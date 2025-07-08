<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCurrentUser, signOut } from 'aws-amplify/auth'
import { useTheme } from '@/composables/useTheme'
import ThemeToggle from '@/components/ThemeToggle.vue'

const router = useRouter()
const sidebarOpen = ref(false)

const userName = ref('Admin')
const userInitials = computed(() => {
  const name = userName.value
  const parts = name.split(' ')
  return parts.length >= 2
    ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
    : name[0]?.toUpperCase() || 'A'
})

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
  document.body.style.overflow = sidebarOpen.value ? 'hidden' : ''
}

const closeSidebar = () => {
  sidebarOpen.value = false
  document.body.style.overflow = ''
}

const logout = async () => {
  try {
    await signOut()
    router.push('/')
  } catch (err) {
    console.error('Logout failed:', err)
  }
}

// Load user info from Cognito
onMounted(async () => {
  try {
    const user = await getCurrentUser()
    userName.value = user.username || 'Admin'
  } catch {
    userName.value = 'Admin'
  }
})

// Close sidebar on route change
router.afterEach(() => {
  if (sidebarOpen.value) closeSidebar()
})

const { theme } = useTheme()
</script>

<template>
  <div class="admin-container" :data-theme="theme">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'show': sidebarOpen }">
      <div class="sidebar-header">
        <img src="@/assets/img/logo.svg" alt="SugarBowl Logo" />
      </div>
      
      <nav class="sidebar-nav">
        <ul>
          <li>
            <router-link to="/admin/burger-editor">
              <i class="fas fa-hamburger"></i>Burger of the Month
            </router-link>
          </li>
          <li>
            <router-link to="/admin/menu-items">
              <i class="fas fa-utensils"></i>Menu Items
            </router-link>
          </li>
          <li>
            <router-link to="/admin/settings">
              <i class="fas fa-cog"></i>Settings
            </router-link>
          </li>
          <li>
            <router-link to="/admin/help">
              <i class="fas fa-question-circle"></i>Help
            </router-link>
          </li>
        </ul>
      </nav>
      
      <!-- Mobile-only footer with logout option -->
      <div class="sidebar-footer">
        <button id="sidebarLogoutBtn" class="sidebar-logout-btn" @click="logout">
          <i class="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <div class="topbar">
        <button class="sidebar-toggle" id="sidebar-toggle" @click="toggleSidebar" aria-label="Toggle menu">
          <i class="fas fa-bars"></i>
        </button>
        <h1 class="page-title">
          <slot name="page-title">Admin Dashboard</slot>
        </h1>
        <div class="user-info">
          <span class="user-name">{{ userName }}</span>
          <div class="user-avatar">{{ userInitials }}</div>
          <button class="logout-btn" id="logoutBtn" title="Log Out" @click="logout">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
      
      <div class="content">
        <slot></slot>
      </div>
    </main>
    
    <!-- Sidebar overlay for mobile -->
    <div 
      class="sidebar-overlay" 
      :class="{ 'show': sidebarOpen }" 
      @click="closeSidebar"
    ></div>
  </div>
  <!-- Theme toggle fixed bottom right -->
  <ThemeToggle />
</template>

<style scoped>
.admin-container {
  display: flex;
  min-height: 100vh;
}

/* Sidebar */
.sidebar {
  width: 260px;
  background-color: var(--input-bg);
  color: var(--text-color);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
  position: fixed;
  height: 100vh;
  z-index: 100;
}

.sidebar-header {
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header img {
  width: 200px;
  height: auto;
  margin: 10px;
}

.sidebar-header h1 {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 24px;
  margin: 0;
  letter-spacing: 1px;
}

.sidebar-nav {
  flex-grow: 1;
  padding: 20px 0;
}

.sidebar-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-nav li {
  margin: 5px 0;
}

/* Sidebar nav link colors adjust for theme */
.sidebar-nav a {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: var(--text-color);
  text-decoration: none;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.sidebar-nav a:hover,
.sidebar-nav a.router-link-active {
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--text-color);
  border-left-color: #8b0000;
}

.sidebar-nav a i {
  width: 20px;
  margin-right: 10px;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: none;
}

.sidebar-logout-btn {
  width: 100%;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--text-color);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.sidebar-logout-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.sidebar-logout-btn i {
  margin-right: 8px;
}

/* Main Content */
.main-content {
  flex-grow: 1;
  margin-left: 260px;
  transition: margin-left 0.3s ease;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color);
  width: 100%;
  color: var(--text-color);
}

.topbar {
  background-color: var(--input-bg);
  padding: 0 20px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  color: var(--text-color);
}

.sidebar-toggle {
  display: none;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--text-color);
  padding: 5px;
}

.page-title {
  margin: 0;
  padding: 0 0.5rem;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-color);
}

.user-info {
  display: flex;
  align-items: center;
}

.user-name {
  margin-right: 10px;
  font-weight: 500;
  color: var(--text-color);
}

.user-avatar {
  width: 35px;
  height: 35px;
  background-color: #2b4da8;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.85rem;
}

.logout-btn {
  background: none;
  border: none;
  margin-left: 15px;
  color: var(--text-color);
  cursor: pointer;
  font-size: 1.1rem;
  transition: color 0.2s;
}

.logout-btn:hover {
  color: var(--btn-bg);
}

.content {
  padding: 20px;
  flex-grow: 1;
  color: var(--text-color);
}

/* Sidebar overlay for mobile */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 90;
  display: none;
}

.sidebar-overlay.show {
  display: block;
}

/* Mobile responsiveness */
@media (max-width: 992px) {
  .sidebar {
    transform: translateX(-100%);
  }
  
  .sidebar.show {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
  }
  
  .sidebar-toggle {
    display: block;
  }
  
  .sidebar-footer {
    display: block;
  }
}
</style>







