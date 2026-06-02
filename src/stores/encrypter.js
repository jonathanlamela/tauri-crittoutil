import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useEncrypterStore = defineStore('encrypter', () => {
  const selectedAlgId = ref('md5')
  const plaintext = ref('')
  const key = ref('')
  const iv = ref('')
  const resultCipher = ref('')
  const resultIv = ref('')
  const errorMsg = ref('')

  function clear() {
    plaintext.value = ''
    key.value = ''
    iv.value = ''
    resultCipher.value = ''
    resultIv.value = ''
    errorMsg.value = ''
  }

  return { selectedAlgId, plaintext, key, iv, resultCipher, resultIv, errorMsg, clear }
})
