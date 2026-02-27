import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useFriendsStore = defineStore('friends', () => {
  // ── State ─────────────────────────────────────────────
  const friends      = ref([])   // amis acceptés
  const pending      = ref([])   // demandes reçues en attente
  const sent         = ref([])   // demandes envoyées
  const leaderboard  = ref([])   // classement amis + soi
  const searchResults = ref([])
  const loading      = ref(false)

  // ── Charger tout ──────────────────────────────────────
  async function loadAll() {
    loading.value = true
    await Promise.all([
      loadFriends(),
      loadPending(),
      loadSent(),
      loadLeaderboard()
    ])
    loading.value = false
  }

  // Amis acceptés
  async function loadFriends() {
    const auth = useAuthStore()
    const { data } = await supabase
      .from('friendships')
      .select(`
        id, status, requester, addressee,
        requester_profile:profiles!friendships_requester_fkey(id, username, level, xp, total_pts),
        addressee_profile:profiles!friendships_addressee_fkey(id, username, level, xp, total_pts)
      `)
      .eq('status', 'accepted')
      .or(`requester.eq.${auth.user.id},addressee.eq.${auth.user.id}`)

    friends.value = (data || []).map(f => {
      // Retourne le profil de l'autre personne
      const isRequester = f.requester === auth.user.id
      return {
        friendshipId: f.id,
        ...( isRequester ? f.addressee_profile : f.requester_profile)
      }
    })
  }

  // Demandes reçues
  async function loadPending() {
    const auth = useAuthStore()
    const { data } = await supabase
      .from('friendships')
      .select(`
        id,
        requester_profile:profiles!friendships_requester_fkey(id, username, level, xp)
      `)
      .eq('status', 'pending')
      .eq('addressee', auth.user.id)

    pending.value = (data || []).map(f => ({
      friendshipId: f.id,
      ...f.requester_profile
    }))
  }

  // Demandes envoyées
  async function loadSent() {
    const auth = useAuthStore()
    const { data } = await supabase
      .from('friendships')
      .select(`
        id,
        addressee_profile:profiles!friendships_addressee_fkey(id, username, level, xp)
      `)
      .eq('status', 'pending')
      .eq('requester', auth.user.id)

    sent.value = (data || []).map(f => ({
      friendshipId: f.id,
      ...f.addressee_profile
    }))
  }

  // Classement
  async function loadLeaderboard() {
    const { data } = await supabase.rpc('get_friends_leaderboard')
    leaderboard.value = data || []
  }

  // ── Recherche ──────────────────────────────────────────
  async function searchUsers(query) {
    if (!query.trim()) {
      searchResults.value = []
      return
    }
    const { data } = await supabase.rpc('search_users', {
      search_query: query.trim()
    })
    searchResults.value = data || []
  }

  // ── Actions ────────────────────────────────────────────
  async function sendRequest(addresseeId) {
    const auth = useAuthStore()
    const { error } = await supabase
      .from('friendships')
      .insert({
        requester: auth.user.id,
        addressee: addresseeId,
        status: 'pending'
      })
    if (error) throw error
    await loadSent()
  }

  async function acceptRequest(friendshipId) {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)
    if (error) throw error
    await loadAll()
  }

  async function declineRequest(friendshipId) {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)
    if (error) throw error
    await loadPending()
  }

  async function removeFriend(friendshipId) {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)
    if (error) throw error
    await loadAll()
  }

  return {
    friends, pending, sent, leaderboard, searchResults, loading,
    loadAll, searchUsers,
    sendRequest, acceptRequest, declineRequest, removeFriend
  }
})