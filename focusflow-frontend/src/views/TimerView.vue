<template>
    <div class="timer-view">

        <!-- Blobs décoratifs en arrière-plan -->
        <div class="blobs" aria-hidden="true">
            <div class="blob blob-1"></div>
            <div class="blob blob-2"></div>
            <div class="blob blob-3"></div>
        </div>

        <div class="container">

            <!-- Header -->
            <NavBar />

            <!-- Infos utilisateur connecté -->
            <div v-if="auth.isLoggedIn && auth.profile" class="user-strip">
                <div class="streak-chip">
                    🔥 <span class="highlight">{{ auth.profile.streak }}</span> jours
                </div>
                <div class="xp-wrap">
                    <span class="level-badge">Niveau {{ auth.profile.level }}</span>
                    <div class="xp-track">
                        <div class="xp-fill" :style="{ width: xpPercent + '%' }"></div>
                    </div>
                    <span class="xp-label">{{ auth.profile.xp }} XP</span>
                </div>
                <div class="pts-chip">
                    ⚡ <span class="highlight">{{ auth.profile.total_pts }}</span> pts
                </div>
            </div>

            <!-- Contenu principal -->
            <main class="main-grid">

                <!-- Carte Timer -->
                <div class="card">
                    <div class="card-title">🎯 Session de focus</div>

                    <input v-model="session.subject" class="subject-input" placeholder="📚 Sur quoi tu travailles ?" />

                    <!-- Sélecteur de durée -->
                    <div class="duration-grid">
                        <button v-for="min in [15, 25, 45, 60]" :key="min" class="dur-btn"
                            :class="{ active: session.duration === min * 60 }" :disabled="timer.running.value"
                            @click="setDuration(min)">
                            {{ min < 60 ? min + ' min' : '1h' }} </button>
                    </div>

                    <!-- Input custom — juste pour le dev -->
                    <div class="custom-duration" style="display:flex; gap:8px; margin-bottom:16px;">
                        <input
                            v-model.number="customMinutes"
                            type="number"
                            min="1"
                            max="120"
                            placeholder="Durée custom (min)"
                            :disabled="timer.running.value"
                            class="subject-input"
                            style="margin-bottom: 0; flex:1;"
                        />
                        <button class="dur-btn" style="white-space:nowrap;" @click="setDuration(customMinutes)">OK</button>
                    </div>

                    <!-- Anneau SVG -->
                    <div class="clock-wrap">
                        <svg viewBox="0 0 160 160" class="clock-svg">
                            <defs>
                                <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stop-color="#6BCB77" />
                                    <stop offset="50%" stop-color="#4D96FF" />
                                    <stop offset="100%" stop-color="#C77DFF" />
                                </linearGradient>
                            </defs>
                            <circle class="track" cx="80" cy="80" r="68" />
                            <circle class="progress" cx="80" cy="80" r="68" :stroke-dasharray="timer.CIRC"
                                :stroke-dashoffset="timer.strokeOffset.value" />
                            <text class="clock-time" x="80" y="84" text-anchor="middle">
                                {{ timer.display.value }}
                            </text>
                            <text class="clock-status" x="80" y="104" text-anchor="middle">
                                {{ statusLabel }}
                            </text>
                        </svg>
                    </div>

                    <!-- Boutons -->
                    <div class="controls">
                        <button class="btn-start" @click="timer.toggle()">
                            {{ session.completed ? '↺ Nouvelle' : timer.running.value ? '⏸ Pause' : '▶ Démarrer' }}
                        </button>
                        <button class="btn-reset" @click="handleReset()">↺</button>
                    </div>

                    <!-- Points à gagner -->
                    <div class="points-preview">
                        <span>Points à gagner</span>
                        <span class="pts-value">+{{ session.pointsPreview }} ⚡</span>
                    </div>
                </div>

                <!-- Carte Tâches -->
                <div class="card">
                    <div class="card-title">✅ Tâches de la session</div>

                    <div class="task-add-row">
                        <input v-model="newTask" class="task-input" placeholder="Ajouter une tâche..."
                            @keydown.enter="addTask" />
                        <button class="add-btn" @click="addTask">+</button>
                    </div>

                    <div class="task-list">
                        <div v-for="task in session.tasks" :key="task.id" class="task-item" :class="{ done: task.done }"
                            @click="session.toggleTask(task.id)">
                            <div class="check-box">{{ task.done ? '✓' : '' }}</div>
                            <span class="task-text">{{ task.label }}</span>
                            <span class="task-pts">+2⚡</span>
                            <button class="task-del" @click.stop="session.removeTask(task.id)">✕</button>
                        </div>

                        <div v-if="session.tasks.length === 0" class="task-empty">
                            Aucune tâche — ajoutes-en une !
                        </div>
                        <span>+5⚡si toutes les tâches réalisées</span>
                    </div>

                    <!-- Barre de progression tâches -->
                    <div class="tasks-progress">
                        <div class="tasks-track">
                            <div class="tasks-fill" :style="{ width: tasksPercent + '%' }"></div>
                        </div>
                        <span class="tasks-label">{{ session.doneTasks }} / {{ session.tasks.length }}</span>
                    </div>
                </div>

            </main>

            <!-- Modal fin de session -->
            <Transition name="modal">
                <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
                    <div class="modal">
                        <div class="modal-emoji">🎉</div>
                        <div class="modal-title">Session terminée !</div>
                        <div class="modal-sub">
                            {{ session.subject || 'Beau travail' }} — {{ Math.floor(session.elapsed / 60) }} min
                        </div>
                        <div class="modal-pts">
                            <div class="modal-pts-value">+{{ finalPts }}</div>
                            <small>points gagnés</small>
                        </div>
                        <div class="modal-actions">
                            <button
                                class="modal-btn modal-btn-save"
                                @click="handleReset(); showModal = false">
                                🚀 Nouvelle session
                            </button>

                            <RouterLink
                                v-if="!auth.isLoggedIn"
                                to="/auth"
                                class="modal-btn modal-btn-skip">
                                🔐 Se connecter pour sauvegarder
                            </RouterLink>
                            <button
                                v-else
                                class="modal-btn modal-btn-skip"
                                @click="showModal = false">
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>

            <!-- Toast -->
            <Transition name="toast">
                <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>
            </Transition>

        </div>
    </div>
</template>

<script setup>
import NavBar from '@/components/NavBar.vue'
import { ref, computed, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSessionStore } from '@/stores/session'
import { useTimer } from '@/composables/useTimer'

const auth = useAuthStore()
const session = useSessionStore()
const timer = useTimer()
const router = useRouter()

// ── State local ───────────────────────────────────────────
const newTask = ref('')
const showModal = ref(false)
const saving = ref(false)
const toastMsg = ref('')
const customMinutes = ref(1)
const finalPts = ref(0)

// ── Computed ──────────────────────────────────────────────
const xpPercent = computed(() => {
    if (!auth.profile) return 0
    // 1 niveau tous les 500 XP
    return (auth.profile.xp % 500) / 500 * 100
})

const tasksPercent = computed(() => {
    if (session.tasks.length === 0) return 0
    return session.doneTasks / session.tasks.length * 100
})

const statusLabel = computed(() => {
    if (session.completed) return '✅ Terminé !'
    if (timer.running.value) return 'En cours…'
    if (session.elapsed > 0) return 'En pause'
    return 'Prêt !'
})

// ── Watchers ──────────────────────────────────────────────

// Ouvre la modal automatiquement quand la session se termine
watch(() => session.completed, async (done) => {
  if (!done) return

  finalPts.value = session.pointsPreview
  // Ouvre la modal dans tous les cas
  showModal.value = true

  // Sauvegarde automatique si connecté
  if (auth.isLoggedIn) {
    saving.value = true
    try {
      await session.save()
      showToast('🎉 Session sauvegardée ! +' + finalPts.value + ' pts')
    } catch (e) {
      showToast('❌ Erreur lors de la sauvegarde')
    } finally {
      saving.value = false
    }
  }
})

// ── Méthodes ──────────────────────────────────────────────
function setDuration(minutes) {
    session.duration = minutes * 60
    timer.reset()
}

function addTask() {
    session.addTask(newTask.value)
    newTask.value = ''
}

function handleReset() {
    timer.reset()
    showModal.value = false
}

function showToast(msg) {
    toastMsg.value = msg
    setTimeout(() => toastMsg.value = '', 3500)
}
</script>

<style scoped>
/* ── Layout ─────────────────────────────────────────────── */
.timer-view {
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
}

.container {
    max-width: 900px;
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

.blob-1 {
    width: 400px;
    height: 400px;
    background: var(--c1);
    top: -100px;
    left: -100px;
    animation-delay: 0s;
}

.blob-2 {
    width: 350px;
    height: 350px;
    background: var(--c4);
    bottom: -80px;
    right: -80px;
    animation-delay: -4s;
}

.blob-3 {
    width: 300px;
    height: 300px;
    background: var(--c5);
    top: 40%;
    left: 40%;
    animation-delay: -8s;
}

@keyframes blobMove {
    from {
        transform: translate(0, 0) scale(1);
    }

    to {
        transform: translate(40px, 30px) scale(1.1);
    }
}

/* ── Header ──────────────────────────────────────────────── */
.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 12px;
}

.logo {
    font-family: 'Fredoka One', cursive;
    font-size: 28px;
    background: linear-gradient(135deg, var(--c1), var(--c2), var(--c4));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
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

.nav a:hover {
    color: var(--text);
}

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

.btn-logout:hover {
    color: var(--c1);
}

/* ── User strip ──────────────────────────────────────────── */
.user-strip {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap;
}

.streak-chip,
.pts-chip {
    background: var(--surface);
    border-radius: 12px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 700;
}

.highlight {
    color: var(--c2);
    font-size: 16px;
}

.xp-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
}

.level-badge {
    font-family: 'Fredoka One', cursive;
    font-size: 13px;
    background: linear-gradient(135deg, var(--c5), var(--c4));
    padding: 5px 12px;
    border-radius: 20px;
    white-space: nowrap;
}

.xp-track {
    flex: 1;
    height: 8px;
    background: var(--surface2);
    border-radius: 4px;
    overflow: hidden;
    min-width: 80px;
}

.xp-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--c4), var(--c5));
    border-radius: 4px;
    transition: width 0.5s ease;
}

.xp-label {
    font-size: 12px;
    color: var(--muted);
    white-space: nowrap;
    font-weight: 700;
}

/* ── Grid ────────────────────────────────────────────────── */
.main-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

@media (max-width: 640px) {
    .main-grid {
        grid-template-columns: 1fr;
    }
}

/* ── Card ────────────────────────────────────────────────── */
.card {
    background: var(--surface);
    border-radius: var(--radius);
    padding: 28px;
    border: 1.5px solid rgba(255, 255, 255, 0.05);
}

.card-title {
    font-family: 'Fredoka One', cursive;
    font-size: 15px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 20px;
}

/* ── Timer card ──────────────────────────────────────────── */
.subject-input {
    width: 100%;
    background: var(--surface2);
    border: 1.5px solid transparent;
    border-radius: 12px;
    padding: 12px 16px;
    color: var(--text);
    font-family: 'Nunito', sans-serif;
    font-weight: 700;
    font-size: 15px;
    margin-bottom: 16px;
    outline: none;
    transition: border-color 0.2s;
}

.subject-input::placeholder {
    color: var(--muted);
}

.subject-input:focus {
    border-color: var(--c4);
}

.duration-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 16px;
}

.dur-btn {
    background: var(--surface2);
    border: 1.5px solid transparent;
    border-radius: 10px;
    padding: 10px 4px;
    color: var(--muted);
    font-family: 'Nunito', sans-serif;
    font-weight: 800;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
}

.dur-btn:hover {
    border-color: var(--c3);
    color: var(--c3);
}

.dur-btn.active {
    border-color: var(--c3);
    background: rgba(107, 203, 119, 0.12);
    color: var(--c3);
}

.dur-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

/* ── SVG Clock ───────────────────────────────────────────── */
.clock-wrap {
    text-align: center;
    margin: 20px 0;
}

.clock-svg {
    width: 160px;
    height: 160px;
}

circle.track {
    fill: none;
    stroke: var(--surface2);
    stroke-width: 10;
}

circle.progress {
    fill: none;
    stroke: url(#timerGrad);
    stroke-width: 10;
    stroke-linecap: round;
    transform-origin: 50% 50%;
    transform: rotate(-90deg);
    transition: stroke-dashoffset 1s linear;
}

.clock-time {
    font-family: 'Fredoka One', cursive;
    font-size: 38px;
    fill: var(--text);
}

.clock-status {
    font-size: 12px;
    fill: var(--muted);
    font-family: 'Nunito', sans-serif;
}

/* ── Controls ────────────────────────────────────────────── */
.controls {
    display: flex;
    gap: 10px;
    margin-top: 8px;
}

.btn-start {
    flex: 1;
    font-family: 'Fredoka One', cursive;
    font-size: 18px;
    padding: 14px;
    border-radius: 14px;
    border: none;
    background: linear-gradient(135deg, var(--c3), #4CAF50);
    color: #fff;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 6px 20px rgba(107, 203, 119, 0.3);
}

.btn-start:hover {
    transform: translateY(-2px);
}

.btn-reset {
    font-family: 'Fredoka One', cursive;
    font-size: 18px;
    padding: 14px 18px;
    border-radius: 14px;
    border: none;
    background: var(--surface2);
    color: var(--muted);
    cursor: pointer;
    transition: all 0.2s;
}

.btn-reset:hover {
    color: var(--c1);
}

.points-preview {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 16px;
    padding: 12px 16px;
    background: rgba(255, 217, 61, 0.08);
    border: 1px solid rgba(255, 217, 61, 0.2);
    border-radius: 12px;
    font-size: 13px;
    color: var(--muted);
}

.pts-value {
    font-family: 'Fredoka One', cursive;
    font-size: 22px;
    color: var(--c2);
}

/* ── Tasks card ──────────────────────────────────────────── */
.task-add-row {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
}

.task-input {
    flex: 1;
    background: var(--surface2);
    border: 1.5px solid transparent;
    border-radius: 10px;
    padding: 10px 14px;
    color: var(--text);
    font-family: 'Nunito', sans-serif;
    font-weight: 600;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
}

.task-input::placeholder {
    color: var(--muted);
}

.task-input:focus {
    border-color: var(--c4);
}

.add-btn {
    background: linear-gradient(135deg, var(--c4), var(--c5));
    border: none;
    border-radius: 10px;
    padding: 10px 16px;
    color: #fff;
    font-size: 22px;
    font-weight: 800;
    cursor: pointer;
    transition: transform 0.2s;
    line-height: 1;
}

.add-btn:hover {
    transform: scale(1.1);
}

.task-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 260px;
    overflow-y: auto;
    margin-bottom: 14px;
}

.task-list::-webkit-scrollbar {
    width: 4px;
}

.task-list::-webkit-scrollbar-thumb {
    background: var(--surface2);
    border-radius: 2px;
}

.task-item {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--surface2);
    border-radius: 10px;
    padding: 10px 14px;
    cursor: pointer;
    transition: opacity 0.2s;
    border: 1.5px solid transparent;
}

.task-item:hover {
    border-color: rgba(255, 255, 255, 0.08);
}

.task-item.done {
    opacity: 0.5;
}

.task-item.done .task-text {
    text-decoration: line-through;
}

.check-box {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2px solid var(--muted);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    transition: all 0.2s;
}

.task-item.done .check-box {
    background: var(--c3);
    border-color: var(--c3);
    color: #fff;
}

.task-text {
    flex: 1;
    font-weight: 600;
    font-size: 14px;
}

.task-pts {
    font-family: 'Fredoka One', cursive;
    font-size: 12px;
    color: var(--c2);
}

.task-del {
    background: none;
    border: none;
    color: var(--muted);
    cursor: pointer;
    font-size: 14px;
    opacity: 0;
    transition: opacity 0.2s;
    padding: 0 4px;
}

.task-item:hover .task-del {
    opacity: 1;
}

.task-empty {
    text-align: center;
    color: var(--muted);
    font-size: 13px;
    padding: 20px;
}

.tasks-progress {
    display: flex;
    align-items: center;
    gap: 10px;
}

.tasks-track {
    flex: 1;
    height: 6px;
    background: var(--bg);
    border-radius: 3px;
    overflow: hidden;
}

.tasks-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--c3), var(--c2));
    border-radius: 3px;
    transition: width 0.4s ease;
}

.tasks-label {
    font-size: 12px;
    color: var(--muted);
    font-weight: 700;
    white-space: nowrap;
}

/* ── Modal ───────────────────────────────────────────────── */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal {
    background: var(--surface);
    border-radius: 24px;
    padding: 40px;
    max-width: 400px;
    width: 90%;
    text-align: center;
    border: 1.5px solid rgba(255, 255, 255, 0.07);
}

.modal-emoji {
    font-size: 56px;
    margin-bottom: 12px;
}

.modal-title {
    font-family: 'Fredoka One', cursive;
    font-size: 26px;
    margin-bottom: 6px;
}

.modal-sub {
    color: var(--muted);
    font-size: 14px;
    margin-bottom: 20px;
}

.modal-pts {
    background: rgba(255, 217, 61, 0.1);
    border: 1px solid rgba(255, 217, 61, 0.3);
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 24px;
}

.modal-pts-value {
    font-family: 'Fredoka One', cursive;
    font-size: 42px;
    color: var(--c2);
}

.modal-pts small {
    color: var(--muted);
    font-size: 13px;
}

.modal-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
}

.modal-btn {
    font-family: 'Fredoka One', cursive;
    font-size: 16px;
    padding: 12px 24px;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
}

.modal-btn-save {
    background: linear-gradient(135deg, var(--c4), var(--c5));
    color: #fff;
}

.modal-btn-save:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.modal-btn-skip {
    background: var(--surface2);
    color: var(--muted);
}

/* ── Toast ───────────────────────────────────────────────── */
.toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--surface2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    padding: 14px 24px;
    font-weight: 700;
    font-size: 14px;
    z-index: 200;
    white-space: nowrap;
}

/* ── Transitions ─────────────────────────────────────────── */
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.3s;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
    transition: transform 0.3s;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
    transform: scale(0.9);
}

.toast-enter-active,
.toast-leave-active {
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-enter-from,
.toast-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
}
</style>