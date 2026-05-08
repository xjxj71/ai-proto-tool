# Project Foundation & UI Shell — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Tauri 2.x desktop app with React frontend, establish SQLite data layer, file system structure, and build the working three-panel editor shell with dark theme and Chinese UI.

**Architecture:** Tauri 2.x (Rust) handles window management, SQLite via sqlx (direct Rust access, no plugin), and file I/O via commands exposed over IPC. React 18 + TypeScript frontend uses Zustand for state, TailwindCSS + Radix UI for styling, and i18next for Chinese localization. The app opens to a welcome screen where users create/open projects, then enters a three-panel editor.

**Tech Stack:** Tauri 2.x, React 18, TypeScript, Vite, Zustand, TailwindCSS, Radix UI, Lucide React, i18next, SQLite (sqlx direct), Vitest, React Testing Library

---

## Roadmap

This is **Plan 1 of 4** in the AI-Proto-Tool implementation roadmap:

| Plan | Scope | Produces |
|------|-------|----------|
| **Plan 1** (this) | Scaffolding + Data Layer + UI Shell | Working desktop app with project CRUD, three-panel editor layout |
| **Plan 2** | Canvas Engine + Page Management + Drawing Tools | Functional Fabric.js canvas with drawing tools, page switching, element operations |
| **Plan 3** | AI Integration — Chat + Model Config + Generation | AI conversation panel, model configuration, prototype generation from text/sketch |
| **Plan 4** | Export + Navigation + Memory + Skills + Polish | HTML/PNG export, element jump binding, memory system, skill engine, shortcuts |

Each plan builds on the previous and produces independently testable software.

---

## File Structure

### Rust Backend (`src-tauri/`)

```
src-tauri/
├── Cargo.toml
├── build.rs
├── tauri.conf.json
├── capabilities/
│   └── default.json
├── src/
│   ├── lib.rs                    # App entry, plugin registration, command registration
│   ├── db/
│   │   ├── mod.rs                # Database module root
│   │   ├── migrations.rs         # Table creation SQL
│   │   └── repository.rs         # CRUD operations (projects, pages, model_configs)
│   ├── fs/
│   │   ├── mod.rs                # File system module root
│   │   ├── dirs.rs               # Directory initialization and management
│   │   └── io.rs                 # File read/write helpers
│   └── commands/
│       ├── mod.rs                # Commands module root
│       ├── project_commands.rs   # Project CRUD IPC commands
│       ├── page_commands.rs      # Page CRUD IPC commands
│       └── model_commands.rs     # Model config IPC commands
```

### React Frontend (`src/`)

```
src/
├── main.tsx                      # React entry point
├── App.tsx                       # Root component with routing
├── vite-env.d.ts
├── i18n/
│   ├── index.ts                  # i18next configuration
│   └── locales/
│       └── zh-CN/
│           └── translation.json  # Chinese language pack
├── stores/
│   ├── projectStore.ts           # Project state (list, current project)
│   ├── settingsStore.ts          # App settings (theme, language)
│   └── uiStore.ts               # UI state (panel visibility, active tool)
├── hooks/
│   └── useTheme.ts              # Theme hook
├── types/
│   └── index.ts                  # Shared TypeScript types
├── components/
│   ├── welcome/
│   │   ├── WelcomeScreen.tsx     # Welcome/landing screen
│   │   ├── ProjectList.tsx       # Project card grid
│   │   └── CreateProjectDialog.tsx # New project dialog
│   ├── editor/
│   │   ├── EditorLayout.tsx      # Three-panel editor container
│   │   ├── MenuBar.tsx           # Top menu bar
│   │   ├── Toolbar.tsx           # Canvas toolbar (placeholder)
│   │   ├── StatusBar.tsx         # Bottom status bar
│   │   ├── PagePanel.tsx         # Left panel — page list (placeholder)
│   │   ├── CanvasArea.tsx        # Center — canvas workspace (placeholder)
│   │   └── ChatPanel.tsx         # Right panel — AI chat (placeholder)
│   └── ui/
│       └── ThemeToggle.tsx       # Theme switch button
├── styles/
│   └── globals.css               # TailwindCSS imports + custom styles
```

### Tests

```
src-tauri/
├── src/
│   └── db/
│       └── repository.rs         # Inline tests via #[cfg(test)] mod tests
tests/                            # Frontend tests
├── stores/
│   ├── projectStore.test.ts
│   ├── settingsStore.test.ts
│   └── uiStore.test.ts
├── components/
│   ├── welcome/
│   │   ├── WelcomeScreen.test.tsx
│   │   ├── ProjectList.test.tsx
│   │   └── CreateProjectDialog.test.tsx
│   └── editor/
│       ├── EditorLayout.test.tsx
│       ├── MenuBar.test.tsx
│       └── StatusBar.test.tsx
```

---

## Task 1: Initialize Tauri 2.x + React + Vite Project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`
- Create: `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, `src-tauri/build.rs`
- Create: `src-tauri/src/lib.rs`, `src-tauri/src/main.rs`
- Create: `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`

- [ ] **Step 1: Create Tauri 2.x project with React + TypeScript template**

Run:
```bash
cd "/mnt/d/research project/ai-proto-tool"
npm create tauri-app@latest . -- --template react-ts --manager npm
```

If prompted about existing files, choose to overwrite. This generates the complete Tauri 2.x + React + Vite + TypeScript scaffold.

> **Troubleshooting:** If the scaffold fails because the directory isn't empty (contains `.git/`, `.claude/`, `docs/`), try one of these approaches:
> 1. Create in a temp directory and copy files over: `npm create tauri-app@latest /tmp/ai-proto-scaffold -- --template react-ts --manager npm && cp -r /tmp/ai-proto-scaffold/* . && cp -r /tmp/ai-proto-scaffold/.* . 2>/dev/null; true`
> 2. Or use the `--` flag to skip confirmation prompts if supported by your scaffolding version.

- [ ] **Step 2: Verify project structure was created**

Run: `ls -la src-tauri/src/ src/`

Expected: `lib.rs` and `main.rs` in `src-tauri/src/`, `App.tsx` and `main.tsx` in `src/`.

- [ ] **Step 3: Configure TypeScript strict mode**

In `tsconfig.json`, ensure:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

In `tsconfig.node.json` (if not present, create alongside `tsconfig.json`):
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Configure Vite path alias**

In `vite.config.ts`, update to include path alias:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
```

- [ ] **Step 5: Verify the app builds and opens**

Run: `npm run tauri dev`

Expected: A Tauri window opens showing the default React template page. Close the window after verifying.

Run: `cargo test --manifest-path src-tauri/Cargo.toml`

Expected: All Rust tests pass.

- [ ] **Step 6: Verify .gitignore coverage**

Check that `.gitignore` (generated by the scaffold) covers the following patterns. If any are missing, append them:

```
node_modules/
dist/
target/
src-tauri/target/
.env
.env.*
```

Run: `cat .gitignore`

If missing entries, append:
```bash
echo -e "\nnode_modules/\ndist/\ntarget/\nsrc-tauri/target/\n.env\n.env.*" >> .gitignore
```

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.node.json vite.config.ts index.html src/ src-tauri/
git commit -m "feat: initialize Tauri 2.x + React + TypeScript project scaffold"
```

---

## Task 2: Install and Configure Dependencies

**Files:**
- Modify: `package.json` (add dependencies)
- Create: `src/styles/globals.css`
- Create: `src/types/index.ts`

- [ ] **Step 1: Install npm dependencies**

Run:
```bash
cd "/mnt/d/research project/ai-proto-tool"
npm install zustand @radix-ui/react-dialog lucide-react i18next react-i18next
```

> **Deferred packages (install in later plans):**
> - Plan 2: `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities fabric@^6.0.0`
> - Plan 3-4: `@radix-ui/react-dropdown-menu @radix-ui/react-tooltip @radix-ui/react-select @radix-ui/react-context-menu @radix-ui/react-separator`
> - Plan 4: `@tauri-apps/plugin-fs @tauri-apps/plugin-dialog`

Run:
```bash
npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Run (Tauri plugin JS bindings -- needed for Rust plugin registration):
```bash
npm install @tauri-apps/plugin-dialog @tauri-apps/plugin-fs
```

Note: The JS bindings for `plugin-dialog` and `plugin-fs` are installed now because their Rust-side plugins (`tauri_plugin_dialog::init()`, `tauri_plugin_fs::init()`) are registered in `lib.rs`. The frontend does not call these directly in Plan 1, but the bindings must be present to avoid missing-peer warnings. If the scaffolded template already includes these, skip this step.

- [ ] **Step 2: Configure TailwindCSS**

In `vite.config.ts`, add the TailwindCSS plugin:
```typescript
import tailwindcss from "@tailwindcss/vite";

// In the plugins array, add tailwindcss():
plugins: [react(), tailwindcss()],
```

Create `src/styles/globals.css`:
```css
@import "tailwindcss";

@theme {
  --color-bg-primary: #1a1a2e;
  --color-bg-secondary: #16213e;
  --color-bg-tertiary: #0f3460;
  --color-bg-surface: #1e1e3a;
  --color-text-primary: #e0e0e0;
  --color-text-secondary: #a0a0b8;
  --color-text-muted: #6b6b80;
  --color-accent: #7c6aef;
  --color-accent-hover: #9585f0;
  --color-border: #2a2a4a;
  --color-border-hover: #3a3a5a;
  --color-danger: #ef4444;
  --color-success: #22c55e;
  --color-warning: #eab308;
}
```

- [ ] **Step 3: Replace default CSS imports**

In `src/main.tsx`, replace any existing CSS import with:
```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 4: Configure Vitest**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: false,
  },
});
```

Create `src/test/setup.ts`:
```typescript
import "@testing-library/jest-dom";
```

Add to `package.json` scripts:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

- [ ] **Step 5: Create shared TypeScript types**

Create `src/types/index.ts`:
```typescript
export interface Project {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  canvasPreset: string;
  createdAt: string;
  updatedAt: string;
}

export interface Page {
  id: string;
  projectId: string;
  name: string;
  thumbnail: string;
  sortOrder: number;
  canvasWidth: number;
  canvasHeight: number;
  createdAt: string;
  updatedAt: string;
}

export type AuthMode = "standard_api" | "token_plan" | "coding_plan";
export type ModelType = "text" | "vision" | "both";

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  authMode: AuthMode;
  baseUrl: string;
  apiKey: string;
  token: string;
  modelName: string;
  modelType: ModelType;
  isDefaultText: boolean;
  isDefaultVision: boolean;
  connectionStatus: string;
  lastTestedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type ThemeMode = "dark" | "light";

export interface AppSettings {
  theme: ThemeMode;
  language: string;
  defaultCanvasPreset: string;
}

export type CanvasPreset = {
  name: string;
  width: number;
  height: number;
  category: "desktop" | "tablet" | "mobile";
};

export const CANVAS_PRESETS: CanvasPreset[] = [
  { name: "桌面 1440×900", width: 1440, height: 900, category: "desktop" },
  { name: "桌面 1280×800", width: 1280, height: 800, category: "desktop" },
  { name: "桌面 1920×1080", width: 1920, height: 1080, category: "desktop" },
  { name: "平板 1024×768", width: 1024, height: 768, category: "tablet" },
  { name: "平板 768×1024", width: 768, height: 1024, category: "tablet" },
  { name: "手机 375×812", width: 375, height: 812, category: "mobile" },
  { name: "手机 390×844", width: 390, height: 844, category: "mobile" },
];
```

- [ ] **Step 6: Verify build succeeds**

Run: `npm run build`

Expected: Build completes with no errors.

Run: `npm test`

Expected: No test files yet, vitest reports "no test files found" without errors.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vite.config.ts vitest.config.ts src/styles/ src/types/ src/test/ src/main.tsx
git commit -m "feat: add dependencies, TailwindCSS, Vitest, and TypeScript types"
```

---

## Task 3: Rust Backend — SQLite Database Module

**Files:**
- Create: `src-tauri/src/db/mod.rs`
- Create: `src-tauri/src/db/migrations.rs`
- Create: `src-tauri/src/db/repository.rs`
- Modify: `src-tauri/Cargo.toml` (add dependencies)
- Test: `src-tauri/src/db/repository.rs` (inline tests)

- [ ] **Step 1: Add Rust dependencies**

In `src-tauri/Cargo.toml`, add to `[dependencies]`:
```toml
serde = { version = "1", features = ["derive"] }
serde_json = "1"
uuid = { version = "1", features = ["v4"] }
chrono = { version = "0.4", features = ["serde"] }
```

Add to `[dependencies]` (SQL database -- sqlx for direct Rust access):
```toml
sqlx = { version = "0.8", features = ["runtime-tokio", "sqlite"] }
```

Note: `sqlx` is used directly in Rust commands for type-safe queries. We do NOT use `tauri-plugin-sql` -- all database access goes through Rust IPC commands, so there is no need for frontend JS SQL access. This avoids the plugin's internal pool type not being publicly accessible and keeps the architecture simple.

- [ ] **Step 2: Create database migration module**

Create `src-tauri/src/db/mod.rs`:
```rust
pub mod migrations;
pub mod repository;
```

Create `src-tauri/src/db/migrations.rs`:
```rust
pub const CREATE_PROJECTS: &str = r#"
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    cover_image TEXT NOT NULL DEFAULT '',
    canvas_preset TEXT NOT NULL DEFAULT 'desktop_1440x900',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
"#;

pub const CREATE_PAGES: &str = r#"
CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    thumbnail TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    canvas_width INTEGER NOT NULL DEFAULT 1440,
    canvas_height INTEGER NOT NULL DEFAULT 900,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
"#;

pub const CREATE_MODEL_CONFIGS: &str = r#"
CREATE TABLE IF NOT EXISTS model_configs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    auth_mode TEXT NOT NULL DEFAULT 'standard_api',
    base_url TEXT NOT NULL DEFAULT '',
    api_key TEXT NOT NULL DEFAULT '',
    token TEXT NOT NULL DEFAULT '',
    model_name TEXT NOT NULL,
    model_type TEXT NOT NULL DEFAULT 'text',
    is_default_text INTEGER NOT NULL DEFAULT 0,
    is_default_vision INTEGER NOT NULL DEFAULT 0,
    connection_status TEXT NOT NULL DEFAULT '',
    last_tested_at TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
"#;
```

- [ ] **Step 3: Write failing test for repository — project CRUD**

Create `src-tauri/src/db/repository.rs`:
```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: String,
    pub cover_image: String,
    pub canvas_preset: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Page {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub thumbnail: String,
    pub sort_order: i64,
    pub canvas_width: i64,
    pub canvas_height: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelConfig {
    pub id: String,
    pub name: String,
    pub provider: String,
    pub auth_mode: String,
    pub base_url: String,
    pub api_key: String,
    pub token: String,
    pub model_name: String,
    pub model_type: String,
    pub is_default_text: bool,
    pub is_default_vision: bool,
    pub connection_status: String,
    pub last_tested_at: String,
    pub created_at: String,
    pub updated_at: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_project_struct_serialization() {
        let project = Project {
            id: "test-id".to_string(),
            name: "Test Project".to_string(),
            description: "A test".to_string(),
            cover_image: "".to_string(),
            canvas_preset: "desktop_1440x900".to_string(),
            created_at: "2026-01-01T00:00:00Z".to_string(),
            updated_at: "2026-01-01T00:00:00Z".to_string(),
        };
        let json = serde_json::to_string(&project).unwrap();
        let deserialized: Project = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.id, "test-id");
        assert_eq!(deserialized.name, "Test Project");
    }

    #[test]
    fn test_page_struct_serialization() {
        let page = Page {
            id: "page-id".to_string(),
            project_id: "proj-id".to_string(),
            name: "Home".to_string(),
            thumbnail: "".to_string(),
            sort_order: 0,
            canvas_width: 1440,
            canvas_height: 900,
            created_at: "2026-01-01T00:00:00Z".to_string(),
            updated_at: "2026-01-01T00:00:00Z".to_string(),
        };
        let json = serde_json::to_string(&page).unwrap();
        let deserialized: Page = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.project_id, "proj-id");
        assert_eq!(deserialized.canvas_width, 1440);
    }

    #[test]
    fn test_model_config_struct_serialization() {
        let config = ModelConfig {
            id: "cfg-id".to_string(),
            name: "GPT-4o".to_string(),
            provider: "openai".to_string(),
            auth_mode: "standard_api".to_string(),
            base_url: "https://api.openai.com/v1".to_string(),
            api_key: "sk-test".to_string(),
            token: "".to_string(),
            model_name: "gpt-4o".to_string(),
            model_type: "both".to_string(),
            is_default_text: true,
            is_default_vision: true,
            connection_status: "ok".to_string(),
            last_tested_at: "2026-01-01T00:00:00Z".to_string(),
            created_at: "2026-01-01T00:00:00Z".to_string(),
            updated_at: "2026-01-01T00:00:00Z".to_string(),
        };
        let json = serde_json::to_string(&config).unwrap();
        let deserialized: ModelConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.provider, "openai");
        assert!(deserialized.is_default_text);
        assert!(deserialized.is_default_vision);
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`

Expected: All 3 struct serialization tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/Cargo.toml src-tauri/src/db/
git commit -m "feat: add SQLite database module with migrations and repository structs"
```

---

## Task 4: Rust Backend — File System Operations

**Files:**
- Create: `src-tauri/src/fs/mod.rs`
- Create: `src-tauri/src/fs/dirs.rs`
- Create: `src-tauri/src/fs/io.rs`

- [ ] **Step 1: Create file system module structure**

Create `src-tauri/src/fs/mod.rs`:
```rust
pub mod dirs;
pub mod io;
```

Create `src-tauri/src/fs/dirs.rs`:
```rust
use std::fs;
use std::path::{Path, PathBuf};

pub fn get_app_data_dir() -> Result<PathBuf, String> {
    let dir = ::dirs::document_dir()
        .ok_or("Cannot determine Documents directory")?
        .join("AI-Prototyper");
    Ok(dir)
}

pub fn initialize_app_directories(base_dir: &Path) -> Result<(), String> {
    let dirs = [
        base_dir.join("projects"),
        base_dir.join("components").join("built-in"),
        base_dir.join("components").join("custom"),
        base_dir.join("memory").join("saved_modules"),
        base_dir.join("memory").join("project_context"),
        base_dir.join("memory").join("chat_summaries"),
        base_dir.join("skills"),
        base_dir.join("config"),
    ];

    for dir in &dirs {
        fs::create_dir_all(dir).map_err(|e| format!("Failed to create {}: {}", dir.display(), e))?;
    }

    Ok(())
}

pub fn create_project_directories(base_dir: &Path, project_id: &str) -> Result<PathBuf, String> {
    let project_dir = base_dir.join("projects").join(project_id);
    let dirs = [
        project_dir.join("pages"),
        project_dir.join("sketches"),
        project_dir.join("snapshots"),
    ];

    for dir in &dirs {
        fs::create_dir_all(dir).map_err(|e| format!("Failed to create {}: {}", dir.display(), e))?;
    }

    Ok(project_dir)
}

pub fn create_page_directory(base_dir: &Path, project_id: &str, page_id: &str) -> Result<PathBuf, String> {
    let page_dir = base_dir
        .join("projects")
        .join(project_id)
        .join("pages")
        .join(page_id);

    fs::create_dir_all(&page_dir)
        .map_err(|e| format!("Failed to create {}: {}", page_dir.display(), e))?;

    Ok(page_dir)
}
```

Note: This uses the `dirs` crate. Add to `src-tauri/Cargo.toml` `[dependencies]`:
```toml
dirs = "6"
```

Create `src-tauri/src/fs/io.rs`:
```rust
use std::fs;
use std::path::Path;

pub fn write_json<T: serde::Serialize>(path: &Path, data: &T) -> Result<(), String> {
    let parent = path.parent().ok_or("Invalid path: no parent directory")?;
    fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
    let json = serde_json::to_string_pretty(data).map_err(|e| format!("Failed to serialize: {}", e))?;
    fs::write(path, json).map_err(|e| format!("Failed to write file: {}", e))?;
    Ok(())
}

pub fn read_json<T: serde::de::DeserializeOwned>(path: &Path) -> Result<T, String> {
    let content = fs::read_to_string(path).map_err(|e| format!("Failed to read file: {}", e))?;
    serde_json::from_str(&content).map_err(|e| format!("Failed to parse JSON: {}", e))
}

pub fn file_exists(path: &Path) -> bool {
    path.exists() && path.is_file()
}
```

- [ ] **Step 2: Write tests for file system operations**

Add to `src-tauri/src/fs/dirs.rs`:
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_get_app_data_dir_returns_path() {
        let dir = get_app_data_dir();
        assert!(dir.is_ok());
        let path = dir.unwrap();
        assert!(path.to_string_lossy().contains("AI-Prototyper"));
    }

    #[test]
    fn test_initialize_app_directories_creates_structure() {
        let temp_dir = std::env::temp_dir().join("ai_proto_test_dirs");
        let _ = fs::remove_dir_all(&temp_dir);
        let result = initialize_app_directories(temp_dir.as_path());
        assert!(result.is_ok());
        assert!(temp_dir.join("projects").exists());
        assert!(temp_dir.join("components/built-in").exists());
        assert!(temp_dir.join("components/custom").exists());
        assert!(temp_dir.join("memory/saved_modules").exists());
        assert!(temp_dir.join("memory/project_context").exists());
        assert!(temp_dir.join("memory/chat_summaries").exists());
        assert!(temp_dir.join("skills").exists());
        assert!(temp_dir.join("config").exists());
        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_create_project_directories() {
        let temp_dir = std::env::temp_dir().join("ai_proto_test_proj");
        let _ = fs::remove_dir_all(&temp_dir);
        let result = create_project_directories(temp_dir.as_path(), "test-proj-id");
        assert!(result.is_ok());
        let proj_dir = result.unwrap();
        assert!(proj_dir.join("pages").exists());
        assert!(proj_dir.join("sketches").exists());
        assert!(proj_dir.join("snapshots").exists());
        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_create_page_directory() {
        let temp_dir = std::env::temp_dir().join("ai_proto_test_page");
        let _ = fs::remove_dir_all(&temp_dir);
        let result = create_page_directory(temp_dir.as_path(), "proj-id", "page-id");
        assert!(result.is_ok());
        assert!(temp_dir.join("projects/proj-id/pages/page-id").exists());
        let _ = fs::remove_dir_all(&temp_dir);
    }
}
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`

Expected: All file system tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src-tauri/src/fs/ src-tauri/Cargo.toml
git commit -m "feat: add file system operations with directory management and JSON I/O"
```

---

## Task 5: Rust Backend — Tauri IPC Commands

**Files:**
- Create: `src-tauri/src/commands/mod.rs`
- Create: `src-tauri/src/commands/project_commands.rs`
- Create: `src-tauri/src/commands/page_commands.rs`
- Create: `src-tauri/src/commands/model_commands.rs`
- Modify: `src-tauri/src/lib.rs` (register commands and plugins)

- [ ] **Step 1: Create commands module structure**

Create `src-tauri/src/commands/mod.rs`:
```rust
pub mod project_commands;
pub mod page_commands;
pub mod model_commands;
```

Create `src-tauri/src/commands/project_commands.rs`:
```rust
use crate::db::repository::Project;
use crate::fs::dirs;
use crate::fs::io;
use serde::Deserialize;
use std::path::PathBuf;
use tauri::State;

#[derive(Deserialize)]
pub struct CreateProjectInput {
    pub name: String,
    pub description: String,
    pub canvas_preset: String,
}

#[tauri::command]
pub async fn create_project(
    pool: State<'_, sqlx::SqlitePool>,
    input: CreateProjectInput,
) -> Result<Project, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let project = Project {
        id: id.clone(),
        name: input.name,
        description: input.description,
        cover_image: String::new(),
        canvas_preset: input.canvas_preset,
        created_at: now.clone(),
        updated_at: now,
    };

    sqlx::query(
        "INSERT INTO projects (id, name, description, cover_image, canvas_preset, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&project.id)
    .bind(&project.name)
    .bind(&project.description)
    .bind(&project.cover_image)
    .bind(&project.canvas_preset)
    .bind(&project.created_at)
    .bind(&project.updated_at)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let app_dir = dirs::get_app_data_dir()?;
    dirs::create_project_directories(&app_dir, &id)?;

    let meta_path = app_dir.join("projects").join(&id).join("meta.json");
    io::write_json(&meta_path, &project)?;

    Ok(project)
}

#[tauri::command]
pub async fn list_projects(pool: State<'_, sqlx::SqlitePool>) -> Result<Vec<Project>, String> {
    let projects = sqlx::query_as::<_, Project>(
        "SELECT id, name, description, cover_image, canvas_preset, created_at, updated_at FROM projects ORDER BY updated_at DESC"
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(projects)
}

#[tauri::command]
pub async fn get_project(pool: State<'_, sqlx::SqlitePool>, id: String) -> Result<Project, String> {
    let project = sqlx::query_as::<_, Project>(
        "SELECT id, name, description, cover_image, canvas_preset, created_at, updated_at FROM projects WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(project)
}

#[tauri::command]
pub async fn delete_project(pool: State<'_, sqlx::SqlitePool>, id: String) -> Result<(), String> {
    sqlx::query("DELETE FROM projects WHERE id = ?")
        .bind(&id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    let app_dir = dirs::get_app_data_dir()?;
    let project_dir = app_dir.join("projects").join(&id);
    if project_dir.exists() {
        std::fs::remove_dir_all(&project_dir)
            .map_err(|e| format!("Failed to remove project directory: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn update_project(
    pool: State<'_, sqlx::SqlitePool>,
    id: String,
    name: String,
    description: String,
) -> Result<Project, String> {
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query("UPDATE projects SET name = ?, description = ?, updated_at = ? WHERE id = ?")
        .bind(&name)
        .bind(&description)
        .bind(&now)
        .bind(&id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query_as::<_, Project>(
        "SELECT id, name, description, cover_image, canvas_preset, created_at, updated_at FROM projects WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(&*pool)
    .await
    .map_err(|e| e.to_string())
}
```

- [ ] **Step 2: Create page commands**

Create `src-tauri/src/commands/page_commands.rs`:
```rust
use crate::db::repository::Page;
use crate::fs::dirs;
use serde::Deserialize;
use tauri::State;

#[derive(Deserialize)]
pub struct CreatePageInput {
    pub project_id: String,
    pub name: String,
    pub canvas_width: i64,
    pub canvas_height: i64,
}

#[tauri::command]
pub async fn create_page(
    pool: State<'_, sqlx::SqlitePool>,
    input: CreatePageInput,
) -> Result<Page, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let max_order: Option<(i64,)> = sqlx::query_as(
        "SELECT COALESCE(MAX(sort_order), -1) FROM pages WHERE project_id = ?"
    )
    .bind(&input.project_id)
    .fetch_one(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let sort_order = max_order.map(|(m,)| m + 1).unwrap_or(0);

    let page = Page {
        id: id.clone(),
        project_id: input.project_id.clone(),
        name: input.name,
        thumbnail: String::new(),
        sort_order,
        canvas_width: input.canvas_width,
        canvas_height: input.canvas_height,
        created_at: now.clone(),
        updated_at: now,
    };

    sqlx::query(
        "INSERT INTO pages (id, project_id, name, thumbnail, sort_order, canvas_width, canvas_height, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&page.id)
    .bind(&page.project_id)
    .bind(&page.name)
    .bind(&page.thumbnail)
    .bind(&page.sort_order)
    .bind(&page.canvas_width)
    .bind(&page.canvas_height)
    .bind(&page.created_at)
    .bind(&page.updated_at)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let app_dir = dirs::get_app_data_dir()?;
    dirs::create_page_directory(&app_dir, &input.project_id, &id)?;

    Ok(page)
}

#[tauri::command]
pub async fn list_pages(
    pool: State<'_, sqlx::SqlitePool>,
    project_id: String,
) -> Result<Vec<Page>, String> {
    let pages = sqlx::query_as::<_, Page>(
        "SELECT id, project_id, name, thumbnail, sort_order, canvas_width, canvas_height, created_at, updated_at FROM pages WHERE project_id = ? ORDER BY sort_order ASC"
    )
    .bind(&project_id)
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(pages)
}

#[tauri::command]
pub async fn delete_page(pool: State<'_, sqlx::SqlitePool>, id: String) -> Result<(), String> {
    let page: Page = sqlx::query_as::<_, Page>(
        "SELECT id, project_id, name, thumbnail, sort_order, canvas_width, canvas_height, created_at, updated_at FROM pages WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query("DELETE FROM pages WHERE id = ?")
        .bind(&id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    let app_dir = dirs::get_app_data_dir()?;
    let page_dir = app_dir.join("projects").join(&page.project_id).join("pages").join(&id);
    if page_dir.exists() {
        std::fs::remove_dir_all(&page_dir)
            .map_err(|e| format!("Failed to remove page directory: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn rename_page(
    pool: State<'_, sqlx::SqlitePool>,
    id: String,
    name: String,
) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();
    sqlx::query("UPDATE pages SET name = ?, updated_at = ? WHERE id = ?")
        .bind(&name)
        .bind(&now)
        .bind(&id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}
```

- [ ] **Step 3: Create model config commands**

Create `src-tauri/src/commands/model_commands.rs`:
```rust
use crate::db::repository::ModelConfig;
use serde::Deserialize;
use tauri::State;

#[derive(Deserialize)]
pub struct CreateModelConfigInput {
    pub name: String,
    pub provider: String,
    pub auth_mode: String,
    pub base_url: String,
    pub api_key: String,
    pub token: String,
    pub model_name: String,
    pub model_type: String,
    pub is_default_text: bool,
    pub is_default_vision: bool,
}

#[tauri::command]
pub async fn create_model_config(
    pool: State<'_, sqlx::SqlitePool>,
    input: CreateModelConfigInput,
) -> Result<ModelConfig, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    if input.is_default_text {
        sqlx::query("UPDATE model_configs SET is_default_text = 0")
            .execute(&*pool)
            .await
            .map_err(|e| e.to_string())?;
    }
    if input.is_default_vision {
        sqlx::query("UPDATE model_configs SET is_default_vision = 0")
            .execute(&*pool)
            .await
            .map_err(|e| e.to_string())?;
    }

    let config = ModelConfig {
        id: id.clone(),
        name: input.name,
        provider: input.provider,
        auth_mode: input.auth_mode,
        base_url: input.base_url,
        api_key: input.api_key,
        token: input.token,
        model_name: input.model_name,
        model_type: input.model_type,
        is_default_text: input.is_default_text,
        is_default_vision: input.is_default_vision,
        connection_status: String::new(),
        last_tested_at: String::new(),
        created_at: now.clone(),
        updated_at: now,
    };

    sqlx::query(
        "INSERT INTO model_configs (id, name, provider, auth_mode, base_url, api_key, token, model_name, model_type, is_default_text, is_default_vision, connection_status, last_tested_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&config.id)
    .bind(&config.name)
    .bind(&config.provider)
    .bind(&config.auth_mode)
    .bind(&config.base_url)
    .bind(&config.api_key)
    .bind(&config.token)
    .bind(&config.model_name)
    .bind(&config.model_type)
    .bind(config.is_default_text)
    .bind(config.is_default_vision)
    .bind(&config.connection_status)
    .bind(&config.last_tested_at)
    .bind(&config.created_at)
    .bind(&config.updated_at)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(config)
}

#[tauri::command]
pub async fn list_model_configs(pool: State<'_, sqlx::SqlitePool>) -> Result<Vec<ModelConfig>, String> {
    let configs = sqlx::query_as::<_, ModelConfig>(
        "SELECT * FROM model_configs ORDER BY created_at ASC"
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(configs)
}

#[tauri::command]
pub async fn delete_model_config(pool: State<'_, sqlx::SqlitePool>, id: String) -> Result<(), String> {
    sqlx::query("DELETE FROM model_configs WHERE id = ?")
        .bind(&id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}
```

- [ ] **Step 4: Wire up lib.rs with all modules, plugins, and commands**

Update `src-tauri/src/lib.rs`:
```rust
mod commands;
mod db;
mod fs;

use sqlx::SqlitePool;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::project_commands::create_project,
            commands::project_commands::list_projects,
            commands::project_commands::get_project,
            commands::project_commands::delete_project,
            commands::project_commands::update_project,
            commands::page_commands::create_page,
            commands::page_commands::list_pages,
            commands::page_commands::delete_page,
            commands::page_commands::rename_page,
            commands::model_commands::create_model_config,
            commands::model_commands::list_model_configs,
            commands::model_commands::delete_model_config,
        ])
        .setup(|app| {
            // NOTE on data directory paths:
            // - app.path().app_data_dir() is for INTERNAL app data (database file).
            //   This is platform-specific, e.g., ~/.local/share/com.ai-proto-tool.dev/ on Linux,
            //   %APPDATA%/ai-proto-tool/ on Windows.
            // - dirs::document_dir()/AI-Prototyper is for USER-VISIBLE project files.
            //   This is ~/Documents/AI-Prototyper/ on all platforms.
            // These are intentionally separate paths.

            let app_data_dir = match app.path().app_data_dir() {
                Ok(dir) => dir,
                Err(e) => {
                    eprintln!("Failed to get app data directory: {}", e);
                    return Err(e.into());
                }
            };

            if let Err(e) = std::fs::create_dir_all(&app_data_dir) {
                eprintln!("Failed to create app data directory: {}", e);
                return Err(Box::new(std::io::Error::new(
                    std::io::ErrorKind::Other,
                    format!("Failed to create app data directory: {}", e),
                )) as std::error::Error);
            }

            let doc_dir = match fs::dirs::get_app_data_dir() {
                Ok(dir) => dir,
                Err(e) => {
                    eprintln!("Failed to get document directory: {}", e);
                    return Err(Box::new(std::io::Error::new(
                        std::io::ErrorKind::Other,
                        format!("Failed to get document directory: {}", e),
                    )) as std::error::Error);
                }
            };

            if let Err(e) = fs::dirs::initialize_app_directories(&doc_dir) {
                eprintln!("Failed to initialize directories: {}", e);
                return Err(Box::new(std::io::Error::new(
                    std::io::ErrorKind::Other,
                    format!("Failed to initialize directories: {}", e),
                )) as std::error::Error);
            }

            // Set up SQLite pool using sqlx directly
            let db_path = format!("sqlite:{}/app.db?mode=rwc", app_data_dir.display());
            let pool = tauri::async_runtime::block_on(async {
                let pool = match SqlitePool::connect(&db_path).await {
                    Ok(pool) => pool,
                    Err(e) => {
                        eprintln!("Database initialization failed: {}", e);
                        panic!("Database initialization failed: {}", e);
                    }
                };

                // Run migrations
                if let Err(e) = sqlx::query(db::migrations::CREATE_PROJECTS).execute(&pool).await {
                    eprintln!("Projects migration failed: {}", e);
                    panic!("Projects migration failed: {}", e);
                }
                if let Err(e) = sqlx::query(db::migrations::CREATE_PAGES).execute(&pool).await {
                    eprintln!("Pages migration failed: {}", e);
                    panic!("Pages migration failed: {}", e);
                }
                if let Err(e) = sqlx::query(db::migrations::CREATE_MODEL_CONFIGS).execute(&pool).await {
                    eprintln!("Model configs migration failed: {}", e);
                    panic!("Model configs migration failed: {}", e);
                }

                pool
            });

            app.manage(pool);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

Also update `src-tauri/src/main.rs` to:
```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    ai_proto_tool_lib::run()
}
```

Note: Check the `Cargo.toml` `[lib]` section. It should have:
```toml
[lib]
name = "ai_proto_tool_lib"
crate-type = ["staticlib", "cdylib", "rlib"]
```

**Important:** The scaffolding tool may generate a different library name based on the project name (e.g., `ai_proto_tool` or `ai_proto_tool_lib`). Verify the crate lib name in `Cargo.toml` `[lib]` section matches `ai_proto_tool_lib` (the name used in `main.rs`). If the scaffolding generates a different name, either update the `[lib]` name or update `main.rs` to use the generated name.

- [ ] **Step 5: Configure Tauri capabilities**

In `src-tauri/capabilities/default.json`, add the FS and Dialog permissions:
```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "dialog:default",
    "fs:default"
  ]
}
```

- [ ] **Step 6: Verify Rust compilation**

Run: `cargo check --manifest-path src-tauri/Cargo.toml`

Expected: Compiles with no errors. Fix any import or type errors.

Run: `cargo test --manifest-path src-tauri/Cargo.toml`

Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src-tauri/src/ src-tauri/capabilities/
git commit -m "feat: add Tauri IPC commands for projects, pages, and model configs"
```

---

## Task 6: Frontend — i18n Setup

**Files:**
- Create: `src/i18n/index.ts`
- Create: `src/i18n/locales/zh-CN/translation.json`

- [ ] **Step 1: Configure i18next**

Create `src/i18n/index.ts`:
```typescript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import zhCN from "./locales/zh-CN/translation.json";

i18n.use(initReactI18next).init({
  resources: {
    "zh-CN": { translation: zhCN },
  },
  lng: "zh-CN",
  fallbackLng: "zh-CN",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
```

- [ ] **Step 2: Create Chinese language pack**

Create `src/i18n/locales/zh-CN/translation.json`:
```json
{
  "app": {
    "name": "AI-Proto-Tool"
  },
  "welcome": {
    "title": "欢迎使用 AI-Proto-Tool",
    "subtitle": "AI驱动的原型设计工具",
    "newProject": "新建项目",
    "openProject": "打开项目",
    "recentProjects": "最近项目",
    "noProjects": "还没有项目，点击上方按钮创建第一个项目",
    "createProject": "创建项目",
    "projectName": "项目名称",
    "projectDescription": "项目描述",
    "canvasSize": "画布尺寸",
    "cancel": "取消",
    "delete": "删除",
    "deleteConfirm": "确定要删除这个项目吗？此操作不可撤销。"
  },
  "editor": {
    "menu": {
      "file": "文件",
      "edit": "编辑",
      "view": "视图",
      "export": "导出",
      "settings": "设置"
    },
    "toolbar": {
      "select": "选择",
      "pen": "画笔",
      "rectangle": "矩形",
      "text": "文字",
      "undo": "撤销",
      "redo": "重做"
    },
    "status": {
      "page": "页面",
      "canvasSize": "画布尺寸",
      "objects": "对象",
      "saved": "已保存",
      "saving": "保存中...",
      "unsaved": "未保存"
    }
  },
  "settings": {
    "title": "设置",
    "theme": "主题",
    "dark": "暗色",
    "light": "亮色",
    "language": "语言",
    "modelConfig": "模型配置"
  }
}
```

- [ ] **Step 3: Import i18n in main.tsx**

Update `src/main.tsx` to include the i18n import:
```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@/styles/globals.css";
import "@/i18n";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 4: Write test for i18n setup**

Create `tests/i18n.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import i18n from "@/i18n";

describe("i18n configuration", () => {
  it("should have zh-CN as default language", () => {
    expect(i18n.language).toBe("zh-CN");
  });

  it("should translate app name", () => {
    expect(i18n.t("app.name")).toBe("AI-Proto-Tool");
  });

  it("should translate welcome title", () => {
    expect(i18n.t("welcome.title")).toBe("欢迎使用 AI-Proto-Tool");
  });

  it("should translate editor menu items", () => {
    expect(i18n.t("editor.menu.file")).toBe("文件");
    expect(i18n.t("editor.menu.edit")).toBe("编辑");
  });
});
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`

Expected: All 4 i18n tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/i18n/ src/main.tsx tests/i18n.test.ts
git commit -m "feat: add i18next configuration with Chinese language pack"
```

---

## Task 7: Frontend — Zustand Stores

**Files:**
- Create: `src/stores/projectStore.ts`
- Create: `src/stores/settingsStore.ts`
- Create: `src/stores/uiStore.ts`
- Test: `tests/stores/projectStore.test.ts`
- Test: `tests/stores/settingsStore.test.ts`
- Test: `tests/stores/uiStore.test.ts`

- [ ] **Step 1: Write failing test for projectStore**

Create `tests/stores/projectStore.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useProjectStore } from "@/stores/projectStore";

describe("projectStore", () => {
  beforeEach(() => {
    useProjectStore.setState({
      projects: [],
      currentProject: null,
      pages: [],
    });
  });

  it("should start with empty projects list", () => {
    const state = useProjectStore.getState();
    expect(state.projects).toEqual([]);
    expect(state.currentProject).toBeNull();
  });

  it("should set projects", () => {
    const mockProject = {
      id: "test-id",
      name: "Test",
      description: "",
      coverImage: "",
      canvasPreset: "desktop_1440x900",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };

    useProjectStore.getState().setProjects([mockProject]);
    expect(useProjectStore.getState().projects).toHaveLength(1);
    expect(useProjectStore.getState().projects[0].name).toBe("Test");
  });

  it("should set current project", () => {
    const mockProject = {
      id: "test-id",
      name: "Test",
      description: "",
      coverImage: "",
      canvasPreset: "desktop_1440x900",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };

    useProjectStore.getState().setCurrentProject(mockProject);
    expect(useProjectStore.getState().currentProject?.id).toBe("test-id");
  });

  it("should clear current project", () => {
    useProjectStore.getState().setCurrentProject({
      id: "test",
      name: "Test",
      description: "",
      coverImage: "",
      canvasPreset: "desktop_1440x900",
      createdAt: "",
      updatedAt: "",
    });
    useProjectStore.getState().clearCurrentProject();
    expect(useProjectStore.getState().currentProject).toBeNull();
  });

  it("should set pages", () => {
    const mockPage = {
      id: "page-id",
      projectId: "proj-id",
      name: "Home",
      thumbnail: "",
      sortOrder: 0,
      canvasWidth: 1440,
      canvasHeight: 900,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };

    useProjectStore.getState().setPages([mockPage]);
    expect(useProjectStore.getState().pages).toHaveLength(1);
    expect(useProjectStore.getState().pages[0].name).toBe("Home");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/stores/projectStore.test.ts`

Expected: FAIL — module `@/stores/projectStore` not found.

- [ ] **Step 3: Write projectStore implementation**

Create `src/stores/projectStore.ts`:
```typescript
import { create } from "zustand";
import type { Project, Page } from "@/types";

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  pages: Page[];
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project) => void;
  clearCurrentProject: () => void;
  setPages: (pages: Page[]) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  pages: [],
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  clearCurrentProject: () => set({ currentProject: null, pages: [] }),
  setPages: (pages) => set({ pages }),
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/stores/projectStore.test.ts`

Expected: All 5 projectStore tests PASS.

- [ ] **Step 5: Write failing test for settingsStore**

Create `tests/stores/settingsStore.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "@/stores/settingsStore";

describe("settingsStore", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      theme: "dark",
      language: "zh-CN",
    });
  });

  it("should default to dark theme", () => {
    expect(useSettingsStore.getState().theme).toBe("dark");
  });

  it("should default to Chinese language", () => {
    expect(useSettingsStore.getState().language).toBe("zh-CN");
  });

  it("should toggle theme", () => {
    useSettingsStore.getState().setTheme("light");
    expect(useSettingsStore.getState().theme).toBe("light");
    useSettingsStore.getState().setTheme("dark");
    expect(useSettingsStore.getState().theme).toBe("dark");
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- tests/stores/settingsStore.test.ts`

Expected: FAIL — module `@/stores/settingsStore` not found.

- [ ] **Step 7: Write settingsStore implementation**

Create `src/stores/settingsStore.ts`:
```typescript
import { create } from "zustand";
import type { ThemeMode } from "@/types";

interface SettingsState {
  theme: ThemeMode;
  language: string;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: "dark",
  language: "zh-CN",
  setTheme: (theme) => set({ theme }),
  setLanguage: (language) => set({ language }),
}));
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test -- tests/stores/settingsStore.test.ts`

Expected: All 3 settingsStore tests PASS.

- [ ] **Step 9: Write failing test for uiStore**

Create `tests/stores/uiStore.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useUiStore } from "@/stores/uiStore";

describe("uiStore", () => {
  beforeEach(() => {
    useUiStore.setState({
      leftPanelVisible: true,
      rightPanelVisible: true,
      activeTool: "select",
      view: "welcome",
    });
  });

  it("should default to showing both panels", () => {
    expect(useUiStore.getState().leftPanelVisible).toBe(true);
    expect(useUiStore.getState().rightPanelVisible).toBe(true);
  });

  it("should toggle left panel", () => {
    useUiStore.getState().toggleLeftPanel();
    expect(useUiStore.getState().leftPanelVisible).toBe(false);
    useUiStore.getState().toggleLeftPanel();
    expect(useUiStore.getState().leftPanelVisible).toBe(true);
  });

  it("should toggle right panel", () => {
    useUiStore.getState().toggleRightPanel();
    expect(useUiStore.getState().rightPanelVisible).toBe(false);
  });

  it("should set active tool", () => {
    useUiStore.getState().setActiveTool("pen");
    expect(useUiStore.getState().activeTool).toBe("pen");
  });

  it("should switch view between welcome and editor", () => {
    useUiStore.getState().setView("editor");
    expect(useUiStore.getState().view).toBe("editor");
    useUiStore.getState().setView("welcome");
    expect(useUiStore.getState().view).toBe("welcome");
  });
});
```

- [ ] **Step 10: Run test to verify it fails**

Run: `npm test -- tests/stores/uiStore.test.ts`

Expected: FAIL — module `@/stores/uiStore` not found.

- [ ] **Step 11: Write uiStore implementation**

Create `src/stores/uiStore.ts`:
```typescript
import { create } from "zustand";

export type ToolType = "select" | "pen" | "rectangle" | "text";
export type ViewType = "welcome" | "editor";

interface UiState {
  leftPanelVisible: boolean;
  rightPanelVisible: boolean;
  activeTool: ToolType;
  view: ViewType;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setActiveTool: (tool: ToolType) => void;
  setView: (view: ViewType) => void;
}

export const useUiStore = create<UiState>((set) => ({
  leftPanelVisible: true,
  rightPanelVisible: true,
  activeTool: "select",
  view: "welcome",
  toggleLeftPanel: () => set((state) => ({ leftPanelVisible: !state.leftPanelVisible })),
  toggleRightPanel: () => set((state) => ({ rightPanelVisible: !state.rightPanelVisible })),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setView: (view) => set({ view }),
}));
```

- [ ] **Step 12: Run all store tests**

Run: `npm test -- tests/stores/`

Expected: All 13 store tests PASS (5 + 3 + 5).

- [ ] **Step 13: Commit**

```bash
git add src/stores/ tests/stores/
git commit -m "feat: add Zustand stores for project, settings, and UI state"
```

---

## Task 8: Frontend — Theme System

**Files:**
- Create: `src/hooks/useTheme.ts`
- Create: `src/components/ui/ThemeToggle.tsx`
- Test: `tests/components/ui/ThemeToggle.test.tsx`

- [ ] **Step 1: Create useTheme hook**

Create `src/hooks/useTheme.ts`:
```typescript
import { useEffect } from "react";
import { useSettingsStore } from "@/stores/settingsStore";

export function useTheme() {
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return { theme, setTheme, toggleTheme };
}
```

- [ ] **Step 2: Write test for ThemeToggle component**

Create `tests/components/ui/ThemeToggle.test.tsx`:
```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useSettingsStore } from "@/stores/settingsStore";

describe("ThemeToggle", () => {
  it("should render a toggle button", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should show current theme as button text", () => {
    useSettingsStore.setState({ theme: "dark" });
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toHaveTextContent("亮色");
  });

  it("should toggle theme on click", async () => {
    useSettingsStore.setState({ theme: "dark" });
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole("button"));
    expect(useSettingsStore.getState().theme).toBe("light");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- tests/components/ui/ThemeToggle.test.tsx`

Expected: FAIL — module `@/components/ui/ThemeToggle` not found.

- [ ] **Step 4: Write ThemeToggle implementation**

Create `src/components/ui/ThemeToggle.tsx`:
```typescript
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-1.5 px-2 py-1 rounded text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
      aria-label={theme === "dark" ? t("settings.light") : t("settings.dark")}
    >
      {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
      {theme === "dark" ? t("settings.light") : t("settings.dark")}
    </button>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- tests/components/ui/ThemeToggle.test.tsx`

Expected: All 3 ThemeToggle tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/ src/components/ui/ tests/components/
git commit -m "feat: add theme system with dark/light toggle"
```

---

## Task 9: Frontend — Welcome Screen and Project Management

**Files:**
- Create: `src/components/welcome/WelcomeScreen.tsx`
- Create: `src/components/welcome/ProjectList.tsx`
- Create: `src/components/welcome/CreateProjectDialog.tsx`
- Test: `tests/components/welcome/WelcomeScreen.test.tsx`
- Test: `tests/components/welcome/CreateProjectDialog.test.tsx`

- [ ] **Step 1: Write failing test for CreateProjectDialog**

Create `tests/components/welcome/CreateProjectDialog.test.tsx`:
```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateProjectDialog } from "@/components/welcome/CreateProjectDialog";

describe("CreateProjectDialog", () => {
  it("should render project name input", () => {
    render(<CreateProjectDialog open={true} onClose={() => {}} onSubmit={() => {}} />);
    expect(screen.getByLabelText("项目名称")).toBeInTheDocument();
  });

  it("should render create and cancel buttons", () => {
    render(<CreateProjectDialog open={true} onClose={() => {}} onSubmit={() => {}} />);
    expect(screen.getByText("创建项目")).toBeInTheDocument();
    expect(screen.getByText("取消")).toBeInTheDocument();
  });

  it("should call onSubmit with form data", async () => {
    const handleSubmit = vi.fn();
    render(<CreateProjectDialog open={true} onClose={() => {}} onSubmit={handleSubmit} />);

    await userEvent.type(screen.getByLabelText("项目名称"), "My Project");
    await userEvent.click(screen.getByText("创建项目"));

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: "My Project" }),
    );
  });

  it("should not submit with empty name", async () => {
    const handleSubmit = vi.fn();
    render(<CreateProjectDialog open={true} onClose={() => {}} onSubmit={handleSubmit} />);

    await userEvent.click(screen.getByText("创建项目"));
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/components/welcome/CreateProjectDialog.test.tsx`

Expected: FAIL — module not found.

- [ ] **Step 3: Write CreateProjectDialog implementation**

Create `src/components/welcome/CreateProjectDialog.tsx`:
```typescript
import { useState } from "react";
import { useTranslation } from "react-i18next";
import * as Dialog from "@radix-ui/react-dialog";
import { CANVAS_PRESETS } from "@/types";

interface CreateProjectFormData {
  name: string;
  description: string;
  canvasPreset: string;
}

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectFormData) => void;
}

export function CreateProjectDialog({ open, onClose, onSubmit }: CreateProjectDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [canvasPreset, setCanvasPreset] = useState(CANVAS_PRESETS[0].name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim(), canvasPreset });
    setName("");
    setDescription("");
    setCanvasPreset(CANVAS_PRESETS[0].name);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-surface rounded-lg p-6 w-[480px] border border-border">
          <Dialog.Title className="text-lg font-medium text-text-primary mb-4">
            {t("welcome.createProject")}
          </Dialog.Title>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="project-name" className="block text-sm text-text-secondary mb-1">
                {t("welcome.projectName")}
              </label>
              <input
                id="project-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded text-text-primary focus:outline-none focus:border-accent"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="project-desc" className="block text-sm text-text-secondary mb-1">
                {t("welcome.projectDescription")}
              </label>
              <textarea
                id="project-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded text-text-primary focus:outline-none focus:border-accent resize-none"
              />
            </div>
            <div>
              <label htmlFor="canvas-preset" className="block text-sm text-text-secondary mb-1">
                {t("welcome.canvasSize")}
              </label>
              <select
                id="canvas-preset"
                value={canvasPreset}
                onChange={(e) => setCanvasPreset(e.target.value)}
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded text-text-primary focus:outline-none focus:border-accent"
              >
                {CANVAS_PRESETS.map((preset) => (
                  <option key={preset.name} value={preset.name}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                {t("welcome.cancel")}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-accent text-white rounded hover:bg-accent-hover transition-colors"
              >
                {t("welcome.createProject")}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/components/welcome/CreateProjectDialog.test.tsx`

Expected: All 4 CreateProjectDialog tests PASS.

- [ ] **Step 5: Create ProjectList component**

Create `src/components/welcome/ProjectList.tsx`:
```typescript
import { useTranslation } from "react-i18next";
import { FolderOpen, Trash2 } from "lucide-react";
import type { Project } from "@/types";

interface ProjectListProps {
  projects: Project[];
  onOpen: (project: Project) => void;
  onDelete: (id: string) => void;
}

export function ProjectList({ projects, onOpen, onDelete }: ProjectListProps) {
  const { t } = useTranslation();

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        {t("welcome.noProjects")}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <div
          key={project.id}
          className="group bg-bg-surface border border-border rounded-lg p-4 hover:border-accent transition-colors cursor-pointer"
          onClick={() => onOpen(project)}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-medium text-text-primary truncate">
              {project.name}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-danger transition-all"
              aria-label={t("welcome.delete")}
            >
              <Trash2 size={14} />
            </button>
          </div>
          {project.description && (
            <p className="text-xs text-text-muted line-clamp-2 mb-3">
              {project.description}
            </p>
          )}
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <FolderOpen size={12} />
            <span>{project.canvasPreset}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Create WelcomeScreen component**

Create `src/components/welcome/WelcomeScreen.tsx`:
```typescript
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useProjectStore } from "@/stores/projectStore";
import { useUiStore } from "@/stores/uiStore";
import { ProjectList } from "./ProjectList";
import { CreateProjectDialog } from "./CreateProjectDialog";
import type { Project } from "@/types";

interface CreateProjectFormData {
  name: string;
  description: string;
  canvasPreset: string;
}

export function WelcomeScreen() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const projects = useProjectStore((s) => s.projects);
  const setProjects = useProjectStore((s) => s.setProjects);
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);
  const setView = useUiStore((s) => s.setView);

  const handleCreateProject = async (data: CreateProjectFormData) => {
    try {
      const project = await invoke("create_project", {
        input: {
          name: data.name,
          description: data.description,
          canvas_preset: data.canvasPreset,
        },
      }) as Project;
      const updated = await invoke("list_projects") as Project[];
      setProjects(updated);
      setCurrentProject(project);
      setView("editor");
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const handleOpenProject = (project: Project) => {
    setCurrentProject(project);
    setView("editor");
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await invoke("delete_project", { id });
      const updated = await invoke("list_projects") as Project[];
      setProjects(updated);
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  return (
    <div className="h-screen bg-bg-primary flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          {t("welcome.title")}
        </h1>
        <p className="text-text-secondary mb-8">
          {t("welcome.subtitle")}
        </p>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-text-primary">
            {t("welcome.recentProjects")}
          </h2>
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
          >
            <Plus size={16} />
            {t("welcome.newProject")}
          </button>
        </div>
        <ProjectList
          projects={projects}
          onOpen={handleOpenProject}
          onDelete={handleDeleteProject}
        />
      </div>
      <CreateProjectDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}
```

- [ ] **Step 7: Write test for WelcomeScreen**

Create `tests/components/welcome/WelcomeScreen.test.tsx`:
```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WelcomeScreen } from "@/components/welcome/WelcomeScreen";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue([]),
}));

describe("WelcomeScreen", () => {
  it("should render welcome title", () => {
    render(<WelcomeScreen />);
    expect(screen.getByText("欢迎使用 AI-Proto-Tool")).toBeInTheDocument();
  });

  it("should render new project button", () => {
    render(<WelcomeScreen />);
    expect(screen.getByText("新建项目")).toBeInTheDocument();
  });

  it("should show empty state when no projects", () => {
    render(<WelcomeScreen />);
    expect(screen.getByText(/还没有项目/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 8: Run all welcome tests**

Run: `npm test -- tests/components/welcome/`

Expected: All 7 welcome tests PASS (4 dialog + 3 welcome).

- [ ] **Step 9: Commit**

```bash
git add src/components/welcome/ tests/components/welcome/
git commit -m "feat: add welcome screen with project creation dialog"
```

---

## Task 10: Frontend — Editor Layout Shell

**Files:**
- Create: `src/components/editor/EditorLayout.tsx`
- Create: `src/components/editor/MenuBar.tsx`
- Create: `src/components/editor/Toolbar.tsx`
- Create: `src/components/editor/StatusBar.tsx`
- Create: `src/components/editor/PagePanel.tsx`
- Create: `src/components/editor/CanvasArea.tsx`
- Create: `src/components/editor/ChatPanel.tsx`
- Test: `tests/components/editor/EditorLayout.test.tsx`
- Test: `tests/components/editor/MenuBar.test.tsx`
- Test: `tests/components/editor/StatusBar.test.tsx`

- [ ] **Step 1: Create MenuBar component**

Create `src/components/editor/MenuBar.tsx`:
```typescript
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useProjectStore } from "@/stores/projectStore";
import { useUiStore } from "@/stores/uiStore";

export function MenuBar() {
  const { t } = useTranslation();
  const currentProject = useProjectStore((s) => s.currentProject);
  const setView = useUiStore((s) => s.setView);
  const clearCurrentProject = useProjectStore((s) => s.clearCurrentProject);

  const handleBackToWelcome = () => {
    clearCurrentProject();
    setView("welcome");
  };

  return (
    <div className="h-8 bg-bg-secondary border-b border-border flex items-center px-3 text-xs select-none">
      <button
        onClick={handleBackToWelcome}
        className="text-text-secondary hover:text-text-primary mr-3 transition-colors"
      >
        {currentProject?.name ?? "AI-Proto-Tool"}
      </button>
      <span className="text-text-muted mx-1">|</span>
      {(["file", "edit", "view", "export"] as const).map((menu) => (
        <button
          key={menu}
          className="px-2 py-0.5 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors"
        >
          {t(`editor.menu.${menu}`)}
        </button>
      ))}
      <div className="flex-1" />
      <ThemeToggle />
    </div>
  );
}
```

- [ ] **Step 2: Create Toolbar component (placeholder)**

Create `src/components/editor/Toolbar.tsx`:
```typescript
import { useTranslation } from "react-i18next";
import { MousePointer, Pen, Square, Type, Undo2, Redo2 } from "lucide-react";
import { useUiStore, type ToolType } from "@/stores/uiStore";

const TOOLS: { type: ToolType; icon: typeof MousePointer; labelKey: string }[] = [
  { type: "select", icon: MousePointer, labelKey: "editor.toolbar.select" },
  { type: "pen", icon: Pen, labelKey: "editor.toolbar.pen" },
  { type: "rectangle", icon: Square, labelKey: "editor.toolbar.rectangle" },
  { type: "text", icon: Type, labelKey: "editor.toolbar.text" },
];

export function Toolbar() {
  const { t } = useTranslation();
  const activeTool = useUiStore((s) => s.activeTool);
  const setActiveTool = useUiStore((s) => s.setActiveTool);

  return (
    <div className="h-10 bg-bg-secondary border-b border-border flex items-center px-3 gap-1">
      {TOOLS.map(({ type, icon: Icon, labelKey }) => (
        <button
          key={type}
          onClick={() => setActiveTool(type)}
          className={`p-1.5 rounded transition-colors ${
            activeTool === type
              ? "bg-accent text-white"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
          }`}
          title={t(labelKey)}
        >
          <Icon size={16} />
        </button>
      ))}
      <div className="w-px h-5 bg-border mx-2" />
      <button className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors" title={t("editor.toolbar.undo")}>
        <Undo2 size={16} />
      </button>
      <button className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors" title={t("editor.toolbar.redo")}>
        <Redo2 size={16} />
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create StatusBar component**

Create `src/components/editor/StatusBar.tsx`:
```typescript
import { useTranslation } from "react-i18next";
import { useProjectStore } from "@/stores/projectStore";

export function StatusBar() {
  const { t } = useTranslation();
  const currentProject = useProjectStore((s) => s.currentProject);
  const pages = useProjectStore((s) => s.pages);

  const currentPage = pages.length > 0 ? pages[0] : null;

  return (
    <div className="h-6 bg-bg-secondary border-t border-border flex items-center px-3 text-xs text-text-muted select-none">
      {currentPage && (
        <>
          <span>
            {t("editor.status.page")}: {currentPage.name}
          </span>
          <span className="mx-2">|</span>
          <span>
            {t("editor.status.canvasSize")}: {currentPage.canvasWidth}×{currentPage.canvasHeight}
          </span>
          <span className="mx-2">|</span>
        </>
      )}
      <span>{t("editor.status.saved")}</span>
      <div className="flex-1" />
      {currentProject && (
        <span className="text-text-muted">{currentProject.name}</span>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create placeholder panels**

Create `src/components/editor/PagePanel.tsx`:
```typescript
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";

export function PagePanel() {
  const { t } = useTranslation();

  return (
    <div className="w-[200px] bg-bg-secondary border-r border-border flex flex-col">
      <div className="p-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">页面</span>
        <button className="p-1 text-text-muted hover:text-accent transition-colors">
          <Plus size={14} />
        </button>
      </div>
      <div className="flex-1 p-2 text-xs text-text-muted">
        {/* Page list will be implemented in Plan 2 */}
        <p>暂无页面</p>
      </div>
    </div>
  );
}
```

Create `src/components/editor/CanvasArea.tsx`:
```typescript
export function CanvasArea() {
  return (
    <div className="flex-1 bg-bg-primary flex items-center justify-center">
      <div className="text-text-muted text-sm">
        {/* Canvas will be implemented in Plan 2 */}
        画板工作区
      </div>
    </div>
  );
}
```

Create `src/components/editor/ChatPanel.tsx`:
```typescript
import { useTranslation } from "react-i18next";

export function ChatPanel() {
  const { t } = useTranslation();

  return (
    <div className="w-[300px] bg-bg-secondary border-l border-border flex flex-col">
      <div className="p-3 border-b border-border">
        <span className="text-xs font-medium text-text-secondary">AI 助手</span>
      </div>
      <div className="flex-1 p-3 text-xs text-text-muted">
        {/* Chat will be implemented in Plan 3 */}
        <p>AI 对话面板</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create EditorLayout component**

Create `src/components/editor/EditorLayout.tsx`:
```typescript
import { MenuBar } from "./MenuBar";
import { Toolbar } from "./Toolbar";
import { StatusBar } from "./StatusBar";
import { PagePanel } from "./PagePanel";
import { CanvasArea } from "./CanvasArea";
import { ChatPanel } from "./ChatPanel";
import { useUiStore } from "@/stores/uiStore";

export function EditorLayout() {
  const leftPanelVisible = useUiStore((s) => s.leftPanelVisible);
  const rightPanelVisible = useUiStore((s) => s.rightPanelVisible);

  return (
    <div className="h-screen flex flex-col bg-bg-primary text-text-primary">
      <MenuBar />
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        {leftPanelVisible && <PagePanel />}
        <CanvasArea />
        {rightPanelVisible && <ChatPanel />}
      </div>
      <StatusBar />
    </div>
  );
}
```

- [ ] **Step 6: Write tests for editor components**

Create `tests/components/editor/EditorLayout.test.tsx`:
```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EditorLayout } from "@/components/editor/EditorLayout";

describe("EditorLayout", () => {
  it("should render all major sections", () => {
    render(<EditorLayout />);
    expect(screen.getByText("画板工作区")).toBeInTheDocument();
    expect(screen.getByText("AI 对话面板")).toBeInTheDocument();
    expect(screen.getByText("暂无页面")).toBeInTheDocument();
  });

  it("should render status bar", () => {
    render(<EditorLayout />);
    expect(screen.getByText("已保存")).toBeInTheDocument();
  });
});
```

Create `tests/components/editor/MenuBar.test.tsx`:
```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MenuBar } from "@/components/editor/MenuBar";

describe("MenuBar", () => {
  it("should render menu items", () => {
    render(<MenuBar />);
    expect(screen.getByText("文件")).toBeInTheDocument();
    expect(screen.getByText("编辑")).toBeInTheDocument();
    expect(screen.getByText("视图")).toBeInTheDocument();
    expect(screen.getByText("导出")).toBeInTheDocument();
  });
});
```

Create `tests/components/editor/StatusBar.test.tsx`:
```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBar } from "@/components/editor/StatusBar";

describe("StatusBar", () => {
  it("should render saved status", () => {
    render(<StatusBar />);
    expect(screen.getByText("已保存")).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Run all editor tests**

Run: `npm test -- tests/components/editor/`

Expected: All 5 editor tests PASS (2 + 1 + 1 + 1).

- [ ] **Step 8: Commit**

```bash
git add src/components/editor/ tests/components/editor/
git commit -m "feat: add editor layout with menu bar, toolbar, status bar, and placeholder panels"
```

---

## Task 11: Frontend — Wire Up App Routing

**Files:**
- Modify: `src/App.tsx` (add view switching)
- Test: `tests/App.test.tsx`

- [ ] **Step 1: Write failing test for App view switching**

Create `tests/App.test.tsx`:
```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "@/App";
import { useUiStore } from "@/stores/uiStore";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue([]),
}));

describe("App", () => {
  it("should show welcome screen by default", () => {
    render(<App />);
    expect(screen.getByText("欢迎使用 AI-Proto-Tool")).toBeInTheDocument();
  });

  it("should show editor when view is set to editor", () => {
    useUiStore.getState().setView("editor");
    render(<App />);
    expect(screen.getByText("画板工作区")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/App.test.tsx`

Expected: FAIL — App doesn't implement view switching yet.

- [ ] **Step 3: Write App implementation**

Update `src/App.tsx`:
```typescript
import { useUiStore } from "@/stores/uiStore";
import { WelcomeScreen } from "@/components/welcome/WelcomeScreen";
import { EditorLayout } from "@/components/editor/EditorLayout";

function App() {
  const view = useUiStore((s) => s.view);

  if (view === "editor") {
    return <EditorLayout />;
  }

  return <WelcomeScreen />;
}

export default App;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/App.test.tsx`

Expected: All 2 App tests PASS.

- [ ] **Step 5: Run all tests**

Run: `npm test`

Expected: All tests across all files PASS.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx tests/App.test.tsx
git commit -m "feat: wire up App with welcome/editor view switching"
```

---

## Task 12: End-to-End Integration Verification

**Files:** None new — verifying existing code.

- [ ] **Step 1: Run full Rust test suite**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`

Expected: All Rust tests PASS.

- [ ] **Step 2: Run full frontend test suite**

Run: `npm test`

Expected: All frontend tests PASS.

- [ ] **Step 3: Run Tauri dev build**

Run: `npm run tauri dev`

Expected: App window opens showing the welcome screen with dark theme and Chinese text. The "新建项目" button is visible.

Verify:
1. Click "新建项目" — dialog appears with name input, description, canvas size selector
2. Enter a project name and click "创建项目" — switches to editor view
3. Editor shows three-panel layout: page panel (left), canvas area (center), chat panel (right)
4. Menu bar shows project name, File/Edit/View/Export menus, and theme toggle
5. Click project name in menu bar — returns to welcome screen
6. Created project appears in the project list

- [ ] **Step 4: Verify database and file system**

After creating a project, check:
```bash
ls ~/Documents/AI-Prototyper/
ls ~/Documents/AI-Prototyper/projects/
```

Expected: `app.db` exists, project directory with `meta.json` exists.

- [ ] **Step 5: Run production build**

Run: `npm run tauri build`

Expected: Build completes without errors, producing an executable.

- [ ] **Step 6: Final commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix: integration fixes from end-to-end verification"
```

Only commit if changes were needed. Skip if everything passed.

---

## Summary

After completing all 12 tasks, the project will have:

- **Tauri 2.x desktop app** that opens in a window with dark theme
- **SQLite database** with projects, pages, model_configs tables
- **File system structure** under `~/Documents/AI-Prototyper/`
- **Welcome screen** with project creation and listing
- **Three-panel editor** with menu bar, toolbar, canvas placeholder, and chat placeholder
- **i18n** with Chinese language pack
- **Theme toggle** between dark and light modes
- **Zustand stores** for project, settings, and UI state
- **Test coverage** for all stores, key components, and data structures

**Next plan:** Plan 2 — Canvas Engine (Fabric.js integration, drawing tools, page CRUD, element operations)
