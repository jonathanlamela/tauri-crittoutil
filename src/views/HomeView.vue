<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const rnd = (n) => Array.from({ length: n }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join('')

const tick = ref(0)
let timer
onMounted(() => { timer = setInterval(() => tick.value++, 80) })
onUnmounted(() => clearInterval(timer))

// Each card has a different phase offset so they never sync
// Converter: 3 stages × 32 ticks (2.56s each) = 96 ticks cycle
const CONV = [
  { from: 'Hello',     to: 'SGVsbG8=' },
  { from: 'Hello',     to: '01001000…' },
  { from: 'SGVsbG8=',  to: 'Hello' },
]
const convFrom = computed(() => CONV[Math.floor(tick.value / 32) % 3].from)
const convTo   = computed(() => CONV[Math.floor(tick.value / 32) % 3].to)

// Key generator: offset +23 ticks — cycling random → locked key
const keyAnim = computed(() => {
  void tick.value
  const phase = Math.floor((tick.value + 23) / 30) % 2
  return phase === 1 ? rnd(10) : 'aX9kP·2mRq'
})
const keyLocked = computed(() => Math.floor((tick.value + 23) / 30) % 2 === 1)

// Encrypter: offset +41 ticks — plain (20t) → scramble (10t) → cipher (20t)
const encAnim = computed(() => {
  void tick.value
  const p = (tick.value + 41) % 50
  if (p < 20) return { from: 'secret',     to: '········',   phase: 'idle' }
  if (p < 30) return { from: rnd(6),        to: rnd(8),       phase: 'scramble' }
  return             { from: 'secret',     to: 'xK8p·Qr9Z', phase: 'done' }
})

// Decrypter: offset +67 ticks — cipher (20t) → scramble (10t) → plain (20t)
const decAnim = computed(() => {
  void tick.value
  const p = (tick.value + 67) % 50
  if (p < 20) return { from: 'xK8p·Qr9Z', to: '········',  phase: 'idle' }
  if (p < 30) return { from: rnd(8),        to: rnd(6),      phase: 'scramble' }
  return             { from: 'xK8p·Qr9Z', to: 'secret',    phase: 'done' }
})

// File hasher: offset +13 ticks — filename (20t) → scramble (10t) → hash (20t)
const hashAnim = computed(() => {
  void tick.value
  const p = (tick.value + 13) % 50
  if (p < 20) return { from: 'file.pdf', to: '···',              phase: 'idle' }
  if (p < 30) return { from: rnd(7),     to: rnd(8),             phase: 'scramble' }
  return             { from: 'file.pdf', to: '5d41402a…',        phase: 'done' }
})

// Stopwords da ignorare nel matching
const STOPWORDS = new Set(['voglio', 'vorrei', 'devo', 'ho', 'bisogno', 'come', 'cosa', 'un', 'una', 'il', 'la', 'lo', 'di', 'per', 'che', 'con', 'del', 'della', 'i', 'e', 'a', 'in', 'su', 'da', 'to', 'a', 'the', 'an', 'of', 'my', 'need', 'want', 'how', 'can', 'do', 'i'])

// Ogni feature ha keyword esatte (peso 3) e keyword fuzzy/parziali (peso 1)
const FEATURE_KEYWORDS = {
  '/converter': {
    exact: ['converti', 'convertire', 'conversione', 'convert', 'conversion', 'base64', 'binario', 'binary', 'trasforma', 'transform', 'formato', 'format', 'codifica', 'decodifica', 'encode', 'decode', 'encoding', 'decoding'],
    partial: ['testo', 'text', 'stringa', 'string'],
  },
  '/key-generator': {
    exact: ['chiave', 'chiavi', 'key', 'keys', 'genera', 'generare', 'generate', 'generazione', 'generation', 'password', 'random', 'casuale', 'sicuro', 'secure', 'crittografica', 'cryptographic', 'bit', '128', '256', '512'],
    partial: ['sicurezza', 'security'],
  },
  '/encrypter': {
    exact: ['cifra', 'cifrare', 'cifratura', 'encrypt', 'encryption', 'aes', 'des', 'proteggi', 'proteggere', 'protect', 'nascondi', 'nascondere', 'hide', 'segreto', 'secret', 'cbc', 'ecb', 'crypt', 'criptare', 'criptato'],
    partial: ['sicuro', 'sicurezza', 'secure', 'security', 'md5'],
  },
  '/decrypter': {
    exact: ['decifra', 'decifrare', 'decifratura', 'decrypt', 'decryption', 'decrittografa', 'decrittografia', 'decodifica', 'decodificare', 'decode', 'aes', 'des', 'cbc', 'ecb', 'leggi', 'apri', 'rivela', 'reveal'],
    partial: ['testo cifrato', 'ciphertext', 'payload'],
  },
  '/file-hasher': {
    exact: ['hash', 'hashing', 'file', 'md5', 'checksum', 'impronta', 'fingerprint', 'integrità', 'integrity', 'verifica', 'verify', 'documento', 'document', 'calcola', 'calculate', 'somma', 'digest'],
    partial: ['controlla', 'check'],
  },
}

const searchQuery = ref('')

const searchResult = computed(() => {
  const q = searchQuery.value.trim().toLowerCase().replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/[^a-z0-9\s]/g, '')
  if (!q) return null
  const tokens = q.split(/\s+/).filter(t => t.length > 1 && !STOPWORDS.has(t))
  if (!tokens.length) return null

  let best = null
  let bestScore = 0
  for (const [route, { exact, partial }] of Object.entries(FEATURE_KEYWORDS)) {
    let score = 0
    for (const token of tokens) {
      // Exact match su keyword esatte: peso 3
      if (exact.includes(token)) { score += 3; continue }
      // Partial match (token contenuto nella keyword o viceversa) solo se token ≥ 4 char: peso 1
      if (token.length >= 4) {
        if (exact.some(k => k.includes(token) || token.includes(k))) { score += 1; continue }
        if (partial.some(k => k.includes(token) || token.includes(k))) { score += 1 }
      }
    }
    if (score > bestScore) { bestScore = score; best = route }
  }
  // Soglia minima: almeno 1 punto reale
  if (bestScore < 1) return null
  return features.value.find(f => f.to === best) ?? null
})

const features = computed(() => [
  { icon: 'mdi-swap-horizontal', title: t('nav.converter'),    description: t('home.converterDesc'),    to: '/converter',     anim: 'converter',   role: 'primary' },
  { icon: 'mdi-key',             title: t('nav.keyGenerator'), description: t('home.keyGeneratorDesc'), to: '/key-generator', anim: 'keygen',      role: 'secondary' },
  { icon: 'mdi-lock',            title: t('nav.encrypter'),    description: t('home.encrypterDesc'),    to: '/encrypter',     anim: 'encrypter',   role: 'tertiary' },
  { icon: 'mdi-lock-open',       title: t('nav.decrypter'),    description: t('home.decrypterDesc'),    to: '/decrypter',     anim: 'decrypter',   role: 'error' },
  { icon: 'mdi-file-search',     title: t('nav.fileHasher'),   description: t('home.fileHasherDesc'),   to: '/file-hasher',   anim: 'filehasher',  role: 'primary' },
])
</script>

<template>
  <div>
    <div class="d-flex align-center mb-8" style="margin-left: -4px;">
      <v-icon size="40" color="primary" class="mr-3">mdi-shield-lock</v-icon>
      <h1 class="text-h4 font-weight-bold">{{ t('home.title') }}</h1>
    </div>

    <v-text-field
      v-model="searchQuery"
      :placeholder="t('home.searchPlaceholder')"
      prepend-inner-icon="mdi-magnify"
      clearable
      variant="outlined"
      rounded="xl"
      hide-details
      class="mb-4"
    />

    <v-slide-y-transition>
      <div v-if="searchResult" class="mb-6 d-flex align-center" style="gap: 12px;">
        <span class="text-body-1">{{ t('home.searchSuggestion') }}</span>
        <v-btn
          :color="searchResult.role"
          variant="tonal"
          :prepend-icon="searchResult.icon"
          :to="searchResult.to"
          rounded="xl"
        >
          {{ searchResult.title }}
        </v-btn>
      </div>
      <div v-else-if="searchQuery.trim()" class="mb-6">
        <span class="text-body-2 text-medium-emphasis">{{ t('home.searchNoResult') }}</span>
      </div>
    </v-slide-y-transition>

    <v-row>
      <v-col v-for="f in features" :key="f.to" cols="12">
        <v-card
          height="100%"
          rounded="xl"
          elevation="0"
          :color="`${f.role}-container`"
          @click="router.push(f.to)"
          style="cursor: pointer;"
        >
          <v-card-text class="pa-5">

            <!-- Icon(2) + animation(8) + button(2) — 2-8-2 on 12 cols -->
            <div class="mb-4" style="display: grid; grid-template-columns: 2fr 8fr 2fr; align-items: center; gap: 8px;">
              <div
                :style="{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: `rgb(var(--v-theme-${f.role}))`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }"
              >
                <v-icon :icon="f.icon" color="white" size="24" />
              </div>

              <!-- Converter -->
              <div v-if="f.anim === 'converter'" class="anim-box"
                :style="`--anim-accent: rgb(var(--v-theme-${f.role}))`">
                <span class="anim-from">{{ convFrom }}</span>
                <v-icon size="14" class="anim-arrow">mdi-arrow-right</v-icon>
                <div class="anim-scroll-wrap">
                  <Transition name="scroll-up">
                    <span :key="convTo" class="anim-to">{{ convTo }}</span>
                  </Transition>
                </div>
              </div>

              <!-- Key generator -->
              <div v-if="f.anim === 'keygen'" class="anim-box"
                :style="`--anim-accent: rgb(var(--v-theme-${f.role}))`">
                <v-icon size="14" class="anim-arrow">mdi-key-variant</v-icon>
                <div class="anim-scroll-wrap" style="flex:1;">
                  <Transition name="scroll-up">
                    <span :key="keyLocked ? 'locked' : String(tick)" class="anim-to" :class="{ 'anim-dim': !keyLocked }">
                      {{ keyAnim }}
                    </span>
                  </Transition>
                </div>
              </div>

              <!-- Encrypter -->
              <div v-if="f.anim === 'encrypter'" class="anim-box"
                :style="`--anim-accent: rgb(var(--v-theme-${f.role}))`">
                <span class="anim-from">{{ encAnim.from }}</span>
                <v-icon size="14" class="anim-arrow" :class="{ 'anim-pulse': encAnim.phase === 'scramble' }">mdi-lock</v-icon>
                <div class="anim-scroll-wrap">
                  <Transition name="scroll-up">
                    <span :key="encAnim.to" class="anim-to" :class="{ 'anim-scramble': encAnim.phase === 'scramble' }">
                      {{ encAnim.to }}
                    </span>
                  </Transition>
                </div>
              </div>

              <!-- Decrypter -->
              <div v-if="f.anim === 'decrypter'" class="anim-box"
                :style="`--anim-accent: rgb(var(--v-theme-${f.role}))`">
                <span class="anim-from">{{ decAnim.from }}</span>
                <v-icon size="14" class="anim-arrow" :class="{ 'anim-pulse': decAnim.phase === 'scramble' }">mdi-lock-open</v-icon>
                <div class="anim-scroll-wrap">
                  <Transition name="scroll-up">
                    <span :key="decAnim.to" class="anim-to" :class="{ 'anim-scramble': decAnim.phase === 'scramble' }">
                      {{ decAnim.to }}
                    </span>
                  </Transition>
                </div>
              </div>

              <!-- File hasher -->
              <div v-if="f.anim === 'filehasher'" class="anim-box"
                :style="`--anim-accent: rgb(var(--v-theme-${f.role}))`">
                <span class="anim-from">{{ hashAnim.from }}</span>
                <v-icon size="14" class="anim-arrow" :class="{ 'anim-pulse': hashAnim.phase === 'scramble' }">mdi-pound</v-icon>
                <div class="anim-scroll-wrap">
                  <Transition name="scroll-up">
                    <span :key="hashAnim.to" class="anim-to" :class="{ 'anim-scramble': hashAnim.phase === 'scramble' }">
                      {{ hashAnim.to }}
                    </span>
                  </Transition>
                </div>
              </div>

              <!-- Open button -->
              <div class="d-flex justify-end">
                <v-btn
                  :color="f.role"
                  variant="tonal"
                  icon="mdi-arrow-right"
                  size="40"
                  :to="f.to"
                  @click.stop
                />
              </div>
            </div>

            <div class="text-subtitle-1 font-weight-bold mb-1">{{ f.title }}</div>
            <div class="text-body-2 text-medium-emphasis">{{ f.description }}</div>
          </v-card-text>

        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.anim-box {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: monospace;
  font-size: 0.92rem;
  min-width: 0;
  overflow: hidden;
  height: 36px;
  background: rgb(var(--v-theme-surface));
  border: 1.5px solid rgb(var(--v-theme-outline-variant));
  color: rgb(var(--v-theme-on-surface));
  border-radius: 10px;
  padding: 0 14px;
}

.anim-from {
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.5;
  white-space: nowrap;
  flex-shrink: 0;
}

.anim-arrow {
  color: rgb(var(--v-theme-on-surface)) !important;
  opacity: 0.35;
  flex-shrink: 0;
}

.anim-scroll-wrap {
  position: relative;
  overflow: hidden;
  height: 1.3em;
  flex: 1;
}

.anim-to {
  position: absolute;
  left: 0;
  top: 0;
  color: var(--anim-accent);
  font-weight: 600;
  white-space: nowrap;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.anim-dim {
  opacity: 0.45;
  color: rgb(var(--v-theme-on-surface-variant)) !important;
}

.anim-scramble {
  color: rgb(var(--v-theme-error)) !important;
  opacity: 0.8;
}

.anim-pulse {
  animation: pulse 0.15s ease-in-out infinite alternate;
  opacity: 0.9 !important;
}

/* Scroll-up transition */
.scroll-up-enter-active {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s;
}
.scroll-up-leave-active {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s;
}
.scroll-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}
.scroll-up-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

@keyframes pulse {
  from { transform: scale(1);    opacity: 0.7; }
  to   { transform: scale(1.35); opacity: 1;   }
}
</style>
