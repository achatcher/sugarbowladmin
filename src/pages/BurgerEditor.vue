<script setup>
import { reactive, ref, onMounted, computed, watch } from 'vue'
import { get, post } from '@aws-amplify/api'
import { uploadData } from '@aws-amplify/storage'
import ThemeToggle from '@/components/ThemeToggle.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'

const apiName = 'burgeradminapi'

// Fixed URL for the current burger image
const CURRENT_BURGER_IMAGE_URL = 'https://burgeroftheweek-app-dev-storageb6735-dev.s3.us-east-2.amazonaws.com/burgers/current_newburger.jpg'
const BURGER_ID = 'current'

// Form data for editing
const burger = reactive({
  id: BURGER_ID,
  name: '',
  description: '',
  price: '',
  startDate: '',
  endDate: '',
  imageKey: 'burgers/current_newburger.jpg',
})

// Current burger data from server
const currentBurger = reactive({
  id: BURGER_ID,
  name: '',
  description: '',
  price: '',
  startDate: '',
  endDate: '',
  imageKey: 'burgers/current_newburger.jpg',
})

const previewUrl = ref(CURRENT_BURGER_IMAGE_URL)
const file = ref(null)
const isSaving = ref(false)
const isLoading = ref(true)
const filePreviewUrl = ref('')
const isEditing = ref(false)  // Track if user is editing the form
const selectedTab = ref('current')  // 'current' or 'preview'

// Automatically switch to preview tab when editing starts
watch(
  [
    () => burger.name,
    () => burger.description,
    () => burger.price,
    () => burger.startDate,
    () => burger.endDate,
    filePreviewUrl
  ],
  () => {
    // Check if any form field has changed or a file is selected
    if (
      burger.name ||
      burger.description ||
      burger.price ||
      burger.startDate ||
      burger.endDate ||
      filePreviewUrl.value
    ) {
      isEditing.value = true
      // Auto-switch to preview tab when editing starts
      selectedTab.value = 'preview'
    }
  }
)

// Computed property for preview burger - combines form data with current burger
const previewBurger = computed(() => {
  // If editing, show form values; otherwise, show current burger
  if (isEditing.value) {
    return {
      id: BURGER_ID,
      name: burger.name || 'New Burger Name',
      description: burger.description || 'Add a description for your burger...',
      price: burger.price || 0.00,
      startDate: burger.startDate || '',
      endDate: burger.endDate || '',
      // Use file preview URL if available, else use current burger image
      imageUrl: filePreviewUrl.value || previewUrl.value
    }
  } else {
    return {
      ...currentBurger,
      imageUrl: previewUrl.value
    }
  }
})

async function fetchBurger() {
  isLoading.value = true
  try {
    const op = get({
      apiName,
      path: '/burger',
      options: { authMode: 'userPool' }
    })
    const response = await op.response

    // Properly handle the ReadableStream
    if (response.body && typeof response.body.json === 'function') {
      const jsonData = await response.body.json()
      console.log("Parsed burger data:", jsonData)

      if (jsonData && jsonData.id) {
        // Update the current burger data
        Object.assign(currentBurger, jsonData)

        // Always use the fixed image URL for the current burger
        previewUrl.value = CURRENT_BURGER_IMAGE_URL
        console.log("Using fixed burger image URL:", previewUrl.value)
      } else {
        console.log("No burger data found or invalid format:", jsonData)
        resetCurrentBurger()
      }
    } else {
      console.log("Response body is not a ReadableStream or has no json method")
      resetCurrentBurger()
    }
  } catch (e) {
    console.error('fetchBurger error', e)
    resetCurrentBurger()
  } finally {
    isLoading.value = false
  }
}

function resetCurrentBurger() {
  Object.assign(currentBurger, {
    id: BURGER_ID,
    name: '',
    description: '',
    price: '',
    startDate: '',
    endDate: '',
    imageKey: 'burgers/current_newburger.jpg',
  })
  previewUrl.value = CURRENT_BURGER_IMAGE_URL
}
function onFileChange(e) {
  const selectedFile = e.target.files[0]
  if (selectedFile) {
    file.value = selectedFile
    filePreviewUrl.value = window.URL.createObjectURL(selectedFile)
    isEditing.value = true
    selectedTab.value = 'preview'
  }
}

function formatPrice(price) {
  if (price === undefined || price === null || price === '') return '0.00'
  return typeof price === 'number' ? price.toFixed(2) : parseFloat(price).toFixed(2)
}

async function saveBurger() {
  isSaving.value = true
  try {
    // Prepare the burger data - always use ID 'current'
    const burgerData = {
      ...burger,
      id: BURGER_ID,
      imageKey: 'burgers/current_newburger.jpg' // Always use this fixed image key
    }

    // ensure numeric
    burgerData.price = parseFloat(burgerData.price)

    // upload if new file selected - always upload with the same filename
    if (file.value) {
      const path = 'burgers/current_newburger.jpg' // Always use this fixed path
      const task = await uploadData({
        path,
        data: file.value,
        options: { contentType: file.value.type, accessLevel: 'public' }
      })
      const result = await task.result
      console.log("Uploaded image to fixed path:", path)
    }

    console.log("Saving burger data:", burgerData)

    // send to API
    const op = post({
      apiName,
      path: '/burger',
      options: {
        body: burgerData,
        authMode: 'userPool'
      }
    })
    const response = await op.response
    console.log("Save response:", response)

    // Handle the response stream correctly
    if (response.body && typeof response.body.json === 'function') {
      const jsonResponse = await response.body.json()
      console.log("Save response parsed:", jsonResponse)
    }

    // reload from backend to get the saved burger
    await fetchBurger()

    // clear form inputs
    burger.name = ''
    burger.description = ''
    burger.price = ''
    burger.startDate = ''
    burger.endDate = ''
    file.value = null
    filePreviewUrl.value = ''
    isEditing.value = false
    selectedTab.value = 'current'

    showAlert('✅ Burger saved successfully!')
  } catch (e) {
    console.error('saveBurger error', e)
    showAlert('❌ Save failed: ' + (e.message || 'Unknown error'), 'error')
  } finally {
    isSaving.value = false
  }
}

// Reset the form and go back to current view
function cancelEdit() {
  burger.name = ''
  burger.description = ''
  burger.price = ''
  burger.startDate = ''
  burger.endDate = ''
  file.value = null
  filePreviewUrl.value = ''
  isEditing.value = false
  selectedTab.value = 'current'
}

// simple alert helper
const alerts = ref([])
let nextId = 1
function showAlert(msg, type = 'success') {
  const id = nextId++
  alerts.value.push({ id, msg, type })
  setTimeout(() => {
    alerts.value = alerts.value.filter(a => a.id !== id)
  }, 4000)
}

// Format date for display
function formatDate(dateString) {
  if (!dateString) return 'Not set'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch (e) {
    return dateString
  }
}

onMounted(fetchBurger)
</script>

<template>
  <AdminLayout>
    <!-- Alert Messages -->
    <div class="alerts-container">
      <div v-for="alert in alerts" :key="alert.id" class="alert" :class="alert.type">
        {{ alert.msg }}
      </div>
    </div>

    <div class="two-columns">
      <!-- Burger Editor Panel -->
      <div class="panel" :class="{ loading: isSaving }">
        <div class="panel-header">
          <h2 class="panel-title">Edit Burger Details</h2>
        </div>
        <div class="panel-body">
          <form @submit.prevent="saveBurger" class="form">
            <div class="form-group">
              <label>Name</label>
              <input v-model="burger.name" placeholder="Burger Name" required />
            </div>

            <div class="form-group">
              <label>Description</label>
              <textarea
                v-model="burger.description"
                placeholder="Burger Description"
                maxlength="300"
              ></textarea>
            </div>

            <div class="form-group">
              <label>Price</label>
              <input
                v-model="burger.price"
                type="number"
                step="0.01"
                placeholder="Price (e.g. 9.99)"
                required
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Start Date</label>
                <input v-model="burger.startDate" type="date" required />
              </div>
              <div class="form-group">
                <label>End Date</label>
                <input v-model="burger.endDate" type="date" required />
              </div>
            </div>

            <div class="form-group">
              <label>Upload Image</label>
              <input type="file" accept="image/*" @change="onFileChange" />
              <div v-if="filePreviewUrl" class="image-preview">
                <img :src="filePreviewUrl" alt="Upload Preview" />
              </div>
            </div>
            <div class="form-group save-button-container">
              <button
                id="save-burger"
                class="btn btn-primary"
                @click="saveBurger"
                :disabled="isSaving"
              >
                <i class="fas" :class="isSaving ? 'fa-spinner fa-spin' : 'fa-save'"></i>
                {{ isSaving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Burger Preview Panel -->
      <div class="preview-panel">
        <div class="preview-header">
          <div class="preview-tabs">
            <span
              class="preview-tab"
              :class="{ active: selectedTab === 'current' }"
              @click="selectedTab = 'current'"
            >
              Current Burger
            </span>
            <span
              class="preview-tab"
              :class="{ active: selectedTab === 'preview', editing: isEditing }"
              @click="selectedTab = 'preview'"
            >
              {{ isEditing ? 'Live Preview' : 'Customer View' }}
            </span>
          </div>
        </div>
        <div class="preview-body">
          <div v-if="isLoading" class="loading-indicator">
            Loading burger data...
          </div>

          <!-- Current Burger View -->
          <div v-else-if="selectedTab === 'current'" class="card">
            <div v-if="!currentBurger.name" class="no-burger-message">
              No burger of the month is currently set.
            </div>
            <template v-else>
              <img :src="previewUrl" alt="Current Burger" class="burger-image" @error="handleImageError" />
              <h3>{{ currentBurger.name }}</h3>
              <p>{{ currentBurger.description }}</p>
              <p><strong>${{ formatPrice(currentBurger.price) }}</strong></p>
              <p>Available from {{ formatDate(currentBurger.startDate) }} to {{ formatDate(currentBurger.endDate) }}</p>
            </template>
          </div>

          <!-- Preview/Editing View -->
          <div v-else class="card">
            <img
              :src="previewBurger.imageUrl"
              alt="Burger Preview"
              class="burger-image"
              @error="handleImageError"
            />
            <h3>{{ previewBurger.name }}</h3>
            <p>{{ previewBurger.description }}</p>
            <p><strong>${{ formatPrice(previewBurger.price) }}</strong></p>
            <p>Available from {{ formatDate(previewBurger.startDate) }} to {{ formatDate(previewBurger.endDate) }}</p>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script>
// Add to your script section - helps with debugging image loading issues
function handleImageError(event) {
  console.error('Image failed to load:', event.target.src)
  // Try with an alternative path
  if (!event.target.hasRetried) {
    event.target.hasRetried = true
    // Try alternative URL format if the first one fails
    event.target.src = 'https://burgeroftheweek-app-dev-storageb6735-dev.s3.us-east-2.amazonaws.com/burgers/current_newburger.jpg'
  } else {
    // If retry failed, add error class
    event.target.classList.add('error')
  }
}
</script>

<style scoped>
.alerts-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.alert {
  padding: 10px 15px;
  margin-bottom: 10px;
  border-radius: 4px;
  animation: fadeIn 0.3s ease;
}

.alert.success {
  background-color: D4EDDA_1;
  color: 155724_1;
}

.alert.error {
  background-color: F8D7DA_1;
  color: 721C24_1;
}

.loading-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #666;
}

.burger-image {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.burger-image.error {
  border: 2px solid red;
}

.image-preview {
  margin-top: 10px;
}

.image-preview img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
}

.no-burger-message {
  padding: 40px;
  text-align: center;
  color: #666;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.two-columns {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;
}
@media (max-width: 992px) {
  .two-columns {
    grid-template-columns: 1fr;
  }
}

.panel,
.preview-panel {
  background-color: var(--input-bg);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  color: var(--text-color);
}

.panel.loading::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  z-index: 10;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--input-border);
}

.panel-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-color);
}

.panel-body {
  padding: 20px;
}

.form {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.25rem;
  color: var(--text-color);
}

input,
textarea {
  width: 100%;
  padding: 0.5rem;
  font-size: 1rem;
  border-radius: 4px;
  border: 1px solid var(--input-border);
  background-color: var(--input-bg);
  color: var(--text-color);
}

textarea {
  resize: vertical;
  min-height: 80px;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

.image-preview img {
  max-width: 100%;
  max-height: 200px;
  margin-top: 1rem;
  border-radius: 6px;
}

.preview-header {
  padding: 15px 20px;
  border-bottom: 1px solid var(--input-border);
}

.preview-tabs {
  display: flex;
  gap: 15px;
}

.preview-tab {
  padding: 5px 10px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  font-weight: 500;
  color: var(--text-color);
}

.preview-tab.active {
  border-bottom-color: var(--btn-bg);
  color: var(--btn-bg);
}

.preview-body {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.card {
  text-align: center;
  max-width: 100%;
  background-color: var(--input-bg);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  color: var(--text-color);
}

.card img {
  max-width: 100%;
  max-height: 200px;
  margin-bottom: 1rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background-color: var(--btn-bg);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--btn-hover-bg);
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
