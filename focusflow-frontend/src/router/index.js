import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    name: 'timer',
    component: () => import('@/views/TimerView.vue'),
    // Pas de meta → accessible sans connexion
  },
  {
    path: '/auth',
    name: 'auth',
    component: () => import('@/views/AuthView.vue'),
    meta: { guestOnly: true }  // redirige si déjà connecté
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/friends',
    name: 'friends',
    component: () => import('@/views/FriendsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'  // toute route inconnue → timer
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// ── Guard global ──────────────────────────────────────────
router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Attend que l'auth soit initialisée avant de décider
  if (auth.loading) {
    await new Promise(resolve => {
      const stop = setInterval(() => {
        if (!auth.loading) {
          clearInterval(stop)
          resolve()
        }
      }, 50)
    })
  }

  // Page protégée + non connecté → redirige vers /auth
  // On mémorise la destination pour y revenir après connexion
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'auth', query: { redirect: to.fullPath } }
  }

  // Page guest only + déjà connecté → redirige vers dashboard
  if (to.meta.guestOnly && auth.isLoggedIn) {
    return { name: 'timer' }
  }
})

export default router