import { ref } from 'vue'

const keys = ref([])

export function useKeyHistory() {
  function addKey(name, lengthBytes) {
    keys.value.unshift({ name, lengthBytes, bits: lengthBytes * 8 })
  }

  return { keys, addKey }
}
