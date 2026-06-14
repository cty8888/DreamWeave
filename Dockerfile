# ---- 前端构建阶段 ----
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---- 后端运行阶段 ----
# better-sqlite3 是原生模块；当前环境拿不到预编译二进制，需用 node-gyp 现场编译。
# 临时装上 python3/make/g++ 编译，装完依赖后再删除，保持镜像精简。
FROM node:20-slim
WORKDIR /app

COPY server/package*.json ./
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && npm ci --omit=dev \
 && apt-get purge -y python3 make g++ \
 && apt-get autoremove -y \
 && rm -rf /var/lib/apt/lists/*

COPY server/ ./
COPY --from=client-build /app/client/dist ./public
RUN mkdir -p /app/data

ENV PORT=3000
ENV DB_PATH=/app/data/dreamweave.db

EXPOSE 3000
CMD ["node", "src/index.js"]
