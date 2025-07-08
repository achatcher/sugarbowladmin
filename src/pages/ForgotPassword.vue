<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { resetPassword, confirmResetPassword } from 'aws-amplify/auth'
import ThemeToggle from '@/components/ThemeToggle.vue'

const router = useRouter()

const username = ref('')
const code = ref('')
const newPassword = ref('')

const step = ref(1)
const isLoading = ref(false)
const error = ref('')
const success = ref('')
const showPassword = ref(false)

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const handleRequestCode = async () => {
  error.value = ''
  success.value = ''
  isLoading.value = true

  try {
    await resetPassword(username.value.trim())
    step.value = 2
    success.value = 'A verification code has been sent to your email.'
  } catch (err) {
    error.value = err.message || 'Failed to send code.'
  } finally {
    isLoading.value = false
  }
}

const handleConfirmReset = async () => {
  error.value = ''
  success.value = ''
  isLoading.value = true

  try {
    await confirmResetPassword(
      username.value.trim(),
      code.value.trim(),
      newPassword.value
    )

    success.value = 'Password has been reset. Redirecting to login...'
    setTimeout(() => router.push({ name: 'Login' }), 2500)
  } catch (err) {
    error.value = err.message || 'Failed to reset password.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-form">
      <div class="logo-container">
        <img src="@/assets/img/logo.svg" alt="SugarBowl Logo" />
        <h1>Reset Password</h1>
      </div>

      <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
      <div v-if="success" class="alert alert-success" role="alert">{{ success }}</div>

      <form @submit.prevent="step === 1 ? handleRequestCode() : handleConfirmReset()" novalidate>
        <div class="form-group">
          <label for="username" class="form-label">Username</label>
          <input
            type="text"
            id="username"
            v-model="username"
            class="form-control"
            required
            :disabled="step === 2"
            autocomplete="username"
          />
        </div>

        <template v-if="step === 2">
          <div class="form-group">
            <label for="code" class="form-label">Verification Code</label>
            <input
              type="text"
              id="code"
              v-model="code"
              class="form-control"
              placeholder="Enter the code you received"
              required
              autocomplete="one-time-code"
            />
          </div>

          <div class="form-group">
            <label for="newPassword" class="form-label">New Password</label>
            <div class="password-field">
              <input
                :type="showPassword ? 'text' : 'password'"
                id="newPassword"
                v-model="newPassword"
                class="form-control"
                placeholder="Enter a new password"
                required
                autocomplete="new-password"
              />
              <button
                type="button"
                class="password-toggle"
                @click="togglePassword"
                aria-label="Toggle password visibility"
              >
                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
          </div>
        </template>

        <button
          type="submit"
          class="btn"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Processing...' : step === 1 ? 'Send Code' : 'Reset Password' }}
        </button>

        <div class="additional-options">
          <RouterLink :to="{ name: 'Login' }" class="forgot-password-link">Back to Login</RouterLink>
        </div>
      </form>
    </div>
    <!-- Use the toggle -->
    <ThemeToggle />
  </div>
</template> 

<style scoped>
*,
*::before,
*::after {
  box-sizing: border-box;
}

.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: var(--bg-color);
  padding: 24px;
}

.login-form {
  width: 100%;
  max-width: 420px;
  padding: 36px;
  background: var(--input-bg);
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
  font-family: 'Inter', sans-serif;
  color: var(--text-color);
}

.logo-container {
  text-align: center;
  margin-bottom: 32px;
}

.logo-container img {
  height: 64px;
  margin-bottom: 12px;
}

.logo-container h1 {
  font-weight: 700;
  font-size: 28px;
  color: var(--text-color);
  margin: 0;
}

.alert {
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-weight: 600;
  font-size: 14px;
  border: 1px solid;
}

.alert-danger {
  background-color: var(--alert-danger-bg, #fee2e2);
  color: var(--alert-danger-color, #b91c1c);
  border-color: var(--alert-danger-border, #fca5a5);
}

.alert-success {
  background-color: var(--alert-success-bg, #d1fae5);
  color: var(--alert-success-color, #065f46);
  border-color: var(--alert-success-border, #6ee7b7);
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 15px;
  color: var(--text-color);
}

.form-control {
  width: 100%;
  padding: 14px 16px;
  font-size: 16px;
  font-weight: 500;
  border: 1.5px solid var(--input-border);
  border-radius: 10px;
  color: var(--text-color);
  background-color: var(--input-bg);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-control::placeholder {
  color: #9ca3af;
}

.form-control:focus {
  outline: none;
  border-color: var(--btn-bg);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
}

.password-field {
  position: relative;
}

.password-toggle {
  position: absolute;
  top: 50%;
  right: 14px;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-color);
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  user-select: none;
  transition: color 0.2s ease;
}

.password-toggle:hover {
  color: var(--btn-bg);
}

.btn {
  width: 100%;
  padding: 14px 0;
  font-size: 16px;
  font-weight: 700;
  background-color: var(--btn-bg);
  color: white;
  border: none;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
  transition: background-color 0.2s ease;
}

.btn:hover:not(:disabled) {
  background-color: var(--btn-hover-bg);
}

.btn:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}

.additional-options {
  margin-top: 20px;
  text-align: center;
}

.forgot-password-link {
  font-size: 15px;
  font-weight: 500;
  color: var(--btn-bg);
  text-decoration: none;
}

.forgot-password-link:hover {
  text-decoration: underline;
}
</style>

