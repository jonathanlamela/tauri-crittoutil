import { ref } from 'vue'

const selectedAlgId = ref('aes_cbc')
const payload = ref('')
const key = ref('')
const iv = ref('')
const result = ref('')
const errorMsg = ref('')

export function useDecrypterState() {
  function clear() {
    payload.value = ''
    key.value = ''
    iv.value = ''
    result.value = ''
    errorMsg.value = ''
  }

  return { selectedAlgId, payload, key, iv, result, errorMsg, clear }
}
