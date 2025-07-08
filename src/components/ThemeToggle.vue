<script setup>
import { useTheme } from '@/composables/useTheme'
const { theme, toggle } = useTheme()
</script>

<template>
  <div
    class="theme-toggle-wrapper"
    role="switch"
    :aria-checked="theme === 'dark'"
  >
    <input
      type="checkbox"
      id="themeToggle"
      class="theme-toggle-checkbox"
      :checked="theme === 'dark'"
      aria-label="Toggle dark/light mode"
      readonly
    />
    <label for="themeToggle" class="theme-toggle-label" @click="toggle">
      <span class="toggle-icon toggle-sun">☀️</span>
      <span class="toggle-icon toggle-moon">🌙</span>
      <span class="toggle-ball"></span>
    </label>
  </div>
</template>

<style scoped>
.theme-toggle-wrapper {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 60px;
  height: 30px;
  background-color: var(--input-border);
  border-radius: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  user-select: none;
}

.theme-toggle-checkbox {
  opacity: 0;
  position: absolute;
  pointer-events: none;
}

.theme-toggle-label {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px;
  border-radius: 15px;
  background-color: var(--input-border);
  overflow: hidden;
}

.toggle-icon {
  font-size: 14px;
  line-height: 1;
  z-index: 2;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.toggle-sun {
  opacity: 1;
}

.toggle-moon {
  opacity: 0;
}

.toggle-ball {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  background-color: var(--btn-bg);
  border-radius: 50%;
  transition: transform 0.3s ease;
  z-index: 1;
}

html[data-theme='dark'] .toggle-ball {
  transform: translateX(30px);
}

html[data-theme='dark'] .toggle-sun {
  opacity: 0;
}

html[data-theme='dark'] .toggle-moon {
  opacity: 1;
}
</style>
