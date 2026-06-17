# ---------- BUILD STAGE ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copier tout le monorepo
COPY . .

# Installer TOUTES les dépendances du monorepo
RUN npm install

# Build du package types (workspace)
RUN npm run build --workspace=@school-mgt/types

# Build de l'API
RUN npm run build --workspace=apps/api

# Génération Prisma
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma


# ---------- RUNTIME STAGE ----------
FROM node:20-alpine AS runner

WORKDIR /app

# Copier uniquement ce qui est nécessaire
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/prisma ./prisma

# copier les types compilés (pas TS)
# COPY --from=builder /app/packages/types/dist ./node_modules/@school-mgt/types

# Copier node_modules runtime (déjà installé dans builder)
COPY --from=builder /app/node_modules ./node_modules

# Variables environnement
ENV NODE_ENV=production

# Port (optionnel mais propre)
EXPOSE 5000

# Start
CMD ["node", "dist/index.js"]