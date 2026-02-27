# ── Étape 1 : Dev ─────────────────────────────────────────
FROM node:20-alpine AS dev

WORKDIR /app

# On copie d'abord uniquement les manifestes
# Docker met en cache cette couche — si package.json ne change pas,
# il ne réinstalle pas tout à chaque build
COPY package*.json ./
RUN npm install

# Copie le reste du code
COPY . .

EXPOSE 5173

# --host 0.0.0.0 indispensable pour exposer Vite hors du container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]


# ── Étape 2 : Build ───────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Vite génère les fichiers optimisés dans /app/dist
RUN npm run build


# ── Étape 3 : Prod (nginx) ────────────────────────────────
FROM nginx:alpine AS prod

# Copie uniquement le dossier dist du build
# L'image finale ne contient pas Node.js — beaucoup plus légère
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]