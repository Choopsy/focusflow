<template>
  <div class="profile-view">

    <div class="blobs" aria-hidden="true">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
    </div>

    <div class="container">

      <!-- Header -->
      <NavBar />

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        Chargement...
      </div>

      <template v-else-if="auth.profile">

        <!-- Hero profil -->
        <div class="profile-hero">
          <div class="avatar-big" :style="{ background: getColor(auth.profile.username) }">
            {{ auth.profile.username[0].toUpperCase() }}
          </div>
          <div class="profile-info">
            <h1 class="profile-username">{{ auth.profile.username }}</h1>
            <div class="profile-email">{{ auth.user.email }}</div>
            <div class="profile-meta">
              <span class="meta-chip">🔥 Streak {{ auth.profile.streak }} jours</span>
              <span class="meta-chip">📅 Membre depuis {{ joinedDate }}</span>
            </div>
          </div>
        </div>

        <!-- Niveau & XP -->
        <div class="card level-card">
          <div class="level-left">
            <div class="level-num">
              <span class="level-label">Niveau</span>
              <span class="level-value">{{ auth.profile.level }}</span>
            </div>
            <div class="level-title">{{ levelTitle }}</div>
          </div>
          <div class="level-right">
            <div class="xp-info">
              <span>{{ auth.profile.xp % 500 }} / 500 XP</span>
              <span class="xp-next">Prochain niveau dans {{ 500 - (auth.profile.xp % 500) }} XP</span>
            </div>
            <div class="xp-track">
              <div class="xp-fill" :style="{ width: xpPercent + '%' }"></div>
            </div>
            <div class="pts-total">
              ⚡ {{ auth.profile.total_pts }} points au total
            </div>
          </div>
        </div>

        <!-- Badges -->
        <div class="card">
          <div class="card-title">🏅 Badges</div>
          <div v-if="loadingBadges" class="empty-state">Chargement...</div>
          <div v-else-if="allBadges.length === 0" class="empty-state">
            Aucun badge disponible
          </div>
          <div v-else class="badges-grid">
            <div
              v-for="badge in allBadges"
              :key="badge.id"
              class="badge-item"
              :class="{ earned: badge.earned }"
            >
              <div class="badge-icon">{{ badge.icon }}</div>
              <div class="badge-label">{{ badge.label }}</div>
              <div v-if="badge.earned" class="badge-check">✓</div>
              <div v-else class="badge-lock">🔒</div>
            </div>
          </div>
        </div>

        <!-- Historique sessions -->
        <div class="card">
          <div class="card-title">📋 Dernières sessions</div>
          <div v-if="loadingSessions" class="empty-state">Chargement...</div>
          <div v-else-if="recentSessions.length === 0" class="empty-state">
            Aucune session enregistrée
          </div>
          <div v-else class="sessions-list">
            <div
              v-for="s in recentSessions"
              :key="s.id"
              class="session-item"
            >
              <div class="session-icon">{{ s.completed ? '✅' : '⏸️' }}</div>
              <div class="session-info">
                <div class="session-subject">{{ s.subject || 'Sans sujet' }}</div>
                <div class="session-meta">
                  {{ formatDate(s.started_at) }} · {{ formatDuration(s.duration) }}
                </div>
              </div>
              <div class="session-pts">+{{ s.pts_earned }} ⚡</div>
            </div>
          </div>
        </div>

      </template>
    </div>
  </div>
</template>

<script setup>
import NavBar from '@/components/NavBar.vue'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'

const auth   = useAuthStore()
const router = useRouter()

// ── State ─────────────────────────────────────────────────
const loading         = ref(true)
const loadingBadges   = ref(true)
const loadingSessions = ref(true)
const allBadges       = ref([])
const recentSessions  = ref([])

// ── Init ──────────────────────────────────────────────────
onMounted(async () => {
  loading.value = false
  await Promise.all([
    loadBadges(),
    loadSessions()
  ])
})

// ── Badges ────────────────────────────────────────────────
async function loadBadges() {
  loadingBadges.value = true

  // Récupère tous les badges existants
  const { data: allB } = await supabase
    .from('badges')
    .select('*')
    .order('key')

  // Récupère les badges gagnés par l'utilisateur
  const { data: earned } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', auth.user.id)

  const earnedIds = (earned || []).map(e => e.badge_id)

  allBadges.value = (allB || []).map(b => ({
    ...b,
    earned: earnedIds.includes(b.id)
  }))

  loadingBadges.value = false
}

// ── Sessions récentes ─────────────────────────────────────
async function loadSessions() {
  loadingSessions.value = true

  const { data } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('started_at', { ascending: false })
    .limit(10)

  recentSessions.value = data || []
  loadingSessions.value = false
}

// ── Computed ──────────────────────────────────────────────
const xpPercent = computed(() => {
  if (!auth.profile) return 0
  return (auth.profile.xp % 500) / 500 * 100
})

const levelTitle = computed(() => {
  const level = auth.profile?.level || 1
  if (level < 3)  return '🌱 Débutant'
  if (level < 5)  return '📚 Apprenti'
  if (level < 8)  return '⚡ Concentré'
  if (level < 12) return '🔥 Acharné'
  if (level < 17) return '🏆 Expert'
  return '👑 Maître du Focus'
})

const joinedDate = computed(() => {
  if (!auth.user?.created_at) return ''
  return new Date(auth.user.created_at).toLocaleDateString('fr-FR', {
    month: 'long',
    year:  'numeric'
  })
})

// ── Helpers ───────────────────────────────────────────────
const COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#C77DFF', '#FF9F43', '#00D2D3']
function getColor(username) {
  return COLORS[username.charCodeAt(0) % COLORS.length]
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day:   'numeric',
    month: 'short',
    year:  'numeric'
  })
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m} min`
}

</script>
<style scoped>
/* ── Layout ──────────────────────────────────────────────── */
.profile-view {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

.container {
  max-width: 800px;
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

.blob-1 { width: 400px; height: 400px; background: var(--c4); top: -100px; left: -100px; animation-delay: 0s; }
.blob-2 { width: 350px; height: 350px; background: var(--c5); bottom: -80px; right: -80px; animation-delay: -4s; }
.blob-3 { width: 300px; height: 300px; background: var(--c2); top: 40%; left: 40%; animation-delay: -8s; }

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

/* ── Loading ─────────────────────────────────────────────── */
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px;
  color: var(--muted);
  font-weight: 700;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--surface2);
  border-top-color: var(--c4);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── Profile hero ────────────────────────────────────────── */
.profile-hero {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
  background: var(--surface);
  border-radius: var(--radius);
  padding: 28px;
  border: 1.5px solid rgba(255,255,255,0.05);
  flex-wrap: wrap;
}

.avatar-big {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Fredoka One', cursive;
  font-size: 36px;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
}

.profile-info { flex: 1; min-width: 0; }

.profile-username {
  font-family: 'Fredoka One', cursive;
  font-size: 28px;
  margin-bottom: 4px;
}

.profile-email {
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
}

.profile-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-chip {
  background: var(--surface2);
  border-radius: 10px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
}

/* ── Level card ──────────────────────────────────────────── */
.level-card {
  display: flex;
  align-items: center;
  gap: 28px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.level-left { flex-shrink: 0; text-align: center; }

.level-num {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(135deg, var(--c4), var(--c5));
  border-radius: 16px;
  padding: 12px 20px;
  margin-bottom: 8px;
}

.level-label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255,255,255,0.7);
}

.level-value {
  font-family: 'Fredoka One', cursive;
  font-size: 48px;
  line-height: 1;
  color: #fff;
}

.level-title {
  font-family: 'Fredoka One', cursive;
  font-size: 15px;
  color: var(--muted);
}

.level-right { flex: 1; min-width: 200px; }

.xp-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 4px;
}

.xp-next { color: var(--muted); }

.xp-track {
  height: 12px;
  background: var(--surface2);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 12px;
}

.xp-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--c4), var(--c5));
  border-radius: 6px;
  transition: width 0.6s ease;
}

.pts-total {
  font-family: 'Fredoka One', cursive;
  font-size: 18px;
  color: var(--c2);
}

/* ── Card ────────────────────────────────────────────────── */
.card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 24px;
  border: 1.5px solid rgba(255,255,255,0.05);
  margin-bottom: 20px;
}

.card-title {
  font-family: 'Fredoka One', cursive;
  font-size: 15px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 20px;
}

/* ── Badges ──────────────────────────────────────────────── */
.badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.badge-item {
  background: var(--surface2);
  border-radius: 14px;
  padding: 16px 8px;
  text-align: center;
  border: 1.5px solid transparent;
  transition: all 0.2s;
  position: relative;
  opacity: 0.4;
  filter: grayscale(1);
}

.badge-item.earned {
  opacity: 1;
  filter: none;
  border-color: var(--c2);
  background: rgba(255,217,61,0.08);
}

.badge-icon { font-size: 28px; margin-bottom: 6px; }

.badge-label {
  font-size: 11px;
  font-weight: 800;
  color: var(--muted);
}

.badge-check {
  position: absolute;
  top: 6px;
  right: 8px;
  font-size: 11px;
  color: var(--c3);
  font-weight: 800;
}

.badge-lock {
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 11px;
}

/* ── Sessions ────────────────────────────────────────────── */
.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface2);
  border-radius: 12px;
  padding: 12px 16px;
  border: 1.5px solid transparent;
  transition: border-color 0.2s;
}

.session-item:hover { border-color: rgba(255,255,255,0.08); }

.session-icon { font-size: 20px; flex-shrink: 0; }

.session-info { flex: 1; min-width: 0; }

.session-subject {
  font-weight: 800;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-meta {
  font-size: 12px;
  color: var(--muted);
  font-weight: 600;
  margin-top: 2px;
}

.session-pts {
  font-family: 'Fredoka One', cursive;
  font-size: 16px;
  color: var(--c2);
  flex-shrink: 0;
}

/* ── Empty state ─────────────────────────────────────────── */
.empty-state {
  text-align: center;
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
  padding: 24px;
}
</style>