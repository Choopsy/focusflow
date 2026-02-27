import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useSessionStore = defineStore('session', () => {
  // ── State ─────────────────────────────────────────────
  const subject   = ref('')        // sujet de travail
  const tasks     = ref([])        // liste des tâches
  const duration  = ref(25 * 60)  // durée choisie en secondes
  const elapsed   = ref(0)         // secondes écoulées
  const completed = ref(false)     // session terminée ?
  const earnedPts = ref(0)

  // ── Getters ───────────────────────────────────────────
  const remaining = computed(() => duration.value - elapsed.value)
  const progress  = computed(() => elapsed.value / duration.value)

  const doneTasks    = computed(() => tasks.value.filter(t => t.done).length)
  const allTasksDone = computed(() => tasks.value.length > 0 && tasks.value.every(t => t.done))

  const pointsPreview = computed(() => {
    const base      = 10
    const timeBonus = Math.floor((duration.value / 60) / 5)  // +1 par tranche de 5 min
    const taskBonus = doneTasks.value * 2                     // +2 par tâche faite
    const allBonus  = allTasksDone.value ? 5 : 0             // +5 si tout coché
    return base + timeBonus + taskBonus + allBonus
  })

  // ── Actions tâches ────────────────────────────────────
  function addTask(label) {
    if (!label.trim()) return
    tasks.value.push({
      id:   Date.now(),
      label: label.trim(),
      done:  false
    })
  }

  function toggleTask(id) {
    const task = tasks.value.find(t => t.id === id)
    if (task) task.done = !task.done
  }

  function removeTask(id) {
    tasks.value = tasks.value.filter(t => t.id !== id)
  }

  // ── Reset ─────────────────────────────────────────────
  function reset() {
    subject.value   = ''
    tasks.value     = []
    elapsed.value   = 0
    completed.value = false
  }

  // ── Sauvegarde Supabase ───────────────────────────────
  async function save() {
    const auth = useAuthStore()

    if (!auth.isLoggedIn) {
        throw new Error('not_authenticated')
    }

    // Récupère la session et force le token dans les headers
    const { data: { session: authSession } } = await supabase.auth.getSession()

    earnedPts.value = pointsPreview.value

    if (!authSession?.access_token) {
        throw new Error('no_token')
    }

    // Client authentifié avec le token explicite
    const headers = {
        'Authorization': `Bearer ${authSession.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
    }

    const { data: savedSession, error } = await supabase
        .from('sessions')
        .insert({
        user_id:    auth.user.id,
        subject:    subject.value || null,
        duration:   elapsed.value,
        completed:  completed.value,
        pts_earned: earnedPts.value,
        }, { headers })
        .select()
        .single()

    if (error) throw error

    if (tasks.value.length > 0) {
        await supabase.from('tasks').insert(
        tasks.value.map(t => ({
            session_id: savedSession.id,
            label:      t.label,
            done:       t.done
        })), { headers }
        )
    }

    await supabase.rpc('add_points', {
        p_user_id: auth.user.id,
        p_points:  pointsPreview.value
    })

    await auth.fetchProfile()

    return savedSession
    }

  return {
    subject, tasks, duration, elapsed, completed,
    remaining, progress, doneTasks, allTasksDone, pointsPreview,
    addTask, toggleTask, removeTask, reset, save
  }
})