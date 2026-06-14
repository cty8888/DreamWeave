# ---- 前端构建阶段 ----
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---- 后端运行阶段 ----
# 用 debian-slim（glibc）：better-sqlite3 有 glibc 预编译二进制，无需现场用 node-gyp 编译
# （alpine 是 musl，无预编译，会因缺 Python/编译工具而构建失败）
FROM node:20-slim
WORKDIR /app

COPY server/package*.json ./
RUN npm ci --omit=dev

COPY server/ ./
COPY --from=client-build /app/client/dist ./public
RUN mkdir -p /app/data

ENV PORT=3000
ENV DB_PATH=/app/data/dreamweave.db

EXPOSE 3000
CMD ["node", "src/index.js"]
