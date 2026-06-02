import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useKeyGeneratorStore = defineStore('keyGenerator', () => {
  const keySize = ref(128)
  const generatedKey = ref('')

  function clear() {
    keySize.value = 128
    generatedKey.value = ''
  }

  return { keySize, generatedKey, clear }
})
