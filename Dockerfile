# Snowfolk: one container serving the API and the built web app (Cloud Run, or any container host).

# 1) Build the web app
FROM node:22-slim AS web
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2) Production server
FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY backend/package*.json backend/
RUN cd backend && npm ci --omit=dev
COPY backend/ backend/
COPY --from=web /app/frontend/dist frontend/dist
USER node
# Cloud Run provides PORT (8080 by default)
CMD ["node", "backend/src/index.js"]
