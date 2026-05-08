# AI-Proto-Tool

面向开发者的 AI 驱动桌面原型设计工具。通过手绘草图 + AI 生成 + 自然语言对话迭代，快速将想法转化为可交互的 Web 原型。

## 核心功能

- **手绘草图 → AI 原型** — 在画板上自由绘制布局，AI 识别后生成规范的 HTML/CSS 原型
- **对话式迭代** — 通过自然语言描述需求，AI 实时修改画板内容
- **多页面管理** — 以项目为维度管理多个页面，支持元素级别的页面跳转绑定
- **多模型支持** — OpenAI / Anthropic / Gemini / 国产大模型（通义千问、DeepSeek、Moonshot、豆包、小米、智谱）
- **可交互导出** — 导出的 HTML 支持页面跳转等交互，不仅是静态截图
- **组件库 & 模板** — 预置 14 种 UI 技能模板（落地页、仪表盘、表单、电商等）
- **快照系统** — 保存/恢复设计快照，支持设计版本回溯
- **AI 记忆系统** — 三层记忆（用户偏好、可复用模块、项目上下文），跨会话保持设计一致性

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面框架 | Tauri 2.x (Rust) |
| 前端 | React 18 + TypeScript (strict) |
| 构建 | Vite 6 |
| 状态管理 | Zustand 5 (11 stores) |
| 画布引擎 | Fabric.js 6 |
| 样式 | TailwindCSS 4 + Radix UI |
| 国际化 | i18next (zh-CN) |
| 拖拽排序 | dnd-kit |
| 图标 | Lucide React |
| 数据库 | SQLite (sqlx) |
| HTTP 客户端 | reqwest (Rust, SSE 流式) |
| 测试 | Vitest 3 + Testing Library |

## 架构

应用分为 4 层，通过 Tauri IPC 机制通信：

```
┌─────────────────────────────────────────────┐
│          Tauri 壳层 (Rust)                   │
│  窗口管理 / SQLite / 文件系统 / HTTP 代理     │
├─────────────────────────────────────────────┤
│          前端应用层 (React + TypeScript)       │
│  路由 / Zustand 状态管理 / 界面组件            │
├─────────────────────────────────────────────┤
│          画板引擎层 (Fabric.js)               │
│  画布核心 / 绘图工具 / 元素跳转 / 导出         │
├─────────────────────────────────────────────┤
│          AI 集成层                            │
│  多模型适配 / 对话引擎 / 记忆 / Skill 引擎     │
└─────────────────────────────────────────────┘
```

Rust 后端负责数据库操作、文件系统读写和 AI API 代理（避免前端 CORS 限制）。前端通过 `invoke` 调用 Tauri 命令。

## 目录结构

```
ai-proto-tool/
├── docs/                          # 设计文档和计划
│   ├── 2026-05-07-ai-prototyper-design.md   # 产品设计文档
│   ├── CODE_REVIEW_REPORT.md                # 代码审查报告
│   └── superpowers/plans/                   # 实施计划 (Plan 1-4)
├── src/                           # 前端源码
│   ├── ai/                        # AI 层 (providers, ChatEngine, ResponseParser)
│   ├── canvas/                    # 画布管理 (LinkManager)
│   ├── components/                # UI 组件
│   │   ├── ai/                    # AI 相关组件
│   │   ├── canvas/                # 画布组件 (CanvasRenderer, tools, modes)
│   │   ├── chat/                  # 聊天面板
│   │   ├── editor/                # 编辑器布局 (MenuBar, Toolbar, StatusBar)
│   │   ├── export/                # 导出功能
│   │   ├── settings/              # 设置页面
│   │   ├── snapshots/             # 快照管理
│   │   ├── ui/                    # 通用 UI (ConfirmDialog, ErrorBoundary)
│   │   └── welcome/               # 欢迎页 (项目创建/列表)
│   ├── hooks/                     # React Hooks
│   ├── i18n/                      # 国际化 (zh-CN)
│   ├── memory/                    # AI 记忆系统 (MemoryManager)
│   ├── skills/                    # Skill 引擎 (14 预置技能)
│   ├── stores/                    # Zustand 状态 (11 stores)
│   └── types/                     # TypeScript 类型定义
├── src-tauri/                     # Rust 后端
│   └── src/
│       ├── commands/              # Tauri 命令 (10 模块)
│       ├── db/                    # 数据库 (migrations, repository)
│       ├── export/                # HTML 导出生成器
│       └── fs/                    # 文件系统操作
├── tests/                         # 测试 (~40 文件)
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## 数据存储

采用混合存储方案：

| 存储方式 | 位置 | 内容 |
|---------|------|------|
| SQLite | `{AppData}/app.db` | 项目索引、页面元数据、模型配置 |
| 文件系统 | `~/Documents/AI-Prototyper/` | 画板数据、对话历史、快照、组件、记忆 |

关键数据文件：
- `canvas.json` — Fabric.js 序列化的画板状态
- `element_links.json` — 元素跳转绑定定义
- `chat_history.json` — AI 对话历史（每页面独立）
- `meta.json` — 项目/快照/组件元信息

## 开发环境

### 前置要求

- Node.js 18+
- Rust (latest stable)
- Tauri CLI 2.x

### 安装

```bash
# 安装前端依赖
npm install

# 安装 Rust 依赖 (cd src-tauri && cargo build)
```

### 开发模式

```bash
npm run tauri dev
```

启动 Vite 开发服务器 (port 1420) 和 Tauri 窗口。

### 构建

```bash
npm run tauri build
```

输出安装包到 `src-tauri/target/release/bundle/`。

### 测试

```bash
# 前端测试
npx vitest run

# Rust 测试
cd src-tauri && cargo test
```

## 实施路线

项目按 4 个计划逐步实施，均已完成：

| 阶段 | 内容 | 状态 |
|------|------|------|
| Plan 1 | 项目脚手架 + 数据层 + UI 骨架 | 已完成 |
| Plan 2 | 画布引擎 + 页面管理 + 绘图工具 | 已完成 |
| Plan 3 | AI 集成（对话、模型配置、生成） | 已完成 |
| Plan 4 | 导出 + 导航 + 记忆 + 技能 + 完善 | 已完成 |

## 已知问题

详细问题列表见 `docs/CODE_REVIEW_REPORT.md`。主要问题：

- API Key 在 SQLite 中明文存储（待加密）
- `memory_commands.rs` 存在路径遍历风险（待修复）
- AI 请求取消功能未真正中断 HTTP 连接
- Ctrl+S 快捷键未实际触发保存
- WSL2 环境下 rollup 平台二进制缺失导致前端测试无法运行

## 文档

- [产品设计文档](docs/2026-05-07-ai-prototyper-design.md) — 完整的产品设计、数据模型、界面布局、AI 集成方案
- [代码审查报告](docs/CODE_REVIEW_REPORT.md) — 全项目代码审查结果
- [实施计划](docs/superpowers/plans/) — Plan 1-4 实施计划和审查记录

## 许可

Private / 未发布
