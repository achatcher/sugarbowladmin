<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Amplify } from 'aws-amplify'
import { signIn, confirmSignIn, getCurrentUser, signOut } from 'aws-amplify/auth'
import { useTheme } from '@/composables/useTheme'
import ThemeToggle from '@/components/ThemeToggle.vue'

const { theme, toggle } = useTheme()
const router = useRouter()

// Form state
const username = ref('')
const password = ref('')
const newPassword = ref('')
const rememberMe = ref(false)

const showPassword = ref(false)
const showNewPassword = ref(false)

const error = ref(null)
const isLoading = ref(false)
const requiresNewPassword = ref(false)
let currentUser = null

const togglePassword = () => {
  showPassword.value = !showPassword.value
}
const toggleNewPassword = () => {
  showNewPassword.value = !showNewPassword.value
}

// Check for active session on page load
onMounted(async () => {
  try {
    const user = await getCurrentUser()
    if (user) {
      router.push('/admin/burger-editor')
    }
  } catch {
    // No active user — do nothing
  }
})

const handleLogin = async () => {
  error.value = null
  isLoading.value = true

  try {
    if (!requiresNewPassword.value) {
      const result = await signIn({
        username: username.value.trim(),
        password: password.value,
      })
      currentUser = result

      if (result.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        requiresNewPassword.value = true
        error.value = 'Please enter a new password to continue.'
      } else if (result.isSignedIn) {
        router.push('/editor')
      } else {
        error.value = 'Sign in incomplete.'
      }
    } else {
      const result = await confirmSignIn({
        user: currentUser,
        challengeResponse: newPassword.value,
      })

      if (result.isSignedIn) {
        router.push('/editor')
      } else {
        error.value = 'New password confirmation failed.'
      }
    }
  } catch (err) {
    error.value = err.message || 'Login failed'
  } finally {
    isLoading.value = false
  }
}

const handleSignOut = async () => {
  try {
    await signOut()
    username.value = ''
    password.value = ''
    newPassword.value = ''
    currentUser = null
    requiresNewPassword.value = false
    error.value = null
  } catch (err) {
    console.error('Error signing out:', err)
  }
}

const forgotPassword = () => {
  router.push('/forgot-password')
}
</script>


<template>
  <div class="login-container">
    <div class="login-form">
      <div class="logo-container">
        <img src="@/assets/img/logo.svg" alt="SugarBowl Logo" />
        <h1>SUGARBOWL ADMIN</h1>
      </div>

      <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>

      <form @submit.prevent="handleLogin" novalidate>
        <div class="form-group">
          <label for="username" class="form-label">Username</label>
          <input
            type="text"
            id="username"
            v-model="username"
            class="form-control"
            placeholder="Enter your username"
            required
            autocomplete="username"
            :disabled="requiresNewPassword"
          />
        </div>

        <div class="form-group" v-if="!requiresNewPassword">
          <label for="password" class="form-label">Password</label>
          <div class="password-field">
            <input
              :type="showPassword ? 'text' : 'password'"
              id="password"
              v-model="password"
              class="form-control"
              placeholder="Enter your password"
              required
              autocomplete="current-password"
              aria-describedby="togglePasswordBtn"
            />
            <button
              type="button"
              id="togglePasswordBtn"
              class="password-toggle"
              @click="togglePassword"
              aria-label="Toggle password visibility"
            >
              <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
        </div>

        <div class="form-group" v-if="requiresNewPassword">
          <label for="newPassword" class="form-label">New Password</label>
          <div class="password-field">
            <input
              :type="showNewPassword ? 'text' : 'password'"
              id="newPassword"
              v-model="newPassword"
              class="form-control"
              placeholder="Enter a new password"
              required
              autocomplete="new-password"
              aria-describedby="toggleNewPasswordBtn"
            />
            <button
              type="button"
              id="toggleNewPasswordBtn"
              class="password-toggle"
              @click="toggleNewPassword"
              aria-label="Toggle new password visibility"
            >
              <i :class="showNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
        </div>

        <div class="form-group remember-me" v-if="!requiresNewPassword">
          <input
            type="checkbox"
            id="rememberMe"
            v-model="rememberMe"
            class="form-checkbox"
          />
          <label for="rememberMe" class="remember-label">Remember me</label>
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-block"
          :disabled="isLoading"
          aria-busy="isLoading"
        >
          <span
            v-if="isLoading"
            class="spinner-border spinner-border-sm mr-2"
            role="status"
            aria-hidden="true"
          ></span>
          {{
            isLoading
              ? requiresNewPassword
                ? 'Setting Password...'
                : 'Logging in...'
              : requiresNewPassword
              ? 'Set New Password'
              : 'Log In'
          }}
        </button>

        <div class="additional-options" v-if="!requiresNewPassword">
          <a href="#" @click.prevent="forgotPassword" class="forgot-password-link"
            >Forgot Password?</a
          >
        </div>
      </form>
    </div>
    <!-- Use the toggle -->
    <ThemeToggle />
  </div>
</template>

<style scoped>
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
  padding: 36px 40px;
  background-color: var(--input-bg);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0 0 0 / 0.12);
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
  letter-spacing: 1px;
  margin: 0;
  color: var(--text-color);
}

.alert {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  background-color: rgba(220, 38, 38, 0.1);
  color: #dc2626;
  border: 1px solid #dc2626;
  margin-bottom: 20px;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 10px;
  font-weight: 600;
  font-size: 15px;
  color: var(--text-color);
}

.form-control {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  border-radius: 8px;
  border: 1.5px solid var(--input-border);
  background-color: var(--input-bg);
  color: var(--text-color);
  font-weight: 500;
  transition: border-color 0.2s ease;
}

.form-control::placeholder {
  color: #aaa;
}

.form-control:focus {
  outline: none;
  border-color: var(--btn-bg);
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
  transition: color 0.2s ease;
  user-select: none;
}

.password-toggle:hover {
  color: var(--btn-bg);
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: -8px;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--btn-bg);
}

.remember-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-color);
  cursor: pointer;
}

.btn {
  width: 100%;
  padding: 14px 0;
  font-size: 17px;
  font-weight: 700;
  background-color: var(--btn-bg);
  color: var(--input-bg);
  border: none;
  border-radius: 8px;
  cursor: pointer !important;
  transition: background-color 0.2s ease;
}

.btn:hover:not(:disabled) {
  background-color: var(--btn-hover-bg);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner-border {
  vertical-align: middle;
  margin-right: 8px;
}

.additional-options {
  margin-top: 18px;
  text-align: center;
}

.forgot-password-link {
  font-size: 14px;
  font-weight: 600;
  color: var(--btn-bg);
  text-decoration: none;
  user-select: none;
}

.forgot-password-link:hover {
  text-decoration: underline;
}
</style>
