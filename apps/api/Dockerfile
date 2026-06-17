FROM node:20-alpine AS builder

WORKDIR /app

COPY . .

RUN npm install

RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

RUN npm run build --workspace=apps/api

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/src/generated ./src/generated

EXPOSE 5000

CMD ["node", "dist/index.js"]