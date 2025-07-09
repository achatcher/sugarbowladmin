// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'

import outputs from '../amplify_outputs.json'
import { parseAmplifyConfig } from 'aws-amplify/utils'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/api'

const config = parseAmplifyConfig(outputs)
Amplify.configure(config)

export const apiClient = generateClient()

createApp(App).use(router).mount('#app')
