<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const input = ref('')
const inputType = ref('text')
const outputType = ref('binary')
const output = ref('')
const inputError = ref('')
const snackbar = ref(false)

const inputTypes = computed(() => [
  { title: t('converter.text'),   value: 'text' },
  { title: t('converter.binary'), value: 'binary' },
  { title: t('converter.base64'), value: 'b64' },
])

const outputTypes = computed(() => [
  { title: t('converter.text'),   value: 'text',   disabled: inputType.value === 'text' },
  { title: t('converter.binary'), value: 'binary', disabled: inputType.value === 'binary' },
  { title: t('converter.base64'), value: 'b64',    disabled: inputType.value === 'b64' },
])

watch(inputType, (newVal) => {
  if (newVal === outputType.value) {
    outputType.value = ['text', 'binary', 'b64'].find(t => t !== newVal)
  }
  output.value = ''
  inputError.value = ''
})

function validateInput() {
  if (!input.value.trim()) {
    inputError.value = t('converter.emptyField')
    return false
  }
  if (inputType.value === 'binary') {
    if (!/^[01\s]+$/.test(input.value)) {
      inputError.value = t('converter.invalidBinary')
      return false
    }
  } else if (inputType.value === 'b64') {
    if (!/^[A-Za-z0-9+/=]+$/.test(input.value)) {
      inputError.value = t('converter.invalidBase64')
      return false
    }
  }
  inputError.value = ''
  return true
}

function convert() {
  if (!validateInput()) return

  const val = input.value.trim()
  let result = ''

  if (inputType.value === 'text') {
    const bytes = new TextEncoder().encode(val)
    if (outputType.value === 'binary') {
      result = Array.from(bytes).map(b => b.toString(2).padStart(8, '0')).join(' ')
    } else {
      result = btoa(String.fromCharCode(...bytes))
    }
  } else if (inputType.value === 'binary') {
    const bytes = val.trim().split(/\s+/).map(b => parseInt(b, 2))
    if (outputType.value === 'text') {
      result = new TextDecoder().decode(new Uint8Array(bytes))
    } else {
      result = btoa(String.fromCharCode(...bytes))
    }
  } else if (inputType.value === 'b64') {
    const bytes = Uint8Array.from(atob(val), c => c.charCodeAt(0))
    if (outputType.value === 'text') {
      result = new TextDecoder().decode(bytes)
    } else {
      result = Array.from(bytes).map(b => b.toString(2).padStart(8, '0')).join(' ')
    }
  }

  output.value = result
}

async function copyOutput() {
  if (!output.value) return
  await navigator.clipboard.writeText(output.value)
  snackbar.value = true
}
</script>

<template>
  <div>
    <h2 class="text-h5 font-weight-bold mb-6">{{ t('converter.title') }}</h2>

    <v-text-field
      v-model="input"
      :label="t('converter.input')"
      :error-messages="inputError"
      @input="inputError = ''"
      class="mb-4"
    />

    <v-select
      v-model="inputType"
      :items="inputTypes"
      :label="t('converter.convertFrom')"
      class="mb-4"
    />

    <v-select
      v-model="outputType"
      :items="outputTypes"
      :label="t('converter.convertTo')"
      class="mb-4"
    />

    <v-btn color="primary" variant="flat" rounded="xl" block class="mb-6" @click="convert">
      {{ t('converter.convertBtn') }}
    </v-btn>

    <v-card v-if="output" variant="tonal" color="primary" rounded="xl">
      <v-card-text>
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-subtitle-2 font-weight-bold">{{ t('converter.output') }}</span>
          <v-btn icon="mdi-content-copy" variant="text" size="small" @click="copyOutput" />
        </div>
        <div class="text-body-1 font-weight-medium" style="word-break: break-all; user-select: text;">
          {{ output }}
        </div>
      </v-card-text>
    </v-card>

    <v-snackbar v-model="snackbar" :timeout="2000" color="primary">
      {{ t('converter.copied') }}
    </v-snackbar>
  </div>
</template>
