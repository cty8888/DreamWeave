# 梦境续写 (DreamWeave) 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个梦境续写 Web 应用——用户录入梦境、AI 续写故事、公开梦境接力续写、碎片串联、收藏与分享。

**Architecture:** Vue.js 3 前端 SPA + Node.js Express 后端 REST API + SQLite 数据库。前端通过 Axios 调用后端 API，JWT Token 鉴权。后端通过 OpenAI 兼容接口调用 LLM。

**Tech Stack:** Vue 3 + Vue Router + Pinia | Node.js + Express | better-sqlite3 | bcrypt + jsonwebtoken | openai SDK | html2canvas | Vitest (后端测试) | Vitest + Vue Test Utils (前端测试)

---

## 任务总览

| 统计项 | 数量 |
|--------|------|
| 总任务数 | 30 |
| P0（阻塞性） | 15 |
| P1（高优先） | 10 |
| P2（可延后） | 5 |
| 可并行组 | 6 组 |

---

## 依赖关系图

```
阶段 1（并行）: T01 + T02 + T03（项目骨架 + DB）
         │
阶段 2:   ├── T04 → T05 → T06（Auth 全链路）
         │         └── 所有后续 API 依赖 Auth middleware
         ├── T07 + T08（标签，可与 Auth 并行）
         │
阶段 3:   ├── T09 → T10 → T11 → T12（梦境 CRUD API）
         │         └── T13 → T14 → T15（梦境前端页面）
         ├── T16 → T17（LLM 服务 + 续写 API）
         │         └── T18（续写前端）
         │
阶段 4:   ├── T19 → T20 → T21（公开接力全链路）
         ├── T22 → T23 → T24（碎片串联全链路）
         ├── T25 → T26（收藏全链路）
         │
阶段 5:   └── T27（分享卡片，依赖 T14）
                  └── T28（NavBar + 路由集成）
                          └── T29 → T30（Docker + CI）
```

---

## 文件结构总览

```
project-root/
├── server/
│   ├── package.json
│   ├── src/
│   │   ├── index.js               # Express 入口，注册路由和中间件
│   │   ├── config.js              # 环境变量读取
│   │   ├── db/
│   │   │   ├── connection.js      # SQLite 连接（better-sqlite3）
│   │   │   ├── schema.js          # 建表语句
│   │   │   └── seed.js            # 预设标签初始化
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT 验证中间件
│   │   │   └── errorHandler.js    # 全局错误处理
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── dreams.js
│   │   │   ├── continuations.js
│   │   │   ├── fragments.js
│   │   │   ├── favorites.js
│   │   │   └── tags.js
│   │   └── services/
│   │       └── llm.js             # OpenAI 兼容 LLM 调用
│   └── tests/
│       ├── helpers.js             # 测试辅助（临时 DB 初始化）
│       ├── auth.test.js
│       ├── dreams.test.js
│       ├── continuations.test.js
│       ├── fragments.test.js
│       ├── favorites.test.js
│       └── tags.test.js
│
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.js
│       ├── App.vue
│       ├── router/index.js
│       ├── stores/
│       │   ├── auth.js
│       │   ├── dreams.js
│       │   └── favorites.js
│       ├── api/
│       │   └── client.js          # Axios 实例 + 拦截器
│       ├── views/
│       │   ├── HomeView.vue
│       │   ├── LoginView.vue
│       │   ├── RegisterView.vue
│       │   ├── DreamNewView.vue
│       │   ├── DreamDetailView.vue
│       │   ├── DreamContinueView.vue
│       │   ├── MineView.vue
│       │   ├── FavoritesView.vue
│       │   ├── FragmentWeaveView.vue
│       │   ├── FragmentDetailView.vue
│       │   └── ShareCardView.vue
│       ├── components/
│       │   ├── AppNavbar.vue
│       │   ├── DreamCard.vue
│       │   ├── SceneSelector.vue
│       │   ├── EmotionSelector.vue
│       │   ├── ContinuationList.vue
│       │   ├── FragmentEditor.vue
│       │   └── ShareCard.vue
│       └── assets/
│           └── style.css
│
├── Dockerfile
├── docker-compose.yml
├── .github/workflows/ci.yml
├── SPEC.md
├── PLAN.md           ← 本文件
├── SPEC_PROCESS.md
├── AGENT_LOG.md
└── README.md
```

---

## 任务列表

---

### Task T01: 初始化后端项目 ✅ `52993d7`

**优先级:** P0 | **依赖:** 无 | **可并行:** 与 T02, T03

**目标:** 搭建 Node.js + Express 项目骨架，安装依赖，创建入口文件和配置模块。

**涉及文件:**
- 创建 `server/package.json`
- 创建 `server/src/index.js`
- 创建 `server/src/config.js`
- 创建 `server/.env.example`

---

- [ ] **Step 1: 初始化 package.json 并安装依赖**

```bash
cd server
npm init -y
npm install express cors better-sqlite3 bcrypt jsonwebtoken openai dotenv
npm install -D vitest supertest nodemon
```

- [ ] **Step 2: 创建 server/src/config.js**

```js
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: '7d',
  llm: {
    apiKey: process.env.LLM_API_KEY || '',
    baseURL: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.LLM_MODEL || 'gpt-3.5-turbo',
  },
  dbPath: process.env.DB_PATH || './data/dreamweave.db',
};
```

- [ ] **Step 3: 创建 server/.env.example**

```
PORT=3000
JWT_SECRET=change-me-to-a-random-string
LLM_API_KEY=sk-your-key-here
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-3.5-turbo
DB_PATH=./data/dreamweave.db
```

- [ ] **Step 4: 创建 server/src/index.js（最小骨架）**

```js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./config');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok' });
});

const port = config.port;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
```

- [ ] **Step 5: 添加 server/package.json 的 start/dev/test 脚本**

在 `server/package.json` 中确保有：
```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 6: 验证服务器启动**

```bash
cd server && node src/index.js
```
预期：控制台输出 `Server running on port 3000`

---

### Task T02: 初始化前端项目 ✅ `af30182`

**优先级:** P0 | **依赖:** 无 | **可并行:** 与 T01, T03

**目标:** 用 Vite 搭建 Vue 3 项目，安装 Vue Router、Pinia、Axios、html2canvas。

**涉及文件:**
- 创建 `client/` 整个脚手架
- 创建 `client/src/main.js`
- 创建 `client/src/App.vue`
- 创建 `client/src/router/index.js`

---

- [ ] **Step 1: 用 Vite 创建 Vue 3 项目**

```bash
npm create vite@latest client -- --template vue
cd client
npm install
npm install vue-router@4 pinia axios html2canvas
npm install -D vitest @vue/test-utils jsdom
```

- [ ] **Step 2: 创建 client/src/router/index.js**

```js
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
  { path: '/register', name: 'register', component: () => import('../views/RegisterView.vue') },
  { path: '/dreams/new', name: 'dream-new', component: () => import('../views/DreamNewView.vue') },
  { path: '/dreams/:id', name: 'dream-detail', component: () => import('../views/DreamDetailView.vue') },
  { path: '/dreams/:id/continue', name: 'dream-continue', component: () => import('../views/DreamContinueView.vue') },
  { path: '/mine', name: 'mine', component: () => import('../views/MineView.vue') },
  { path: '/favorites', name: 'favorites', component: () => import('../views/FavoritesView.vue') },
  { path: '/fragments/weave', name: 'fragment-weave', component: () => import('../views/FragmentWeaveView.vue') },
  { path: '/fragments/:id', name: 'fragment-detail', component: () => import('../views/FragmentDetailView.vue') },
  { path: '/share/:id', name: 'share-card', component: () => import('../views/ShareCardView.vue') },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
```

- [ ] **Step 3: 创建 client/src/api/client.js**

```js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  timeout: 35000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

- [ ] **Step 4: 创建 client/src/main.js**

```js
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './assets/style.css';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');
```

- [ ] **Step 5: 创建最小 client/src/App.vue**

```vue
<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
</script>
```

- [ ] **Step 6: 验证前端启动**

```bash
cd client && npm run dev
```
预期：浏览器打开 `http://localhost:5173` 可见空白页面，无报错。

---

### Task T03: 初始化 SQLite 数据库 ✅ `22b7377`

**优先级:** P0 | **依赖:** T01 | **可并行:** 与 T02

**目标:** 创建数据库连接模块、建表 Schema、预设种子数据。

**涉及文件:**
- 创建 `server/src/db/connection.js`
- 创建 `server/src/db/schema.js`
- 创建 `server/src/db/seed.js`

---

- [ ] **Step 1: 创建 server/src/db/connection.js**

```js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('../config');

const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(config.dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
```

- [ ] **Step 2: 创建 server/src/db/schema.js**

```js
const db = require('./connection');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scene_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      is_preset INTEGER DEFAULT 0,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS emotion_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      is_preset INTEGER DEFAULT 0,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS dreams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT,
      content TEXT NOT NULL,
      scene_ids TEXT DEFAULT '[]',
      emotion_tags TEXT DEFAULT '[]',
      visibility TEXT DEFAULT 'private' CHECK(visibility IN ('private','public')),
      ai_story TEXT,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft','completed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS continuations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dream_id INTEGER NOT NULL REFERENCES dreams(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      parent_id INTEGER REFERENCES continuations(id),
      content TEXT NOT NULL,
      is_independent INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fragments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      sort_order INTEGER,
      session_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      dream_id INTEGER NOT NULL REFERENCES dreams(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, dream_id)
    );
  `);

  console.log('Database schema initialized.');
}

module.exports = { initSchema };
```

- [ ] **Step 3: 创建 server/src/db/seed.js**

```js
const db = require('./connection');

const PRESET_SCENES = ['坠落', '追逐', '飞行', '迷宫', '溺水', '战斗', '考试', '迷路', '重逢', '变形', '末日', '日常'];
const PRESET_EMOTIONS = ['恐惧', '焦虑', '悲伤', '迷茫', '喜悦', '惊奇', '愤怒', '平静'];

function seed() {
  const insertTag = db.prepare(
    'INSERT OR IGNORE INTO scene_tags (name, is_preset) VALUES (?, 1)'
  );
  const insertEmotion = db.prepare(
    'INSERT OR IGNORE INTO emotion_tags (name, is_preset) VALUES (?, 1)'
  );

  for (const scene of PRESET_SCENES) {
    insertTag.run(scene);
  }
  for (const emotion of PRESET_EMOTIONS) {
    insertEmotion.run(emotion);
  }

  console.log('Seed data inserted.');
}

module.exports = { seed };
```

- [ ] **Step 4: 在 server/src/index.js 中调用初始化和种子**

在 `server/src/index.js` 中 `app.listen` 之前添加：
```js
const { initSchema } = require('./db/schema');
const { seed } = require('./db/seed');

initSchema();
seed();
```

- [ ] **Step 5: 验证**

```bash
cd server && node -e "
require('./src/db/schema').initSchema();
require('./src/db/seed').seed();
const db = require('./src/db/connection');
console.log('Users table count:', db.prepare('SELECT COUNT(*) as c FROM sqlite_master WHERE type=\'table\'').get());
console.log('Scene tags:', db.prepare('SELECT * FROM scene_tags').all());
"
```
预期：输出 7 张表，12 个场景标签，8 个情感标签。

---

### Task T04: 用户注册 API ✅ `16d0d0d`

**优先级:** P0 | **依赖:** T01, T03 | **可并行:** 与 T07

**目标:** 实现 POST /api/v1/auth/register，含密码哈希和参数校验。

**涉及文件:**
- 创建 `server/tests/auth.test.js`
- 创建 `server/src/routes/auth.js`
- 修改 `server/src/index.js`（注册 auth 路由）

---

- [ ] **Step 1: 创建 server/tests/helpers.js**

```js
const Database = require('better-sqlite3');

function createTestDb() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  return db;
}

module.exports = { createTestDb };
```

- [ ] **Step 2: 写失败测试 — server/tests/auth.test.js**

```js
const { describe, it, beforeAll, expect } = require('vitest');
const request = require('supertest');

let app;

beforeAll(async () => {
  process.env.DB_PATH = ':memory:';
  process.env.JWT_SECRET = 'test-secret';
  app = require('../src/index');
});

describe('POST /api/v1/auth/register', () => {
  it('should register a new user and return token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'testuser', email: 'test@example.com', password: '123456' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.username).toBe('testuser');
  });

  it('should reject duplicate email with 409', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'u2', email: 'dup@example.com', password: '123456' });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'u3', email: 'dup@example.com', password: '123456' });

    expect(res.status).toBe(409);
  });

  it('should reject missing fields with 422', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'x' });

    expect(res.status).toBe(422);
  });
});
```

- [ ] **Step 3: 运行测试确认红色**

```bash
cd server && npx vitest run tests/auth.test.js
```
预期：全部 FAIL（路由未定义 / 404）。

- [ ] **Step 4: 创建 server/src/routes/auth.js**

```js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');
const config = require('../config');

const router = express.Router();

router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(422).json({ error: 'username, email, password are required' });
  }
  if (password.length < 6) {
    return res.status(422).json({ error: 'password must be at least 6 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
  if (existing) {
    return res.status(409).json({ error: 'user already exists' });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
  ).run(username, email, password_hash);

  const user = { id: result.lastInsertRowid, username, email };
  const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

  res.status(201).json({ token, user });
});

module.exports = router;
```

- [ ] **Step 5: 修改 server/src/index.js — 注册路由**

在 `app.use(express.json())` 之后添加：
```js
const authRoutes = require('./routes/auth');
app.use('/api/v1/auth', authRoutes);
```

- [ ] **Step 6: 运行测试确认绿色**

```bash
cd server && npx vitest run tests/auth.test.js
```
预期：3 个测试全部 PASS。

---

### Task T05: 用户登录 API + JWT 中间件 ✅ `718c933`

**优先级:** P0 | **依赖:** T04 | **可并行:** 无

**目标:** 实现 POST /api/v1/auth/login 和 JWT 验证中间件。

**涉及文件:**
- 修改 `server/tests/auth.test.js`（追加登录测试）
- 修改 `server/src/routes/auth.js`（追加 /login）
- 创建 `server/src/middleware/auth.js`

---

- [ ] **Step 1: 追加登录测试到 server/tests/auth.test.js**

```js
describe('POST /api/v1/auth/login', () => {
  beforeAll(async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'logintest', email: 'login@test.com', password: 'testpass' });
  });

  it('should login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@test.com', password: 'testpass' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should reject wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@test.com', password: 'wrong' });

    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: 运行测试确认红色**

```bash
cd server && npx vitest run tests/auth.test.js
```
预期：新增 2 个 FAIL（/login 路由 404）。

- [ ] **Step 3: 追加 /login 路由到 server/src/routes/auth.js**

```js
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(422).json({ error: 'email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'invalid email or password' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'invalid email or password' });
  }

  const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email },
  });
});
```

- [ ] **Step 4: 创建 server/src/middleware/auth.js**

```js
const jwt = require('jsonwebtoken');
const config = require('../config');

function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'authentication required' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid or expired token' });
  }
}

module.exports = { authRequired };
```

- [ ] **Step 5: 运行测试确认绿色**

```bash
cd server && npx vitest run tests/auth.test.js
```
预期：5 个测试全部 PASS。

---

### Task T06: 前端 Auth（登录/注册页面 + Store）

**优先级:** P0 | **依赖:** T02, T05 | **可并行:** 与 T08

**目标:** 创建 Pinia auth store、登录和注册页面。

**涉及文件:**
- 创建 `client/src/stores/auth.js`
- 创建 `client/src/views/LoginView.vue`
- 创建 `client/src/views/RegisterView.vue`

---

- [ ] **Step 1: 创建 client/src/stores/auth.js**

```js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '../api/client';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));
  const token = ref(localStorage.getItem('token') || '');

  const isLoggedIn = computed(() => !!token.value);

  async function login(email, password) {
    const res = await apiClient.post('/auth/login', { email, password });
    token.value = res.data.token;
    user.value = res.data.user;
    localStorage.setItem('token', token.value);
    localStorage.setItem('user', JSON.stringify(user.value));
    return res.data;
  }

  async function register(username, email, password) {
    const res = await apiClient.post('/auth/register', { username, email, password });
    token.value = res.data.token;
    user.value = res.data.user;
    localStorage.setItem('token', token.value);
    localStorage.setItem('user', JSON.stringify(user.value));
    return res.data;
  }

  function logout() {
    token.value = '';
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  return { user, token, isLoggedIn, login, register, logout };
});
```

- [ ] **Step 2: 创建 client/src/views/LoginView.vue**

```vue
<template>
  <div class="auth-page">
    <h1>登录</h1>
    <form @submit.prevent="handleSubmit">
      <input v-model="email" type="email" placeholder="邮箱" required />
      <input v-model="password" type="password" placeholder="密码" required minlength="6" />
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" :disabled="loading">登录</button>
    </form>
    <p>还没有账号？<router-link to="/register">去注册</router-link></p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const router = useRouter();
const auth = useAuthStore();

async function handleSubmit() {
  error.value = '';
  loading.value = true;
  try {
    await auth.login(email.value, password.value);
    router.push('/');
  } catch (e) {
    error.value = e.response?.data?.error || '登录失败';
  } finally {
    loading.value = false;
  }
}
</script>
```

- [ ] **Step 3: 创建 client/src/views/RegisterView.vue**

```vue
<template>
  <div class="auth-page">
    <h1>注册</h1>
    <form @submit.prevent="handleSubmit">
      <input v-model="username" type="text" placeholder="用户名" required />
      <input v-model="email" type="email" placeholder="邮箱" required />
      <input v-model="password" type="password" placeholder="密码（至少6位）" required minlength="6" />
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" :disabled="loading">注册</button>
    </form>
    <p>已有账号？<router-link to="/login">去登录</router-link></p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const username = ref('');
const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const router = useRouter();
const auth = useAuthStore();

async function handleSubmit() {
  error.value = '';
  loading.value = true;
  try {
    await auth.register(username.value, email.value, password.value);
    router.push('/');
  } catch (e) {
    error.value = e.response?.data?.error || '注册失败';
  } finally {
    loading.value = false;
  }
}
</script>
```

- [ ] **Step 4: 手动验证**

```bash
cd server && npm run dev    # 终端 1
cd client && npm run dev    # 终端 2
```
手动访问 http://localhost:5173/register 注册 → 自动跳转首页。

---

### Task T07: 标签 API ✅ `e274535`

**优先级:** P1 | **依赖:** T01, T03 | **可并行:** 与 T04

**目标:** 实现 GET /api/v1/tags/scenes 和 GET /api/v1/tags/emotions。

**涉及文件:**
- 创建 `server/tests/tags.test.js`
- 创建 `server/src/routes/tags.js`
- 修改 `server/src/index.js`

---

- [ ] **Step 1: 写失败测试 — server/tests/tags.test.js**

```js
const { describe, it, expect } = require('vitest');
const request = require('supertest');

let app;
beforeAll(async () => {
  process.env.DB_PATH = ':memory:';
  process.env.JWT_SECRET = 'test-secret';
  app = require('../src/index');
});

describe('GET /api/v1/tags/scenes', () => {
  it('should return all scene tags', async () => {
    const res = await request(app).get('/api/v1/tags/scenes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(12);
    expect(res.body[0]).toHaveProperty('name');
  });
});

describe('GET /api/v1/tags/emotions', () => {
  it('should return all emotion tags', async () => {
    const res = await request(app).get('/api/v1/tags/emotions');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(8);
  });
});
```

- [ ] **Step 2: 运行测试确认红色**

```bash
cd server && npx vitest run tests/tags.test.js
```
预期：FAIL（路由 404）。

- [ ] **Step 3: 创建 server/src/routes/tags.js**

```js
const express = require('express');
const db = require('../db/connection');

const router = express.Router();

router.get('/scenes', (req, res) => {
  const tags = db.prepare('SELECT id, name, is_preset FROM scene_tags ORDER BY id').all();
  res.json(tags);
});

router.get('/emotions', (req, res) => {
  const tags = db.prepare('SELECT id, name, is_preset FROM emotion_tags ORDER BY id').all();
  res.json(tags);
});

module.exports = router;
```

- [ ] **Step 4: 注册路由 — server/src/index.js**

```js
const tagsRoutes = require('./routes/tags');
app.use('/api/v1/tags', tagsRoutes);
```

- [ ] **Step 5: 运行测试确认绿色**

```bash
cd server && npx vitest run tests/tags.test.js
```
预期：2 个 PASS。

---

### Task T08: 前端标签选择器组件

**优先级:** P1 | **依赖:** T02, T07 | **可并行:** 与 T06

**目标:** 创建 SceneSelector 和 EmotionSelector 组件。

**涉及文件:**
- 创建 `client/src/components/SceneSelector.vue`
- 创建 `client/src/components/EmotionSelector.vue`
- 创建 `client/src/stores/tags.js`（缓存标签数据）

---

- [ ] **Step 1: 创建 client/src/stores/tags.js**

```js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiClient from '../api/client';

export const useTagsStore = defineStore('tags', () => {
  const scenes = ref([]);
  const emotions = ref([]);
  const loaded = ref(false);

  async function fetchTags() {
    if (loaded.value) return;
    const [sRes, eRes] = await Promise.all([
      apiClient.get('/tags/scenes'),
      apiClient.get('/tags/emotions'),
    ]);
    scenes.value = sRes.data;
    emotions.value = eRes.data;
    loaded.value = true;
  }

  return { scenes, emotions, loaded, fetchTags };
});
```

- [ ] **Step 2: 创建 client/src/components/SceneSelector.vue**

```vue
<template>
  <div class="scene-selector">
    <label>场景标签</label>
    <div class="tag-grid">
      <button
        v-for="scene in allScenes"
        :key="scene.id || scene.name"
        :class="{ active: isSelected(scene) }"
        type="button"
        @click="toggle(scene)"
      >
        {{ scene.name }}
      </button>
    </div>
    <div class="custom-tag">
      <input
        v-model="customName"
        placeholder="自定义场景..."
        @keyup.enter="addCustom"
      />
      <button type="button" @click="addCustom">添加</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({ modelValue: { type: Array, default: () => [] } });
const emit = defineEmits(['update:modelValue']);

const presetScenes = ref([]);
const customScenes = ref([]);
const customName = ref('');

const allScenes = computed(() => [...presetScenes.value, ...customScenes.value]);

function isSelected(scene) {
  return props.modelValue.some(s => s.name === scene.name || s === scene.name);
}

function toggle(scene) {
  const name = typeof scene === 'string' ? scene : scene.name;
  const current = [...props.modelValue];
  const idx = current.findIndex(s => (s.name || s) === name);
  if (idx >= 0) {
    current.splice(idx, 1);
  } else {
    current.push(typeof scene === 'string' ? scene : { id: scene.id, name: scene.name });
  }
  emit('update:modelValue', current);
}

function addCustom() {
  const name = customName.value.trim();
  if (name && !allScenes.value.find(s => s.name === name)) {
    customScenes.value.push({ name, isCustom: true });
    const current = [...props.modelValue];
    current.push({ name, isCustom: true });
    emit('update:modelValue', current);
  }
  customName.value = '';
}
</script>
```

- [ ] **Step 3: 创建 client/src/components/EmotionSelector.vue**

```vue
<template>
  <div class="emotion-selector">
    <label>情感标签</label>
    <div class="tag-grid">
      <div v-for="emotion in allEmotions" :key="emotion.id || emotion.name" class="emotion-row">
        <button
          :class="{ active: isSelected(emotion) }"
          type="button"
          @click="toggle(emotion)"
        >
          {{ emotion.name }}
        </button>
        <input
          v-if="isSelected(emotion)"
          type="range"
          min="1"
          max="5"
          :value="getIntensity(emotion)"
          @input="setIntensity(emotion, $event.target.value)"
        />
        <span v-if="isSelected(emotion)" class="intensity-label">{{ getIntensity(emotion) }}</span>
      </div>
    </div>
    <div class="custom-tag">
      <input
        v-model="customName"
        placeholder="自定义情感..."
        @keyup.enter="addCustom"
      />
      <button type="button" @click="addCustom">添加</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({ modelValue: { type: Array, default: () => [] } });
const emit = defineEmits(['update:modelValue']);

const customName = ref('');
const customEmotions = ref([]);

const allEmotions = computed(() => [...presetEmotions.value, ...customEmotions.value]);

function isSelected(emotion) {
  return props.modelValue.some(e => (e.name || e) === (emotion.name || emotion));
}

function getIntensity(emotion) {
  const found = props.modelValue.find(e => (e.name || e) === (emotion.name || emotion));
  return found?.intensity || 3;
}

function toggle(emotion) {
  const name = emotion.name || emotion;
  const current = [...props.modelValue];
  const idx = current.findIndex(e => (e.name || e) === name);
  if (idx >= 0) {
    current.splice(idx, 1);
  } else {
    current.push({ name, intensity: 3 });
  }
  emit('update:modelValue', current);
}

function setIntensity(emotion, value) {
  const name = emotion.name || emotion;
  const current = [...props.modelValue];
  const idx = current.findIndex(e => (e.name || e) === name);
  if (idx >= 0) {
    current[idx] = { ...current[idx], intensity: Number(value) };
    emit('update:modelValue', current);
  }
}

function addCustom() {
  const name = customName.value.trim();
  if (name && !allEmotions.value.find(e => e.name === name)) {
    customEmotions.value.push({ name, isCustom: true });
  }
  customName.value = '';
}
</script>
```

- [ ] **Step 4: 手动验证**

两个组件可在后续 T13 梦境录入页面中集成验证。

---

### Task T09: 创建梦境 API ✅ `ed77988`

**优先级:** P0 | **依赖:** T05（Auth 中间件）, T03 | **可并行:** 无

**目标:** 实现 POST /api/v1/dreams（需认证）。

**涉及文件:**
- 创建 `server/tests/dreams.test.js`
- 创建 `server/src/routes/dreams.js`
- 修改 `server/src/index.js`

---

- [ ] **Step 1: 写失败测试 — server/tests/dreams.test.js**

```js
const { describe, it, beforeAll, expect } = require('vitest');
const request = require('supertest');

let app, token;

beforeAll(async () => {
  process.env.DB_PATH = ':memory:';
  process.env.JWT_SECRET = 'test-secret';
  app = require('../src/index');

  await request(app).post('/api/v1/auth/register')
    .send({ username: 'u', email: 'u@t.com', password: '123456' });
  const loginRes = await request(app).post('/api/v1/auth/login')
    .send({ email: 'u@t.com', password: '123456' });
  token = loginRes.body.token;
});

describe('POST /api/v1/dreams', () => {
  it('should create a dream when authenticated', async () => {
    const res = await request(app)
      .post('/api/v1/dreams')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '坠落之梦',
        content: '我从高楼上坠落，一直掉不到底...',
        scene_ids: [1],
        emotion_tags: [{ name: '恐惧', intensity: 5 }],
        visibility: 'private',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.content).toBe('我从高楼上坠落，一直掉不到底...');
  });

  it('should reject unauthenticated request with 401', async () => {
    const res = await request(app)
      .post('/api/v1/dreams')
      .send({ title: 'x', content: 'y' });

    expect(res.status).toBe(401);
  });

  it('should reject empty content with 400', async () => {
    const res = await request(app)
      .post('/api/v1/dreams')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'x', content: '' });

    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: 运行测试确认红色**

```bash
cd server && npx vitest run tests/dreams.test.js
```
预期：3 个 FAIL。

- [ ] **Step 3: 创建 server/src/routes/dreams.js**

```js
const express = require('express');
const db = require('../db/connection');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.post('/', authRequired, (req, res) => {
  const { title, content, scene_ids, emotion_tags, visibility } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'content is required' });
  }

  const sceneIdsJson = JSON.stringify(scene_ids || []);
  const emotionTagsJson = JSON.stringify(emotion_tags || []);

  const result = db.prepare(`
    INSERT INTO dreams (user_id, title, content, scene_ids, emotion_tags, visibility)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.userId, title || '', content, sceneIdsJson, emotionTagsJson, visibility || 'private');

  const dream = db.prepare('SELECT * FROM dreams WHERE id = ?').get(result.lastInsertRowid);

  // 处理自定义标签：新增的不在预设中的标签入库
  if (scene_ids) {
    const insertScene = db.prepare('INSERT OR IGNORE INTO scene_tags (name, is_preset, created_by) VALUES (?, 0, ?)');
    for (const s of scene_ids) {
      if (typeof s === 'string') insertScene.run(s, req.userId);
    }
  }
  if (emotion_tags) {
    const insertEmotion = db.prepare('INSERT OR IGNORE INTO emotion_tags (name, is_preset, created_by) VALUES (?, 0, ?)');
    for (const e of emotion_tags) {
      if (![12].includes(e.id)) insertEmotion.run(e.name, req.userId); // 简单判断非预设
    }
  }

  res.status(201).json(dream);
});

module.exports = router;
```

- [ ] **Step 4: 注册路由 — server/src/index.js**

```js
const dreamsRoutes = require('./routes/dreams');
app.use('/api/v1/dreams', dreamsRoutes);
```

- [ ] **Step 5: 运行测试确认绿色**

```bash
cd server && npx vitest run tests/dreams.test.js
```
预期：3 个 PASS。

---

### Task T10: 获取梦境列表 API

**优先级:** P0 | **依赖:** T09 | **可并行:** 无

**目标:** 实现 GET /api/v1/dreams（公开梦境广场，分页 + 可选过滤）。

**涉及文件:**
- 修改 `server/tests/dreams.test.js`
- 修改 `server/src/routes/dreams.js`

---

- [ ] **Step 1: 追加测试到 server/tests/dreams.test.js**

```js
describe('GET /api/v1/dreams', () => {
  beforeAll(async () => {
    // 创建几笔公开梦境
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/v1/dreams')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: `public ${i}`, content: `content ${i}`, visibility: 'public' });
    }
  });

  it('should return public dreams with pagination', async () => {
    const res = await request(app).get('/api/v1/dreams?visibility=public&page=1&limit=2');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
  });

  it('should return empty for unauthenticated private request', async () => {
    const res = await request(app).get('/api/v1/dreams');
    expect(res.status).toBe(200);
    // 未登录只能看到公开
    expect(res.body.data.every(d => d.visibility === 'public')).toBe(true);
  });
});
```

- [ ] **Step 2: 运行确认红色**

```bash
cd server && npx vitest run tests/dreams.test.js
```
预期：新增测试 FAIL。

- [ ] **Step 3: 追加 GET / 路由到 server/src/routes/dreams.js**

```js
router.get('/', (req, res) => {
  const { visibility, page = 1, limit = 20, scene, emotion } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let where = 'WHERE 1=1';
  const params = [];

  if (visibility) {
    where += ' AND d.visibility = ?';
    params.push(visibility);
  } else if (!req.headers.authorization) {
    // 未登录只能看公开
    where += ' AND d.visibility = ?';
    params.push('public');
  }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM dreams d ${where}`).get(...params);
  const rows = db.prepare(`
    SELECT d.*, u.username
    FROM dreams d JOIN users u ON d.user_id = u.id
    ${where}
    ORDER BY d.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset);

  res.json({
    data: rows,
    total: countRow.total,
    page: Number(page),
  });
});
```

- [ ] **Step 4: 运行测试确认绿色**

```bash
cd server && npx vitest run tests/dreams.test.js
```
预期：全部 PASS。

---

### Task T11: 获取单个梦境 API

**优先级:** P0 | **依赖:** T09 | **可并行:** 与 T10

**目标:** 实现 GET /api/v1/dreams/:id（权限控制：私有梦仅所有者可见）。

**涉及文件:**
- 修改 `server/tests/dreams.test.js`
- 修改 `server/src/routes/dreams.js`

---

- [ ] **Step 1: 追加测试**

```js
describe('GET /api/v1/dreams/:id', () => {
  let privateDreamId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/dreams')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'private dream', content: 'secret', visibility: 'private' });
    privateDreamId = res.body.id;
  });

  it('should return dream for owner', async () => {
    const res = await request(app)
      .get(`/api/v1/dreams/${privateDreamId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.content).toBe('secret');
  });

  it('should return 404 for non-owner accessing private dream', async () => {
    // 注册另一个用户
    const regRes = await request(app).post('/api/v1/auth/register')
      .send({ username: 'other', email: 'other@t.com', password: '123456' });
    const otherToken = regRes.body.token;

    const res = await request(app)
      .get(`/api/v1/dreams/${privateDreamId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: 运行确认红色**

- [ ] **Step 3: 追加路由**

```js
router.get('/:id', (req, res) => {
  const dream = db.prepare(`
    SELECT d.*, u.username
    FROM dreams d JOIN users u ON d.user_id = u.id
    WHERE d.id = ?
  `).get(req.params.id);

  if (!dream) return res.status(404).json({ error: 'dream not found' });

  // 私有梦境仅所有者可见
  if (dream.visibility === 'private' && dream.user_id !== req.userId) {
    return res.status(404).json({ error: 'dream not found' });
  }

  res.json(dream);
});
```

- [ ] **Step 4: 运行测试确认绿色**

---

### Task T12: 更新 & 删除梦境 API

**优先级:** P1 | **依赖:** T09 | **可并行:** 与 T10, T11

**目标:** 实现 PUT 和 DELETE /api/v1/dreams/:id（仅所有者可操作）。

**涉及文件:**
- 修改 `server/tests/dreams.test.js`
- 修改 `server/src/routes/dreams.js`

---

- [ ] **Step 1: 追加测试**

```js
describe('PUT /api/v1/dreams/:id', () => {
  it('should update own dream', async () => {
    const createRes = await request(app).post('/api/v1/dreams')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'old', content: 'old content' });
    const id = createRes.body.id;

    const res = await request(app)
      .put(`/api/v1/dreams/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'new title' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('new title');
  });
});

describe('DELETE /api/v1/dreams/:id', () => {
  it('should delete own dream', async () => {
    const createRes = await request(app).post('/api/v1/dreams')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'to delete', content: 'x' });
    const id = createRes.body.id;

    const res = await request(app)
      .delete(`/api/v1/dreams/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const getRes = await request(app)
      .get(`/api/v1/dreams/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(404);
  });
});
```

- [ ] **Step 2: 运行确认红色 → 追加路由**

```js
router.put('/:id', authRequired, (req, res) => {
  const dream = db.prepare('SELECT * FROM dreams WHERE id = ?').get(req.params.id);
  if (!dream) return res.status(404).json({ error: 'dream not found' });
  if (dream.user_id !== req.userId) return res.status(403).json({ error: 'forbidden' });

  const { title, content, scene_ids, emotion_tags, visibility } = req.body;
  db.prepare(`
    UPDATE dreams SET title = ?, content = ?, scene_ids = ?, emotion_tags = ?, visibility = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title ?? dream.title,
    content ?? dream.content,
    scene_ids ? JSON.stringify(scene_ids) : dream.scene_ids,
    emotion_tags ? JSON.stringify(emotion_tags) : dream.emotion_tags,
    visibility ?? dream.visibility,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM dreams WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', authRequired, (req, res) => {
  const dream = db.prepare('SELECT * FROM dreams WHERE id = ?').get(req.params.id);
  if (!dream) return res.status(404).json({ error: 'dream not found' });
  if (dream.user_id !== req.userId) return res.status(403).json({ error: 'forbidden' });

  db.prepare('DELETE FROM continuations WHERE dream_id = ?').run(req.params.id);
  db.prepare('DELETE FROM favorites WHERE dream_id = ?').run(req.params.id);
  db.prepare('DELETE FROM dreams WHERE id = ?').run(req.params.id);

  res.json({ message: 'deleted' });
});
```

- [ ] **Step 3: 运行测试确认绿色**

---

### Task T13: 前端梦境录入页面

**优先级:** P0 | **依赖:** T09, T08 | **可并行:** 无

**目标:** 创建梦境录入页面，集成 SceneSelector 和 EmotionSelector。

**涉及文件:**
- 创建 `client/src/views/DreamNewView.vue`

---

- [ ] **Step 1: 创建 client/src/views/DreamNewView.vue**

```vue
<template>
  <div class="dream-form">
    <h1>记录梦境</h1>
    <form @submit.prevent="handleSubmit">
      <input v-model="title" placeholder="梦境标题（可选）" />

      <textarea
        v-model="content"
        placeholder="描述你的梦..."
        rows="8"
        required
      ></textarea>

      <SceneSelector v-model="sceneIds" />
      <EmotionSelector v-model="emotionTags" />

      <div class="visibility-toggle">
        <label>
          <input type="radio" v-model="visibility" value="private" /> 私有（AI 续写）
        </label>
        <label>
          <input type="radio" v-model="visibility" value="public" /> 公开（他人可接力）
        </label>
      </div>

      <button type="submit" :disabled="loading">保存梦境</button>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '../api/client';
import { useTagsStore } from '../stores/tags';
import SceneSelector from '../components/SceneSelector.vue';
import EmotionSelector from '../components/EmotionSelector.vue';

const tagsStore = useTagsStore();
const router = useRouter();

const title = ref('');
const content = ref('');
const sceneIds = ref([]);
const emotionTags = ref([]);
const visibility = ref('private');
const loading = ref(false);
const error = ref('');

onMounted(() => tagsStore.fetchTags());

async function handleSubmit() {
  if (!content.value.trim()) return;
  error.value = '';
  loading.value = true;
  try {
    const res = await apiClient.post('/dreams', {
      title: title.value,
      content: content.value,
      scene_ids: sceneIds.value.map(s => s.id || s.name),
      emotion_tags: emotionTags.value,
      visibility: visibility.value,
    });
    router.push(`/dreams/${res.data.id}`);
  } catch (e) {
    error.value = e.response?.data?.error || '保存失败';
  } finally {
    loading.value = false;
  }
}
</script>
```

- [ ] **Step 2: 手动验证**

启动前后端 → 登录 → 访问 /dreams/new → 录入一个梦境 → 保存后跳转详情页。

---

### Task T14: 前端梦境详情页

**优先级:** P0 | **依赖:** T11 | **可并行:** 无

**目标:** 梦境详情页 — 展示梦境内容、标签、续写故事、操作按钮。

**涉及文件:**
- 创建 `client/src/views/DreamDetailView.vue`

---

- [ ] **Step 1: 创建 client/src/views/DreamDetailView.vue**

```vue
<template>
  <div class="dream-detail" v-if="dream">
    <h1>{{ dream.title || '无标题梦境' }}</h1>
    <div class="meta">
      <span>@{{ dream.username }}</span>
      <span>{{ dream.created_at }}</span>
      <span class="badge">{{ dream.visibility === 'public' ? '公开' : '私有' }}</span>
    </div>

    <div class="tags" v-if="parsedSceneIds.length || parsedEmotions.length">
      <span v-for="s in parsedSceneIds" :key="s" class="tag scene">{{ s }}</span>
      <span v-for="e in parsedEmotions" :key="e.name" class="tag emotion">{{ e.name }} {{ '●'.repeat(e.intensity) }}</span>
    </div>

    <section class="content">
      <h2>梦境内容</h2>
      <p>{{ dream.content }}</p>
    </section>

    <section v-if="dream.ai_story" class="ai-story">
      <h2>🤖 AI 续写故事</h2>
      <p>{{ dream.ai_story }}</p>
    </section>

    <div class="actions">
      <button v-if="isOwner && !dream.ai_story" @click="generateAI">🤖 AI 续写</button>
      <button v-if="dream.visibility === 'public'" @click="$router.push(`/dreams/${dream.id}/continue`)">✏️ 接力续写</button>
      <button @click="toggleFavorite">
        {{ isFavorited ? '❤️ 已收藏' : '🤍 收藏' }}
      </button>
      <button @click="$router.push(`/share/${dream.id}`)">📤 分享卡片</button>
    </div>

    <section v-if="dream.visibility === 'public'" class="continuations">
      <h2>续写接力</h2>
      <ContinuationList :dream-id="dream.id" />
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '../api/client';
import { useAuthStore } from '../stores/auth';
import ContinuationList from '../components/ContinuationList.vue';

const route = useRoute();
const auth = useAuthStore();
const dream = ref(null);
const isFavorited = ref(false);

const isOwner = computed(() => dream.value?.user_id === auth.user?.id);
const parsedSceneIds = computed(() => {
  try { return JSON.parse(dream.value?.scene_ids || '[]'); } catch { return []; }
});
const parsedEmotions = computed(() => {
  try { return JSON.parse(dream.value?.emotion_tags || '[]'); } catch { return []; }
});

onMounted(async () => {
  const res = await apiClient.get(`/dreams/${route.params.id}`);
  dream.value = res.data;
  checkFavorite();
});

async function checkFavorite() {
  try {
    const res = await apiClient.get('/favorites');
    isFavorited.value = res.data.some(f => f.dream_id === dream.value.id);
  } catch { /* ignore */ }
}

async function toggleFavorite() {
  try {
    if (isFavorited.value) {
      await apiClient.delete(`/favorites/${dream.value.id}`);
    } else {
      await apiClient.post('/favorites', { dream_id: dream.value.id });
    }
    isFavorited.value = !isFavorited.value;
  } catch { /* ignore */ }
}

async function generateAI() {
  const res = await apiClient.post(`/dreams/${dream.value.id}/generate`);
  dream.value.ai_story = res.data.ai_story;
}
</script>
```

- [ ] **Step 2: 手动验证**

---

### Task T15: 前端梦境广场首页

**优先级:** P1 | **依赖:** T10 | **可并行:** 与 T14

**目标:** 首页展示公开梦境列表，支持分页，点击跳转详情。

**涉及文件:**
- 创建 `client/src/views/HomeView.vue`
- 创建 `client/src/components/DreamCard.vue`

---

- [ ] **Step 1: 创建 client/src/components/DreamCard.vue**

```vue
<template>
  <div class="dream-card" @click="$router.push(`/dreams/${dream.id}`)">
    <h3>{{ dream.title || '无标题' }}</h3>
    <p class="preview">{{ preview }}</p>
    <div class="meta">
      <span>@{{ dream.username }}</span>
      <span>{{ dream.created_at?.slice(0, 10) }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({ dream: Object });

const preview = computed(() => {
  const text = props.dream.content || '';
  return text.length > 100 ? text.slice(0, 100) + '...' : text;
});
</script>
```

- [ ] **Step 2: 创建 client/src/views/HomeView.vue**

```vue
<template>
  <div class="home">
    <h1>梦境广场</h1>
    <div class="dream-grid">
      <DreamCard v-for="d in dreams" :key="d.id" :dream="d" />
    </div>
    <div class="pagination" v-if="totalPages > 1">
      <button :disabled="page <= 1" @click="page--">上一页</button>
      <span>{{ page }} / {{ totalPages }}</span>
      <button :disabled="page >= totalPages" @click="page++">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '../api/client';
import DreamCard from '../components/DreamCard.vue';

const dreams = ref([]);
const page = ref(1);
const totalPages = ref(1);

async function fetchDreams() {
  const res = await apiClient.get('/dreams', { params: { visibility: 'public', page: page.value, limit: 12 } });
  dreams.value = res.data.data;
  totalPages.value = Math.ceil(res.data.total / 12);
}

onMounted(fetchDreams);
</script>
```

- [ ] **Step 3: 手动验证**

---

### Task T16: LLM 服务模块 ✅ `052f128`

**优先级:** P0 | **依赖:** T01 | **可并行:** 无

**目标:** 封装 OpenAI 兼容 LLM 调用。

**涉及文件:**
- 创建 `server/src/services/llm.js`

---

- [ ] **Step 1: 创建 server/src/services/llm.js**

```js
const OpenAI = require('openai');
const config = require('../config');

const client = new OpenAI({
  apiKey: config.llm.apiKey,
  baseURL: config.llm.baseURL,
});

async function generateCompletion(systemPrompt, userPrompt, { maxTokens = 2000, timeout = 30000 } = {}) {
  const response = await client.chat.completions.create({
    model: config.llm.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: maxTokens,
    temperature: 0.8,
  }, { timeout });

  return response.choices[0].message.content;
}

/**
 * 将梦境续写成完整故事
 */
async function continueDream(dreamContent, sceneTags, emotionTags) {
  const systemPrompt = `你是一位擅长梦境叙事和超现实主义文学的作家。请根据用户的梦境记录，将其续写成一个有开头、发展、高潮和结尾的完整故事。保持梦境的氛围和情感基调。使用中文写作。`;
  const userPrompt = `梦境内容：${dreamContent}\n场景：${sceneTags.join('、')}\n情感基调：${JSON.stringify(emotionTags)}\n\n请续写这个梦境，使其成为一个完整的故事：`;
  return generateCompletion(systemPrompt, userPrompt);
}

/**
 * 将多个梦境碎片编织成连贯故事
 */
async function weaveFragments(fragments) {
  const systemPrompt = `你是一位擅长梦境叙事和超现实主义文学的作家。请将以下多个零散的梦境碎片编织成一个连贯的完整故事。在碎片之间建立逻辑联系，让整体流畅自然。使用中文写作。`;
  const fragmentsText = fragments.map((f, i) => `碎片${i + 1}：${f}`).join('\n');
  const userPrompt = `${fragmentsText}\n\n请将这些碎片编织成一个完整故事：`;
  return generateCompletion(systemPrompt, userPrompt, { maxTokens: 3000 });
}

module.exports = { continueDream, weaveFragments };
```

---

### Task T17: AI 续写 API

**优先级:** P0 | **依赖:** T16, T09 | **可并行:** 无

**目标:** 实现 POST /api/v1/dreams/:id/generate。

**涉及文件:**
- 修改 `server/src/routes/dreams.js`
- 修改 `server/tests/dreams.test.js`（Mock LLM 测试）

---

- [ ] **Step 1: 安装 vitest mock**

已在 T01 安装 vitest，使用 `vi.mock` 即可。

- [ ] **Step 2: 追加测试（Mock LLM）**

```js
const { vi } = require('vitest');

describe('POST /api/v1/dreams/:id/generate', () => {
  it('should generate AI story for own dream', async () => {
    vi.mock('../src/services/llm', () => ({
      continueDream: vi.fn().mockResolvedValue('AI 续写的故事内容...'),
    }));

    const createRes = await request(app).post('/api/v1/dreams')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'test', content: 'a dream', visibility: 'private' });
    const id = createRes.body.id;

    const res = await request(app)
      .post(`/api/v1/dreams/${id}/generate`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ai_story).toBe('AI 续写的故事内容...');
  });
});
```

- [ ] **Step 3: 追加路由**

```js
router.post('/:id/generate', authRequired, async (req, res) => {
  const dream = db.prepare('SELECT * FROM dreams WHERE id = ?').get(req.params.id);
  if (!dream) return res.status(404).json({ error: 'dream not found' });
  if (dream.user_id !== req.userId) return res.status(403).json({ error: 'forbidden' });

  try {
    const { continueDream } = require('../services/llm');
    const sceneIds = JSON.parse(dream.scene_ids || '[]');
    const emotions = JSON.parse(dream.emotion_tags || '[]');
    const ai_story = await continueDream(dream.content, sceneIds, emotions);

    db.prepare('UPDATE dreams SET ai_story = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(ai_story, 'completed', req.params.id);

    res.json({ ai_story });
  } catch (err) {
    console.error('LLM error:', err.message);
    res.status(500).json({ error: 'AI generation failed' });
  }
});
```

- [ ] **Step 4: 运行测试确认绿色**

---

### Task T18: 前端续写触发 & 展示

**优先级:** P1 | **依赖:** T17, T14 | **可并行:** 无

**目标:** 在梦境详情页上实现 AI 续写按钮和结果展示（已在 T14 中预埋，此处确认和补充）。

**涉及文件:**
- 修改 `client/src/views/DreamDetailView.vue`（确认 generateAI 函数和展示逻辑）

已在 T14 中完整实现，此处为验证步骤。

- [ ] **Step 1: 手动验证**

1. 登录 → 录入私有梦境
2. 进入详情页 → 点击「🤖 AI 续写」
3. 预期：等待数秒后显示续写故事

---

### Task T19: 接力续写 API（创建） ✅ `3e61681`

**优先级:** P1 | **依赖:** T05, T03 | **可并行:** 与 T22

**目标:** 实现 POST /api/v1/dreams/:id/continuations。

**涉及文件:**
- 创建 `server/tests/continuations.test.js`
- 创建 `server/src/routes/continuations.js`
- 修改 `server/src/index.js`

---

- [ ] **Step 1: 写失败测试 — server/tests/continuations.test.js**

```js
const { describe, it, beforeAll, expect } = require('vitest');
const request = require('supertest');

let app, token, otherToken, publicDreamId;

beforeAll(async () => {
  process.env.DB_PATH = ':memory:';
  process.env.JWT_SECRET = 'test-secret';
  app = require('../src/index');

  await request(app).post('/api/v1/auth/register')
    .send({ username: 'a', email: 'a@t.com', password: '123456' });
  const r1 = await request(app).post('/api/v1/auth/login')
    .send({ email: 'a@t.com', password: '123456' });
  token = r1.body.token;

  await request(app).post('/api/v1/auth/register')
    .send({ username: 'b', email: 'b@t.com', password: '123456' });
  const r2 = await request(app).post('/api/v1/auth/login')
    .send({ email: 'b@t.com', password: '123456' });
  otherToken = r2.body.token;

  const d = await request(app).post('/api/v1/dreams')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'public dream', content: 'a dream', visibility: 'public' });
  publicDreamId = d.body.id;
});

describe('POST /api/v1/dreams/:id/continuations', () => {
  it('should create a continuation by another user', async () => {
    const res = await request(app)
      .post(`/api/v1/dreams/${publicDreamId}/continuations`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ content: '续写内容...' });

    expect(res.status).toBe(201);
    expect(res.body.content).toBe('续写内容...');
  });

  it('should reject continuation on private dream', async () => {
    const d = await request(app).post('/api/v1/dreams')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'private', content: 'x', visibility: 'private' });

    const res = await request(app)
      .post(`/api/v1/dreams/${d.body.id}/continuations`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ content: 'try' });

    expect(res.status).toBe(403);
  });

  it('should build linear chain via parent_id', async () => {
    const first = await request(app)
      .post(`/api/v1/dreams/${publicDreamId}/continuations`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ content: '第一棒' });

    const second = await request(app)
      .post(`/api/v1/dreams/${publicDreamId}/continuations`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '第二棒', parent_id: first.body.id });

    expect(second.status).toBe(201);
    expect(second.body.parent_id).toBe(first.body.id);
  });
});
```

- [ ] **Step 2: 运行测试确认红色**

- [ ] **Step 3: 创建 server/src/routes/continuations.js**

```js
const express = require('express');
const db = require('../db/connection');
const { authRequired } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.post('/', authRequired, (req, res) => {
  const dreamId = Number(req.params.id);
  const dream = db.prepare('SELECT * FROM dreams WHERE id = ?').get(dreamId);

  if (!dream) return res.status(404).json({ error: 'dream not found' });
  if (dream.visibility !== 'public') return res.status(403).json({ error: 'dream is not public' });

  const { content, parent_id, is_independent } = req.body;
  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'content is required' });
  }

  const result = db.prepare(`
    INSERT INTO continuations (dream_id, user_id, parent_id, content, is_independent)
    VALUES (?, ?, ?, ?, ?)
  `).run(dreamId, req.userId, parent_id || null, content, is_independent ? 1 : 0);

  const continuation = db.prepare('SELECT * FROM continuations WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(continuation);
});

module.exports = router;
```

- [ ] **Step 4: 注册路由到 server/src/index.js**

```js
const continuationsRoutes = require('./routes/continuations');
app.use('/api/v1/dreams/:id/continuations', continuationsRoutes);
```

- [ ] **Step 5: 运行测试确认绿色**

---

### Task T20: 接力续写 API（获取列表）

**优先级:** P1 | **依赖:** T19 | **可并行:** 无

**目标:** 实现 GET /api/v1/dreams/:id/continuations。

**涉及文件:**
- 修改 `server/tests/continuations.test.js`
- 修改 `server/src/routes/continuations.js`

---

- [ ] **Step 1: 追加测试**

```js
describe('GET /api/v1/dreams/:id/continuations', () => {
  it('should return continuations for a dream', async () => {
    const res = await request(app)
      .get(`/api/v1/dreams/${publicDreamId}/continuations`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
```

- [ ] **Step 2: 追加路由**

```js
router.get('/', (req, res) => {
  const dreamId = Number(req.params.id);

  const continuations = db.prepare(`
    SELECT c.*, u.username
    FROM continuations c JOIN users u ON c.user_id = u.id
    WHERE c.dream_id = ?
    ORDER BY c.created_at ASC
  `).all(dreamId);

  res.json(continuations);
});
```

- [ ] **Step 3: 运行测试确认绿色**

---

### Task T21: 前端接力续写页面 + 续写列表组件

**优先级:** P1 | **依赖:** T19, T20, T14 | **可并行:** 无

**目标:** 创建接力续写页面和续写列表组件。

**涉及文件:**
- 创建 `client/src/views/DreamContinueView.vue`
- 创建 `client/src/components/ContinuationList.vue`

---

- [ ] **Step 1: 创建 client/src/components/ContinuationList.vue**

```vue
<template>
  <div class="continuation-list">
    <div v-for="c in continuations" :key="c.id" class="continuation-item">
      <div class="header">
        <span>@{{ c.username }}</span>
        <span v-if="c.is_independent" class="badge">独立续写</span>
        <span v-else-if="c.parent_id" class="badge">接力 #{{ c.parent_id }}</span>
      </div>
      <p>{{ c.content }}</p>
    </div>
    <p v-if="!continuations.length">暂无续写，来做第一个吧</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '../api/client';

const props = defineProps({ dreamId: [Number, String] });
const continuations = ref([]);

onMounted(async () => {
  const res = await apiClient.get(`/dreams/${props.dreamId}/continuations`);
  continuations.value = res.data;
});
</script>
```

- [ ] **Step 2: 创建 client/src/views/DreamContinueView.vue**

```vue
<template>
  <div class="continue-page">
    <h1>接力续写</h1>
    <p>续写 @{{ dream?.username }} 的梦境「{{ dream?.title || '无标题' }}」</p>

    <div class="modes">
      <label><input type="radio" v-model="mode" value="linear" /> 线性接力</label>
      <label><input type="radio" v-model="mode" value="independent" /> 独立续写</label>
    </div>

    <div v-if="mode === 'linear' && lastContinuation">
      <p>上一位续写：{{ lastContinuation.content?.slice(0, 100) }}...</p>
    </div>

    <textarea v-model="content" placeholder="写下你的续写..." rows="8" required></textarea>

    <button @click="submit" :disabled="loading">提交续写</button>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '../api/client';

const route = useRoute();
const router = useRouter();
const dream = ref(null);
const content = ref('');
const mode = ref('linear');
const lastContinuation = ref(null);
const loading = ref(false);
const error = ref('');

onMounted(async () => {
  const [dreamRes, contRes] = await Promise.all([
    apiClient.get(`/dreams/${route.params.id}`),
    apiClient.get(`/dreams/${route.params.id}/continuations`),
  ]);
  dream.value = dreamRes.data;
  const conts = contRes.data;
  if (conts.length > 0) {
    const linearConts = conts.filter(c => !c.is_independent);
    lastContinuation.value = linearConts[linearConts.length - 1] || null;
  }
});

async function submit() {
  if (!content.value.trim()) return;
  error.value = '';
  loading.value = true;
  try {
    await apiClient.post(`/dreams/${route.params.id}/continuations`, {
      content: content.value,
      parent_id: mode.value === 'linear' ? lastContinuation.value?.id : null,
      is_independent: mode.value === 'independent',
    });
    router.push(`/dreams/${route.params.id}`);
  } catch (e) {
    error.value = e.response?.data?.error || '提交失败';
  } finally {
    loading.value = false;
  }
}
</script>
```

---

### Task T22: 碎片串联 API

**优先级:** P1 | **依赖:** T01, T03, T16 | **可并行:** 与 T19

**目标:** 实现 POST /api/v1/fragments/weave 和 GET /api/v1/fragments/sessions。

**涉及文件:**
- 创建 `server/tests/fragments.test.js`
- 创建 `server/src/routes/fragments.js`
- 修改 `server/src/index.js`

---

- [ ] **Step 1: 写失败测试 — server/tests/fragments.test.js**

```js
const { describe, it, beforeAll, expect, vi } = require('vitest');
const request = require('supertest');

let app, token;

beforeAll(async () => {
  process.env.DB_PATH = ':memory:';
  process.env.JWT_SECRET = 'test-secret';
  app = require('../src/index');

  vi.mock('../src/services/llm', () => ({
    weaveFragments: vi.fn().mockResolvedValue('编织后的完整故事。'),
  }));

  await request(app).post('/api/v1/auth/register')
    .send({ username: 'u', email: 'u@t.com', password: '123456' });
  const r = await request(app).post('/api/v1/auth/login')
    .send({ email: 'u@t.com', password: '123456' });
  token = r.body.token;
});

describe('POST /api/v1/fragments/weave', () => {
  it('should weave fragments into a story', async () => {
    const res = await request(app)
      .post('/api/v1/fragments/weave')
      .set('Authorization', `Bearer ${token}`)
      .send({ fragments: [{ content: '碎片1' }, { content: '碎片2' }] });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('story');
  });

  it('should reject fewer than 2 fragments', async () => {
    const res = await request(app)
      .post('/api/v1/fragments/weave')
      .set('Authorization', `Bearer ${token}`)
      .send({ fragments: [{ content: '只有一个' }] });

    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: 运行测试确认红色**

- [ ] **Step 3: 创建 server/src/routes/fragments.js**

```js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { authRequired } = require('../middleware/auth');
const { weaveFragments } = require('../services/llm');

const router = express.Router();

router.post('/weave', authRequired, async (req, res) => {
  const { fragments } = req.body;

  if (!fragments || fragments.length < 2) {
    return res.status(400).json({ error: 'at least 2 fragments required' });
  }
  if (fragments.length > 10) {
    return res.status(400).json({ error: 'max 10 fragments allowed' });
  }

  const sessionId = uuidv4();
  const insert = db.prepare(
    'INSERT INTO fragments (user_id, content, sort_order, session_id) VALUES (?, ?, ?, ?)'
  );

  for (let i = 0; i < fragments.length; i++) {
    insert.run(req.userId, fragments[i].content, fragments[i].sort_order ?? i, sessionId);
  }

  try {
    const contents = fragments.map((f, i) => f.content);
    const story = await weaveFragments(contents);
    res.json({ story, session_id: sessionId });
  } catch (err) {
    res.status(500).json({ error: 'AI weaving failed' });
  }
});

router.get('/sessions', authRequired, (req, res) => {
  const sessions = db.prepare(`
    SELECT session_id, COUNT(*) as fragment_count, MIN(created_at) as created_at
    FROM fragments WHERE user_id = ?
    GROUP BY session_id ORDER BY created_at DESC
  `).all(req.userId);

  res.json(sessions);
});

module.exports = router;
```

- [ ] **Step 4: 安装 uuid 并注册路由**

```bash
cd server && npm install uuid
```

```js
// server/src/index.js
const fragmentsRoutes = require('./routes/fragments');
app.use('/api/v1/fragments', fragmentsRoutes);
```

- [ ] **Step 5: 运行测试确认绿色**

---

### Task T23: 碎片详情 API

**优先级:** P2 | **依赖:** T22 | **可并行:** 无

**目标:** 实现获取某次串联的碎片和结果。

**涉及文件:**
- 修改 `server/src/routes/fragments.js`

- [ ] **Step 1: 追加路由**

```js
router.get('/sessions/:sessionId', authRequired, (req, res) => {
  const fragments = db.prepare(`
    SELECT * FROM fragments WHERE session_id = ? AND user_id = ? ORDER BY sort_order
  `).all(req.params.sessionId, req.userId);

  res.json(fragments);
});
```

---

### Task T24: 前端碎片串联页面

**优先级:** P1 | **依赖:** T22 | **可并行:** 无

**目标:** 碎片串联工作台页面。

**涉及文件:**
- 创建 `client/src/views/FragmentWeaveView.vue`
- 创建 `client/src/views/FragmentDetailView.vue`
- 创建 `client/src/components/FragmentEditor.vue`

---

- [ ] **Step 1: 创建 client/src/components/FragmentEditor.vue**

```vue
<template>
  <div class="fragment-editor">
    <div v-for="(f, i) in fragments" :key="i" class="fragment-item">
      <span class="index">{{ i + 1 }}</span>
      <textarea v-model="fragments[i].content" :placeholder="`梦境碎片 ${i + 1}`" rows="3"></textarea>
      <button type="button" @click="remove(i)">✕</button>
    </div>
    <button type="button" @click="add">+ 添加碎片</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({ modelValue: { type: Array, default: () => [] } });
const emit = defineEmits(['update:modelValue']);

const fragments = ref(props.modelValue.length ? [...props.modelValue] : [{ content: '' }, { content: '' }]);

function add() {
  fragments.value.push({ content: '' });
  emitUpdate();
}

function remove(i) {
  fragments.value.splice(i, 1);
  emitUpdate();
}

function emitUpdate() {
  emit('update:modelValue', fragments.value);
}
</script>
```

- [ ] **Step 2: 创建 client/src/views/FragmentWeaveView.vue**

```vue
<template>
  <div class="fragment-weave">
    <h1>碎片串联</h1>
    <p>上传多个零散的梦境碎片，AI 将它们编织成完整故事。</p>

    <FragmentEditor v-model="fragments" />

    <button @click="weave" :disabled="loading || fragments.length < 2">🤖 开始编织</button>

    <div v-if="story" class="result">
      <h2>编织结果</h2>
      <p>{{ story }}</p>
    </div>
    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="sessions.length" class="history">
      <h2>历史记录</h2>
      <div v-for="s in sessions" :key="s.session_id" @click="$router.push(`/fragments/${s.session_id}`)">
        <span>{{ s.created_at?.slice(0, 10) }}</span>
        <span>{{ s.fragment_count }} 个碎片</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '../api/client';
import FragmentEditor from '../components/FragmentEditor.vue';

const fragments = ref([{ content: '' }, { content: '' }]);
const story = ref('');
const error = ref('');
const loading = ref(false);
const sessions = ref([]);

onMounted(async () => {
  try {
    const res = await apiClient.get('/fragments/sessions');
    sessions.value = res.data;
  } catch { /* ignore */ }
});

async function weave() {
  error.value = '';
  loading.value = true;
  try {
    const res = await apiClient.post('/fragments/weave', { fragments: fragments.value });
    story.value = res.data.story;
  } catch (e) {
    error.value = e.response?.data?.error || '编织失败';
  } finally {
    loading.value = false;
  }
}
</script>
```

- [ ] **Step 3: 创建 client/src/views/FragmentDetailView.vue**（历史详情，基础版）

```vue
<template>
  <div>
    <h1>历史碎片</h1>
    <div v-for="f in fragments" :key="f.id">
      <p>{{ f.content }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '../api/client';

const route = useRoute();
const fragments = ref([]);

onMounted(async () => {
  const res = await apiClient.get(`/fragments/sessions/${route.params.id}`);
  fragments.value = res.data;
});
</script>
```

---

### Task T10: 获取梦境列表 API ✅ `a215e45`
### Task T11: 获取单个梦境 API ✅ `a215e45`
### Task T12: 更新 & 删除梦境 API ✅ `90e1d3d`
### Task T13: 前端梦境录入页面 ✅ `e9a46dd`
### Task T14: 前端梦境详情页 ✅ `4b4846a`
### Task T15: 前端梦境广场首页 ✅ `41684f0`
### Task T16: LLM 服务模块 ✅ `052f128`
### Task T17: AI 续写 API ✅ `b75b7a0`
### Task T18: 前端续写触发 & 展示 ✅ `4b4846a`
### Task T19: 接力续写 API ✅ `f0e33f4`
### Task T20: 获取续写列表 API ✅ `f0e33f4`
### Task T21: 前端接力续写页面 ✅ `9be8de1`
### Task T22: 碎片串联 API ✅ `f0e33f4`
### Task T23: 碎片详情 API ✅ `9be8de1`
### Task T24: 前端碎片串联页面 ✅ `9be8de1`
### Task T25: 收藏 API ✅ `f0e33f4`
### Task T26: 前端收藏页面 ✅ `f39c1ca`
### Task T27: 分享卡片页面 ✅ `f39c1ca`
### Task T28: 导航栏 + 我的梦境页面 ✅ `f39c1ca`
### Task T29: Docker 配置 ✅ `ec6133d`
### Task T30: CI 配置 ✅ `ec6133d`

**优先级:** P2 | **依赖:** T05, T03 | **可并行:** 无

**目标:** 实现收藏/取消收藏/收藏列表 API。

**涉及文件:**
- 创建 `server/tests/favorites.test.js`
- 创建 `server/src/routes/favorites.js`
- 修改 `server/src/index.js`

---

- [ ] **Step 1: 写失败测试**

省略详细代码（模式同前），覆盖：POST /favorites（收藏），DELETE /favorites/:dream_id（取消），GET /favorites（列表），重复收藏 → 409。

- [ ] **Step 2: 创建 server/src/routes/favorites.js**

```js
const express = require('express');
const db = require('../db/connection');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/', authRequired, (req, res) => {
  const favs = db.prepare(`
    SELECT f.*, d.title, d.content, d.ai_story, u.username
    FROM favorites f
    JOIN dreams d ON f.dream_id = d.id
    JOIN users u ON d.user_id = u.id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `).all(req.userId);
  res.json(favs);
});

router.post('/', authRequired, (req, res) => {
  const { dream_id } = req.body;
  const dream = db.prepare('SELECT * FROM dreams WHERE id = ?').get(dream_id);
  if (!dream) return res.status(404).json({ error: 'dream not found' });

  const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND dream_id = ?')
    .get(req.userId, dream_id);
  if (existing) return res.status(409).json({ error: 'already favorited' });

  const result = db.prepare('INSERT INTO favorites (user_id, dream_id) VALUES (?, ?)')
    .run(req.userId, dream_id);
  res.status(201).json({ id: result.lastInsertRowid });
});

router.delete('/:dreamId', authRequired, (req, res) => {
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND dream_id = ?')
    .run(req.userId, req.params.dreamId);
  res.json({ message: 'unfavorited' });
});

module.exports = router;
```

- [ ] **Step 3: 运行测试确认绿色**

---

### Task T26: 前端收藏页面

**优先级:** P2 | **依赖:** T25 | **可并行:** 无

**目标:** 创建收藏列表页面。

**涉及文件:**
- 创建 `client/src/views/FavoritesView.vue`
- 创建 `client/src/stores/favorites.js`

---

- [ ] **Step 1: 创建 client/src/stores/favorites.js**

```js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiClient from '../api/client';

export const useFavoritesStore = defineStore('favorites', () => {
  const items = ref([]);

  async function fetchFavorites() {
    const res = await apiClient.get('/favorites');
    items.value = res.data;
  }

  async function toggle(dreamId) {
    const idx = items.value.findIndex(f => f.dream_id === dreamId);
    if (idx >= 0) {
      await apiClient.delete(`/favorites/${dreamId}`);
      items.value.splice(idx, 1);
    } else {
      await apiClient.post('/favorites', { dream_id: dreamId });
      await fetchFavorites();
    }
  }

  return { items, fetchFavorites, toggle };
});
```

- [ ] **Step 2: 创建 client/src/views/FavoritesView.vue**

```vue
<template>
  <div class="favorites">
    <h1>我的收藏</h1>
    <DreamCard v-for="f in favStore.items" :key="f.id" :dream="f" />
    <p v-if="!favStore.items.length">还没有收藏任何梦境</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useFavoritesStore } from '../stores/favorites';
import DreamCard from '../components/DreamCard.vue';

const favStore = useFavoritesStore();
onMounted(() => favStore.fetchFavorites());
</script>
```

---

### Task T27: 分享卡片页面

**优先级:** P2 | **依赖:** T14 | **可并行:** 无

**目标:** 分享卡片独立页面 + html2canvas 导出 PNG。

**涉及文件:**
- 创建 `client/src/views/ShareCardView.vue`
- 创建 `client/src/components/ShareCard.vue`

---

- [ ] **Step 1: 创建 client/src/components/ShareCard.vue**

```vue
<template>
  <div ref="cardRef" class="share-card">
    <h2>{{ dream.title || '无标题梦境' }}</h2>
    <div class="tags">
      <span v-for="s in scenes" :key="s" class="tag">{{ s }}</span>
    </div>
    <p class="excerpt">{{ excerpt }}</p>
    <div class="footer">
      <span>@{{ dream.username }}</span>
      <span>DreamWeave</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({ dream: Object });
const emit = defineEmits(['cardRef']);

const scenes = computed(() => {
  try { return JSON.parse(props.dream?.scene_ids || '[]'); } catch { return []; }
});

const excerpt = computed(() => {
  const text = props.dream?.ai_story || props.dream?.content || '';
  return text.length > 200 ? text.slice(0, 200) + '...' : text;
});
</script>

<style scoped>
.share-card {
  width: 400px;
  padding: 32px;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  color: #eee;
  border-radius: 16px;
  font-family: 'Georgia', serif;
}
.share-card h2 { font-size: 24px; margin-bottom: 12px; color: #e94560; }
.share-card .excerpt { font-size: 16px; line-height: 1.8; }
.share-card .footer { margin-top: 20px; display: flex; justify-content: space-between; font-size: 14px; color: #aaa; }
</style>
```

- [ ] **Step 2: 创建 client/src/views/ShareCardView.vue**

```vue
<template>
  <div class="share-page" v-if="dream">
    <ShareCard :dream="dream" ref="cardComp" />
    <button @click="exportPNG">📥 导出 PNG</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import html2canvas from 'html2canvas';
import apiClient from '../api/client';
import ShareCard from '../components/ShareCard.vue';

const route = useRoute();
const dream = ref(null);
const cardComp = ref(null);

onMounted(async () => {
  const res = await apiClient.get(`/dreams/${route.params.id}`);
  dream.value = res.data;
});

async function exportPNG() {
  const el = cardComp.value?.$el || document.querySelector('.share-card');
  const canvas = await html2canvas(el, { backgroundColor: null });
  const link = document.createElement('a');
  link.download = `dream-${dream.value.id}.png`;
  link.href = canvas.toDataURL();
  link.click();
}
</script>
```

---

### Task T28: 导航栏 + 「我的梦境」页面

**优先级:** P1 | **依赖:** T06, T15 | **可并行:** 无

**目标:** 全局导航栏 + 我的梦境列表页面。

**涉及文件:**
- 创建 `client/src/components/AppNavbar.vue`
- 修改 `client/src/App.vue`
- 创建 `client/src/views/MineView.vue`

---

- [ ] **Step 1: 创建 client/src/components/AppNavbar.vue**

```vue
<template>
  <nav>
    <router-link to="/">🏠 广场</router-link>
    <router-link to="/dreams/new">✏️ 记录</router-link>
    <router-link to="/fragments/weave">🧩 串联</router-link>
    <router-link v-if="auth.isLoggedIn" to="/mine">📖 我的</router-link>
    <router-link v-if="auth.isLoggedIn" to="/favorites">❤️ 收藏</router-link>
    <template v-if="auth.isLoggedIn">
      <span>{{ auth.user?.username }}</span>
      <button @click="logout">退出</button>
    </template>
    <router-link v-else to="/login">登录</router-link>
  </nav>
</template>

<script setup>
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();

function logout() {
  auth.logout();
  router.push('/');
}
</script>
```

- [ ] **Step 2: 修改 client/src/App.vue**

```vue
<template>
  <div id="app">
    <AppNavbar />
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup>
import AppNavbar from './components/AppNavbar.vue';
</script>
```

- [ ] **Step 3: 创建 client/src/views/MineView.vue**

```vue
<template>
  <div class="mine">
    <h1>我的梦境</h1>
    <div class="tabs">
      <button :class="{ active: tab === 'all' }" @click="tab = 'all'">全部</button>
      <button :class="{ active: tab === 'private' }" @click="tab = 'private'">私有</button>
      <button :class="{ active: tab === 'public' }" @click="tab = 'public'">公开</button>
    </div>
    <DreamCard v-for="d in filteredDreams" :key="d.id" :dream="d" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import apiClient from '../api/client';
import DreamCard from '../components/DreamCard.vue';

const dreams = ref([]);
const tab = ref('all');

onMounted(async () => {
  const res = await apiClient.get('/dreams', { params: { page: 1, limit: 50 } });
  dreams.value = res.data.data;
});

const filteredDreams = computed(() => {
  if (tab.value === 'all') return dreams.value;
  return dreams.value.filter(d => d.visibility === tab.value);
});
</script>
```

---

### Task T29: Docker 配置

**优先级:** P0 | **依赖:** 全部后端 + 前端 | **可并行:** 无

**目标:** 创建 Dockerfile 和 docker-compose.yml。

**涉及文件:**
- 修改 `Dockerfile`
- 创建 `docker-compose.yml`

---

- [ ] **Step 1: 写 server/Dockerfile（后端）**

实际上用整体构建方式更简单。创建一个根级 Dockerfile：

```dockerfile
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

EXPOSE 3000
CMD ["node", "src/index.js"]
```

- [ ] **Step 2: 修改 server/src/index.js 以提供静态文件**

在 `app.use(cors())` 之后添加：
```js
app.use(express.static('public'));
// 前端 SPA fallback（非 API 请求返回 index.html）
app.get(/^\/(?!api\/)/, (req, res) => {
  res.sendFile('public/index.html', { root: __dirname + '/..' });
});
```

- [ ] **Step 3: 创建 docker-compose.yml**

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - PORT=3000
      - JWT_SECRET=${JWT_SECRET:-change-me}
      - LLM_API_KEY=${LLM_API_KEY}
      - LLM_BASE_URL=${LLM_BASE_URL:-https://api.openai.com/v1}
      - LLM_MODEL=${LLM_MODEL:-gpt-3.5-turbo}
      - DB_PATH=./data/dreamweave.db
    volumes:
      - ./data:/app/data
```

- [ ] **Step 4: 更新 client/vite.config.js 配置构建输出**

```js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
```

- [ ] **Step 5: 验证 Docker 构建**

```bash
docker build -t dreamweave .
docker run -p 3000:3000 -e LLM_API_KEY=sk-test dreamweave
```
预期：http://localhost:3000 可访问。

---

### Task T30: CI 配置（GitHub Actions）

**优先级:** P0 | **依赖:** T29 | **可并行:** 无

**目标:** 最终化 .github/workflows/ci.yml。

**涉及文件:**
- 修改 `.github/workflows/ci.yml`

---

- [ ] **Step 1: 更新 .github/workflows/ci.yml**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd server && npm ci
      - run: cd server && npm test
        env:
          JWT_SECRET: test-secret
          LLM_API_KEY: sk-test
          DB_PATH: ':memory:'

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd client && npm ci
      - run: cd client && npx vitest run

  build-docker:
    needs: [test-backend, test-frontend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker image
        run: docker build -t dreamweave .
```

---

## 并行执行计划

### 阶段 1（无依赖，全并行 → 3 个 task）
- [ ] T01 — 初始化后端项目
- [ ] T02 — 初始化前端项目
- [ ] T03 — 初始化 SQLite 数据库

### 阶段 2（并行 → 最多 3 个分支）
- [ ] T04 → T05 → T06（Auth 全链路：注册 → 登录 → 前端）
- [ ] T07 → T08（标签 API + 前端组件，可与 Auth 并行）
- [ ] T16（LLM 服务，可与上述并行）

### 阶段 3（梦境核心）
- [ ] T09 → T10, T11, T12（梦境 CRUD）
- [ ] T13, T14, T15（梦境前端页面，依赖 T09+）
- [ ] T17, T18（AI 续写全链路，依赖 T16+T09）

### 阶段 4（扩展功能，可并行 → 3 个分支）
- [ ] T19 → T20 → T21（接力续写全链路）
- [ ] T22 → T23 → T24（碎片串联全链路）
- [ ] T25 → T26（收藏全链路）

### 阶段 5（收尾）
- [ ] T27（分享卡片）
- [ ] T28（导航栏 + 我的页面）
- [ ] T29 → T30（Docker + CI）

---

## 完成检查清单

- [ ] 所有 30 个 task 状态为完成
- [ ] 所有测试绿色通过（`cd server && npm test`）
- [ ] CI（GitHub Actions）通过
- [ ] Docker 镜像构建成功（`docker build -t dreamweave .`）
- [ ] `docker run -p 3000:3000 dreamweave` 可访问
- [ ] `AGENT_LOG.md` 记录完整
- [ ] `PLAN.md` 所有 task 勾掉并附 commit hash
