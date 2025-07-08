<script setup>
import { ref, reactive } from 'vue'
import { post } from 'aws-amplify/api'
import AdminLayout from '@/layouts/AdminLayout.vue'
import Alert from '@/components/UI/Alert.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'

// Alerts
const alerts = ref([])
let nextAlertId = 1

function showAlert(message, type = 'success') {
  const id = nextAlertId++
  alerts.value.push({ id, message, type })
  setTimeout(() => removeAlert(id), 5000)
}

function removeAlert(id) {
  alerts.value = alerts.value.filter(alert => alert.id !== id)
}

// Loading state
const isLoading = ref(false)

// FAQ
const faqs = [
  {
    question: 'How do I update the Burger of the Month?',
    answer: 'Navigate to the "Burger of the Month" page from the main menu. There you can update the burger name, description, price, availability dates, and image. Click "Save Changes" when finished.'
  },
  {
    question: 'How do I add or remove menu items?',
    answer: 'Go to the "Menu Items" section. To add a new item, click the "Add Item" button and fill in the required information. To remove an item, locate it in the list and click the trash icon, then confirm the deletion.'
  },
  {
    question: 'How do I change my password?',
    answer: 'Go to the "Settings" page where you\'ll find a form to change your password. Enter your current password, then your new password twice to confirm. Click "Change Password" to save.'
  },
  {
    question: 'What happens when I publish changes?',
    answer: 'When you publish changes, any updated or new menu items become visible to customers on the SugarBowl website. Until published, changes are only visible in the admin panel.'
  }
]

const activeFaqIndex = ref(null)
const toggleFaq = index => {
  activeFaqIndex.value = activeFaqIndex.value === index ? null : index
}

// File upload
const fileInput = ref(null)
const fileName = ref('')
const triggerFileInput = () => fileInput.value?.click()

const supportForm = reactive({
  subject: '',
  urgency: '',
  message: '',
  attachment: null
})

// File selection
const handleFileSelect = e => {
  const file = e.target.files[0]
  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    showAlert('File size should be under 5MB', 'error')
    return
  }

  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  if (!allowed.includes(file.type)) {
    showAlert('Unsupported file type. Use PNG, JPG, PDF, DOC, or DOCX.', 'error')
    return
  }

  fileName.value = file.name
  supportForm.attachment = file
}

// Submit form
const submitSupportRequest = async () => {
  if (!supportForm.subject || !supportForm.urgency || !supportForm.message) {
    showAlert('Please fill in all required fields', 'error')
    return
  }

  isLoading.value = true

  try {
    // Construct basic payload
    const body = {
      subject: supportForm.subject,
      urgency: supportForm.urgency,
      message: supportForm.message,
      timestamp: new Date().toISOString()
    }

    // If file was selected, base64 encode it (basic fallback)
    if (supportForm.attachment) {
      const file = supportForm.attachment
      const base64 = await toBase64(file)
      body.attachment = {
        name: file.name,
        type: file.type,
        content: base64
      }
    }

    await post({
      apiName: 'burgeradminapi',
      path: '/help',
      options: {
        body
      }
    }).response

    showAlert('✅ Support request sent successfully!')
    supportForm.subject = ''
    supportForm.urgency = ''
    supportForm.message = ''
    supportForm.attachment = null
    fileName.value = ''
  } catch (err) {
    console.error(err)
    showAlert('❌ Failed to send support request', 'error')
  } finally {
    isLoading.value = false
  }
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1]) // Strip data URL prefix
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
</script>

<template>
  <AdminLayout>
    <template #page-title>Help & Support</template>

    <div id="alertContainer">
      <Alert
        v-for="alert in alerts"
        :key="alert.id"
        :type="alert.type"
        :message="alert.message"
        @close="removeAlert(alert.id)"
      />
    </div>

    <!-- FAQ Section -->
    <div class="panel">
      <div class="panel-header">
        <h2 class="panel-title">Frequently Asked Questions</h2>
      </div>
      <div class="panel-body">
        <div class="faq-container">
          <div
            v-for="(faq, index) in faqs"
            :key="index"
            class="faq-item"
          >
            <div
              class="faq-question"
              :class="{ active: activeFaqIndex === index }"
              @click="toggleFaq(index)"
            >
              <h3>{{ faq.question }}</h3>
              <i :class="activeFaqIndex === index ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
            </div>
            <div
              class="faq-answer"
              :class="{ show: activeFaqIndex === index }"
              :style="{ maxHeight: activeFaqIndex === index ? '1000px' : '0' }"
            >
              <p>{{ faq.answer }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Support Form -->
    <div class="panel">
      <div class="panel-header">
        <h2 class="panel-title">Contact Support</h2>
      </div>
      <div class="panel-body">
        <p class="help-intro">
          Need assistance with the SugarBowl Admin? Fill out the form below to reach out directly to our support team.
        </p>

        <form class="support-form" @submit.prevent="submitSupportRequest">
          <div class="form-group">
            <label for="subject">Subject</label>
            <input
              id="subject"
              v-model="supportForm.subject"
              type="text"
              class="form-control"
              placeholder="Briefly describe your issue"
              required
            />
          </div>

          <div class="form-group">
            <label for="urgency">Urgency Level</label>
            <select
              id="urgency"
              v-model="supportForm.urgency"
              class="form-control"
              required
            >
              <option value="">Select urgency level</option>
              <option value="low">Low - General question</option>
              <option value="medium">Medium - Needs attention within 24 hours</option>
              <option value="high">High - Urgent issue affecting operations</option>
              <option value="critical">Critical - System down or major malfunction</option>
            </select>
          </div>

          <div class="form-group">
            <label for="message">Message Details</label>
            <textarea
              id="message"
              v-model="supportForm.message"
              rows="6"
              class="form-control"
              placeholder="Please describe your issue in detail..."
              required
            ></textarea>
          </div>

          <div class="form-group">
            <label for="attachment">Attachment (Optional)</label>
            <div class="file-input-container">
              <input
                type="file"
                id="attachment"
                class="file-input"
                @change="handleFileSelect"
                ref="fileInput"
              />
              <div class="file-input-label" @click="triggerFileInput">
                <i class="fas fa-paperclip"></i>
                <span>{{ fileName || 'Choose a file' }}</span>
              </div>
            </div>
            <p class="help-text">Accepted file types: PNG, JPG, PDF, DOC, DOCX (max 5MB)</p>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="isLoading">
              <i :class="isLoading ? 'fas fa-spinner fa-spin' : 'fas fa-paper-plane'"></i>
              {{ isLoading ? 'Sending...' : 'Send Message' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>


<style scoped>
.panel {
  background-color: var(--input-bg);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgb(0 0 0 / 0.1);
  overflow: hidden;
  margin-bottom: 24px;
  color: var(--text-color);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.panel-header {
  padding: 15px 20px;
  border-bottom: 1.5px solid var(--input-border);
  background-color: var(--bg-color);
}

.panel-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.panel-body {
  padding: 24px;
}

.faq-container {
  margin-top: 15px;
}

.faq-item {
  border-bottom: 1.5px solid var(--input-border);
  margin-bottom: 15px;
}

.faq-question {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 15px 10px;
  font-weight: 600;
  color: var(--text-color);
}

.faq-question h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.faq-question i {
  color: var(--text-color);
  transition: transform 0.2s ease;
}

.faq-question.active {
  color: var(--btn-bg);
}

.faq-question.active i {
  color: var(--btn-bg);
}

.faq-answer {
  padding: 0 10px;
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.3s ease-out;
}

.faq-answer.show {
  max-height: 1000px;
  transition: max-height 0.5s ease-in;
}

.faq-answer p {
  margin: 0 0 15px;
  line-height: 1.6;
  color: var(--text-color);
  padding-bottom: 15px;
}

.help-intro {
  margin-bottom: 25px;
  color: var(--text-color);
}

.support-form {
  max-width: 800px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--text-color);
}

.form-control {
  width: 100%;
  padding: 10px 15px;
  border: 1.5px solid var(--input-border);
  border-radius: 6px;
  font-size: 1rem;
  background-color: var(--input-bg);
  color: var(--text-color);
  transition: border-color 0.3s ease;
}

.form-control:focus {
  border-color: var(--btn-bg);
  outline: none;
}

textarea.form-control {
  resize: vertical;
}

.file-input-container {
  position: relative;
  overflow: hidden;
}

.file-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.file-input-label {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  background: var(--input-bg);
  border: 1.5px dashed var(--input-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-color);
}

.file-input-label:hover {
  border-color: var(--btn-bg);
}

.file-input-label i {
  margin-right: 10px;
  color: var(--btn-bg);
}

.help-text {
  font-size: 0.8rem;
  color: var(--text-color);
  margin-top: 5px;
}

.form-actions {
  margin-top: 30px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  background-color: var(--btn-bg);
  color: var(--input-bg);
}

.btn:hover:not(:disabled) {
  background-color: var(--btn-hover-bg);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@keyframes spinner {
  to { transform: rotate(360deg); }
}

.fa-spinner {
  animation: spinner 1s linear infinite;
}
</style>
