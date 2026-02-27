import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  // ── State ─────────────────────────────────────────────
  const user    = ref(null)
  const profile = ref(null)
  const loading = ref(true)

  // ── Getters ───────────────────────────────────────────
  const isLoggedIn = computed(() => !!user.value)

  // ── Actions ───────────────────────────────────────────

  // Appelée une seule fois au démarrage de l'app
  async function init() {
    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user ?? null
    if (user.value) await fetchProfile()
    loading.value = false

    // Écoute en temps réel les changements d'auth
    // (login, logout, expiration du token)
    supabase.auth.onAuthStateChange(async (_event, session) => {
      user.value = session?.user ?? null
      if (user.value) await fetchProfile()
      else profile.value = null
    })
  }

  async function fetchProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .single()
    profile.value = data
  }

  async function signUp(email, password, username) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    })
    if (error) throw error
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    profile.value = null
  }

  return {
    user, profile, loading, isLoggedIn,
    init, signUp, signIn, signOut, fetchProfile
  }
})