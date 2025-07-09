import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/pages/Login.vue'
import ForgotPassword from '@/pages/ForgotPassword.vue'
import BurgerEditor from '@/pages/BurgerEditor.vue'
import MenuItems from '@/pages/MenuItems.vue'
import Settings from '@/pages/Settings.vue'
import Help from '@/pages/Help.vue'

import { fetchAuthSession } from 'aws-amplify/auth'

const routes = [
  { path: '/', name: 'Login', component: Login },
  { path: '/forgot-password', name: 'ForgotPassword', component: ForgotPassword },
  {
    path: '/admin/burger-editor',
    name: 'BurgerEditor',
    component: BurgerEditor,
    meta: { requiresAuth: true }
  },
  {
    path: '/editor',
    redirect: '/admin/burger-editor'
  },
  {
    path: '/admin/menu-items',
    name: 'MenuItems',
    component: MenuItems,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/settings',
    name: 'Settings',
    component: Settings,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/help',
    name: 'Help',
    component: Help,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.idToken
      if (token) {
        next()
      } else {
        next({ name: 'Login' })
      }
    } catch {
      next({ name: 'Login' })
    }
  } else {
    next()
  }
})

export default router
