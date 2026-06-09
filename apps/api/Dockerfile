# ---------- BUILD ----------
FROM node:20-alpine AS builder

WORKDIR /app

# 👇 copier tout le monorepo
COPY . .

# 👇 installer dépendances (workspaces)
RUN npm install

# 👇 build uniquement l'API
RUN npm run build --workspace=apps/api


# ---------- RUN ----------
FROM node:20-alpine

WORKDIR /app

# 👇 copier uniquement ce qu’il faut pour exécuter l’API
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/prisma ./prisma

# 👇 commande de démarrage
CMD ["node", "dist/index.js"]
