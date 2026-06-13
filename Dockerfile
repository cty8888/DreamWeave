# ---- 前端构建阶段 ----
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---- 后端运行阶段 ----
FROM node:20-alpine
WORKDIR /app

COPY server/package*.json ./
RUN npm ci --only=production

COPY server/ ./
COPY --from=client-build /app/client/dist ./public
RUN mkdir -p /app/data

ENV PORT=3000
ENV DB_PATH=/app/data/dreamweave.db

EXPOSE 3000
CMD ["node", "src/index.js"]
