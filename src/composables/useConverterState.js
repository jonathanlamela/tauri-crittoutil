import { ref } from 'vue'

const input = ref('')
const inputType = ref('text')
const outputType = ref('binary')
const output = ref('')
const inputError = ref('')

export function useConverterState() {
  function clear() {
    input.value = ''
    inputType.value = 'text'
    outputType.value = 'binary'
    output.value = ''
    inputError.value = ''
  }

  return { input, inputType, outputType, output, inputError, clear }
}
