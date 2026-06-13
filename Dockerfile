# TODO: 根据技术栈配置基础镜像与构建步骤
# 示例（Python）：
# FROM python:3.12-slim
# WORKDIR /app
# COPY requirements.txt .
# RUN pip install -r requirements.txt
# COPY . .
# CMD ["python", "main.py"]

# 示例（Node.js）：
# FROM node:20-alpine
# WORKDIR /app
# COPY package*.json .
# RUN npm ci --only=production
# COPY . .
# CMD ["node", "index.js"]

# 完成后删除本注释块
