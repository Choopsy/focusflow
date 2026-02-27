import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export const useDashboardStore = defineStore('dashboard', () => {
  // ── State ─────────────────────────────────────────────
  const stats       = ref(null)
  const dailyData   = ref([])
  const loading     = ref(false)
  const period      = ref('week')   // 'week' | 'month'
  const selectedMonth = ref(new Date().getMonth())      // 0-11
  const selectedYear  = ref(new Date().getFullYear())

  // ── Computed dates ────────────────────────────────────
  const dateRange = computed(() => {
    const now = new Date()

    if (period.value === 'week') {
      // Lundi de la semaine en cours
      const day = now.getDay() || 7
      const monday = new Date(now)
      monday.setDate(now.getDate() - day + 1)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      return {
        start: toDateStr(monday),
        end:   toDateStr(sunday)
      }
    } else {
      // Mois sélectionné
      const start = new Date(selectedYear.value, selectedMonth.value, 1)
      const end   = new Date(selectedYear.value, selectedMonth.value + 1, 0)
      return {
        start: toDateStr(start),
        end:   toDateStr(end)
      }
    }
  })

  // ── Helpers ───────────────────────────────────────────
  function toDateStr(date) {
    return date.toISOString().split('T')[0]
  }

  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  // ── Chargement ────────────────────────────────────────
  async function load() {
    loading.value = true
    const { start, end } = dateRange.value

    const [statsRes, dailyRes] = await Promise.all([
      supabase.rpc('get_stats', { p_start: start, p_end: end }),
      supabase.rpc('get_daily_sessions', { p_start: start, p_end: end })
    ])

    stats.value     = statsRes.data
    dailyData.value = dailyRes.data || []
    loading.value   = false
  }

  // ── Données pour le graphe ────────────────────────────
  const chartData = computed(() => {
    if (!dailyData.value.length) return []

    const { start, end } = dateRange.value
    const result = []
    const current = new Date(start)
    const endDate = new Date(end)

    while (current <= endDate) {
      const dateStr = toDateStr(current)
      const found = dailyData.value.find(d => d.day === dateStr)

      result.push({
        date:     dateStr,
        label:    period.value === 'week'
          ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][current.getDay() === 0 ? 6 : current.getDay() - 1]
          : current.getDate().toString(),
        sessions: found ? Number(found.sessions) : 0,
        minutes:  found ? Math.floor(Number(found.seconds) / 60) : 0,
        pts:      found ? Number(found.pts) : 0,
      })

      current.setDate(current.getDate() + 1)
    }

    return result
  })

  // ── Stats formatées ───────────────────────────────────
  const formattedStats = computed(() => {
    if (!stats.value) return null
    const s = stats.value
    return {
      totalTime:    formatTime(s.total_seconds),
      totalSessions: s.total_sessions,
      completedSessions: s.completed_sessions,
      completionRate: s.total_sessions > 0
        ? Math.round(s.completed_sessions / s.total_sessions * 100)
        : 0,
      totalPts:     s.total_pts,
      taskRate:     s.total_tasks > 0
        ? Math.round(s.done_tasks / s.total_tasks * 100)
        : 0,
      totalTasks:   s.total_tasks,
      doneTasks:    s.done_tasks,
    }
  })

  // ── Liste des mois pour le sélecteur ─────────────────
  const monthOptions = computed(() => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]
    const options = []
    const now = new Date()
    // 12 derniers mois
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      options.push({
        label: `${months[d.getMonth()]} ${d.getFullYear()}`,
        month: d.getMonth(),
        year:  d.getFullYear()
      })
    }
    return options
  })

  function selectMonth(month, year) {
    selectedMonth.value = month
    selectedYear.value  = year
    load()
  }

  function setPeriod(p) {
    period.value = p
    load()
  }

  return {
    stats, dailyData, loading, period,
    selectedMonth, selectedYear,
    dateRange, chartData, formattedStats, monthOptions,
    load, setPeriod, selectMonth
  }
})