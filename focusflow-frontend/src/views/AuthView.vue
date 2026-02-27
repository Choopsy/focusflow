<template>
  <div class="auth-view">

    <div class="blobs" aria-hidden="true">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
    </div>

    <div class="auth-container">

      <!-- Logo -->
      <RouterLink to="/" class="logo">⚡ FocusFlow</RouterLink>
      <p class="tagline">Travaille mieux, gagne des points.</p>

      <!-- Onglets Login / Inscription -->
      <div class="tabs">
        <button
          class="tab"
          :class="{ active: mode === 'login' }"
          @click="mode = 'login'"
        >
          Connexion
        </button>
        <button
          class="tab"
          :class="{ active: mode === 'register' }"
          @click="mode = 'register'"
        >
          Inscription
        </button>
      </div>

      <!-- Carte formulaire -->
      <div class="auth-card">

        <!-- Erreur globale -->
        <Transition name="fade">
          <div v-if="error" class="error-banner">
            ⚠️ {{ error }}
          </div>
        </Transition>

        <!-- Champ username (inscription uniquement) -->
        <Transition name="fade">
          <div v-if="mode === 'register'" class="field">
            <label>Pseudo</label>
            <input
              v-model="username"
              type="text"
              placeholder="ton_pseudo"
              :disabled="loading"
              @keydown.enter="submit"
            />
          </div>
        </Transition>

        <!-- Email -->
        <div class="field">
          <label>Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="toi@email.com"
            :disabled="loading"
            @keydown.enter="submit"
          />
        </div>

        <!-- Mot de passe -->
        <div class="field">
          <label>Mot de passe</label>
          <div class="password-wrap">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              :disabled="loading"
              @keydown.enter="submit"
            />
            <button
              class="toggle-password"
              @click="showPassword = !showPassword"
              type="button"
            >
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <!-- Bouton submit -->
        <button
          class="btn-submit"
          :disabled="loading"
          @click="submit"
        >
          <span v-if="loading">⏳ Chargement...</span>
          <span v-else-if="mode === 'login'">🔐 Se connecter</span>
          <span v-else>🚀 Créer mon compte</span>
        </button>

        <!-- Succès inscription -->
        <Transition name="fade">
          <div v-if="successMsg" class="success-banner">
            ✅ {{ successMsg }}
          </div>
        </Transition>

        <!-- Lien vers timer sans connexion -->
        <div class="skip-wrap">
          <RouterLink to="/" class="skip-link">
            Continuer sans compte →
          </RouterLink>
        </div>

      </div>

      <!-- Points motivants -->
      <div class="perks">
        <div class="perk">🔥 Streaks quotidiens</div>
        <div class="perk">⚡ Points & niveaux</div>
        <div class="perk">👥 Défis entre amis</div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth   = useAuthStore()
const router = useRouter()
const route  = useRoute()

// ── State ─────────────────────────────────────────────────
const mode         = ref('login')    // 'login' | 'register'
const email        = ref('')
const password     = ref('')
const username     = ref('')
const loading      = ref(false)
const error        = ref('')
const successMsg   = ref('')
const showPassword = ref(false)

// ── Submit ────────────────────────────────────────────────
async function submit() {
  // Reset messages
  error.value      = ''
  successMsg.value = ''

  // Validation basique
  if (!email.value || !password.value) {
    error.value = 'Email et mot de passe requis.'
    return
  }

  if (mode.value === 'register' && !username.value) {
    error.value = 'Le pseudo est requis.'
    return
  }

  if (password.value.length < 6) {
    error.value = 'Le mot de passe doit faire au moins 6 caractères.'
    return
  }

  loading.value = true

  try {
    if (mode.value === 'login') {
      await auth.signIn(email.value, password.value)

      // Redirige vers la page demandée avant la connexion
      // ou vers le dashboard par défaut
      const redirect = route.query.redirect || '/'
      router.push(redirect)

    } else {
      await auth.signUp(email.value, password.value, username.value)
      successMsg.value = 'Compte créé ! Vérifie tes emails pour confirmer ton compte.'
      
      // Vide le formulaire
      email.value    = ''
      password.value = ''
      username.value = ''
    }

  } catch (e) {
    // Traduit les erreurs Supabase en français
    const msg = e.message || ''
    if (msg.includes('Invalid login credentials')) {
      error.value = 'Email ou mot de passe incorrect.'
    } else if (msg.includes('User already registered')) {
      error.value = 'Un compte existe déjà avec cet email.'
    } else if (msg.includes('Password should be')) {
      error.value = 'Mot de passe trop court (6 caractères minimum).'
    } else {
      error.value = 'Une erreur est survenue, réessaie.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ── Layout ──────────────────────────────────────────────── */
.auth-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.auth-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
  padding: 24px 16px;
  text-align: center;
}

/* ── Blobs ───────────────────────────────────────────────── */
.blobs {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
  animation: blobMove 12s ease-in-out infinite alternate;
}

.blob-1 { width: 400px; height: 400px; background: var(--c5); top: -100px; left: -100px; animation-delay: 0s; }
.blob-2 { width: 350px; height: 350px; background: var(--c1); bottom: -80px; right: -80px; animation-delay: -4s; }
.blob-3 { width: 300px; height: 300px; background: var(--c4); top: 40%; left: 40%; animation-delay: -8s; }

@keyframes blobMove {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(40px, 30px) scale(1.1); }
}

/* ── Header ──────────────────────────────────────────────── */
.logo {
  font-family: 'Fredoka One', cursive;
  font-size: 32px;
  background: linear-gradient(135deg, var(--c1), var(--c2), var(--c4));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-decoration: none;
  display: inline-block;
  margin-bottom: 8px;
}

.tagline {
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 28px;
}

/* ── Tabs ────────────────────────────────────────────────── */
.tabs {
  display: flex;
  background: var(--surface);
  border-radius: 14px;
  padding: 4px;
  margin-bottom: 20px;
  border: 1.5px solid rgba(255,255,255,0.05);
}

.tab {
  flex: 1;
  font-family: 'Nunito', sans-serif;
  font-weight: 800;
  font-size: 15px;
  padding: 10px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
  color: var(--muted);
}

.tab.active {
  background: var(--surface2);
  color: var(--text);
}

/* ── Card ────────────────────────────────────────────────── */
.auth-card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 28px;
  border: 1.5px solid rgba(255,255,255,0.05);
  text-align: left;
}

/* ── Fields ──────────────────────────────────────────────── */
.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  font-size: 13px;
  font-weight: 800;
  color: var(--muted);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field input {
  width: 100%;
  background: var(--surface2);
  border: 1.5px solid transparent;
  border-radius: 12px;
  padding: 12px 16px;
  color: var(--text);
  font-family: 'Nunito', sans-serif;
  font-weight: 600;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
}

.field input::placeholder { color: var(--muted); }
.field input:focus { border-color: var(--c4); }
.field input:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Password ────────────────────────────────────────────── */
.password-wrap {
  position: relative;
}

.password-wrap input {
  padding-right: 48px;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0;
}

/* ── Submit ──────────────────────────────────────────────── */
.btn-submit {
  width: 100%;
  font-family: 'Fredoka One', cursive;
  font-size: 18px;
  padding: 14px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, var(--c4), var(--c5));
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 6px 20px rgba(77,150,255,0.3);
  margin-top: 8px;
}

.btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(77,150,255,0.4); }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

/* ── Banners ─────────────────────────────────────────────── */
.error-banner {
  background: rgba(255,107,107,0.12);
  border: 1px solid rgba(255,107,107,0.3);
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 700;
  color: var(--c1);
  margin-bottom: 16px;
}

.success-banner {
  background: rgba(107,203,119,0.12);
  border: 1px solid rgba(107,203,119,0.3);
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 700;
  color: var(--c3);
  margin-top: 16px;
}

/* ── Skip & perks ────────────────────────────────────────── */
.skip-wrap {
  text-align: center;
  margin-top: 20px;
}

.skip-link {
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  transition: color 0.2s;
}

.skip-link:hover { color: var(--text); }

.perks {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.perk {
  background: var(--surface);
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
  border: 1.5px solid rgba(255,255,255,0.05);
}

/* ── Transitions ─────────────────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: all 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-6px); }
</style>