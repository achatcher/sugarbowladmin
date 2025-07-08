// src/composables/useTheme.js
import { ref, watch, onMounted } from 'vue'

const theme = ref(
  localStorage.getItem('theme') ||
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
)
const toggle = () => {
    console.log('Toggle clicked!')
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
}
  
function applyTheme(value) {
  document.documentElement.setAttribute('data-theme', value)
  localStorage.setItem('theme', value)
}

// Apply immediately when this file loads
applyTheme(theme.value)

watch(theme, (newTheme) => {
  console.log('Theme changed to:', newTheme)
  applyTheme(newTheme)
})

export function useTheme() {
  const toggle = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  // Reapply after component mounts to ensure it's correct
  onMounted(() => {
    applyTheme(theme.value)
  })

  return { theme, toggle }
}
