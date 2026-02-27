import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// On initialise l'auth AVANT de monter l'app
// Sans ça, l'app s'affiche une fraction de seconde
// avec user = null, même si l'utilisateur est connecté
const auth = useAuthStore()
auth.init().then(() => {
  app.mount('#app')
})