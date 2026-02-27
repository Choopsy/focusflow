import { ref, computed } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { useSessionStore } from '@/stores/session'

export function useTimer() {
  const session = useSessionStore()
  const running = ref(false)

  // useIntervalFn de VueUse — comme un setInterval mais qui se nettoie
  // automatiquement quand le composant est détruit (pas de memory leak)
  const { pause, resume } = useIntervalFn(() => {
    // Si on a atteint la durée choisie → session terminée
    if (session.elapsed >= session.duration) {
      pause()
      running.value     = false
      session.completed = true
      return
    }
    session.elapsed++
  }, 1000, { immediate: false }) // immediate: false = ne démarre pas tout seul

  // ── Contrôles ─────────────────────────────────────────
  function start() {
    if (session.completed) return
    running.value = true
    resume()
  }

  function pauseTimer() {
    running.value = false
    pause()
  }

  function toggle() {
    running.value ? pauseTimer() : start()
  }

  function reset() {
    pause()
    running.value     = false
    session.elapsed   = 0
    session.completed = false
  }

  // ── Affichage ─────────────────────────────────────────

  // Format mm:ss à partir des secondes restantes dans le store
  const display = computed(() => {
    const r = session.remaining
    const m = Math.floor(r / 60).toString().padStart(2, '0')
    const s = (r % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  })

  // Pour l'anneau SVG — circonférence d'un cercle de rayon 68
  const CIRC = 2 * Math.PI * 68  // ≈ 427px
  const strokeOffset = computed(() => CIRC * (1 - session.progress))

  return {
    running,
    display,
    strokeOffset,
    CIRC,
    toggle,
    reset,
    start,
    pauseTimer
  }
}