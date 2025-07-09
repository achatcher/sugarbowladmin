// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { Amplify } from 'aws-amplify'
import outputs from './amplify_outputs.json'


import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/api'
Amplify.configure(outputs)

export const apiClient = generateClient()

createApp(App).use(router).mount('#app')