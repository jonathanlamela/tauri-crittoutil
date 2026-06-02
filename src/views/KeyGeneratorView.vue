<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { generateKey } from '../composables/useCrypto.js'
import { useKeyHistory } from '../composables/useKeyHistory.js'

const { t } = useI18n()
const { keys, addKey } = useKeyHistory()
const keySize = ref(128)
const generatedKey = ref('')
const loading = ref(false)
const snackbar = ref(false)
const snackbarMsg = ref('')

const keySizes = [
  { title: '64 bit', value: 64 },
  { title: '128 bit', value: 128 },
  { title: '192 bit', value: 192 },
  { title: '256 bit', value: 256 },
  { title: '512 bit', value: 512 },
]

async function onGenerate() {
  loading.value = true
  try {
    const key = await generateKey(keySize.value)
    generatedKey.value = key
    addKey(key, keySize.value / 8)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text)
  snackbarMsg.value = t('keyGenerator.keyCopied')
  snackbar.value = true
}
</script>

<template>
  <div>
    <h2 class="text-h5 font-weight-bold mb-6">{{ t('keyGenerator.title') }}</h2>

    <v-select
      v-model="keySize"
      :items="keySizes"
      :label="t('keyGenerator.keySize')"
      class="mb-4"
    />

    <v-btn
      color="primary"
      variant="flat"
      rounded="xl"
      block
      :loading="loading"
      class="mb-6"
      @click="onGenerate"
    >
      {{ t('keyGenerator.generateBtn') }}
    </v-btn>

    <v-card v-if="generatedKey" variant="tonal" color="primary" rounded="xl" class="mb-6">
      <v-card-text>
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-subtitle-2 font-weight-bold">{{ t('keyGenerator.generatedKey') }}</span>
          <v-btn icon="mdi-content-copy" variant="text" size="small" @click="copyToClipboard(generatedKey)" />
        </div>
        <div
          class="text-body-1 font-weight-medium"
          style="word-break: break-all; user-select: text; cursor: pointer;"
          @click="copyToClipboard(generatedKey)"
        >
          {{ generatedKey }} <span class="text-caption text-medium-emphasis">({{ keySize }} bit)</span>
        </div>
      </v-card-text>
    </v-card>

    <div v-if="keys.length > 0">
      <div class="text-subtitle-2 font-weight-bold mb-3">{{ t('keyGenerator.history') }}</div>
      <v-list lines="one" rounded="xl" bg-color="surface-variant">
        <v-list-item
          v-for="(k, i) in keys"
          :key="i"
          :subtitle="`${k.bits} bit`"
          @click="copyToClipboard(k.name)"
          style="cursor: pointer;"
        >
          <template #title>
            <span style="font-family: monospace; font-size: 0.85rem; word-break: break-all;">{{ k.name }}</span>
          </template>
          <template #append>
            <v-btn icon="mdi-content-copy" variant="text" size="x-small" @click.stop="copyToClipboard(k.name)" />
          </template>
        </v-list-item>
      </v-list>
    </div>

    <v-snackbar v-model="snackbar" :timeout="2000" color="primary">{{ snackbarMsg }}</v-snackbar>
  </div>
</template>
