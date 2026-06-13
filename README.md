# DreamWeave — 梦境续写

> AI4SE 期末项目 | 使用 Superpowers 框架进行规约驱动的智能体开发

**记录你的梦，AI 帮你写成故事。公开的梦，别人帮你一起接着写。**

---

## 功能

- 📝 **梦境记录**：录入梦境内容，选择场景标签（坠落/追逐/飞行等 12 种）和情感标签（恐惧/喜悦等 8 种），设置情感强度
- 🤖 **AI 续写**：私有梦境由 LLM 自动续写成完整故事
- 👥 **接力续写**：公开梦境开放给其他用户接力续写（支持线性接力 + 独立续写两种模式）
- 🧩 **碎片串联**：上传多个零散梦境碎片，AI 编织成连贯故事
- ❤️ **收藏 & 分享**：收藏喜欢的梦境，生成图文卡片导出 PNG

---

## 快速开始

### 环境要求

- Node.js 20+
- npm 9+
- （可选）Docker

### 本地开发

```bash
# 1. 克隆仓库
git clone <repo-url>
cd dreamweave

# 2. 配置环境变量
cp server/.env.example server/.env
# 编辑 server/.env，填入你的 LLM_API_KEY

# 3. 安装依赖 & 启动后端
cd server
npm install
npm run dev          # http://localhost:3000

# 4. 新终端，启动前端
cd client
npm install
npm run dev          # http://localhost:5173
```

### Docker 一键启动

```bash
# 构建镜像
docker build -t dreamweave .

# 运行
docker run -p 3000:3000 -e LLM_API_KEY=sk-your-key dreamweave

# 或使用 docker-compose
docker-compose up -d
```

访问 http://localhost:3000

---

## 运行命令

| 命令 | 说明 |
|------|------|
| `cd server && npm test` | 运行后端测试（27 个） |
| `cd server && npm run dev` | 启动后端开发服务器 |
| `cd client && npm run dev` | 启动前端开发服务器 |
| `cd client && npm run build` | 构建前端生产版本 |
| `docker build -t dreamweave .` | 构建 Docker 镜像 |
| `docker-compose up -d` | Docker Compose 启动 |

---

## 目录结构

```
.
├── server/                    # Node.js + Express 后端
│   ├── src/
│   │   ├── index.js           # Express 入口，路由注册
│   │   ├── config.js          # 环境变量配置
│   │   ├── db/
│   │   │   ├── connection.js  # SQLite 连接
│   │   │   ├── schema.js      # 建表（7 张表）
│   │   │   └── seed.js        # 预设标签种子数据
│   │   ├── middleware/
│   │   │   └── auth.js        # JWT authRequired + authOptional
│   │   ├── routes/
│   │   │   ├── auth.js        # 注册/登录
│   │   │   ├── dreams.js      # 梦境 CRUD + AI 续写
│   │   │   ├── continuations.js # 接力续写
│   │   │   ├── fragments.js   # 碎片串联
│   │   │   ├── favorites.js   # 收藏
│   │   │   └── tags.js        # 标签
│   │   └── services/
│   │       └── llm.js         # OpenAI 兼容 LLM 调用
│   └── tests/                 # Vitest 测试（7 个文件，27 个测试）
│
├── client/                    # Vue 3 前端
│   └── src/
│       ├── api/client.js      # Axios + JWT 拦截器
│       ├── router/index.js    # 11 个路由
│       ├── stores/            # Pinia stores (auth, tags, favorites)
│       ├── views/             # 11 个页面
│       └── components/        # 7 个组件
│
├── Dockerfile                 # 多阶段构建
├── docker-compose.yml
├── .github/workflows/ci.yml   # CI（测试 + Docker 构建）
├── SPEC.md                    # 设计规约
├── PLAN.md                    # 30-task 实现计划
├── SPEC_PROCESS.md            # 规约生成过程 + 冷启动验证
├── AGENT_LOG.md               # 智能体使用日志
└── REFLECTION.md              # 反思报告
```

---

## 技术栈

| 层面 | 技术 |
|------|------|
| 前端 | Vue 3 + Vue Router + Pinia + Axios + html2canvas |
| 后端 | Node.js + Express |
| 数据库 | SQLite (better-sqlite3) |
| 认证 | JWT (bcrypt + jsonwebtoken) |
| LLM | OpenAI 兼容接口 |
| 测试 | Vitest + Supertest |
| 部署 | Docker + Docker Compose |
| CI | GitHub Actions |

---

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 后端端口 | `3000` |
| `JWT_SECRET` | JWT 签名密钥 | `dev-secret-change-in-production` |
| `LLM_API_KEY` | LLM API Key | 无（必填） |
| `LLM_BASE_URL` | LLM API 地址 | `https://api.openai.com/v1` |
| `LLM_MODEL` | LLM 模型名 | `gpt-3.5-turbo` |
| `DB_PATH` | SQLite 数据库路径 | `./data/dreamweave.db` |

---

## API 端点

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/v1/auth/register` | 否 | 注册 |
| POST | `/api/v1/auth/login` | 否 | 登录 |
| GET | `/api/v1/tags/scenes` | 否 | 场景标签 |
| GET | `/api/v1/tags/emotions` | 否 | 情感标签 |
| GET | `/api/v1/dreams` | 否 | 梦境列表（公开） |
| POST | `/api/v1/dreams` | 是 | 创建梦境 |
| GET | `/api/v1/dreams/:id` | 可选 | 梦境详情 |
| PUT | `/api/v1/dreams/:id` | 是 | 更新梦境 |
| DELETE | `/api/v1/dreams/:id` | 是 | 删除梦境 |
| POST | `/api/v1/dreams/:id/generate` | 是 | AI 续写 |
| GET | `/api/v1/dreams/:id/continuations` | 否 | 续写列表 |
| POST | `/api/v1/dreams/:id/continuations` | 是 | 提交续写 |
| POST | `/api/v1/fragments/weave` | 是 | 碎片串联 |
| GET | `/api/v1/fragments/sessions` | 是 | 串联历史 |
| GET | `/api/v1/favorites` | 是 | 收藏列表 |
| POST | `/api/v1/favorites` | 是 | 添加收藏 |
| DELETE | `/api/v1/favorites/:dreamId` | 是 | 取消收藏 |

---

## 许可证

本项目为 AI4SE 课程期末项目。

---

## 致谢

- [Superpowers](https://github.com/obra/superpowers) — 智能体开发方法论框架
