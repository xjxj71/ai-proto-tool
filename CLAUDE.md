# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-Proto-Tool is a desktop prototyping tool built with Tauri 2 (Rust) + React 18 + TypeScript. Users sketch on a Fabric.js canvas, AI generates interactive HTML prototypes, and natural language chat iterates on designs. The UI is in Chinese (zh-CN only via i18next).

## Commands

```bash
# Development
npm run tauri dev          # Start Vite (port 1420) + Tauri window

# Build
npm run build              # tsc && vite build (frontend only)
npm run tauri build        # Full Tauri build (outputs to src-tauri/target/release/bundle/)

# Tests
npm run test               # Vitest run all
npm run test:watch         # Vitest watch mode
npx vitest run tests/stores/uiStore.test.ts   # Single test file
npx vitest run --reporter=verbose              # Verbose output

# Rust
cd src-tauri && cargo test   # Run Rust tests
cd src-tauri && cargo build  # Build Rust backend
```

No linter or formatter is configured. TypeScript strict mode is the only code quality gate.

## Architecture

### Tauri IPC Boundary

The frontend calls Rust commands via `invoke()` from `@tauri-apps/api/core`. All Rust command structs use `#[serde(rename_all = "camelCase")]`, so JavaScript must send camelCase field names (e.g., `canvasPreset` not `canvas_preset`). This is the most common source of subtle bugs — always match the serde rename convention.

Command registration is in `src-tauri/src/lib.rs` (31 commands across 10 modules). Each command module is in `src-tauri/src/commands/`.

### State Management

11 Zustand stores in `src/stores/`. Stores are thin data holders — they do not make Tauri `invoke` calls. Components call `invoke` directly and update stores with the results. Key stores:

- `projectStore` — current project and page list
- `uiStore` — view routing (`welcome` | `editor` | `settings`), tool/panel state
- `canvasStore` — Fabric.js canvas state, selected elements
- `modelStore` — AI model configurations

### View Routing

No React Router. `App.tsx` reads `uiStore.view` and renders `WelcomeScreen`, `EditorLayout`, or `SettingsPage` conditionally. The welcome screen is the default view; `setView("editor")` switches to the editor.

### Data Storage

Dual storage:
- **SQLite** (`{AppData}/app.db`) — project/page/model_config indexes. Managed via `src-tauri/src/db/`. Manual migrations in `migrations.rs` (no migration framework).
- **File system** (`~/Documents/AI-Prototyper/`) — canvas JSON, chat history, snapshots, components, memory. Managed via `src-tauri/src/fs/dirs.rs`.

The Rust `Project`/`Page`/`ModelConfig` structs (`src-tauri/src/db/repository.rs`) map to SQLite columns with snake_case fields, but serialize to JSON with camelCase via serde.

### AI Integration

`src/ai/providers/` has provider implementations (OpenAI, Anthropic, Gemini) extending `BaseProvider`. The Rust backend proxies AI API calls via `reqwest` with SSE streaming (`ai_commands.rs`) to avoid CORS. Active requests are tracked in a `Mutex<HashMap>` for cancellation support.

### Canvas Engine

Fabric.js 6 canvas in `src/components/canvas/`. Tool implementations in `src/components/canvas/tools/`. Element link management (page navigation bindings) in `src/canvas/linkManager.ts`.

## Key Conventions

- **Path alias:** `@` maps to `./src` in both Vite and TypeScript config
- **Test setup:** `src/test/setup.ts` imports `@testing-library/jest-dom` and `@/i18n`. Tests use `vi.mock("@tauri-apps/api/core")` to mock `invoke`.
- **Tailwind v4:** No `tailwind.config.ts`. Theme tokens are defined via `@theme { }` in `src/styles/globals.css` using CSS custom properties (`--color-accent`, `--color-bg-primary`, etc.)
- **Component styling:** Use the theme color tokens (e.g., `bg-bg-primary`, `text-text-primary`, `border-border`) not hardcoded colors
- **TypeScript:** `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess` are all enabled
- **Vitest:** `globals: true` — `describe`/`it`/`expect`/`vi` are available without imports

## WSL2 Note

The rollup platform binary (`@rollup/rollup-linux-x64-gnu`) may be missing in WSL2, preventing `npm run test` from working. This is an environment issue, not a code issue. The Tauri dev server and build work fine.
