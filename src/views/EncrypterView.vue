<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { encrypt, encryptAlgorithms, validateKey } from '../composables/useCrypto.js'
import { useKeyHistory } from '../composables/useKeyHistory.js'

const { t } = useI18n()
const { keys } = useKeyHistory()
const selectedAlgId = ref('md5')
const plaintext = ref('')
const key = ref('')
const result = ref('')
const errorMsg = ref('')
const loading = ref(false)
const snackbar = ref(false)
const keyPickerDialog = ref(false)

const selectedAlg = computed(() => encryptAlgorithms.find(a => a.id === selectedAlgId.value))
const algItems = encryptAlgorithms.map(a => ({ title: a.name, value: a.id }))

watch(selectedAlgId, () => {
  result.value = ''
  errorMsg.value = ''
  key.value = ''
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
  if (!plaintext.value && !result.value && !errorMsg.value) return ''
  if (!plaintext.value) return t('encrypter.enterText')
  return ''
})

const keyError = computed(() => {
  if (!selectedAlg.value?.requireKey) return ''
  if (!key.value && !result.value && !errorMsg.value) return ''
  return getKeyError(selectedAlg.value, key.value)
})

async function onEncrypt() {
  if (!plaintext.value) { errorMsg.value = t('encrypter.enterText'); return }
  const kErr = getKeyError(selectedAlg.value, key.value)
  if (kErr) { errorMsg.value = kErr; return }
  loading.value = true
  errorMsg.value = ''
  result.value = ''
  try {
    result.value = await encrypt(selectedAlg.value, plaintext.value, key.value)
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

async function copyResult() {
  await navigator.clipboard.writeText(result.value)
  snackbar.value = true
}
</script>

<template>
  <div>
    <h2 class="text-h5 font-weight-bold mb-6">{{ t('encrypter.title') }}</h2>

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

    <v-card v-if="result" variant="tonal" color="primary" rounded="xl">
      <v-card-text>
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-subtitle-2 font-weight-bold">{{ payloadLabel }}</span>
          <v-btn icon="mdi-content-copy" variant="text" size="small" @click="copyResult" />
        </div>
        <div class="text-body-1 font-weight-medium" style="word-break: break-all; user-select: text;">
          {{ result }}
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

    <v-snackbar v-model="snackbar" :timeout="2000" color="primary">
      {{ t('encrypter.copied') }}
    </v-snackbar>
  </div>
</template>
