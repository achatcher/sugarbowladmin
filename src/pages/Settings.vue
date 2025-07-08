<script setup>
import { ref, reactive } from 'vue'
import { updatePassword } from 'aws-amplify/auth'
import AdminLayout from '@/layouts/AdminLayout.vue'
import Alert from '@/components/UI/Alert.vue'

// Form visibility
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Reactive form data
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Validation errors
const validationErrors = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Alerts
const alerts = ref([])
let nextAlertId = 1

// Loading state
const isLoading = ref(false)

function showAlert(message, type = 'success') {
  const id = nextAlertId++
  alerts.value.push({ id, message, type })
  setTimeout(() => {
    alerts.value = alerts.value.filter(alert => alert.id !== id)
  }, 5000)
}

function removeAlert(id) {
  alerts.value = alerts.value.filter(alert => alert.id !== id)
}

async function handleChangePassword() {
  Object.keys(validationErrors).forEach(key => validationErrors[key] = '')

  let isValid = true
  if (!passwordForm.currentPassword) {
    validationErrors.currentPassword = 'Current password is required'
    isValid = false
  }
  if (!passwordForm.newPassword) {
    validationErrors.newPassword = 'New password is required'
    isValid = false
  } else if (passwordForm.newPassword.length < 8) {
    validationErrors.newPassword = 'Must be at least 8 characters'
    isValid = false
  }
  if (!passwordForm.confirmPassword) {
    validationErrors.confirmPassword = 'Please confirm password'
    isValid = false
  } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    validationErrors.confirmPassword = 'Passwords do not match'
    isValid = false
  }
  if (!isValid) return

  isLoading.value = true
  try {
    await updatePassword({
      oldPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    })
    showAlert('✅ Password changed successfully')
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error) {
    console.error(error)
    showAlert('❌ Failed to change password: ' + error.message, 'error')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <AdminLayout>
    <template #page-title>Settings</template>

    <div id="alertContainer" class="alerts-container">
      <Alert
        v-for="alert in alerts"
        :key="alert.id"
        :type="alert.type"
        :message="alert.message"
        @close="removeAlert(alert.id)"
      />
    </div>

    <main class="settings-main">
      <section class="panel">
        <header class="panel-header">
          <h2 class="panel-title">Account Settings</h2>
        </header>
        <div class="panel-body">
          <h3 class="section-title">Change Password</h3>
          <form class="settings-form" @submit.prevent="handleChangePassword" novalidate>
            <!-- Current Password -->
            <div class="form-group">
              <label for="currentPassword">Current Password</label>
              <div class="password-field">
                <input
                  :type="showCurrentPassword ? 'text' : 'password'"
                  id="currentPassword"
                  v-model="passwordForm.currentPassword"
                  :class="{ error: validationErrors.currentPassword }"
                  autocomplete="current-password"
                  required
                />
                <button
                  type="button"
                  class="password-toggle"
                  :aria-label="showCurrentPassword ? 'Hide current password' : 'Show current password'"
                  @click="showCurrentPassword = !showCurrentPassword"
                >
                  <i :class="showCurrentPassword ? 'far fa-eye-slash' : 'far fa-eye'"></i>
                </button>
              </div>
              <p class="error-message" v-if="validationErrors.currentPassword">
                {{ validationErrors.currentPassword }}
              </p>
            </div>

            <!-- New Password -->
            <div class="form-group">
              <label for="newPassword">New Password</label>
              <div class="password-field">
                <input
                  :type="showNewPassword ? 'text' : 'password'"
                  id="newPassword"
                  v-model="passwordForm.newPassword"
                  :class="{ error: validationErrors.newPassword }"
                  autocomplete="new-password"
                  required
                />
                <button
                  type="button"
                  class="password-toggle"
                  :aria-label="showNewPassword ? 'Hide new password' : 'Show new password'"
                  @click="showNewPassword = !showNewPassword"
                >
                  <i :class="showNewPassword ? 'far fa-eye-slash' : 'far fa-eye'"></i>
                </button>
              </div>
              <p class="error-message" v-if="validationErrors.newPassword">
                {{ validationErrors.newPassword }}
              </p>
            </div>

            <!-- Confirm Password -->
            <div class="form-group">
              <label for="confirmPassword">Confirm New Password</label>
              <div class="password-field">
                <input
                  :type="showConfirmPassword ? 'text' : 'password'"
                  id="confirmPassword"
                  v-model="passwordForm.confirmPassword"
                  :class="{ error: validationErrors.confirmPassword }"
                  autocomplete="new-password"
                  required
                />
                <button
                  type="button"
                  class="password-toggle"
                  :aria-label="showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'"
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  <i :class="showConfirmPassword ? 'far fa-eye-slash' : 'far fa-eye'"></i>
                </button>
              </div>
              <p class="error-message" v-if="validationErrors.confirmPassword">
                {{ validationErrors.confirmPassword }}
              </p>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="isLoading">
                <span v-if="isLoading" class="spinner-border spinner-border-sm mr-2"></span>
                {{ isLoading ? 'Changing Password...' : 'Change Password' }}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  </AdminLayout>
</template>

<style scoped>
/* Center container & set max width */
.settings-main {
  max-width: 600px;
  margin: 2rem auto 3rem;
  padding: 0 1rem;
  width: 100%;
  box-sizing: border-box;
}

/* Alerts fixed at top, full width */
.alerts-container {
  position: fixed;
  top: 70px;
  left: 0;
  right: 0;
  z-index: 1050;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 600px;
  margin: 0 auto;
  padding: 0 1rem;
  pointer-events: none;
}

.alerts-container > * {
  pointer-events: auto;
}

.panel {
  background-color: var(--input-bg);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  color: var(--text-color);
}

.panel-header {
  padding: 15px 20px;
  border-bottom: 1px solid var(--input-border);
}

.panel-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-color);
}

.panel-body {
  padding: 20px 30px;
}

.section-title {
  font-size: 1.3rem;
  margin-bottom: 25px;
  color: var(--btn-bg);
  border-bottom: 1px solid var(--input-border);
  padding-bottom: 12px;
  font-weight: 600;
}

.settings-form {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 24px;
}

label {
  display: block;
  margin-bottom: 10px;
  font-weight: 600;
  color: var(--text-color);
}

.password-field {
  position: relative;
  display: flex;
  align-items: center;
}

input[type='password'],
input[type='text'] {
  flex: 1;
  padding: 12px 15px;
  font-size: 1rem;
  border-radius: 6px;
  border: 1.5px solid var(--input-border);
  background-color: var(--input-bg);
  color: var(--text-color);
  transition: border-color 0.2s ease;
  outline-offset: 2px;
}

input[type='password']:focus,
input[type='text']:focus {
  border-color: var(--btn-bg);
  outline: none;
}

input.error {
  border-color: var(--alert-color);
}

.password-toggle {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: var(--text-color);
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0;
  height: 100%;
  display: flex;
  align-items: center;
}

.error-message {
  margin-top: 6px;
  font-size: 0.9rem;
  color: var(--alert-color);
  font-weight: 600;
  user-select: none;
}

.form-actions {
  margin-top: 30px;
  display: flex;
  justify-content: flex-start;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
  transition: background-color 0.3s ease;
}

.btn-primary {
  background-color: var(--btn-bg);
  color: var(--input-bg);
  box-shadow: 0 4px 12px rgb(37 99 235 / 0.4);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--btn-hover-bg);
  box-shadow: 0 6px 20px rgb(59 130 246 / 0.6);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner-border {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border 0.75s linear infinite;
  color: var(--input-bg);
  margin-right: 0.5rem;
}

@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .settings-main {
    margin: 1.5rem 1rem 2rem;
  }

  .panel-body {
    padding: 20px 15px;
  }

  .form-actions {
    justify-content: center;
  }

  .btn {
    width: 100%;
  }
}
</style>
