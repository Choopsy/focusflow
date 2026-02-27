<template>
  <div class="friends-view">

    <div class="blobs" aria-hidden="true">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
    </div>

    <div class="container">

      <!-- Header -->
      <NavBar />

      <h1 class="page-title">👥 Amis</h1>

      <div class="main-grid">

        <!-- Colonne gauche -->
        <div class="left-col">

          <!-- Recherche -->
          <div class="card">
            <div class="card-title">🔍 Rechercher un ami</div>
            <div class="search-row">
              <input
                v-model="searchQuery"
                class="search-input"
                placeholder="Chercher par pseudo..."
                @input="onSearch"
              />
            </div>

            <!-- Résultats de recherche -->
            <div v-if="searchQuery && friends.searchResults.length === 0 && !searching" class="empty-state">
              Aucun utilisateur trouvé
            </div>

            <div class="result-list">
              <div
                v-for="user in friends.searchResults"
                :key="user.id"
                class="user-item"
              >
                <div class="user-avatar" :style="{ background: getColor(user.username) }">
                  {{ user.username[0].toUpperCase() }}
                </div>
                <div class="user-info">
                  <div class="user-name">{{ user.username }}</div>
                  <div class="user-meta">Niveau {{ user.level }} · {{ user.total_pts }} pts</div>
                </div>
                <button
                  class="btn-add"
                  :disabled="isSent(user.id) || isFriend(user.id)"
                  @click="sendRequest(user.id)"
                >
                  {{ isFriend(user.id) ? '✅ Ami' : isSent(user.id) ? '⏳ Envoyé' : '+ Ajouter' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Demandes reçues -->
          <div class="card" v-if="friends.pending.length > 0">
            <div class="card-title">
              🔔 Demandes reçues
              <span class="badge-count">{{ friends.pending.length }}</span>
            </div>
            <div class="result-list">
              <div
                v-for="req in friends.pending"
                :key="req.friendshipId"
                class="user-item"
              >
                <div class="user-avatar" :style="{ background: getColor(req.username) }">
                  {{ req.username[0].toUpperCase() }}
                </div>
                <div class="user-info">
                  <div class="user-name">{{ req.username }}</div>
                  <div class="user-meta">Niveau {{ req.level }}</div>
                </div>
                <div class="req-actions">
                  <button class="btn-accept" @click="acceptRequest(req.friendshipId)">✓</button>
                  <button class="btn-decline" @click="declineRequest(req.friendshipId)">✕</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Demandes envoyées -->
          <div class="card" v-if="friends.sent.length > 0">
            <div class="card-title">📤 Demandes envoyées</div>
            <div class="result-list">
              <div
                v-for="req in friends.sent"
                :key="req.friendshipId"
                class="user-item"
              >
                <div class="user-avatar" :style="{ background: getColor(req.username) }">
                  {{ req.username[0].toUpperCase() }}
                </div>
                <div class="user-info">
                  <div class="user-name">{{ req.username }}</div>
                  <div class="user-meta">En attente...</div>
                </div>
                <button class="btn-decline" @click="declineRequest(req.friendshipId)">✕</button>
              </div>
            </div>
          </div>

        </div>

        <!-- Colonne droite -->
        <div class="right-col">

          <!-- Classement -->
          <div class="card">
            <div class="card-title">🏆 Classement entre amis</div>

            <div v-if="friends.loading" class="empty-state">Chargement...</div>

            <div v-else-if="friends.leaderboard.length === 0" class="empty-state">
              Ajoute des amis pour voir le classement !
            </div>

            <div v-else class="leaderboard">
              <div
                v-for="(user, index) in friends.leaderboard"
                :key="user.id"
                class="lb-item"
                :class="{
                  'lb-me': user.id === auth.user.id,
                  'lb-gold': index === 0,
                  'lb-silver': index === 1,
                  'lb-bronze': index === 2
                }"
              >
                <div class="lb-rank">{{ rankEmoji(index) }}</div>
                <div class="lb-avatar" :style="{ background: getColor(user.username) }">
                  {{ user.username[0].toUpperCase() }}
                </div>
                <div class="lb-info">
                  <div class="lb-name">
                    {{ user.username }}
                    <span v-if="user.id === auth.user.id" class="me-tag">toi</span>
                  </div>
                  <div class="lb-xp-wrap">
                    <div class="lb-xp-track">
                      <div
                        class="lb-xp-fill"
                        :style="{ width: (user.xp % 500) / 500 * 100 + '%' }"
                      ></div>
                    </div>
                    <span class="lb-xp-label">Niv. {{ user.level }}</span>
                  </div>
                </div>
                <div class="lb-pts">
                  <div class="lb-pts-value">{{ user.total_pts }}</div>
                  <div class="lb-pts-label">pts</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Liste d'amis -->
          <div class="card">
            <div class="card-title">👫 Mes amis ({{ friends.friends.length }})</div>

            <div v-if="friends.friends.length === 0" class="empty-state">
              Tu n'as pas encore d'amis — recherches-en un !
            </div>

            <div class="result-list">
              <div
                v-for="friend in friends.friends"
                :key="friend.friendshipId"
                class="user-item"
              >
                <div class="user-avatar" :style="{ background: getColor(friend.username) }">
                  {{ friend.username[0].toUpperCase() }}
                </div>
                <div class="user-info">
                  <div class="user-name">{{ friend.username }}</div>
                  <div class="user-meta">Niveau {{ friend.level }} · {{ friend.total_pts }} pts</div>
                </div>
                <button class="btn-remove" @click="removeFriend(friend.friendshipId)">
                  Retirer
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Toast -->
      <Transition name="toast">
        <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>
      </Transition>

    </div>
  </div>
</template>

<script setup>
import NavBar from '@/components/NavBar.vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useFriendsStore } from '@/stores/friends'

const auth    = useAuthStore()
const friends = useFriendsStore()
const router  = useRouter()

// ── State local ───────────────────────────────────────────
const searchQuery = ref('')
const searching   = ref(false)
const toastMsg    = ref('')

// ── Init ──────────────────────────────────────────────────
onMounted(async () => {
  await friends.loadAll()
})

// ── Recherche avec debounce ───────────────────────────────
let searchTimeout = null
async function onSearch() {
  clearTimeout(searchTimeout)
  if (!searchQuery.value.trim()) {
    friends.searchResults = []
    return
  }
  searching.value = true
  searchTimeout = setTimeout(async () => {
    await friends.searchUsers(searchQuery.value)
    searching.value = false
  }, 400) // attend 400ms après la dernière frappe
}

// ── Helpers ───────────────────────────────────────────────

// Vérifie si une demande a déjà été envoyée à cet user
function isSent(userId) {
  return friends.sent.some(s => s.id === userId)
}

// Vérifie si c'est déjà un ami
function isFriend(userId) {
  return friends.friends.some(f => f.id === userId)
}

// Emoji selon le rang dans le classement
function rankEmoji(index) {
  if (index === 0) return '🥇'
  if (index === 1) return '🥈'
  if (index === 2) return '🥉'
  return `#${index + 1}`
}

// Couleur d'avatar générée depuis le pseudo
const COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#C77DFF', '#FF9F43', '#00D2D3']
function getColor(username) {
  const index = username.charCodeAt(0) % COLORS.length
  return COLORS[index]
}

// ── Actions ───────────────────────────────────────────────
async function sendRequest(userId) {
  try {
    await friends.sendRequest(userId)
    showToast('✅ Demande envoyée !')
  } catch (e) {
    if (e.message?.includes('duplicate')) {
      showToast('⚠️ Demande déjà envoyée')
    } else {
      showToast('❌ Erreur lors de l\'envoi')
    }
  }
}

async function acceptRequest(friendshipId) {
  try {
    await friends.acceptRequest(friendshipId)
    showToast('🎉 Ami ajouté !')
  } catch (e) {
    showToast('❌ Erreur lors de l\'acceptation')
  }
}

async function declineRequest(friendshipId) {
  try {
    await friends.declineRequest(friendshipId)
    showToast('Demande supprimée')
  } catch (e) {
    showToast('❌ Erreur')
  }
}

async function removeFriend(friendshipId) {
  try {
    await friends.removeFriend(friendshipId)
    showToast('Ami retiré')
  } catch (e) {
    showToast('❌ Erreur')
  }
}

// ── Toast ─────────────────────────────────────────────────
function showToast(msg) {
  toastMsg.value = msg
  setTimeout(() => toastMsg.value = '', 3000)
}
</script>

<style scoped>
/* ── Layout ──────────────────────────────────────────────── */
.friends-view {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px 16px 40px;
  position: relative;
  z-index: 1;
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

.blob-1 { width: 400px; height: 400px; background: var(--c3); top: -100px; left: -100px; animation-delay: 0s; }
.blob-2 { width: 350px; height: 350px; background: var(--c2); bottom: -80px; right: -80px; animation-delay: -4s; }
.blob-3 { width: 300px; height: 300px; background: var(--c4); top: 40%; left: 40%; animation-delay: -8s; }

@keyframes blobMove {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(40px, 30px) scale(1.1); }
}

/* ── Header ──────────────────────────────────────────────── */
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
}

.nav a {
  color: var(--muted);
  text-decoration: none;
  font-weight: 700;
  font-size: 14px;
  transition: color 0.2s;
}

.nav a:hover { color: var(--text); }

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

/* ── Page title ──────────────────────────────────────────── */
.page-title {
  font-family: 'Fredoka One', cursive;
  font-size: 32px;
  margin-bottom: 24px;
  background: linear-gradient(135deg, var(--c3), var(--c4));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ── Grid ────────────────────────────────────────────────── */
.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}

@media (max-width: 700px) {
  .main-grid { grid-template-columns: 1fr; }
}

.left-col, .right-col {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Card ────────────────────────────────────────────────── */
.card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 24px;
  border: 1.5px solid rgba(255,255,255,0.05);
}

.card-title {
  font-family: 'Fredoka One', cursive;
  font-size: 15px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge-count {
  background: var(--c1);
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 20px;
  font-family: 'Nunito', sans-serif;
}

/* ── Search ──────────────────────────────────────────────── */
.search-row { margin-bottom: 12px; }

.search-input {
  width: 100%;
  background: var(--surface2);
  border: 1.5px solid transparent;
  border-radius: 12px;
  padding: 11px 16px;
  color: var(--text);
  font-family: 'Nunito', sans-serif;
  font-weight: 600;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input::placeholder { color: var(--muted); }
.search-input:focus { border-color: var(--c4); }

/* ── User items ──────────────────────────────────────────── */
.result-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--surface2);
  border-radius: 12px;
  border: 1.5px solid transparent;
  transition: border-color 0.2s;
  animation: slideIn 0.2s ease;
}

.user-item:hover { border-color: rgba(255,255,255,0.08); }

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Fredoka One', cursive;
  font-size: 16px;
  color: #fff;
  flex-shrink: 0;
}

.user-info { flex: 1; min-width: 0; }

.user-name {
  font-weight: 800;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-meta {
  font-size: 12px;
  color: var(--muted);
  font-weight: 600;
}

/* ── Buttons ─────────────────────────────────────────────── */
.btn-add {
  font-family: 'Fredoka One', cursive;
  font-size: 13px;
  padding: 6px 14px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, var(--c4), var(--c5));
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-add:disabled {
  background: var(--surface);
  color: var(--muted);
  cursor: default;
}

.req-actions { display: flex; gap: 6px; flex-shrink: 0; }

.btn-accept {
  font-size: 16px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: rgba(107,203,119,0.15);
  color: var(--c3);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-accept:hover { background: rgba(107,203,119,0.3); }

.btn-decline {
  font-size: 14px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: rgba(255,107,107,0.1);
  color: var(--c1);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-decline:hover { background: rgba(255,107,107,0.25); }

.btn-remove {
  font-family: 'Nunito', sans-serif;
  font-size: 12px;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 8px;
  border: none;
  background: rgba(255,107,107,0.1);
  color: var(--c1);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-remove:hover { background: rgba(255,107,107,0.25); }

/* ── Leaderboard ─────────────────────────────────────────── */
.leaderboard {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lb-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--surface2);
  border-radius: 12px;
  border: 1.5px solid transparent;
  transition: all 0.2s;
}

.lb-me    { border-color: var(--c4) !important; background: rgba(77,150,255,0.08); }
.lb-gold  { border-color: rgba(255,215,0,0.3); }
.lb-silver{ border-color: rgba(192,192,192,0.3); }
.lb-bronze{ border-color: rgba(205,127,50,0.3); }

.lb-rank {
  font-family: 'Fredoka One', cursive;
  font-size: 18px;
  width: 28px;
  text-align: center;
  flex-shrink: 0;
}

.lb-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Fredoka One', cursive;
  font-size: 16px;
  color: #fff;
  flex-shrink: 0;
}

.lb-info { flex: 1; min-width: 0; }

.lb-name {
  font-weight: 800;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.me-tag {
  font-family: 'Nunito', sans-serif;
  font-size: 10px;
  background: var(--c4);
  color: #fff;
  padding: 1px 6px;
  border-radius: 6px;
  font-weight: 800;
}

.lb-xp-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.lb-xp-track {
  flex: 1;
  height: 4px;
  background: var(--bg);
  border-radius: 2px;
  overflow: hidden;
}

.lb-xp-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--c4), var(--c5));
  border-radius: 2px;
  transition: width 0.5s ease;
}

.lb-xp-label {
  font-size: 11px;
  color: var(--muted);
  font-weight: 700;
  white-space: nowrap;
}

.lb-pts {
  text-align: right;
  flex-shrink: 0;
}

.lb-pts-value {
  font-family: 'Fredoka One', cursive;
  font-size: 20px;
  color: var(--c2);
  line-height: 1;
}

.lb-pts-label {
  font-size: 11px;
  color: var(--muted);
  font-weight: 700;
}

/* ── Empty state ─────────────────────────────────────────── */
.empty-state {
  text-align: center;
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
  padding: 20px;
}

/* ── Toast ───────────────────────────────────────────────── */
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface2);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  padding: 14px 24px;
  font-weight: 700;
  font-size: 14px;
  z-index: 200;
  white-space: nowrap;
}

.toast-enter-active, .toast-leave-active { transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1); }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(20px); }
</style>