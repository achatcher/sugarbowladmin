// src/composables/useTheme.js
import { ref, watch, onMounted } from 'vue'

const theme = ref('light') // Default value
let hasMounted = false

function applyTheme(value) {
  document.documentElement.setAttribute('data-theme', value)
  localStorage.setItem('theme', value)
}

export function useTheme() {
  const toggle = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  onMounted(() => {
    if (!hasMounted) {
      const stored = localStorage.getItem('theme')
      theme.value = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      applyTheme(theme.value)
      hasMounted = true
    }
  })

  watch(theme, (newTheme) => {
    if (hasMounted) applyTheme(newTheme)
  })

  return { theme, toggle }
}
