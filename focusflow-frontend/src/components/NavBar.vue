<template>
  <header class="header">
    <RouterLink to="/" class="logo">⚡ FocusFlow</RouterLink>

    <nav class="nav">
      <template v-if="auth.isLoggedIn">
        <RouterLink to="/">Timer</RouterLink>
        <RouterLink to="/dashboard">Dashboard</RouterLink>
        <RouterLink to="/friends">Amis</RouterLink>
        <RouterLink to="/profile">Profil</RouterLink>
        <button class="btn-logout" @click="handleSignOut">Déconnexion</button>
      </template>
      <RouterLink v-else to="/auth" class="btn-login">
        Se connecter
      </RouterLink>
    </nav>
  </header>
</template>

<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth   = useAuthStore()
const router = useRouter()

async function handleSignOut() {
  await auth.signOut()
  router.push('/')
}
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 12px;
}

.logo {
  font-family: 'Fredoka One', cursive;
  font-size: 26px;
  background: linear-gradient(135deg, var(--c1), var(--c2), var(--c4));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-decoration: none;
}

.nav {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.nav a {
  color: var(--muted);
  text-decoration: none;
  font-weight: 700;
  font-size: 14px;
  transition: color 0.2s;
}

.nav a:hover { color: var(--text); }

.nav a.router-link-active { color: var(--text); }

.btn-login {
  background: var(--surface2);
  color: var(--text) !important;
  padding: 8px 18px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 14px;
}

.btn-logout {
  background: none;
  border: none;
  color: var(--muted);
  font-family: 'Nunito', sans-serif;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s;
}

.btn-logout:hover { color: var(--c1); }
</style>