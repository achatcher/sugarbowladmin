<!-- src/App.vue -->
<template>
  <router-view />
</template>

<script setup>
// No extra code needed here — router-view renders your current page component
</script>

<style>
/* Add any global styles or imports here */
*, *::before, *::after { box-sizing: border-box; }

body {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #121212; /* example dark theme */
  color: #eee;
}
</style>
