# SPEC: 梦境续写 (DreamWeave)

> 由 Superpowers `brainstorming` 技能驱动生成 | 状态：DRAFT

---

## 1. 问题陈述

### 要解决什么问题？

人们常常在醒来后对梦境记忆深刻，但梦境是碎片化的、转瞬即逝的。本应用帮助用户记录梦境、用 AI 将碎片化的梦境续写成完整故事，并支持公开梦境让他人接力续写——让每个人的梦成为可以被阅读、延续和收藏的故事。

### 目标用户是谁？

- 经常做梦并想记录的人
- 喜欢写作、脑洞、故事创作的年轻人
- 对梦境和潜意识好奇的普通用户

### 为什么值得做？

30 秒价值主张：**"记录你的梦，AI 帮你写成故事。公开的梦，别人帮你一起接着写。"**

---

## 2. 用户故事

| 编号 | 用户故事 | 优先级 | 验收条件 |
|------|----------|--------|----------|
| US-01 | 作为用户，我希望录入我的梦境内容，选择场景和情感标签，以便结构化地记录梦境 | P0 | 录入成功，标签关联正确存储 |
| US-02 | 作为用户，我希望能让 AI 将我的私有梦境续写成完整故事，以便看到梦中未发生的后续 | P0 | 点击生成后返回完整故事，可阅读 |
| US-03 | 作为用户，我希望将梦境设为公开，让其他用户接力续写，以便看到别人眼中这个梦的延续 | P1 | 公开梦境出现在广场，他人可提交续写 |
| US-04 | 作为用户，我希望上传多个零散梦境碎片，由 AI 将它们编织成一个连贯故事 | P1 | 碎片串联生成完整故事 |
| US-05 | 作为用户，我希望收藏喜欢的梦境故事，并生成图文卡片分享出去 | P2 | 收藏成功，卡片可导出为 PNG |

---

## 3. 功能规约

### 模块 A：用户认证

| 项目 | 描述 |
|------|------|
| **输入** | 注册：username, email, password；登录：email, password |
| **行为** | JWT Token 鉴权，注册时密码 bcrypt 哈希 |
| **输出** | JWT Token，用户信息 |
| **边界条件** | username/email 唯一性校验，密码最小 6 位 |
| **错误处理** | 409 重复注册，401 密码错误，422 参数不合法 |

### 模块 B：梦境录入

| 项目 | 描述 |
|------|------|
| **输入** | title, content（梦境内容）, scene_ids（数组）, emotion_tags（[{name, intensity 1-5}]）, visibility（private/public） |
| **行为** | 创建梦境记录，关联场景标签和情感标签。若用户输入了新标签名（不在预设中），自动创建自定义标签 |
| **输出** | 创建的梦境对象 |
| **边界条件** | content 不能为空；visibility 默认为 private；emoji/特殊字符允许 |
| **错误处理** | 400 content 为空，401 未登录 |

### 模块 C：AI 续写（私有梦境）

| 项目 | 描述 |
|------|------|
| **输入** | dream_id |
| **行为** | 后端读取梦境 content + scene_tags + emotion_tags，构造 prompt 发送给 LLM（OpenAI 兼容接口），返回完整续写故事，存入 dreams.ai_story 字段 |
| **输出** | 续写完成的完整故事文本 |
| **边界条件** | 仅 dream 所有者可触发；同一梦境重复生成会覆盖；LLM 超时 30s |
| **错误处理** | 403 非所有者，500 LLM 调用失败（含超时），404 梦境不存在 |

### 模块 D：公开梦境 & 接力续写

| 项目 | 描述 |
|------|------|
| **输入** | dream_id, content, parent_id（可选，线性接力用）, is_independent（布尔） |
| **行为** | 线性接力：parent_id 指向上一段续写，形成链条；独立续写：is_independent=true，基于原始梦境产生新版本。广场按时间倒序展示所有公开梦境 |
| **输出** | continuations 列表，含作者信息和时间线 |
| **边界条件** | 仅公开梦境可被续写；用户不能续写自己的公开梦境；续写内容不能为空 |
| **错误处理** | 404 梦境不存在，403 私有梦境不可续写，400 内容为空 |

### 模块 E：碎片串联

| 项目 | 描述 |
|------|------|
| **输入** | fragments（数组 [{content}...]），可选的 sort_order |
| **行为** | 用户上传多个碎片 → 可选调整顺序 → 点生成 → 后端将碎片拼接为 prompt 发送 LLM，生成连贯故事。碎片不独立存储为 dream（仅串联后的结果可保存） |
| **输出** | 串联后的完整故事 |
| **边界条件** | 最少 2 个碎片；最多 10 个碎片（防止 token 爆炸）；每个碎片最长 1000 字 |
| **错误处理** | 400 碎片不足/超限，500 LLM 调用失败 |

### 模块 F：收藏 & 分享卡片

| 项目 | 描述 |
|------|------|
| **输入** | 收藏：dream_id；分享：dream_id |
| **行为** | 收藏：创建/删除 favorites 记录。分享：前端渲染 HTML 卡片（梦境标题 + 故事摘要 + 作者 + 场景标签），html2canvas 导出 PNG |
| **输出** | 收藏状态，PNG 图片 |
| **边界条件** | 不可重复收藏；取消收藏幂等；卡片内容最长截断 200 字摘要 |
| **错误处理** | 404 梦境不存在，409 重复收藏 |

---

## 4. 非功能性需求

| 维度 | 要求 |
|------|------|
| **性能** | LLM 调用有 30s 超时；页面首屏加载 < 2s |
| **安全** | 密码 bcrypt + salt；JWT 过期 7 天；LLM Key 存后端环境变量 |
| **可用性** | 支持中英文输入；响应式设计（手机 / 桌面均可） |
| **可观测性** | LLM 调用记录日志（请求/响应时间、成功/失败） |
| **可维护性** | 预设标签可通过 seed 脚本初始化 |

---

## 5. 系统架构

```
┌─────────────────────────────────────────────────────┐
│                    Vue.js 前端                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ 梦境录入  │ │ 梦境广场  │ │ 我的收藏  │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ 碎片串联  │ │ 故事阅读  │ │ 分享卡片  │            │
│  └──────────┘ └──────────┘ └──────────┘            │
└─────────────────┬───────────────────────────────────┘
                  │ REST API (JSON)
┌─────────────────▼───────────────────────────────────┐
│                Node.js 后端 (Express)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐│
│  │ Auth 模块│ │ Dream 模块│ │   LLM 代理模块       ││
│  │ JWT 鉴权 │ │ CRUD +   │ │   OpenAI 兼容接口    ││
│  │          │ │ 续写/接力│ │                      ││
│  └──────────┘ └──────────┘ └──────────────────────┘│
│  ┌──────────┐ ┌──────────┐                         │
│  │碎片串联  │ │ 收藏模块  │                         │
│  └──────────┘ └──────────┘                         │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│                    SQLite                            │
│  users | dreams | continuations | fragments          │
│       | favorites | scene_tags | emotion_tags       │
└─────────────────────────────────────────────────────┘
```

### 数据流

1. **梦境录入流**：前端表单 → POST /dreams → 写入 SQLite → 返回
2. **AI 续写流**：POST /dreams/:id/generate → 后端读取 dream + 标签 → 构造 prompt → 调用 LLM → ai_story 写回 → 返回故事
3. **接力续写流**：POST /dreams/:id/continuations → 写入 continuations（parent_id 串联）
4. **碎片串联流**：POST /fragments/weave → 后端拼接碎片 → 调用 LLM → 返回故事

### 外部依赖

| 依赖 | 用途 | 版本 |
|------|------|------|
| OpenAI 兼容 API | LLM 续写 + 串联 | 任一兼容接口 |
| html2canvas | 前端导出分享卡片 PNG | latest |

---

## 6. 数据模型

```
users
├── id              INTEGER PK AUTO_INCREMENT
├── username        TEXT UNIQUE NOT NULL
├── email           TEXT UNIQUE NOT NULL
├── password_hash   TEXT NOT NULL
├── avatar_url      TEXT
├── created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
└── updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP

dreams
├── id              INTEGER PK AUTO_INCREMENT
├── user_id         INTEGER FK → users NOT NULL
├── title           TEXT
├── content         TEXT NOT NULL
├── scene_ids       TEXT            -- JSON array of scene_tag.id
├── emotion_tags    TEXT            -- JSON array of [{name, intensity}]
├── visibility      TEXT DEFAULT 'private'  -- 'private' | 'public'
├── ai_story        TEXT            -- LLM 续写结果
├── status          TEXT DEFAULT 'draft'  -- 'draft' | 'completed'
├── created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
└── updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP

continuations
├── id              INTEGER PK AUTO_INCREMENT
├── dream_id        INTEGER FK → dreams NOT NULL
├── user_id         INTEGER FK → users NOT NULL
├── parent_id       INTEGER FK → continuations (NULLABLE)
├── content         TEXT NOT NULL
├── is_independent  BOOLEAN DEFAULT 0
└── created_at      DATETIME DEFAULT CURRENT_TIMESTAMP

fragments
├── id              INTEGER PK AUTO_INCREMENT
├── user_id         INTEGER FK → users NOT NULL
├── content         TEXT NOT NULL
├── sort_order      INTEGER
├── session_id      TEXT NOT NULL      -- 同一组碎片共享
└── created_at      DATETIME DEFAULT CURRENT_TIMESTAMP

scene_tags
├── id              INTEGER PK AUTO_INCREMENT
├── name            TEXT UNIQUE NOT NULL
├── is_preset       BOOLEAN DEFAULT 0
├── created_by      INTEGER FK → users (NULLABLE)
└── created_at      DATETIME DEFAULT CURRENT_TIMESTAMP

emotion_tags
├── id              INTEGER PK AUTO_INCREMENT
├── name            TEXT UNIQUE NOT NULL
├── is_preset       BOOLEAN DEFAULT 0
├── created_by      INTEGER FK → users (NULLABLE)
└── created_at      DATETIME DEFAULT CURRENT_TIMESTAMP

favorites
├── id              INTEGER PK AUTO_INCREMENT
├── user_id         INTEGER FK → users NOT NULL
├── dream_id        INTEGER FK → dreams NOT NULL
├── UNIQUE(user_id, dream_id)
└── created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
```

---

## 7. API 设计

```
Base URL: /api/v1
Auth: Bearer <JWT Token>

────────────────────────────────────────
认证
────────────────────────────────────────
POST   /api/v1/auth/register     { username, email, password }
POST   /api/v1/auth/login        { email, password }
→      返回 { token, user }

────────────────────────────────────────
梦境
────────────────────────────────────────
GET    /api/v1/dreams            ?visibility=public&page=1&limit=20&scene=&emotion=
POST   /api/v1/dreams            { title, content, scene_ids[], emotion_tags[], visibility }
GET    /api/v1/dreams/:id
PUT    /api/v1/dreams/:id        { ... }   (仅所有者)
DELETE /api/v1/dreams/:id                  (仅所有者)
POST   /api/v1/dreams/:id/generate         (仅所有者，触发 LLM 续写)

────────────────────────────────────────
续写（公开梦境接力）
────────────────────────────────────────
GET    /api/v1/dreams/:id/continuations
POST   /api/v1/dreams/:id/continuations  { content, parent_id?, is_independent }

────────────────────────────────────────
碎片串联
────────────────────────────────────────
POST   /api/v1/fragments/weave   { fragments: [{content}...] }
GET    /api/v1/fragments/sessions   (当前用户的串联历史)

────────────────────────────────────────
收藏
────────────────────────────────────────
POST   /api/v1/favorites         { dream_id }
DELETE /api/v1/favorites/:dream_id
GET    /api/v1/favorites           (当前用户的收藏列表)

────────────────────────────────────────
标签
────────────────────────────────────────
GET    /api/v1/tags/scenes        (所有场景标签)
GET    /api/v1/tags/emotions      (所有情感标签)

────────────────────────────────────────
错误码
────────────────────────────────────────
200  成功
400  请求参数错误
401  未认证 / Token 过期
403  无权限
404  资源不存在
409  冲突（重复注册/重复收藏）
422  参数校验失败
500  服务器内部错误（含 LLM 调用失败）
```

---

## 8. 技术选型与理由

| 层面 | 选择 | 理由 |
|------|------|------|
| **前端** | Vue.js 3 + Vue Router + Pinia | 课程要求；组件化开发，生态成熟 |
| **后端** | Node.js + Express | 课程要求；与 Vue 统一 JS/TS 语言栈 |
| **数据库** | SQLite (better-sqlite3) | 零配置、单文件、无需安装数据库服务 |
| **ORM** | 原生 SQL / Knex | 避免 Prisma 对 SQLite 有限支持的问题 |
| **LLM** | OpenAI 兼容接口（SDK: openai） | 兼容最多后端（OpenAI、DeepSeek、通义千问等） |
| **分享卡片** | html2canvas | 前端将 HTML 渲染为 PNG，一键导出 |
| **部署** | Docker + Docker Compose | 课程必做要求；一条命令启动 |
| **CI** | GitHub Actions | 自动测试 + Docker 构建推送 |

### Open Design 设计系统

**不适用。** 本项目无前端 UI 框架强制要求，使用 Vue.js 组件库自行搭建界面风格。如果你希望使用 Open Design 提升 UI 质量，可在本段补充所选的 Open Design skill 与设计系统。

---

## 9. 验收标准

| 功能模块 | 验收标准 | 测试方法 |
|----------|----------|----------|
| 注册/登录 | 注册成功后可登录；重复注册返回 409；错误密码返回 401 | E2E / API 测试 |
| 梦境录入 | 录入后数据库有记录；标签正确关联；自定义标签自动创建 | API 测试 |
| AI 续写 | 触发后 30s 内返回完整故事；非所有者被拒绝 | API 测试 + Mock LLM |
| 公开广场 | 未登录也可浏览公开梦境；分页正常 | E2E |
| 接力续写 | 线性链条 ID 正确；独立续写标记正确 | API 测试 |
| 碎片串联 | 2-10 个碎片可生成故事；<2 个返回错误 | API 测试 + Mock LLM |
| 收藏 | 可收藏/取消；重复收藏报 409 | API 测试 |
| 分享卡片 | HTML 卡片正确渲染；html2canvas 导出 PNG 成功 | 手动 E2E |
| Docker | `docker build && docker run` 后应用可访问 | CI / 手动 |

---

## 10. 风险与未决问题

| 风险/问题 | 影响 | 缓解策略 | 状态 |
|-----------|------|----------|------|
| LLM 调用不稳定（超时/返回质量差） | AI 续写与串联功能不可用 | 设置 30s 超时 + 错误提示；Prompt 模板预留调优空间 | Open |
| SQLite 并发写入限制 | 多用户同时续写时可能锁 | 课程项目无真实并发，风险低；后续可迁移 PG | Accepted |
| 用户输入恶意内容 | 公开广场展示不当内容 | 前端屏蔽 + 后端内容过滤（可选，MVP 不做） | Open |
| 碎片串联 prompt 质量 | 生成故事逻辑不通顺 | Prompt 工程迭代，允许用户手动排序改善 | Open |

---

> 此文档将通过 brainstorming 对话持续迭代，最终由冷启动验证确认清晰度。

---

## 11. 迭代扩展（v2 — 初版 30 任务之后）

> 初版交付后进行了一轮功能扩展、安全加固与 UI 重构。本节记录增量设计；第 1–10 章保持不变，作为初版规约存档。完整 API 见 `README.md`。

### 11.1 账号体系调整

登录/注册改为 **用户名 + 密码**，移除 email（含数据库列、唯一性校验与前端表单）。

### 11.2 新增功能模块

| 模块 | 说明 | 关键端点 |
|------|------|----------|
| G. AI 解梦 | 从心理/象征层面解析梦境，存 `dreams.interpretation` | `POST /dreams/:id/interpret` |
| H. 续写风格 | AI 续写可选基调（自然/治愈/悬疑/诗意/荒诞） | `POST /dreams/:id/generate { style }` |
| I. 搜索与筛选 | 广场按关键词 + 场景/情感标签筛选 | `GET /dreams?q=&scene=&emotion=` |
| J. 社交互动 | 公开梦境点赞 + 评论（仅公开可操作，私有 403） | `/dreams/:id/likes`、`/dreams/:id/comments` |
| K. 关注/主页/通知 | 关注做梦者、个人主页、被互动时收到通知 | `/users/:username`、`/users/:username/follow`、`/notifications` |
| L. 数据图谱 | 个人梦境聚合可视化（情感/场景/记录热力图） | `GET /stats` |
| M. 编辑/删除/草稿 | 梦境编辑与删除、新建草稿自动保存（localStorage） | 复用 `PUT/DELETE /dreams/:id` |
| N. 随机漫游 | 一键进入随机公开梦境 | `GET /dreams/random` |
| O. 故事朗读 | 浏览器语音合成朗读（零后端） | 纯前端 `useSpeech` |

### 11.3 数据模型新增

- `dreams` 增列：`interpretation TEXT`
- 新表：`likes`、`comments`、`follows`、`notifications`（7 → 11 张表）
- 历史数据迁移：`scene_ids` 由"场景 id"统一改为存"场景名"（与 `emotion_tags` 一致），启动时幂等迁移

### 11.4 非功能性增强

- **安全**：登录/注册限流、CORS 白名单（`CORS_ORIGIN`）、生产强制 `JWT_SECRET`、LLM Prompt 注入防护（不可信输入分隔包裹）、社交接口可见性鉴权
- **LLM**：由桩函数补全为真实 OpenAI 兼容调用；未配置 Key 时降级为离线占位文本
- **可观测性**：LLM 调用记录耗时与结果长度日志

### 11.5 UI / 设计系统

引入 **"Oneiric Nocturne"** 深色梦境设计系统（自定 CSS 变量、玻璃拟态、衬线排版）与成体系动效（极光鼠标视差、滚动揭示、卡片 3D 倾斜、数字滚动计数、流动渐变标题），均尊重 `prefers-reduced-motion`。回应初版 `REFLECTION.md §6` 指出的"界面看上去像 AI 写的"。
