<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { encrypt, encryptAlgorithms } from '../composables/useCrypto.js'
import { useKeyHistoryStore } from '../stores/keyHistory.js'
import { useEncrypterStore } from '../stores/encrypter.js'
import { storeToRefs } from 'pinia'

const { t } = useI18n()
const keyHistoryStore = useKeyHistoryStore()
const { keys } = storeToRefs(keyHistoryStore)
const { addKey } = keyHistoryStore
const encrypterStore = useEncrypterStore()
const { selectedAlgId, plaintext, key, iv, resultCipher, resultIv, errorMsg } = storeToRefs(encrypterStore)
const { clear } = encrypterStore
const loading = ref(false)
const snackbar = ref(false)
const keyPickerDialog = ref(false)
const ivPickerDialog = ref(false)

const selectedAlg = computed(() => encryptAlgorithms.find(a => a.id === selectedAlgId.value))
const algItems = encryptAlgorithms.map(a => ({ title: a.name, value: a.id }))
const ivWasGenerated = computed(() => selectedAlg.value?.ivLength && !iv.value)

watch(selectedAlgId, () => {
  resultCipher.value = ''
  resultIv.value = ''
  errorMsg.value = ''
  key.value = ''
  iv.value = ''
})

const payloadLabel = computed(() =>
  selectedAlg.value?.requireIv ? t('encrypter.payloadWithIv') : t('encrypter.payloadNoIv')
)

function getKeyError(algVal, keyVal) {
  if (!algVal?.requireKey) return ''
  if (!keyVal) return t('encrypter.enterKey')
  const len = new TextEncoder().encode(keyVal).length
  if (algVal.keyLengths) {
    if (!algVal.keyLengths.includes(len)) {
      return algVal.keyLengths.includes(8)
        ? t('encrypter.invalidKeyDes')
        : t('encrypter.invalidKeyAes')
    }
  }
  return ''
}

const plaintextError = computed(() => {
  if (!plaintext.value && !resultCipher.value && !errorMsg.value) return ''
  if (!plaintext.value) return t('encrypter.enterText')
  return ''
})

const keyError = computed(() => {
  if (!selectedAlg.value?.requireKey) return ''
  if (!key.value && !resultCipher.value && !errorMsg.value) return ''
  return getKeyError(selectedAlg.value, key.value)
})

const BASE64_RE = /[+/=]/

function getIvError(algVal, ivVal) {
  if (!algVal?.ivLength || !ivVal) return ''
  const { ivLength } = algVal
  const isBase64 = BASE64_RE.test(ivVal)
  if (isBase64) {
    let decoded
    try { decoded = atob(ivVal) } catch { return t('encrypter.invalidIvBase64') }
    if (decoded.length !== ivLength)
      return ivLength === 8 ? t('encrypter.invalidIvDes') : t('encrypter.invalidIvAes')
  } else {
    const byteLen = new TextEncoder().encode(ivVal).length
    if (byteLen !== ivLength)
      return ivLength === 8 ? t('encrypter.invalidIvDes') : t('encrypter.invalidIvAes')
  }
  return ''
}

const ivError = computed(() => {
  if (!selectedAlg.value?.ivLength || !iv.value) return ''
  return getIvError(selectedAlg.value, iv.value)
})

async function onEncrypt() {
  if (!plaintext.value) { errorMsg.value = t('encrypter.enterText'); return }
  const kErr = getKeyError(selectedAlg.value, key.value)
  if (kErr) { errorMsg.value = kErr; return }
  const iErr = getIvError(selectedAlg.value, iv.value)
  if (iErr) { errorMsg.value = iErr; return }
  loading.value = true
  errorMsg.value = ''
  resultCipher.value = ''
  resultIv.value = ''
  try {
    const res = await encrypt(selectedAlg.value, plaintext.value, key.value, iv.value || null)
    if (res && typeof res === 'object') {
      resultCipher.value = res.cipher
      resultIv.value = res.iv
      // Populate IV field with the generated value so the user can see and reuse it
      if (!iv.value) iv.value = res.iv
      // Save IV: auto-generated one is saved as-is; manually entered one was already validated
      addKey(res.iv, res.iv.length)
    } else {
      resultCipher.value = res
    }
    // Save manually entered key to history
    if (key.value) {
      const keyBytes = new TextEncoder().encode(key.value).length
      addKey(key.value, keyBytes)
    }
  } catch (e) {
    errorMsg.value = e?.message || t('encrypter.error')
  } finally {
    loading.value = false
  }
}

function pickKey(k) {
  key.value = k.name
  keyPickerDialog.value = false
}

function pickIv(k) {
  iv.value = k.name
  ivPickerDialog.value = false
}

async function copyCipher() {
  await navigator.clipboard.writeText(resultCipher.value)
  snackbar.value = true
}
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <h2 class="text-h5 font-weight-bold">{{ t('encrypter.title') }}</h2>
      <v-btn variant="text" rounded="xl" size="small" prepend-icon="mdi-delete-outline" @click="clear">
        {{ t('common.clear') }}
      </v-btn>
    </div>

    <v-select
      v-model="selectedAlgId"
      :items="algItems"
      :label="t('encrypter.pickAlg')"
      class="mb-4"
    />

    <v-text-field
      v-model="plaintext"
      :label="t('encrypter.textToEncrypt')"
      :error-messages="plaintextError"
      class="mb-4"
    />

    <v-text-field
      v-if="selectedAlg?.ivLength"
      v-model="iv"
      :label="t('encrypter.iv')"
      :hint="t('encrypter.ivHint')"
      :error-messages="ivError"
      persistent-hint
      class="mb-4"
    >
      <template #append-inner>
        <v-btn
          icon="mdi-key"
          variant="text"
          size="small"
          :disabled="keys.length === 0"
          :title="t('encrypter.pickIvTooltip')"
          @click="ivPickerDialog = true"
        />
      </template>
    </v-text-field>

    <v-text-field
      v-if="selectedAlg?.requireKey"
      v-model="key"
      :label="t('encrypter.key')"
      :error-messages="keyError"
      class="mb-4"
    >
      <template #append-inner>
        <v-btn
          icon="mdi-key"
          variant="text"
          size="small"
          :disabled="keys.length === 0"
          :title="t('encrypter.pickKeyTooltip')"
          @click="keyPickerDialog = true"
        />
      </template>
    </v-text-field>

    <v-btn
      color="primary"
      variant="flat"
      rounded="xl"
      block
      :loading="loading"
      class="mb-4"
      @click="onEncrypt"
    >
      {{ t('encrypter.encryptBtn') }}
    </v-btn>

    <v-alert v-if="errorMsg" type="error" variant="tonal" rounded="xl" class="mb-4">
      {{ errorMsg }}
    </v-alert>

    <v-card v-if="resultCipher" variant="tonal" color="primary" rounded="xl" class="mb-4">
      <v-card-text>
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-subtitle-2 font-weight-bold">{{ t('encrypter.cipherOutput') }}</span>
          <v-btn icon="mdi-content-copy" variant="text" size="small" @click="copyCipher" />

        </div>
        <div class="text-body-1 font-weight-medium" style="word-break: break-all; user-select: text;">
          {{ resultCipher }}
        </div>
      </v-card-text>
    </v-card>


    <v-dialog v-model="keyPickerDialog" max-width="480">
      <v-card rounded="xl">
        <v-card-title class="pa-4">{{ t('encrypter.pickKey') }}</v-card-title>
        <v-list lines="two">
          <v-list-item
            v-for="(k, i) in keys"
            :key="i"
            :subtitle="`${k.bits} bit`"
            @click="pickKey(k)"
          >
            <template #title>
              <span style="font-family: monospace; font-size: 0.85rem; word-break: break-all;">{{ k.name }}</span>
            </template>
          </v-list-item>
        </v-list>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="keyPickerDialog = false">{{ t('encrypter.cancel') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="ivPickerDialog" max-width="480">
      <v-card rounded="xl">
        <v-card-title class="pa-4">{{ t('encrypter.pickIv') }}</v-card-title>
        <v-list lines="two">
          <v-list-item
            v-for="(k, i) in keys"
            :key="i"
            :subtitle="`${k.bits} bit`"
            @click="pickIv(k)"
          >
            <template #title>
              <span style="font-family: monospace; font-size: 0.85rem; word-break: break-all;">{{ k.name }}</span>
            </template>
          </v-list-item>
        </v-list>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="ivPickerDialog = false">{{ t('encrypter.cancel') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :timeout="2000" color="primary">
      {{ t('encrypter.copied') }}
    </v-snackbar>
  </div>
</template>
