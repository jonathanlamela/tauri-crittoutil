<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { decrypt, decryptAlgorithms } from '../composables/useCrypto.js'
import { useKeyHistory } from '../composables/useKeyHistory.js'
import { useDecrypterState } from '../composables/useDecrypterState.js'

const { t } = useI18n()
const { keys, addKey } = useKeyHistory()
const { selectedAlgId, payload, key, iv, result, errorMsg, clear } = useDecrypterState()
const loading = ref(false)
const snackbar = ref(false)
const keyPickerDialog = ref(false)
const ivPickerDialog = ref(false)

const selectedAlg = computed(() => decryptAlgorithms.find(a => a.id === selectedAlgId.value))
const algItems = decryptAlgorithms.map(a => ({ title: a.name, value: a.id }))

watch(selectedAlgId, () => {
  result.value = ''
  errorMsg.value = ''
  key.value = ''
  iv.value = ''
  payload.value = ''
})

const BASE64_RE = /[+/=]/

function getPayloadError(val) {
  if (!val?.trim()) return t('decrypter.enterText')
  try { atob(val.trim()) } catch { return t('decrypter.invalidPayloadB64') }
  return ''
}

function getIvError(val) {
  const alg = selectedAlg.value
  if (!alg?.ivLength) return ''
  if (!val?.trim()) return t('decrypter.enterIv')
  const isBase64 = BASE64_RE.test(val)
  if (isBase64) {
    let decoded
    try { decoded = atob(val) } catch { return t('decrypter.invalidIvBase64') }
    if (decoded.length !== alg.ivLength)
      return alg.ivLength === 8 ? t('decrypter.invalidIvDes') : t('decrypter.invalidIvAes')
  } else {
    const byteLen = new TextEncoder().encode(val).length
    if (byteLen !== alg.ivLength)
      return alg.ivLength === 8 ? t('decrypter.invalidIvDes') : t('decrypter.invalidIvAes')
  }
  return ''
}

function getKeyError(keyVal) {
  if (!keyVal) return t('decrypter.enterKey')
  const len = new TextEncoder().encode(keyVal).length
  const alg = selectedAlg.value
  if (alg?.keyLengths && !alg.keyLengths.includes(len)) {
    return alg.keyLengths.includes(8)
      ? t('decrypter.invalidKeyDes')
      : t('decrypter.invalidKeyAes')
  }
  return ''
}

const payloadError = computed(() => {
  if (!payload.value && !result.value && !errorMsg.value) return ''
  return getPayloadError(payload.value)
})

const ivError = computed(() => {
  if (!iv.value && !result.value && !errorMsg.value) return ''
  return getIvError(iv.value)
})

const keyError = computed(() => {
  if (!key.value && !result.value && !errorMsg.value) return ''
  return getKeyError(key.value)
})

async function onDecrypt() {
  const pErr = getPayloadError(payload.value)
  if (pErr) { errorMsg.value = pErr; return }
  const iErr = getIvError(iv.value)
  if (iErr) { errorMsg.value = iErr; return }
  const kErr = getKeyError(key.value)
  if (kErr) { errorMsg.value = kErr; return }
  loading.value = true
  errorMsg.value = ''
  result.value = ''
  try {
    result.value = await decrypt(selectedAlg.value, payload.value.trim(), key.value, iv.value.trim() || null)
    // Save manually entered key and IV to history on success
    const keyBytes = new TextEncoder().encode(key.value).length
    addKey(key.value, keyBytes)
    if (iv.value.trim()) addKey(iv.value.trim(), iv.value.trim().length)
  } catch (e) {
    errorMsg.value = e?.message || t('decrypter.error')
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

async function copyResult() {
  await navigator.clipboard.writeText(result.value)
  snackbar.value = true
}
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <h2 class="text-h5 font-weight-bold">{{ t('decrypter.title') }}</h2>
      <v-btn variant="text" rounded="xl" size="small" prepend-icon="mdi-delete-outline" @click="clear">
        {{ t('common.clear') }}
      </v-btn>
    </div>

    <v-select
      v-model="selectedAlgId"
      :items="algItems"
      :label="t('decrypter.pickAlg')"
      class="mb-4"
    />

    <v-text-field
      v-model="payload"
      :label="t('decrypter.payloadNoIv')"
      :hint="t('decrypter.hintNoIv')"
      persistent-hint
      :error-messages="payloadError"
      class="mb-4"
    />

    <v-text-field
      v-if="selectedAlg?.ivLength"
      v-model="iv"
      :label="t('decrypter.iv')"
      :hint="t('decrypter.ivHint')"
      persistent-hint
      :error-messages="ivError"
      class="mb-4"
    >
      <template #append-inner>
        <v-btn
          icon="mdi-key"
          variant="text"
          size="small"
          :disabled="keys.length === 0"
          :title="t('decrypter.pickIvTooltip')"
          @click="ivPickerDialog = true"
        />
      </template>
    </v-text-field>

    <v-text-field
      v-model="key"
      :label="t('decrypter.key')"
      :error-messages="keyError"
      class="mb-4"
    >
      <template #append-inner>
        <v-btn
          icon="mdi-key"
          variant="text"
          size="small"
          :disabled="keys.length === 0"
          :title="t('decrypter.pickKeyTooltip')"
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
      @click="onDecrypt"
    >
      {{ t('decrypter.decryptBtn') }}
    </v-btn>

    <v-alert v-if="errorMsg" type="error" variant="tonal" rounded="xl" class="mb-4">
      {{ errorMsg }}
    </v-alert>

    <v-card v-if="result" variant="tonal" color="primary" rounded="xl">
      <v-card-text>
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-subtitle-2 font-weight-bold">{{ t('decrypter.decryptedText') }}</span>
          <v-btn icon="mdi-content-copy" variant="text" size="small" @click="copyResult" />
        </div>
        <div class="text-body-1 font-weight-medium" style="word-break: break-all; user-select: text;">
          {{ result }}
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="keyPickerDialog" max-width="480">
      <v-card rounded="xl">
        <v-card-title class="pa-4">{{ t('decrypter.pickKey') }}</v-card-title>
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
          <v-btn @click="keyPickerDialog = false">{{ t('decrypter.cancel') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="ivPickerDialog" max-width="480">
      <v-card rounded="xl">
        <v-card-title class="pa-4">{{ t('decrypter.pickIv') }}</v-card-title>
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
          <v-btn @click="ivPickerDialog = false">{{ t('decrypter.cancel') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :timeout="2000" color="primary">
      {{ t('decrypter.copied') }}
    </v-snackbar>
  </div>
</template>
