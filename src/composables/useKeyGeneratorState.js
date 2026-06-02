import { ref } from 'vue'

const keySize = ref(128)
const generatedKey = ref('')

export function useKeyGeneratorState() {
  function clear() {
    keySize.value = 128
    generatedKey.value = ''
  }

  return { keySize, generatedKey, clear }
}
