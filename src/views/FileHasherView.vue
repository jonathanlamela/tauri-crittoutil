<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { hashMd5Bytes } from '../composables/useCrypto.js'

const { t } = useI18n()

const fileInput = ref(null)
const fileName = ref('')
const fileSize = ref(0)
const hash = ref('')
const loading = ref(false)
const dragging = ref(false)
const snackbar = ref(false)

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

async function processFile(file) {
  if (!file) return
  fileName.value = file.name
  fileSize.value = file.size
  hash.value = ''
  loading.value = true
  try {
    const buffer = await file.arrayBuffer()
    hash.value = await hashMd5Bytes(new Uint8Array(buffer))
  } finally {
    loading.value = false
  }
}

function onInputChange(e) {
  processFile(e.target.files[0])
}

function onDrop(e) {
  dragging.value = false
  processFile(e.dataTransfer.files[0])
}

function reset() {
  fileName.value = ''
  fileSize.value = 0
  hash.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

async function copy() {
  await navigator.clipboard.writeText(hash.value)
  snackbar.value = true
}
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <h2 class="text-h5 font-weight-bold">{{ t('fileHasher.title') }}</h2>
      <v-btn variant="text" rounded="xl" size="small" prepend-icon="mdi-delete-outline" @click="reset">
        {{ t('common.clear') }}
      </v-btn>
    </div>

    <!-- Drop zone -->
    <v-card
      rounded="xl"
      elevation="0"
      color="surface-variant"
      class="drop-zone mb-4"
      :class="{ 'drop-zone--active': dragging }"
      @click="fileInput.click()"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <v-card-text class="d-flex flex-column align-center justify-center py-10">
        <v-icon size="48" color="primary" class="mb-3">
          {{ dragging ? 'mdi-file-arrow-down' : 'mdi-file-upload-outline' }}
        </v-icon>
        <div class="text-body-1 font-weight-medium">{{ t('fileHasher.dropZone') }}</div>
        <div class="text-body-2 text-medium-emphasis mt-1">{{ t('fileHasher.dropZoneHint') }}</div>
      </v-card-text>
    </v-card>

    <input ref="fileInput" type="file" hidden @change="onInputChange" />

    <!-- File info -->
    <v-card v-if="fileName" rounded="xl" elevation="0" color="primary-container" class="mb-4">
      <v-card-text class="pa-4 d-flex align-center gap-3">
        <v-icon color="primary" size="28">mdi-file-outline</v-icon>
        <div class="flex-1 min-width-0">
          <div class="text-body-1 font-weight-medium text-truncate">{{ fileName }}</div>
          <div class="text-body-2 text-medium-emphasis">{{ formatSize(fileSize) }}</div>
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" @click.stop="reset" />
      </v-card-text>
    </v-card>

    <!-- Loading -->
    <div v-if="loading" class="d-flex justify-center my-6">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <!-- Hash result -->
    <template v-if="hash">
      <div class="text-subtitle-2 text-medium-emphasis mb-2">{{ t('fileHasher.hashLabel') }}</div>
      <v-card rounded="xl" elevation="0" color="surface-variant" class="mb-2">
        <v-card-text class="pa-4">
          <div class="hash-value">{{ hash }}</div>
        </v-card-text>
      </v-card>
      <div class="d-flex justify-end">
        <v-btn color="primary" variant="tonal" prepend-icon="mdi-content-copy" @click="copy">
          {{ t('fileHasher.copy') }}
        </v-btn>
      </div>
    </template>

    <v-snackbar v-model="snackbar" :timeout="1800" location="bottom">
      {{ t('fileHasher.copied') }}
    </v-snackbar>
  </div>
</template>

<style scoped>
.drop-zone {
  cursor: pointer;
  border: 2px dashed rgb(var(--v-theme-outline-variant));
  transition: border-color 0.2s, background-color 0.2s;
}

.drop-zone--active {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgb(var(--v-theme-primary-container)) !important;
}

.drop-zone:hover {
  border-color: rgb(var(--v-theme-primary));
}

.hash-value {
  font-family: monospace;
  font-size: 0.95rem;
  word-break: break-all;
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>
