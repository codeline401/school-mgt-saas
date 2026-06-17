# ---------- BUILD STAGE ----------
FROM node:20-alpine AS builder

WORKDIR /app

COPY . .
RUN npm install
RUN npm run build --workspace=@school-mgt/types
RUN npm run build --workspace=apps/api
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma


# ---------- RUNTIME STAGE ----------
FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/prisma ./prisma

# 1. Copier node_modules (contient un symlink cassé pour @school-mgt/types)
COPY --from=builder /app/node_modules ./node_modules

# 2. Supprimer le symlink cassé et le remplacer par le vrai package compilé
RUN rm -rf ./node_modules/@school-mgt/types
COPY --from=builder /app/packages/types/dist ./node_modules/@school-mgt/types/dist
COPY --from=builder /app/packages/types/package.json ./node_modules/@school-mgt/types/package.json

ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "dist/index.js"]