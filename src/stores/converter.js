import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConverterStore = defineStore('converter', () => {
  const input = ref('')
  const inputType = ref('text')
  const outputType = ref('binary')
  const output = ref('')
  const inputError = ref('')

  function clear() {
    input.value = ''
    inputType.value = 'text'
    outputType.value = 'binary'
    output.value = ''
    inputError.value = ''
  }

  return { input, inputType, outputType, output, inputError, clear }
})
