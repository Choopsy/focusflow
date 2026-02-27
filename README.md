# ⚡ FocusFlow

Application de focus gamifiée — Vue 3 + Supabase + Docker

---

## 🚀 Démarrage rapide

### 1. Prérequis
- Docker Desktop (Windows) — [docker.com](https://www.docker.com/products/docker-desktop/)
- Un compte Supabase gratuit — [supabase.com](https://supabase.com)

---

### 2. Configurer Supabase

1. Crée un nouveau projet sur [app.supabase.com](https://app.supabase.com)
2. Va dans **SQL Editor** et colle le contenu de `supabase-schema.sql`
3. Clique **Run** — toutes les tables et policies sont créées

---

### 3. Variables d'environnement

```bash
# À la racine du projet
cp .env.example .env
```

Remplis `.env` avec tes clés Supabase :
> **Supabase Dashboard → Settings → API**

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

---

### 4. Lancer en dev avec Docker

```bash
docker compose up --build
```

➡️ L'app est accessible sur **http://localhost:5173**

Le hot-reload fonctionne : modifie un fichier dans `frontend/src/`, la page se met à jour automatiquement.

---

### 5. Lancer sans Docker (optionnel)

```bash
cd frontend
npm install
npm run dev
```

---

## 🏗️ Structure du projet


---

## 📦 Build de production

---

## 🌐 Déploiement (Vercel)


## 🗃️ Stack

| Couche     | Techno                          |
|------------|---------------------------------|
| Frontend   | Vue 3 + Vite + Vue Router + Pinia |
| State      | Pinia + VueUse                  |
| Backend    | Supabase (Auth + PostgreSQL + RLS + Realtime) |
| PWA        | vite-plugin-pwa                 |
| Dev        | Docker + hot-reload             |
| Prod       | Vercel (frontend) + Supabase Cloud |
