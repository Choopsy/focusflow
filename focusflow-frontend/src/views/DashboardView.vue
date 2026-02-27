<template>
  <div class="dashboard-view">

    <div class="blobs" aria-hidden="true">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
    </div>

    <div class="container">

      <!-- Header -->
      <NavBar />

      <!-- Titre + switcher période -->
      <div class="top-bar">
        <h1 class="page-title">📊 Dashboard</h1>

        <div class="period-controls">
          <!-- Switcher semaine / mois -->
          <div class="period-tabs">
            <button
              class="period-tab"
              :class="{ active: dash.period === 'week' }"
              @click="dash.setPeriod('week')"
            >
              Semaine
            </button>
            <button
              class="period-tab"
              :class="{ active: dash.period === 'month' }"
              @click="dash.setPeriod('month')"
            >
              Mois
            </button>
          </div>

          <!-- Sélecteur de mois -->
          <select
            v-if="dash.period === 'month'"
            class="month-select"
            @change="onMonthChange"
          >
            <option
              v-for="opt in dash.monthOptions"
              :key="`${opt.year}-${opt.month}`"
              :value="`${opt.year}-${opt.month}`"
              :selected="opt.month === dash.selectedMonth && opt.year === dash.selectedYear"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="dash.loading" class="loading">
        <div class="spinner"></div>
        Chargement...
      </div>

      <template v-else>

        <!-- Stat cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-value">{{ dash.formattedStats?.totalTime || '0m' }}</div>
            <div class="stat-label">Temps travaillé</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-value">{{ dash.formattedStats?.totalSessions || 0 }}</div>
            <div class="stat-label">Sessions</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⚡</div>
            <div class="stat-value">{{ dash.formattedStats?.totalPts || 0 }}</div>
            <div class="stat-label">Points gagnés</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-value">{{ dash.formattedStats?.taskRate || 0 }}%</div>
            <div class="stat-label">Tâches complétées</div>
          </div>
        </div>

        <!-- Graphe sessions par jour -->
        <div class="card chart-card">
          <div class="card-title">📈 Sessions par jour</div>
          <div v-if="dash.chartData.length === 0" class="empty-chart">
            Aucune session sur cette période
          </div>
          <div v-else class="chart">
            <div class="chart-bars">
              <div
                v-for="day in dash.chartData"
                :key="day.date"
                class="chart-col"
              >
                <div class="bar-wrap">
                  <div class="bar-tooltip">
                    {{ day.sessions }} session{{ day.sessions > 1 ? 's' : '' }}<br>
                    {{ day.minutes }}min · +{{ day.pts }}pts
                  </div>
                  <div
                    class="bar"
                    :style="{ height: barHeight(day.sessions) + '%' }"
                    :class="{ 'bar-active': day.sessions > 0 }"
                  ></div>
                </div>
                <div class="bar-label">{{ day.label }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Graphe minutes par jour -->
        <div class="card chart-card">
          <div class="card-title">🕐 Minutes travaillées par jour</div>
          <div v-if="dash.chartData.length === 0" class="empty-chart">
            Aucune session sur cette période
          </div>
          <div v-else class="chart">
            <div class="chart-bars">
              <div
                v-for="day in dash.chartData"
                :key="day.date"
                class="chart-col"
              >
                <div class="bar-wrap">
                  <div class="bar-tooltip">{{ day.minutes }} minutes</div>
                  <div
                    class="bar bar-minutes"
                    :style="{ height: barHeightMinutes(day.minutes) + '%' }"
                    :class="{ 'bar-active': day.minutes > 0 }"
                  ></div>
                </div>
                <div class="bar-label">{{ day.label }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Détails supplémentaires -->
        <div class="details-grid">
          <div class="card">
            <div class="card-title">🏁 Complétion des sessions</div>
            <div class="completion-wrap">
              <div class="completion-ring">
                <svg viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" class="ring-track"/>
                  <circle cx="40" cy="40" r="32" class="ring-fill"
                    :stroke-dasharray="RING_CIRC"
                    :stroke-dashoffset="ringOffset(dash.formattedStats?.completionRate || 0)"
                  />
                  <text x="40" y="44" text-anchor="middle" class="ring-text">
                    {{ dash.formattedStats?.completionRate || 0 }}%
                  </text>
                </svg>
              </div>
              <div class="completion-details">
                <div class="completion-row">
                  <span class="dot dot-green"></span>
                  <span>Terminées : {{ dash.formattedStats?.completedSessions || 0 }}</span>
                </div>
                <div class="completion-row">
                  <span class="dot dot-red"></span>
                  <span>Abandonnées : {{ (dash.formattedStats?.totalSessions || 0) - (dash.formattedStats?.completedSessions || 0) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-title">📋 Tâches</div>
            <div class="tasks-stats">
              <div class="tasks-big">
                <span class="tasks-done">{{ dash.formattedStats?.doneTasks || 0 }}</span>
                <span class="tasks-sep">/</span>
                <span class="tasks-total">{{ dash.formattedStats?.totalTasks || 0 }}</span>
              </div>
              <div class="tasks-sub">tâches complétées</div>
              <div class="tasks-bar-wrap">
                <div class="tasks-bar-track">
                  <div
                    class="tasks-bar-fill"
                    :style="{ width: (dash.formattedStats?.taskRate || 0) + '%' }"
                  ></div>
                </div>
                <span class="tasks-rate">{{ dash.formattedStats?.taskRate || 0 }}%</span>
              </div>
            </div>
          </div>
        </div>

      </template>
    </div>
  </div>
</template>

<script setup>
import NavBar from '@/components/NavBar.vue'
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'

const auth   = useAuthStore()
const dash   = useDashboardStore()
const router = useRouter()

// ── Init ──────────────────────────────────────────────────
onMounted(async () => {
  await dash.load()
})

// ── Sélecteur de mois ─────────────────────────────────────
function onMonthChange(event) {
  const [year, month] = event.target.value.split('-').map(Number)
  dash.selectMonth(month, year)
}

// ── Graphe barres — hauteur en % ──────────────────────────
const maxSessions = computed(() => {
  const max = Math.max(...dash.chartData.map(d => d.sessions), 1)
  return max
})

const maxMinutes = computed(() => {
  const max = Math.max(...dash.chartData.map(d => d.minutes), 1)
  return max
})

function barHeight(sessions) {
  if (sessions === 0) return 4  // barre mini visible
  return Math.max(8, (sessions / maxSessions.value) * 100)
}

function barHeightMinutes(minutes) {
  if (minutes === 0) return 4
  return Math.max(8, (minutes / maxMinutes.value) * 100)
}

// ── Anneau SVG complétion ─────────────────────────────────
const RING_CIRC = 2 * Math.PI * 32  // ≈ 201

function ringOffset(percent) {
  return RING_CIRC * (1 - percent / 100)
}
</script>

<style scoped>
/* ── Layout ──────────────────────────────────────────────── */
.dashboard-view {
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

.blob-1 { width: 400px; height: 400px; background: var(--c2); top: -100px; left: -100px; animation-delay: 0s; }
.blob-2 { width: 350px; height: 350px; background: var(--c3); bottom: -80px; right: -80px; animation-delay: -4s; }
.blob-3 { width: 300px; height: 300px; background: var(--c1); top: 40%; left: 40%; animation-delay: -8s; }

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

/* ── Top bar ─────────────────────────────────────────────── */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  font-family: 'Fredoka One', cursive;
  font-size: 32px;
  background: linear-gradient(135deg, var(--c2), var(--c3));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.period-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.period-tabs {
  display: flex;
  background: var(--surface);
  border-radius: 12px;
  padding: 4px;
  border: 1.5px solid rgba(255,255,255,0.05);
}

.period-tab {
  font-family: 'Nunito', sans-serif;
  font-weight: 800;
  font-size: 13px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
  color: var(--muted);
}

.period-tab.active {
  background: var(--surface2);
  color: var(--text);
}

.month-select {
  background: var(--surface);
  border: 1.5px solid rgba(255,255,255,0.05);
  border-radius: 12px;
  padding: 8px 14px;
  color: var(--text);
  font-family: 'Nunito', sans-serif;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  outline: none;
}

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

/* ── Stat cards ──────────────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

@media (max-width: 700px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 400px) {
  .stats-grid { grid-template-columns: 1fr; }
}

.stat-card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 20px;
  border: 1.5px solid rgba(255,255,255,0.05);
  text-align: center;
  transition: transform 0.2s;
}

.stat-card:hover { transform: translateY(-2px); }

.stat-icon { font-size: 28px; margin-bottom: 8px; }

.stat-value {
  font-family: 'Fredoka One', cursive;
  font-size: 28px;
  color: var(--c2);
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--muted);
  font-weight: 700;
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

/* ── Chart ───────────────────────────────────────────────── */
.chart-card { margin-bottom: 20px; }

.empty-chart {
  text-align: center;
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
  padding: 40px;
}

.chart { overflow-x: auto; }

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 160px;
  padding-bottom: 28px;
  min-width: 100%;
}

.chart-col {
  flex: 1;
  min-width: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  position: relative;
}

.bar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: relative;
}

.bar-tooltip {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface2);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
  z-index: 10;
  text-align: center;
  line-height: 1.5;
}

.chart-col:hover .bar-tooltip { opacity: 1; }

.bar {
  width: 70%;
  background: var(--surface2);
  border-radius: 6px 6px 0 0;
  transition: height 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  min-height: 4px;
}

.bar.bar-active {
  background: linear-gradient(180deg, var(--c4), var(--c5));
}

.bar.bar-minutes.bar-active {
  background: linear-gradient(180deg, var(--c3), var(--c2));
}

.bar-label {
  position: absolute;
  bottom: 0;
  font-size: 10px;
  color: var(--muted);
  font-weight: 700;
  text-align: center;
}

/* ── Details grid ────────────────────────────────────────── */
.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 600px) {
  .details-grid { grid-template-columns: 1fr; }
}

/* ── Completion ring ─────────────────────────────────────── */
.completion-wrap {
  display: flex;
  align-items: center;
  gap: 24px;
}

.completion-ring svg {
  width: 100px;
  height: 100px;
}

circle.ring-track {
  fill: none;
  stroke: var(--surface2);
  stroke-width: 8;
}

circle.ring-fill {
  fill: none;
  stroke: var(--c3);
  stroke-width: 8;
  stroke-linecap: round;
  transform-origin: 50% 50%;
  transform: rotate(-90deg);
  transition: stroke-dashoffset 0.8s ease;
}

.ring-text {
  font-family: 'Fredoka One', cursive;
  font-size: 16px;
  fill: var(--text);
}

.completion-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.completion-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-green { background: var(--c3); }
.dot-red   { background: var(--c1); }

/* ── Tasks stats ─────────────────────────────────────────── */
.tasks-stats { text-align: center; }

.tasks-big {
  font-family: 'Fredoka One', cursive;
  font-size: 42px;
  line-height: 1;
  margin-bottom: 4px;
}

.tasks-done  { color: var(--c3); }
.tasks-sep   { color: var(--muted); margin: 0 4px; }
.tasks-total { color: var(--muted); }

.tasks-sub {
  font-size: 13px;
  color: var(--muted);
  font-weight: 700;
  margin-bottom: 16px;
}

.tasks-bar-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tasks-bar-track {
  flex: 1;
  height: 8px;
  background: var(--surface2);
  border-radius: 4px;
  overflow: hidden;
}

.tasks-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--c3), var(--c2));
  border-radius: 4px;
  transition: width 0.6s ease;
}

.tasks-rate {
  font-family: 'Fredoka One', cursive;
  font-size: 16px;
  color: var(--c2);
  white-space: nowrap;
}
</style>