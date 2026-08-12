FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
RUN npm ci --include=dev
COPY . .
RUN npm run prisma:generate -w @cartcraft/api && npm run build -w @cartcraft/api

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/apps/api/package.json ./apps/api/package.json
COPY --from=base /app/apps/api/dist ./apps/api/dist
COPY --from=base /app/apps/api/prisma ./apps/api/prisma
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/main.js"]
