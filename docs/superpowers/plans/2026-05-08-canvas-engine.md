# Canvas Engine + Page Management — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Fabric.js canvas with drawing tools (select, pen, rectangle, text), implement page management with thumbnail previews and drag-and-drop reordering, add undo/redo history, canvas modes (sketch/design), and auto-save with debounced canvas.json serialization.

**Architecture:** Fabric.js Canvas renders inside the existing CanvasArea placeholder. A new `canvasStore` (Zustand) manages canvas state, undo/redo history stack, and save status. Page management talks to existing Rust IPC commands (`create_page`, `list_pages`, `delete_page`, `rename_page`) plus new Tauri commands for canvas.json read/write and preview.png generation. The `uiStore` ToolType drives which Fabric.js drawing mode is active. Each tool is a self-contained module that configures canvas behavior on activation and cleans up on deactivation.

**Tech Stack:** Fabric.js (npm `fabric`), @dnd-kit/core + @dnd-kit/sortable, Zustand, React 18, TypeScript, Vitest, jsdom

---

## Roadmap

This is **Plan 2 of 4** in the AI-Proto-Tool implementation roadmap:

| Plan | Scope | Produces |
|------|-------|----------|
| Plan 1 (done) | Scaffolding + Data Layer + UI Shell | Working desktop app with project CRUD, three-panel editor layout |
| **Plan 2** (this) | Canvas Engine + Page Management + Drawing Tools | Functional Fabric.js canvas with drawing tools, page switching, element operations |
| Plan 3 | AI Integration — Chat + Model Config + Generation | AI conversation panel, model configuration, prototype generation from text/sketch |
| Plan 4 | Export + Navigation + Memory + Skills + Polish | HTML/PNG export, element jump binding, memory system, skill engine, shortcuts |

---

## File Structure

### Rust Backend (`src-tauri/`)

```
src-tauri/src/
├── commands/
│   ├── mod.rs                          # Add new canvas_commands module
│   ├── canvas_commands.rs              # NEW: canvas.json read/write, preview.png export
│   └── page_commands.rs               # MODIFY: add reorder_pages, duplicate_page commands
```

### React Frontend (`src/`)

```
src/
├── stores/
│   ├── canvasStore.ts                  # NEW: canvas state, history, save status
│   └── uiStore.ts                      # MODIFY: add CanvasMode, canvas mode state
├── hooks/
│   ├── useCanvas.ts                    # NEW: Fabric.js canvas lifecycle hook
│   ├── useToolManager.ts               # NEW: tool activation/deactivation manager
│   ├── useKeyboardShortcuts.ts         # NEW: global keyboard shortcuts
│   └── useAutoSave.ts                 # NEW: debounced canvas save hook
├── components/
│   ├── editor/
│   │   ├── CanvasArea.tsx             # MODIFY: replace placeholder with Fabric.js canvas
│   │   ├── PagePanel.tsx             # MODIFY: replace placeholder with full implementation
│   │   ├── PageItem.tsx              # NEW: single page card with thumbnail
│   │   ├── PageContextMenu.tsx       # NEW: right-click menu for pages
│   │   ├── Toolbar.tsx               # MODIFY: add canvas mode toggle, grid toggle
│   │   └── StatusBar.tsx             # MODIFY: show object count, canvas size, save status from canvasStore
│   └── canvas/
│       ├── CanvasRenderer.tsx          # NEW: Fabric.js canvas mount/unmount component
│       ├── GridOverlay.ts             # NEW: grid rendering and snap logic
│       ├── ViewportControls.tsx       # NEW: zoom/pan/fit-to-screen controls
│       ├── tools/
│       │   ├── selectTool.ts          # NEW: select tool logic
│       │   ├── penTool.ts             # NEW: pen/freehand tool logic
│       │   ├── rectangleTool.ts       # NEW: rectangle drawing tool logic
│       │   └── textTool.ts            # NEW: text placement tool logic
│       └── modes/
│           └── canvasModes.ts         # NEW: sketch/design mode configuration
├── types/
│   └── index.ts                       # MODIFY: add CanvasMode type
├── utils/
│   └── canvasSerializer.ts            # NEW: canvas JSON serialization helpers
├── i18n/
│   └── locales/zh-CN/
│       └── translation.json           # MODIFY: add canvas/page/mode translations
```

### Tests

```
tests/
├── stores/
│   └── canvasStore.test.ts            # NEW: canvas store tests
├── components/
│   ├── editor/
│   │   ├── PagePanel.test.tsx         # NEW
│   │   └── Toolbar.test.tsx           # NEW: canvas mode toggle tests
├── hooks/
│   └── useAutoSave.test.ts           # NEW
└── utils/
    └── canvasSerializer.test.ts      # NEW
```

---

## Task 1: Extend Types and UI Store for Canvas Modes

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/stores/uiStore.ts`
- Modify: `src/i18n/locales/zh-CN/translation.json`
- Test: `tests/stores/uiStore.test.ts` (update existing)

- [ ] **Step 1: Write failing test for canvas mode in uiStore**

Update `tests/stores/uiStore.test.ts` — add these tests to the existing describe block:

```typescript
// Add to imports at top:
// import type { ToolType } from "@/stores/uiStore";

it("should default to design canvas mode", () => {
  expect(useUiStore.getState().canvasMode).toBe("design");
});

it("should set canvas mode", () => {
  useUiStore.getState().setCanvasMode("sketch");
  expect(useUiStore.getState().canvasMode).toBe("sketch");
  useUiStore.getState().setCanvasMode("design");
  expect(useUiStore.getState().canvasMode).toBe("design");
});

it("should toggle grid visibility", () => {
  const initial = useUiStore.getState().gridVisible;
  useUiStore.getState().toggleGrid();
  expect(useUiStore.getState().gridVisible).toBe(!initial);
});

it("should store current page id", () => {
  useUiStore.getState().setCurrentPageId("page-123");
  expect(useUiStore.getState().currentPageId).toBe("page-123");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/stores/uiStore.test.ts`

Expected: FAIL — `canvasMode` property does not exist on store state.

- [ ] **Step 3: Add CanvasMode type and update uiStore**

Add to `src/types/index.ts`:

```typescript
export type CanvasMode = "sketch" | "design";
```

Update `src/stores/uiStore.ts`:

```typescript
import { create } from "zustand";
import type { CanvasMode } from "@/types";

export type ToolType = "select" | "pen" | "rectangle" | "text";
export type ViewType = "welcome" | "editor";

interface UiState {
  leftPanelVisible: boolean;
  rightPanelVisible: boolean;
  activeTool: ToolType;
  view: ViewType;
  canvasMode: CanvasMode;
  gridVisible: boolean;
  currentPageId: string;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setActiveTool: (tool: ToolType) => void;
  setView: (view: ViewType) => void;
  setCanvasMode: (mode: CanvasMode) => void;
  toggleGrid: () => void;
  setCurrentPageId: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  leftPanelVisible: true,
  rightPanelVisible: true,
  activeTool: "select",
  view: "welcome",
  canvasMode: "design",
  gridVisible: true,
  currentPageId: "",
  toggleLeftPanel: () => set((state) => ({ leftPanelVisible: !state.leftPanelVisible })),
  toggleRightPanel: () => set((state) => ({ rightPanelVisible: !state.rightPanelVisible })),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setView: (view) => set({ view }),
  setCanvasMode: (canvasMode) => set({ canvasMode }),
  toggleGrid: () => set((state) => ({ gridVisible: !state.gridVisible })),
  setCurrentPageId: (currentPageId) => set({ currentPageId }),
}));
```

- [ ] **Step 4: Add canvas mode and page management i18n keys**

Update `src/i18n/locales/zh-CN/translation.json` — add these keys alongside existing ones:

```json
{
  "app": { "name": "AI-Proto-Tool" },
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
      "redo": "重做",
      "sketchMode": "手绘模式",
      "designMode": "设计模式",
      "toggleGrid": "网格"
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
  "canvas": {
    "modes": {
      "sketch": "手绘模式",
      "design": "设计模式"
    },
    "tools": {
      "select": "选择",
      "pen": "画笔",
      "rectangle": "矩形",
      "text": "文字"
    },
    "viewport": {
      "zoomIn": "放大",
      "zoomOut": "缩小",
      "fitToScreen": "适应屏幕",
      "resetZoom": "重置缩放"
    },
    "grid": {
      "show": "显示网格",
      "hide": "隐藏网格"
    }
  },
  "page": {
    "title": "页面",
    "newPage": "新页面",
    "rename": "重命名",
    "duplicate": "复制页面",
    "delete": "删除页面",
    "deleteConfirm": "确定要删除这个页面吗？",
    "export": "导出页面",
    "untitled": "未命名页面",
    "pageCount": "{{count}} 个页面",
    "emptyList": "暂无页面"
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

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- tests/stores/uiStore.test.ts`

Expected: All uiStore tests PASS (original 5 + new 4 = 9).

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/stores/uiStore.ts src/i18n/locales/zh-CN/translation.json tests/stores/uiStore.test.ts
git commit -m "feat: add CanvasMode type, grid toggle, and currentPageId to uiStore"
```

---

## Task 2: Create canvasStore with Undo/Redo History

**Files:**
- Create: `src/stores/canvasStore.ts`
- Create: `src/utils/canvasSerializer.ts`
- Test: `tests/stores/canvasStore.test.ts`
- Test: `tests/utils/canvasSerializer.test.ts`

- [ ] **Step 1: Write failing test for canvasSerializer**

Create `tests/utils/canvasSerializer.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  serializeCanvas,
  createEmptyCanvasJSON,
  isCanvasJSONEmpty,
} from "@/utils/canvasSerializer";

describe("canvasSerializer", () => {
  it("should create empty canvas JSON with version", () => {
    const json = createEmptyCanvasJSON();
    expect(json.version).toBeDefined();
    expect(json.objects).toEqual([]);
  });

  it("should detect empty canvas JSON", () => {
    const json = createEmptyCanvasJSON();
    expect(isCanvasJSONEmpty(json)).toBe(true);
  });

  it("should detect non-empty canvas JSON", () => {
    const json = createEmptyCanvasJSON();
    json.objects = [{ type: "rect" }];
    expect(isCanvasJSONEmpty(json)).toBe(false);
  });

  it("should serialize canvas data to string", () => {
    const json = createEmptyCanvasJSON();
    const str = serializeCanvas(json);
    const parsed = JSON.parse(str);
    expect(parsed.version).toBeDefined();
    expect(parsed.objects).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/utils/canvasSerializer.test.ts`

Expected: FAIL — module `@/utils/canvasSerializer` not found.

- [ ] **Step 3: Implement canvasSerializer**

Create `src/utils/canvasSerializer.ts`:

```typescript
import { Canvas } from "fabric";

export interface CanvasJSON {
  version: string;
  objects: unknown[];
  [key: string]: unknown;
}

export function createEmptyCanvasJSON(): CanvasJSON {
  return {
    version: "6",
    objects: [],
  };
}

export function isCanvasJSONEmpty(json: CanvasJSON): boolean {
  return json.objects.length === 0;
}

export function serializeCanvas(json: CanvasJSON): string {
  return JSON.stringify(json);
}

export function deserializeCanvas(str: string): CanvasJSON {
  return JSON.parse(str) as CanvasJSON;
}

export function getCanvasJSON(canvas: Canvas): CanvasJSON {
  return canvas.toJSON() as CanvasJSON;
}

export async function loadCanvasJSON(canvas: Canvas, json: CanvasJSON): Promise<void> {
  await canvas.loadFromJSON(json);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/utils/canvasSerializer.test.ts`

Expected: All 4 canvasSerializer tests PASS.

- [ ] **Step 5: Write failing test for canvasStore**

Create `tests/stores/canvasStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useCanvasStore } from "@/stores/canvasStore";

describe("canvasStore", () => {
  beforeEach(() => {
    useCanvasStore.setState({
      history: [],
      historyIndex: -1,
      saveStatus: "saved",
      objectCount: 0,
    });
  });

  it("should start with empty history", () => {
    const state = useCanvasStore.getState();
    expect(state.history).toEqual([]);
    expect(state.historyIndex).toBe(-1);
  });

  it("should start with saved status", () => {
    expect(useCanvasStore.getState().saveStatus).toBe("saved");
  });

  it("should push to history and advance index", () => {
    const snapshot = { version: "6", objects: [] };
    useCanvasStore.getState().pushHistory(snapshot);
    expect(useCanvasStore.getState().history).toHaveLength(1);
    expect(useCanvasStore.getState().historyIndex).toBe(0);
  });

  it("should push multiple snapshots", () => {
    const s1 = { version: "6", objects: [{ type: "rect" }] };
    const s2 = { version: "6", objects: [{ type: "rect" }, { type: "circle" }] };
    useCanvasStore.getState().pushHistory(s1);
    useCanvasStore.getState().pushHistory(s2);
    expect(useCanvasStore.getState().history).toHaveLength(2);
    expect(useCanvasStore.getState().historyIndex).toBe(1);
  });

  it("should truncate future history on push after undo", () => {
    const s1 = { version: "6", objects: [] };
    const s2 = { version: "6", objects: [{ type: "rect" }] };
    const s3 = { version: "6", objects: [{ type: "circle" }] };
    useCanvasStore.getState().pushHistory(s1);
    useCanvasStore.getState().pushHistory(s2);
    useCanvasStore.getState().goBack();
    expect(useCanvasStore.getState().historyIndex).toBe(0);
    useCanvasStore.getState().pushHistory(s3);
    expect(useCanvasStore.getState().history).toHaveLength(2);
    expect(useCanvasStore.getState().historyIndex).toBe(1);
  });

  it("should go back in history", () => {
    const s1 = { version: "6", objects: [] };
    const s2 = { version: "6", objects: [{ type: "rect" }] };
    useCanvasStore.getState().pushHistory(s1);
    useCanvasStore.getState().pushHistory(s2);
    const result = useCanvasStore.getState().goBack();
    expect(result).toEqual(s1);
    expect(useCanvasStore.getState().historyIndex).toBe(0);
  });

  it("should go forward in history", () => {
    const s1 = { version: "6", objects: [] };
    const s2 = { version: "6", objects: [{ type: "rect" }] };
    useCanvasStore.getState().pushHistory(s1);
    useCanvasStore.getState().pushHistory(s2);
    useCanvasStore.getState().goBack();
    const result = useCanvasStore.getState().goForward();
    expect(result).toEqual(s2);
    expect(useCanvasStore.getState().historyIndex).toBe(1);
  });

  it("should return null when going back past start", () => {
    const result = useCanvasStore.getState().goBack();
    expect(result).toBeNull();
  });

  it("should return null when going forward past end", () => {
    const s1 = { version: "6", objects: [] };
    useCanvasStore.getState().pushHistory(s1);
    const result = useCanvasStore.getState().goForward();
    expect(result).toBeNull();
  });

  it("should set save status", () => {
    useCanvasStore.getState().setSaveStatus("saving");
    expect(useCanvasStore.getState().saveStatus).toBe("saving");
  });

  it("should set object count", () => {
    useCanvasStore.getState().setObjectCount(5);
    expect(useCanvasStore.getState().objectCount).toBe(5);
  });

  it("should clear history", () => {
    const s1 = { version: "6", objects: [] };
    useCanvasStore.getState().pushHistory(s1);
    useCanvasStore.getState().clearHistory();
    expect(useCanvasStore.getState().history).toEqual([]);
    expect(useCanvasStore.getState().historyIndex).toBe(-1);
  });

  it("should limit history to 50 entries", () => {
    for (let i = 0; i < 60; i++) {
      useCanvasStore.getState().pushHistory({ version: "6", objects: [{ type: "rect", id: i }] });
    }
    expect(useCanvasStore.getState().history.length).toBeLessThanOrEqual(50);
  });

  it("should track undo/redo availability via historyIndex", () => {
    // No history -- cannot undo or redo
    expect(useCanvasStore.getState().historyIndex >= 0).toBe(false);
    expect(useCanvasStore.getState().historyIndex < useCanvasStore.getState().history.length - 1).toBe(false);

    const s1 = { version: "6", objects: [] };
    useCanvasStore.getState().pushHistory(s1);
    // Has history at index 0 -- cannot undo (at first snapshot), cannot redo
    expect(useCanvasStore.getState().historyIndex >= 0).toBe(true);
    expect(useCanvasStore.getState().historyIndex < useCanvasStore.getState().history.length - 1).toBe(false);

    // goBack from index 0 returns null -- stays at index 0
    const result = useCanvasStore.getState().goBack();
    expect(result).toBeNull();
    expect(useCanvasStore.getState().historyIndex).toBe(0);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- tests/stores/canvasStore.test.ts`

Expected: FAIL — module `@/stores/canvasStore` not found.

- [ ] **Step 7: Implement canvasStore**

Create `src/stores/canvasStore.ts`:

```typescript
import { create } from "zustand";
import type { CanvasJSON } from "@/utils/canvasSerializer";

type SaveStatus = "saved" | "saving" | "unsaved";

const MAX_HISTORY = 50;

interface CanvasState {
  history: CanvasJSON[];
  historyIndex: number;
  saveStatus: SaveStatus;
  objectCount: number;

  pushHistory: (snapshot: CanvasJSON) => void;
  goBack: () => CanvasJSON | null;
  goForward: () => CanvasJSON | null;
  clearHistory: () => void;
  setSaveStatus: (status: SaveStatus) => void;
  setObjectCount: (count: number) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  history: [],
  historyIndex: -1,
  saveStatus: "saved",
  objectCount: 0,

  pushHistory: (snapshot) =>
    set((state) => {
      const truncated = state.history.slice(0, state.historyIndex + 1);
      const newHistory = [...truncated, snapshot];
      const trimmed = newHistory.length > MAX_HISTORY
        ? newHistory.slice(newHistory.length - MAX_HISTORY)
        : newHistory;
      return {
        history: trimmed,
        historyIndex: trimmed.length - 1,
        saveStatus: "unsaved",
      };
    }),

  goBack: () => {
    const { historyIndex, history } = get();
    if (historyIndex <= 0) return null;
    const newIndex = historyIndex - 1;
    set({ historyIndex: newIndex });
    return history[newIndex] ?? null;
  },

  goForward: () => {
    const { historyIndex, history } = get();
    if (historyIndex >= history.length - 1) {
      return null;
    }
    const newIndex = historyIndex + 1;
    set({ historyIndex: newIndex });
    return history[newIndex] ?? null;
  },

  clearHistory: () => set({ history: [], historyIndex: -1 }),

  setSaveStatus: (saveStatus) => set({ saveStatus }),

  setObjectCount: (objectCount) => set({ objectCount }),
}));
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test -- tests/stores/canvasStore.test.ts`

Expected: All 14 canvasStore tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/stores/canvasStore.ts src/utils/canvasSerializer.ts tests/stores/canvasStore.test.ts tests/utils/canvasSerializer.test.ts
git commit -m "feat: add canvasStore with undo/redo history and canvas serializer"
```

---

## Task 3: Rust Backend — Canvas File I/O and Page Reorder Commands

**Files:**
- Create: `src-tauri/src/commands/canvas_commands.rs`
- Modify: `src-tauri/src/commands/mod.rs` (add canvas_commands)
- Modify: `src-tauri/src/commands/page_commands.rs` (add reorder_pages, duplicate_page)
- Modify: `src-tauri/src/lib.rs` (register new commands)

- [ ] **Step 1: Add base64 dependency to Cargo.toml**

Add to `src-tauri/Cargo.toml` `[dependencies]`:

```toml
base64 = "0.22"
```

- [ ] **Step 2: Create canvas_commands.rs**

Create `src-tauri/src/commands/canvas_commands.rs`:

```rust
use crate::fs::dirs;
use base64::Engine;

#[tauri::command]
pub async fn save_canvas_json(
    project_id: String,
    page_id: String,
    json: String,
) -> Result<(), String> {
    let app_dir = dirs::get_app_data_dir()?;
    let page_dir = dirs::create_page_directory(&app_dir, &project_id, &page_id)?;
    let path = page_dir.join("canvas.json");
    std::fs::write(&path, json)
        .map_err(|e| format!("Failed to write canvas.json: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn load_canvas_json(
    project_id: String,
    page_id: String,
) -> Result<String, String> {
    let app_dir = dirs::get_app_data_dir()?;
    let path = app_dir
        .join("projects")
        .join(&project_id)
        .join("pages")
        .join(&page_id)
        .join("canvas.json");

    if !path.exists() {
        return Ok(r#"{"version":"6","objects":[]}"#.to_string());
    }

    std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read canvas.json: {}", e))
}

#[tauri::command]
pub async fn save_page_thumbnail(
    project_id: String,
    page_id: String,
    image_data: String,
) -> Result<String, String> {
    let app_dir = dirs::get_app_data_dir()?;
    let page_dir = dirs::create_page_directory(&app_dir, &project_id, &page_id)?;

    let trimmed = image_data.trim_start_matches("data:image/png;base64,");
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(trimmed)
        .map_err(|e| format!("Base64 decode error: {}", e))?;
    let path = page_dir.join("preview.png");
    std::fs::write(&path, bytes)
        .map_err(|e| format!("Failed to write preview.png: {}", e))?;

    Ok(format!("projects/{}/pages/{}/preview.png", project_id, page_id))
}

#[tauri::command]
pub async fn update_page_thumbnail_path(
    pool: tauri::State<'_, tauri_plugin_sql::SqlitePool>,
    page_id: String,
    thumbnail: String,
) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();
    sqlx::query("UPDATE pages SET thumbnail = ?, updated_at = ? WHERE id = ?")
        .bind(&thumbnail)
        .bind(&now)
        .bind(&page_id)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}
```

The `save_page_thumbnail` command handles only the file I/O (write preview.png). The `update_page_thumbnail_path` command updates the database separately. The frontend calls both in sequence when generating a thumbnail.

- [ ] **Step 3: Add page reorder and duplicate commands**

Add to `src-tauri/src/commands/page_commands.rs` (append at end of file):

```rust
#[tauri::command]
pub async fn reorder_pages(
    pool: State<'_, SqlitePool>,
    project_id: String,
    page_ids: Vec<String>,
) -> Result<(), String> {
    let pool = pool.inner();
    let now = chrono::Utc::now().to_rfc3339();
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    for (index, page_id) in page_ids.iter().enumerate() {
        sqlx::query("UPDATE pages SET sort_order = ?, updated_at = ? WHERE id = ? AND project_id = ?")
            .bind(index as i64)
            .bind(&now)
            .bind(page_id)
            .bind(&project_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }
    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn duplicate_page(
    pool: State<'_, SqlitePool>,
    project_id: String,
    page_id: String,
) -> Result<Page, String> {
    let pool_inner = pool.inner();

    let original: Page = sqlx::query_as::<_, Page>(
        "SELECT id, project_id, name, thumbnail, sort_order, canvas_width, canvas_height, created_at, updated_at FROM pages WHERE id = ?"
    )
    .bind(&page_id)
    .fetch_one(pool_inner)
    .await
    .map_err(|e| e.to_string())?;

    let new_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let max_order: Option<(i64,)> = sqlx::query_as(
        "SELECT COALESCE(MAX(sort_order), -1) FROM pages WHERE project_id = ?"
    )
    .bind(&project_id)
    .fetch_one(pool_inner)
    .await
    .map_err(|e| e.to_string())?;

    let sort_order = max_order.map(|(m,)| m + 1).unwrap_or(0);

    let new_page = Page {
        id: new_id.clone(),
        project_id: project_id.clone(),
        name: format!("{} (副本)", original.name),
        thumbnail: String::new(),
        sort_order,
        canvas_width: original.canvas_width,
        canvas_height: original.canvas_height,
        created_at: now.clone(),
        updated_at: now,
    };

    sqlx::query(
        "INSERT INTO pages (id, project_id, name, thumbnail, sort_order, canvas_width, canvas_height, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&new_page.id)
    .bind(&new_page.project_id)
    .bind(&new_page.name)
    .bind(&new_page.thumbnail)
    .bind(&new_page.sort_order)
    .bind(&new_page.canvas_width)
    .bind(&new_page.canvas_height)
    .bind(&new_page.created_at)
    .bind(&new_page.updated_at)
    .execute(pool_inner)
    .await
    .map_err(|e| e.to_string())?;

    // Copy canvas.json from original page
    let app_dir = dirs::get_app_data_dir()?;
    let original_canvas = app_dir
        .join("projects")
        .join(&project_id)
        .join("pages")
        .join(&page_id)
        .join("canvas.json");

    let new_page_dir = dirs::create_page_directory(&app_dir, &project_id, &new_id)?;

    if original_canvas.exists() {
        let content = std::fs::read_to_string(&original_canvas)
            .map_err(|e| format!("Failed to read original canvas: {}", e))?;
        std::fs::write(new_page_dir.join("canvas.json"), content)
            .map_err(|e| format!("Failed to copy canvas.json: {}", e))?;
    }

    Ok(new_page)
}

#[tauri::command]
pub async fn update_page_dimensions(
    pool: State<'_, SqlitePool>,
    page_id: String,
    canvas_width: i64,
    canvas_height: i64,
) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();
    let pool = pool.inner();
    sqlx::query("UPDATE pages SET canvas_width = ?, canvas_height = ?, updated_at = ? WHERE id = ?")
        .bind(canvas_width)
        .bind(canvas_height)
        .bind(&now)
        .bind(&page_id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}
```

- [ ] **Step 4: Register new commands in mod.rs and lib.rs**

Update `src-tauri/src/commands/mod.rs`:

```rust
pub mod canvas_commands;
pub mod model_commands;
pub mod page_commands;
pub mod project_commands;
```

Update the invoke_handler in `src-tauri/src/lib.rs` to add new commands:

```rust
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
    commands::page_commands::reorder_pages,
    commands::page_commands::duplicate_page,
    commands::page_commands::update_page_dimensions,
    commands::model_commands::create_model_config,
    commands::model_commands::list_model_configs,
    commands::model_commands::delete_model_config,
    commands::canvas_commands::save_canvas_json,
    commands::canvas_commands::load_canvas_json,
    commands::canvas_commands::save_page_thumbnail,
    commands::canvas_commands::update_page_thumbnail_path,
])
```

- [ ] **Step 5: Verify Rust compilation**

Run: `cargo check --manifest-path src-tauri/Cargo.toml`

Expected: Compiles with no errors.

Run: `cargo test --manifest-path src-tauri/Cargo.toml`

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src-tauri/Cargo.toml src-tauri/src/commands/ src-tauri/src/lib.rs
git commit -m "feat: add canvas file I/O commands and page reorder/duplicate to Rust backend"
```

---

## Task 4: Fabric.js Canvas Renderer Component

**Files:**
- Create: `src/components/canvas/CanvasRenderer.tsx`
- Create: `src/components/canvas/ViewportControls.tsx`
- Create: `src/hooks/useCanvas.ts`
- Modify: `src/components/editor/CanvasArea.tsx` (replace placeholder)

- [ ] **Step 1: Create useCanvas hook**

Create `src/hooks/useCanvas.ts`:

```typescript
import { useRef, useCallback } from "react";
import { Canvas } from "fabric";
import { useCanvasStore } from "@/stores/canvasStore";
import { getCanvasJSON } from "@/utils/canvasSerializer";
import type { CanvasJSON } from "@/utils/canvasSerializer";

export function useCanvas() {
  const canvasRef = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const setObjectCount = useCanvasStore((s) => s.setObjectCount);

  const initCanvas = useCallback((container: HTMLDivElement, width: number, height: number): Canvas => {
    if (canvasRef.current) {
      canvasRef.current.dispose();
    }

    const canvas = new Canvas(document.createElement("canvas"), {
      width,
      height,
      backgroundColor: "#ffffff",
      selection: true,
    });

    container.innerHTML = "";
    const wrapper = document.createElement("div");
    wrapper.style.overflow = "hidden";
    wrapper.style.width = "100%";
    wrapper.style.height = "100%";
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.justifyContent = "center";
    container.appendChild(wrapper);
    wrapper.appendChild(canvas.getElement().parentElement ?? canvas.getElement());

    // NOTE: object:added, object:modified, object:removed handlers are
    // registered in CanvasArea.tsx (Task 13) to avoid double-registration
    // and keep useCanvas focused on lifecycle only.

    canvasRef.current = canvas;
    containerRef.current = container;

    return canvas;
  }, []);

  const getCanvas = useCallback((): Canvas | null => {
    return canvasRef.current;
  }, []);

  const resizeCanvas = useCallback((width: number, height: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setDimensions({ width, height });
    canvas.renderAll();
  }, []);

  const loadJSON = useCallback((json: CanvasJSON): Promise<void> => {
    const canvas = canvasRef.current;
    if (!canvas) return Promise.resolve();
    return canvas.loadFromJSON(json).then(() => {
      canvas.renderAll();
      setObjectCount(canvas.getObjects().length);
    });
  }, [setObjectCount]);

  const getJSON = useCallback((): CanvasJSON | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return getCanvasJSON(canvas);
  }, []);

  const destroyCanvas = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.dispose();
      canvasRef.current = null;
    }
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }
  }, []);

  return {
    initCanvas,
    getCanvas,
    resizeCanvas,
    loadJSON,
    getJSON,
    destroyCanvas,
  };
}
```

- [ ] **Step 2: Create CanvasRenderer component**

Create `src/components/canvas/CanvasRenderer.tsx`:

```typescript
import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Canvas } from "fabric";
import { useCanvas } from "@/hooks/useCanvas";
import type { CanvasJSON } from "@/utils/canvasSerializer";

interface CanvasRendererProps {
  width: number;
  height: number;
  onCanvasReady: (canvas: Canvas) => void;
}

export interface CanvasRendererHandle {
  getCanvas: () => Canvas | null;
  loadJSON: (json: CanvasJSON) => Promise<void>;
  getJSON: () => CanvasJSON | null;
  resizeCanvas: (width: number, height: number) => void;
}

export const CanvasRenderer = forwardRef<CanvasRendererHandle, CanvasRendererProps>(
  function CanvasRenderer({ width, height, onCanvasReady }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { initCanvas, getCanvas, resizeCanvas, loadJSON, getJSON, destroyCanvas } = useCanvas();
    const onCanvasReadyRef = useRef(onCanvasReady);
    onCanvasReadyRef.current = onCanvasReady;

    useImperativeHandle(ref, () => ({
      getCanvas,
      loadJSON,
      getJSON,
      resizeCanvas,
    }));

    useEffect(() => {
      if (!containerRef.current) return;
      const canvas = initCanvas(containerRef.current, width, height);
      onCanvasReadyRef.current(canvas);

      return () => {
        destroyCanvas();
      };
    }, []);

    useEffect(() => {
      const canvas = getCanvas();
      if (!canvas) return;
      resizeCanvas(width, height);
    }, [width, height]);

    return (
      <div
        ref={containerRef}
        className="w-full h-full bg-gray-800 flex items-center justify-center overflow-hidden"
      />
    );
  }
);
```

- [ ] **Step 3: Create ViewportControls component**

Create `src/components/canvas/ViewportControls.tsx`:

```typescript
import { useTranslation } from "react-i18next";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import type { Canvas } from "fabric";

interface ViewportControlsProps {
  getCanvas: () => Canvas | null;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.1;

export function ViewportControls({ getCanvas }: ViewportControlsProps) {
  const { t } = useTranslation();

  const handleZoomIn = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    const currentZoom = canvas.getZoom();
    const newZoom = Math.min(currentZoom + ZOOM_STEP, MAX_ZOOM);
    canvas.zoomToPoint({ x: canvas.getWidth() / 2, y: canvas.getHeight() / 2 }, newZoom);
    canvas.renderAll();
  };

  const handleZoomOut = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    const currentZoom = canvas.getZoom();
    const newZoom = Math.max(currentZoom - ZOOM_STEP, MIN_ZOOM);
    canvas.zoomToPoint({ x: canvas.getWidth() / 2, y: canvas.getHeight() / 2 }, newZoom);
    canvas.renderAll();
  };

  const handleFitToScreen = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.renderAll();
  };

  return (
    <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-bg-secondary/90 border border-border rounded px-1 py-0.5">
      <button
        onClick={handleZoomOut}
        className="p-1 text-text-secondary hover:text-text-primary transition-colors"
        title={t("canvas.viewport.zoomOut")}
      >
        <ZoomOut size={14} />
      </button>
      <button
        onClick={handleFitToScreen}
        className="p-1 text-text-secondary hover:text-text-primary transition-colors"
        title={t("canvas.viewport.fitToScreen")}
      >
        <Maximize size={14} />
      </button>
      <button
        onClick={handleZoomIn}
        className="p-1 text-text-secondary hover:text-text-primary transition-colors"
        title={t("canvas.viewport.zoomIn")}
      >
        <ZoomIn size={14} />
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Update CanvasArea to use CanvasRenderer**

Replace `src/components/editor/CanvasArea.tsx`:

```typescript
import { useRef, useCallback, useEffect } from "react";
import { CanvasRenderer, type CanvasRendererHandle } from "@/components/canvas/CanvasRenderer";
import { ViewportControls } from "@/components/canvas/ViewportControls";
import { PencilBrush } from "fabric";
import { useProjectStore } from "@/stores/projectStore";
import { useUiStore } from "@/stores/uiStore";
import { useCanvasStore } from "@/stores/canvasStore";
import type { Canvas } from "fabric";

export function CanvasArea() {
  const rendererRef = useRef<CanvasRendererHandle>(null);
  const canvasInstanceRef = useRef<Canvas | null>(null);
  const pages = useProjectStore((s) => s.pages);
  const currentPageId = useUiStore((s) => s.currentPageId);
  const activeTool = useUiStore((s) => s.activeTool);

  const currentPage = pages.find((p) => p.id === currentPageId);
  const canvasWidth = currentPage?.canvasWidth ?? 1440;
  const canvasHeight = currentPage?.canvasHeight ?? 900;

  const handleCanvasReady = useCallback((canvas: Canvas) => {
    canvasInstanceRef.current = canvas;
    canvas.isDrawingMode = false;
    canvas.selection = true;
  }, []);

  // Apply drawing mode based on active tool
  useEffect(() => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = activeTool === "pen";
    canvas.selection = activeTool === "select";

    if (activeTool === "pen") {
      canvas.freeDrawingBrush = new PencilBrush(canvas);
      canvas.freeDrawingBrush.width = 2;
      canvas.freeDrawingBrush.color = "#333333";
    }

    canvas.renderAll();
  }, [activeTool]);

  if (!currentPageId) {
    return (
      <div className="flex-1 bg-bg-primary flex items-center justify-center">
        <div className="text-text-muted text-sm">
          请从左侧面板选择或创建页面
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-bg-primary flex items-center justify-center relative overflow-hidden">
      <div className="relative" style={{ maxWidth: "100%", maxHeight: "100%" }}>
        <CanvasRenderer
          ref={rendererRef}
          width={canvasWidth}
          height={canvasHeight}
          onCanvasReady={handleCanvasReady}
        />
      </div>
      <ViewportControls getCanvas={() => rendererRef.current?.getCanvas() ?? null} />
    </div>
  );
}
```

- [ ] **Step 5: Verify build**

Run: `npm run build`

Expected: Build succeeds with no TypeScript errors. The canvas components compile correctly.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useCanvas.ts src/components/canvas/ src/components/editor/CanvasArea.tsx
git commit -m "feat: add Fabric.js canvas renderer with viewport controls and zoom"
```

---

## Task 5: Drawing Tools Implementation

**Files:**
- Create: `src/components/canvas/tools/selectTool.ts`
- Create: `src/components/canvas/tools/penTool.ts`
- Create: `src/components/canvas/tools/rectangleTool.ts`
- Create: `src/components/canvas/tools/textTool.ts`
- Create: `src/hooks/useToolManager.ts`

- [ ] **Step 1: Create selectTool**

Create `src/components/canvas/tools/selectTool.ts`:

```typescript
import type { Canvas } from "fabric";

export function createSelectTool(canvas: Canvas) {
  function activate() {
    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.defaultCursor = "default";
    canvas.hoverCursor = "move";

    canvas.discardActiveObject();
    canvas.renderAll();
  }

  function deactivate() {
    // Select tool has no persistent state to clean up
  }

  return { activate, deactivate };
}
```

- [ ] **Step 2: Create penTool**

Create `src/components/canvas/tools/penTool.ts`:

```typescript
import { PencilBrush } from "fabric";
import type { Canvas } from "fabric";

export function createPenTool(canvas: Canvas) {
  function activate() {
    canvas.isDrawingMode = true;
    canvas.selection = false;

    const brush = new PencilBrush(canvas);
    brush.width = 2;
    brush.color = "#333333";
    canvas.freeDrawingBrush = brush;
  }

  function deactivate() {
    canvas.isDrawingMode = false;
  }

  return { activate, deactivate };
}
```

- [ ] **Step 3: Create rectangleTool**

Create `src/components/canvas/tools/rectangleTool.ts`:

```typescript
import { Rect } from "fabric";
import type { Canvas } from "fabric";

export function createRectangleTool(canvas: Canvas) {
  let isDrawing = false;
  let startX = 0;
  let startY = 0;
  let currentRect: Rect | null = null;

  function onMouseDown(opt: { e: MouseEvent }) {
    const pointer = canvas.getScenePoint(opt.e);
    isDrawing = true;
    startX = pointer.x;
    startY = pointer.y;

    currentRect = new Rect({
      left: startX,
      top: startY,
      width: 0,
      height: 0,
      fill: "transparent",
      stroke: "#333333",
      strokeWidth: 2,
      selectable: true,
    });

    canvas.add(currentRect);
  }

  function onMouseMove(opt: { e: MouseEvent }) {
    if (!isDrawing || !currentRect) return;

    const pointer = canvas.getScenePoint(opt.e);
    const left = Math.min(startX, pointer.x);
    const top = Math.min(startY, pointer.y);
    const width = Math.abs(pointer.x - startX);
    const height = Math.abs(pointer.y - startY);

    currentRect.set({ left, top, width, height });
    canvas.renderAll();
  }

  function onMouseUp() {
    isDrawing = false;
    currentRect = null;
  }

  function activate() {
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.defaultCursor = "crosshair";

    canvas.discardActiveObject();
    canvas.renderAll();

    canvas.on("mouse:down", onMouseDown);
    canvas.on("mouse:move", onMouseMove);
    canvas.on("mouse:up", onMouseUp);
  }

  function deactivate() {
    canvas.off("mouse:down", onMouseDown);
    canvas.off("mouse:move", onMouseMove);
    canvas.off("mouse:up", onMouseUp);

    canvas.defaultCursor = "default";
    if (currentRect) {
      canvas.remove(currentRect);
      currentRect = null;
    }
    isDrawing = false;
  }

  return { activate, deactivate };
}
```

- [ ] **Step 4: Create textTool**

Create `src/components/canvas/tools/textTool.ts`:

```typescript
import { IText } from "fabric";
import type { Canvas } from "fabric";

export function createTextTool(canvas: Canvas) {
  function onMouseDown(opt: { e: MouseEvent }) {
    const pointer = canvas.getScenePoint(opt.e);
    const text = new IText("文本", {
      left: pointer.x,
      top: pointer.y,
      fontSize: 16,
      fill: "#333333",
      fontFamily: "sans-serif",
      selectable: true,
      editable: true,
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    text.enterEditing();
    canvas.renderAll();
  }

  function activate() {
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.defaultCursor = "text";

    canvas.discardActiveObject();
    canvas.renderAll();

    canvas.on("mouse:down", onMouseDown);
  }

  function deactivate() {
    canvas.off("mouse:down", onMouseDown);
    canvas.defaultCursor = "default";
  }

  return { activate, deactivate };
}
```

- [ ] **Step 5: Create useToolManager hook**

Create `src/hooks/useToolManager.ts`:

```typescript
import { useEffect, useRef } from "react";
import type { Canvas } from "fabric";
import { useUiStore } from "@/stores/uiStore";
import { createSelectTool } from "@/components/canvas/tools/selectTool";
import { createPenTool } from "@/components/canvas/tools/penTool";
import { createRectangleTool } from "@/components/canvas/tools/rectangleTool";
import { createTextTool } from "@/components/canvas/tools/textTool";

interface ToolInstance {
  activate: () => void;
  deactivate: () => void;
}

export function useToolManager(canvas: Canvas | null) {
  const activeTool = useUiStore((s) => s.activeTool);
  const currentToolRef = useRef<ToolInstance | null>(null);

  useEffect(() => {
    if (!canvas) return;
    currentToolRef.current?.deactivate();

    let tool: ToolInstance;
    switch (activeTool) {
      case "pen":
        tool = createPenTool(canvas);
        break;
      case "rectangle":
        tool = createRectangleTool(canvas);
        break;
      case "text":
        tool = createTextTool(canvas);
        break;
      default:
        tool = createSelectTool(canvas);
        break;
    }

    tool.activate();
    currentToolRef.current = tool;

    return () => {
      currentToolRef.current?.deactivate();
    };
  }, [canvas, activeTool]);

  return { activeTool };
}
```

- [ ] **Step 6: Update CanvasArea to use tool manager**

Update `src/components/editor/CanvasArea.tsx`:

```typescript
import { useRef, useCallback, useEffect } from "react";
import { CanvasRenderer, type CanvasRendererHandle } from "@/components/canvas/CanvasRenderer";
import { ViewportControls } from "@/components/canvas/ViewportControls";
import { useProjectStore } from "@/stores/projectStore";
import { useUiStore } from "@/stores/uiStore";
import { useToolManager } from "@/hooks/useToolManager";
import type { Canvas } from "fabric";

function CanvasAreaInner({ currentPageId }: { currentPageId: string }) {
  const rendererRef = useRef<CanvasRendererHandle>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const pages = useProjectStore((s) => s.pages);

  const currentPage = pages.find((p) => p.id === currentPageId);
  const canvasWidth = currentPage?.canvasWidth ?? 1440;
  const canvasHeight = currentPage?.canvasHeight ?? 900;

  const handleCanvasReady = useCallback((canvas: Canvas) => {
    canvasRef.current = canvas;
  }, []);

  useToolManager(canvasRef.current);

  return (
    <div className="flex-1 bg-bg-primary flex items-center justify-center relative overflow-hidden">
      <div className="relative" style={{ maxWidth: "100%", maxHeight: "100%" }}>
        <CanvasRenderer
          ref={rendererRef}
          width={canvasWidth}
          height={canvasHeight}
          onCanvasReady={handleCanvasReady}
        />
      </div>
      <ViewportControls getCanvas={() => rendererRef.current?.getCanvas() ?? null} />
    </div>
  );
}

export function CanvasArea() {
  const currentPageId = useUiStore((s) => s.currentPageId);

  if (!currentPageId) {
    return (
      <div className="flex-1 bg-bg-primary flex items-center justify-center">
        <div className="text-text-muted text-sm">
          请从左侧面板选择或创建页面
        </div>
      </div>
    );
  }

  return <CanvasAreaInner currentPageId={currentPageId} />;
}
```

- [ ] **Step 7: Verify build**

Run: `npm run build`

Expected: Build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/components/canvas/tools/ src/hooks/useToolManager.ts src/components/editor/CanvasArea.tsx
git commit -m "feat: implement drawing tools (select, pen, rectangle, text) with tool manager"
```

> **Test coverage note:** The tool modules (`selectTool.ts`, `penTool.ts`, `rectangleTool.ts`, `textTool.ts`), `GridOverlay.ts`, and `canvasModes.ts` lack unit tests in this plan. These modules require a Fabric.js Canvas instance (DOM-dependent) and are difficult to unit-test in jsdom. Integration tests covering tool behavior should be added in a future pass using a browser-based test environment (e.g., Playwright or a custom jsdom Fabric.js setup).

---

## Task 6: Grid Overlay

**Files:**
- Create: `src/components/canvas/GridOverlay.ts`

- [ ] **Step 1: Create GridOverlay module**

Create `src/components/canvas/GridOverlay.ts`:

```typescript
import { Line } from "fabric";
import type { Canvas } from "fabric";

const GRID_COLOR = "rgba(200, 200, 200, 0.3)";
const DEFAULT_GRID_SIZE = 20;

export function createGridOverlay(canvas: Canvas) {
  let lines: Line[] = [];
  let gridSize = DEFAULT_GRID_SIZE;
  let snapHandler: ((e: { target: { left?: number; top?: number } | null }) => void) | null = null;

  function showGrid(size: number = DEFAULT_GRID_SIZE): void {
    hideGrid();

    gridSize = size;
    const width = canvas.getWidth();
    const height = canvas.getHeight();

    for (let i = 0; i <= width; i += gridSize) {
      const line = new Line([i, 0, i, height], {
        stroke: GRID_COLOR,
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      canvas.add(line);
      canvas.sendObjectToBack(line);
      lines = [...lines, line];
    }

    for (let i = 0; i <= height; i += gridSize) {
      const line = new Line([0, i, width, i], {
        stroke: GRID_COLOR,
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      canvas.add(line);
      canvas.sendObjectToBack(line);
      lines = [...lines, line];
    }

    canvas.renderAll();
  }

  function hideGrid(): void {
    for (const line of lines) {
      canvas.remove(line);
    }
    lines = [];
    canvas.renderAll();
  }

  function snapToGrid(value: number, size: number = DEFAULT_GRID_SIZE): number {
    return Math.round(value / size) * size;
  }

  function enableSnapToGrid(size: number = DEFAULT_GRID_SIZE): void {
    snapHandler = (e) => {
      const obj = e.target;
      if (!obj) return;
      obj.set({
        left: snapToGrid(obj.left ?? 0, size),
        top: snapToGrid(obj.top ?? 0, size),
      });
    };
    canvas.on("object:moving", snapHandler);
  }

  function disableSnapToGrid(): void {
    if (snapHandler) {
      canvas.off("object:moving", snapHandler);
      snapHandler = null;
    }
  }

  return { showGrid, hideGrid, enableSnapToGrid, disableSnapToGrid };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/canvas/GridOverlay.ts
git commit -m "feat: add grid overlay with snap-to-grid alignment"
```

---

## Task 7: Canvas Modes (Sketch / Design)

**Files:**
- Create: `src/components/canvas/modes/canvasModes.ts`

- [ ] **Step 1: Create canvas mode configurations**

Create `src/components/canvas/modes/canvasModes.ts`:

```typescript
import { PencilBrush } from "fabric";
import type { Canvas } from "fabric";
import type { CanvasMode } from "@/types";
import { createGridOverlay } from "@/components/canvas/GridOverlay";

interface ModeConfig {
  apply: (canvas: Canvas) => void;
}

const SKETCH_BRUSH_WIDTH = 3;
const SKETCH_BRUSH_COLOR = "#555555";
const DESIGN_GRID_SIZE = 20;

const modeConfigs: Record<CanvasMode, ModeConfig> = {
  sketch: {
    apply(canvas: Canvas) {
      // Sketch mode: hand-drawn style, no grid, drawing-focused
      // GridOverlay is managed per-instance in CanvasArea; mode only controls brush
      canvas.isDrawingMode = true;
      const brush = new PencilBrush(canvas);
      brush.width = SKETCH_BRUSH_WIDTH;
      brush.color = SKETCH_BRUSH_COLOR;
      brush.strokeDashArray = undefined;
      canvas.freeDrawingBrush = brush;

      // Dim UI chrome elements are handled at the component level
    },
  },
  design: {
    apply(canvas: Canvas) {
      // Design mode: precise editing, grid enabled, snap
      // GridOverlay is managed per-instance in CanvasArea; mode only controls selection
      canvas.isDrawingMode = false;
      canvas.selection = true;
    },
  },
};

export function applyCanvasMode(canvas: Canvas, mode: CanvasMode): void {
  modeConfigs[mode].apply(canvas);
}

export function getSketchBrushConfig(): { width: number; color: string } {
  return {
    width: SKETCH_BRUSH_WIDTH,
    color: SKETCH_BRUSH_COLOR,
  };
}

export function getDesignGridSize(): number {
  return DESIGN_GRID_SIZE;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/canvas/modes/canvasModes.ts
git commit -m "feat: add sketch and design canvas mode configurations"
```

---

## Task 8: Update Toolbar with Mode Toggle and Grid Toggle

**Files:**
- Modify: `src/components/editor/Toolbar.tsx`
- Test: `tests/components/editor/Toolbar.test.tsx`

- [ ] **Step 1: Write failing test for Toolbar mode toggle**

Create `tests/components/editor/Toolbar.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toolbar } from "@/components/editor/Toolbar";
import { useUiStore } from "@/stores/uiStore";

describe("Toolbar", () => {
  it("should render all tool buttons", () => {
    render(<Toolbar />);
    expect(screen.getByTitle("选择")).toBeInTheDocument();
    expect(screen.getByTitle("画笔")).toBeInTheDocument();
    expect(screen.getByTitle("矩形")).toBeInTheDocument();
    expect(screen.getByTitle("文字")).toBeInTheDocument();
  });

  it("should highlight the active tool", () => {
    useUiStore.setState({ activeTool: "pen" });
    render(<Toolbar />);
    const penButton = screen.getByTitle("画笔");
    expect(penButton.className).toContain("bg-accent");
  });

  it("should switch tool on click", async () => {
    useUiStore.setState({ activeTool: "select" });
    render(<Toolbar />);
    await userEvent.click(screen.getByTitle("画笔"));
    expect(useUiStore.getState().activeTool).toBe("pen");
  });

  it("should render canvas mode toggle button", () => {
    useUiStore.setState({ canvasMode: "design" });
    render(<Toolbar />);
    expect(screen.getByTitle("手绘模式")).toBeInTheDocument();
  });

  it("should toggle canvas mode on click", async () => {
    useUiStore.setState({ canvasMode: "design" });
    render(<Toolbar />);
    await userEvent.click(screen.getByTitle("手绘模式"));
    expect(useUiStore.getState().canvasMode).toBe("sketch");
  });

  it("should render grid toggle button", () => {
    render(<Toolbar />);
    expect(screen.getByTitle("网格")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/components/editor/Toolbar.test.tsx`

Expected: FAIL — Toolbar does not have mode toggle or grid toggle buttons yet.

- [ ] **Step 3: Update Toolbar component**

Replace `src/components/editor/Toolbar.tsx`:

```typescript
import { useTranslation } from "react-i18next";
import {
  MousePointer, Pen, Square, Type, Undo2, Redo2,
  Paintbrush, LayoutGrid, Grid3x3,
} from "lucide-react";
import { useUiStore, type ToolType } from "@/stores/uiStore";
import { useCanvasStore } from "@/stores/canvasStore";
import type { CanvasMode } from "@/types";

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
  const canvasMode = useUiStore((s) => s.canvasMode);
  const setCanvasMode = useUiStore((s) => s.setCanvasMode);
  const gridVisible = useUiStore((s) => s.gridVisible);
  const toggleGrid = useUiStore((s) => s.toggleGrid);
  const canUndo = useCanvasStore((s) => s.historyIndex >= 0);
  const canRedo = useCanvasStore((s) => s.historyIndex < s.history.length - 1);

  const handleModeToggle = () => {
    const next: CanvasMode = canvasMode === "sketch" ? "design" : "sketch";
    setCanvasMode(next);
  };

  const modeLabel = canvasMode === "sketch"
    ? t("editor.toolbar.designMode")
    : t("editor.toolbar.sketchMode");

  return (
    <div className="h-10 bg-bg-secondary border-b border-border flex items-center px-3 gap-1">
      {/* Mode toggle */}
      <button
        onClick={handleModeToggle}
        className="flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
        title={modeLabel}
      >
        <Paintbrush size={14} />
        {modeLabel}
      </button>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Drawing tools */}
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

      <div className="w-px h-5 bg-border mx-1" />

      {/* Grid toggle */}
      <button
        onClick={toggleGrid}
        className={`p-1.5 rounded transition-colors ${
          gridVisible
            ? "bg-accent/20 text-accent"
            : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
        }`}
        title={t("editor.toolbar.toggleGrid")}
      >
        <Grid3x3 size={16} />
      </button>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Undo / Redo */}
      <button
        className={`p-1.5 rounded transition-colors ${
          canUndo
            ? "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
            : "text-text-muted cursor-not-allowed"
        }`}
        title={t("editor.toolbar.undo")}
        disabled={!canUndo}
      >
        <Undo2 size={16} />
      </button>
      <button
        className={`p-1.5 rounded transition-colors ${
          canRedo
            ? "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
            : "text-text-muted cursor-not-allowed"
        }`}
        title={t("editor.toolbar.redo")}
        disabled={!canRedo}
      >
        <Redo2 size={16} />
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/components/editor/Toolbar.test.tsx`

Expected: All 6 Toolbar tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/editor/Toolbar.tsx tests/components/editor/Toolbar.test.tsx
git commit -m "feat: update toolbar with canvas mode toggle, grid toggle, and undo/redo state"
```

---

## Task 9: Page Management Panel (Left Panel)

**Files:**
- Modify: `src/components/editor/PagePanel.tsx` (replace placeholder)
- Create: `src/components/editor/PageItem.tsx`
- Create: `src/components/editor/PageContextMenu.tsx`
- Test: `tests/components/editor/PagePanel.test.tsx`

- [ ] **Step 1: Create PageContextMenu component**

Create `src/components/editor/PageContextMenu.tsx`:

```typescript
import { useTranslation } from "react-i18next";
import * as ContextMenu from "@radix-ui/react-context-menu";

interface PageContextMenuProps {
  children: React.ReactNode;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onExport: () => void;
}

export function PageContextMenu({
  children,
  onRename,
  onDuplicate,
  onDelete,
  onExport,
}: PageContextMenuProps) {
  const { t } = useTranslation();

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content
          className="min-w-[160px] bg-bg-surface border border-border rounded-md p-1 shadow-lg z-50"
        >
          <ContextMenu.Item
            className="px-3 py-1.5 text-sm text-text-primary hover:bg-accent hover:text-white rounded cursor-pointer outline-none"
            onSelect={onRename}
          >
            {t("page.rename")}
          </ContextMenu.Item>
          <ContextMenu.Item
            className="px-3 py-1.5 text-sm text-text-primary hover:bg-accent hover:text-white rounded cursor-pointer outline-none"
            onSelect={onDuplicate}
          >
            {t("page.duplicate")}
          </ContextMenu.Item>
          <ContextMenu.Item
            className="px-3 py-1.5 text-sm text-text-primary hover:bg-accent hover:text-white rounded cursor-pointer outline-none"
            onSelect={onExport}
          >
            {t("page.export")}
          </ContextMenu.Item>
          <ContextMenu.Separator className="h-px bg-border my-1" />
          <ContextMenu.Item
            className="px-3 py-1.5 text-sm text-danger hover:bg-danger hover:text-white rounded cursor-pointer outline-none"
            onSelect={onDelete}
          >
            {t("page.delete")}
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
```

- [ ] **Step 2: Create PageItem component**

Create `src/components/editor/PageItem.tsx`:

```typescript
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText } from "lucide-react";
import type { Page } from "@/types";
import { PageContextMenu } from "./PageContextMenu";

interface PageItemProps {
  page: Page;
  isActive: boolean;
  onClick: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
}

export function PageItem({
  page,
  isActive,
  onClick,
  onRename,
  onDuplicate,
  onDelete,
  onExport,
}: PageItemProps) {
  const { t } = useTranslation();
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(page.name);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== page.name) {
      onRename(page.id, trimmed);
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      setRenameValue(page.name);
      setIsRenaming(false);
    }
  };

  const handleStartRename = () => {
    setRenameValue(page.name);
    setIsRenaming(true);
  };

  const content = (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
        isActive
          ? "bg-accent/20 text-accent border border-accent/30"
          : "text-text-secondary hover:bg-bg-tertiary border border-transparent"
      }`}
      onClick={() => {
        if (!isRenaming) onClick(page.id);
      }}
    >
      {/* Thumbnail */}
      <div className="w-8 h-6 bg-bg-primary rounded flex-shrink-0 overflow-hidden flex items-center justify-center">
        {page.thumbnail ? (
          <img
            src={page.thumbnail}
            alt={page.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <FileText size={12} className="text-text-muted" />
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        {isRenaming ? (
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleRenameKeyDown}
            className="w-full bg-bg-primary border border-accent rounded px-1 py-0 text-xs text-text-primary outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="text-xs truncate block">{page.name}</span>
        )}
      </div>

      {/* Dimensions */}
      <span className="text-[10px] text-text-muted flex-shrink-0">
        {page.canvasWidth}×{page.canvasHeight}
      </span>
    </div>
  );

  return (
    <PageContextMenu
      onRename={handleStartRename}
      onDuplicate={() => onDuplicate(page.id)}
      onDelete={() => onDelete(page.id)}
      onExport={() => onExport(page.id)}
    >
      {content}
    </PageContextMenu>
  );
}
```

- [ ] **Step 3: Write failing test for PagePanel**

Create `tests/components/editor/PagePanel.test.tsx`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PagePanel } from "@/components/editor/PagePanel";
import { useProjectStore } from "@/stores/projectStore";
import { useUiStore } from "@/stores/uiStore";
import type { Page } from "@/types";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

const mockPages: Page[] = [
  {
    id: "page-1",
    projectId: "proj-1",
    name: "首页",
    thumbnail: "",
    sortOrder: 0,
    canvasWidth: 1440,
    canvasHeight: 900,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    id: "page-2",
    projectId: "proj-1",
    name: "详情页",
    thumbnail: "",
    sortOrder: 1,
    canvasWidth: 1440,
    canvasHeight: 900,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
];

describe("PagePanel", () => {
  beforeEach(() => {
    useProjectStore.setState({ pages: mockPages });
    useUiStore.setState({ currentPageId: "page-1" });
  });

  it("should render page list with page names", () => {
    render(<PagePanel />);
    expect(screen.getByText("首页")).toBeInTheDocument();
    expect(screen.getByText("详情页")).toBeInTheDocument();
  });

  it("should highlight the active page", () => {
    render(<PagePanel />);
    const activeItem = screen.getByText("首页").closest("[class*='bg-accent']");
    expect(activeItem).toBeInTheDocument();
  });

  it("should render new page button", () => {
    render(<PagePanel />);
    expect(screen.getByTitle("新页面")).toBeInTheDocument();
  });

  it("should show empty state when no pages", () => {
    useProjectStore.setState({ pages: [] });
    render(<PagePanel />);
    expect(screen.getByText("暂无页面")).toBeInTheDocument();
  });

  it("should switch page on click", async () => {
    render(<PagePanel />);
    await userEvent.click(screen.getByText("详情页"));
    expect(useUiStore.getState().currentPageId).toBe("page-2");
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test -- tests/components/editor/PagePanel.test.tsx`

Expected: FAIL — PagePanel is still a placeholder.

- [ ] **Step 5: Implement PagePanel component**

Replace `src/components/editor/PagePanel.tsx`:

```typescript
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import { useUiStore } from "@/stores/uiStore";
import { useCanvasStore } from "@/stores/canvasStore";
import { PageItem } from "./PageItem";
import { CANVAS_PRESETS, type Page } from "@/types";

export function PagePanel() {
  const { t } = useTranslation();
  const pages = useProjectStore((s) => s.pages);
  const currentProject = useProjectStore((s) => s.currentProject);
  const setPages = useProjectStore((s) => s.setPages);
  const currentPageId = useUiStore((s) => s.currentPageId);
  const setCurrentPageId = useUiStore((s) => s.setCurrentPageId);
  const clearHistory = useCanvasStore((s) => s.clearHistory);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handlePageClick = useCallback(async (pageId: string) => {
    if (pageId === currentPageId) return;
    // Save current page canvas before switching (auto-save handles this)
    setCurrentPageId(pageId);
    clearHistory();
  }, [currentPageId, setCurrentPageId, clearHistory]);

  const handleNewPage = useCallback(async () => {
    if (!currentProject) return;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const preset = CANVAS_PRESETS.find(
        (p) => p.name === currentProject.canvasPreset
      ) ?? CANVAS_PRESETS[0];
      await invoke("create_page", {
        input: {
          project_id: currentProject.id,
          name: `${t("page.untitled")} ${pages.length + 1}`,
          canvas_width: preset.width,
          canvas_height: preset.height,
        },
      });
      const updatedPages = await invoke("list_pages", {
        projectId: currentProject.id,
      });
      setPages(updatedPages as never[]);
      // Auto-select the new page
      const newPages = updatedPages as Page[];
      if (newPages.length > 0) {
        const newest = newPages[newPages.length - 1];
        setCurrentPageId(newest.id);
        clearHistory();
      }
    } catch (error) {
      console.error("Failed to create page:", error);
    }
  }, [currentProject, pages.length, setPages, setCurrentPageId, clearHistory, t]);

  const handleRename = useCallback(async (pageId: string, name: string) => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("rename_page", { id: pageId, name });
      const updatedPages = pages.map((p) =>
        p.id === pageId ? { ...p, name } : p
      );
      setPages(updatedPages);
    } catch (error) {
      console.error("Failed to rename page:", error);
    }
  }, [pages, setPages]);

  const handleDuplicate = useCallback(async (pageId: string) => {
    if (!currentProject) return;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("duplicate_page", {
        projectId: currentProject.id,
        pageId,
      });
      const updatedPages = await invoke("list_pages", {
        projectId: currentProject.id,
      });
      setPages(updatedPages as never[]);
    } catch (error) {
      console.error("Failed to duplicate page:", error);
    }
  }, [currentProject, setPages]);

  const handleDelete = useCallback(async (pageId: string) => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("delete_page", { id: pageId });
      const remaining = pages.filter((p) => p.id !== pageId);
      setPages(remaining);
      if (currentPageId === pageId) {
        if (remaining.length > 0) {
          setCurrentPageId(remaining[0].id);
        } else {
          setCurrentPageId("");
        }
        clearHistory();
      }
    } catch (error) {
      console.error("Failed to delete page:", error);
    }
  }, [pages, currentPageId, setPages, setCurrentPageId, clearHistory]);

  const handleExport = useCallback((_pageId: string) => {
    // Export will be implemented in Plan 4
    console.log("Export page:", _pageId);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    if (!currentProject) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = pages.findIndex((p) => p.id === active.id);
    const newIndex = pages.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...pages];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    setPages(reordered);

    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("reorder_pages", {
        projectId: currentProject.id,
        pageIds: reordered.map((p) => p.id),
      });
    } catch (error) {
      console.error("Failed to reorder pages:", error);
      // Revert on failure
      setPages(pages);
    }
  }, [pages, currentProject, setPages]);

  return (
    <div className="w-[200px] bg-bg-secondary border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">{t("page.title")}</span>
        <button
          onClick={handleNewPage}
          className="p-1 text-text-muted hover:text-accent transition-colors"
          title={t("page.newPage")}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Page list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {pages.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-4">{t("page.emptyList")}</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={pages.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              {pages.map((page) => (
                <PageItem
                  key={page.id}
                  page={page}
                  isActive={page.id === currentPageId}
                  onClick={handlePageClick}
                  onRename={handleRename}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  onExport={handleExport}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Footer — page count */}
      {pages.length > 0 && (
        <div className="p-2 border-t border-border">
          <span className="text-[10px] text-text-muted">
            {t("page.pageCount", { count: pages.length })}
          </span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- tests/components/editor/PagePanel.test.tsx`

Expected: All 5 PagePanel tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/editor/PagePanel.tsx src/components/editor/PageItem.tsx src/components/editor/PageContextMenu.tsx tests/components/editor/PagePanel.test.tsx
git commit -m "feat: implement page management panel with drag-and-drop reorder and context menu"
```

---

## Task 10: Auto-Save System

**Files:**
- Create: `src/hooks/useAutoSave.ts`
- Test: `tests/hooks/useAutoSave.test.ts`

- [ ] **Step 1: Write failing test for useAutoSave**

Create `tests/hooks/useAutoSave.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useCanvasStore } from "@/stores/canvasStore";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

describe("useAutoSave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useCanvasStore.setState({ saveStatus: "saved" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should start with no pending save", () => {
    const { result } = renderHook(() =>
      useAutoSave({
        projectId: "proj-1",
        pageId: "page-1",
        enabled: true,
      })
    );
    expect(result.current.isPending).toBe(false);
  });

  it("should set saving status when triggered", () => {
    const { result } = renderHook(() =>
      useAutoSave({
        projectId: "proj-1",
        pageId: "page-1",
        enabled: true,
      })
    );

    act(() => {
      result.current.triggerSave('{"version":"6","objects":[]}');
    });

    expect(useCanvasStore.getState().saveStatus).toBe("unsaved");
  });

  it("should call invoke after debounce delay", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    const { result } = renderHook(() =>
      useAutoSave({
        projectId: "proj-1",
        pageId: "page-1",
        enabled: true,
        debounceMs: 1000,
      })
    );

    act(() => {
      result.current.triggerSave('{"version":"6","objects":[]}');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(invoke).toHaveBeenCalledWith("save_canvas_json", {
      projectId: "proj-1",
      pageId: "page-1",
      json: '{"version":"6","objects":[]}',
    });
  });

  it("should not save when disabled", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    const { result } = renderHook(() =>
      useAutoSave({
        projectId: "proj-1",
        pageId: "page-1",
        enabled: false,
        debounceMs: 1000,
      })
    );

    act(() => {
      result.current.triggerSave('{"version":"6","objects":[]}');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(invoke).not.toHaveBeenCalled();
  });

  it("should not save when pageId is empty", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    const { result } = renderHook(() =>
      useAutoSave({
        projectId: "proj-1",
        pageId: "",
        enabled: true,
        debounceMs: 1000,
      })
    );

    act(() => {
      result.current.triggerSave('{"version":"6","objects":[]}');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(invoke).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/hooks/useAutoSave.test.ts`

Expected: FAIL — module `@/hooks/useAutoSave` not found.

- [ ] **Step 3: Implement useAutoSave hook**

Create `src/hooks/useAutoSave.ts`:

```typescript
import { useRef, useCallback, useEffect, useState } from "react";
import { useCanvasStore } from "@/stores/canvasStore";

interface UseAutoSaveOptions {
  projectId: string;
  pageId: string;
  enabled: boolean;
  debounceMs?: number;
}

export function useAutoSave({
  projectId,
  pageId,
  enabled,
  debounceMs = 2000,
}: UseAutoSaveOptions) {
  const [isPending, setIsPending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setSaveStatus = useCanvasStore((s) => s.setSaveStatus);

  const flushSave = useCallback(async (json: string) => {
    if (!enabled || !pageId || !projectId) return;

    setSaveStatus("saving");
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("save_canvas_json", { projectId, pageId, json });
      setSaveStatus("saved");
    } catch (error) {
      console.error("Auto-save failed:", error);
      setSaveStatus("unsaved");
    }
    setIsPending(false);
  }, [enabled, pageId, projectId, setSaveStatus]);

  const triggerSave = useCallback((json: string) => {
    if (!enabled || !pageId) return;

    setSaveStatus("unsaved");
    setIsPending(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      flushSave(json);
    }, debounceMs);
  }, [enabled, pageId, debounceMs, flushSave, setSaveStatus]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { triggerSave, isPending, flushSave };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/hooks/useAutoSave.test.ts`

Expected: All 5 useAutoSave tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAutoSave.ts tests/hooks/useAutoSave.test.ts
git commit -m "feat: add debounced auto-save hook for canvas JSON persistence"
```

---

## Task 11: Update StatusBar with Save Status and Object Count

**Files:**
- Modify: `src/components/editor/StatusBar.tsx`

- [ ] **Step 1: Update StatusBar component**

Replace `src/components/editor/StatusBar.tsx`:

```typescript
import { useTranslation } from "react-i18next";
import { useProjectStore } from "@/stores/projectStore";
import { useUiStore } from "@/stores/uiStore";
import { useCanvasStore } from "@/stores/canvasStore";

export function StatusBar() {
  const { t } = useTranslation();
  const currentProject = useProjectStore((s) => s.currentProject);
  const pages = useProjectStore((s) => s.pages);
  const currentPageId = useUiStore((s) => s.currentPageId);
  const canvasMode = useUiStore((s) => s.canvasMode);
  const saveStatus = useCanvasStore((s) => s.saveStatus);
  const objectCount = useCanvasStore((s) => s.objectCount);

  const currentPage = pages.find((p) => p.id === currentPageId);

  const saveStatusLabel = (() => {
    switch (saveStatus) {
      case "saved": return t("editor.status.saved");
      case "saving": return t("editor.status.saving");
      case "unsaved": return t("editor.status.unsaved");
    }
  })();

  const saveStatusColor = (() => {
    switch (saveStatus) {
      case "saved": return "text-success";
      case "saving": return "text-warning";
      case "unsaved": return "text-danger";
    }
  })();

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
          <span>
            {t("editor.status.objects")}: {objectCount}
          </span>
          <span className="mx-2">|</span>
        </>
      )}
      <span className={saveStatusColor}>{saveStatusLabel}</span>
      <div className="flex-1" />
      {canvasMode === "sketch" && (
        <span className="text-accent mr-2">{t("canvas.modes.sketch")}</span>
      )}
      {currentProject && (
        <span className="text-text-muted">{currentProject.name}</span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update StatusBar test**

Update `tests/components/editor/StatusBar.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBar } from "@/components/editor/StatusBar";
import { useCanvasStore } from "@/stores/canvasStore";

describe("StatusBar", () => {
  it("should render saved status", () => {
    useCanvasStore.setState({ saveStatus: "saved" });
    render(<StatusBar />);
    expect(screen.getByText("已保存")).toBeInTheDocument();
  });

  it("should render saving status", () => {
    useCanvasStore.setState({ saveStatus: "saving" });
    render(<StatusBar />);
    expect(screen.getByText("保存中...")).toBeInTheDocument();
  });

  it("should render unsaved status", () => {
    useCanvasStore.setState({ saveStatus: "unsaved" });
    render(<StatusBar />);
    expect(screen.getByText("未保存")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npm test -- tests/components/editor/StatusBar.test.tsx`

Expected: All 3 StatusBar tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/editor/StatusBar.tsx tests/components/editor/StatusBar.test.tsx
git commit -m "feat: update status bar with save status, object count, and canvas mode"
```

---

## Task 12: Keyboard Shortcuts

**Files:**
- Create: `src/hooks/useKeyboardShortcuts.ts`

- [ ] **Step 1: Create useKeyboardShortcuts hook**

Create `src/hooks/useKeyboardShortcuts.ts`:

```typescript
import { useEffect, useCallback } from "react";
import { useUiStore, type ToolType } from "@/stores/uiStore";
import { useCanvasStore } from "@/stores/canvasStore";
import { loadCanvasJSON } from "@/utils/canvasSerializer";
import type { Canvas } from "fabric";

interface UseKeyboardShortcutsOptions {
  getCanvas: () => Canvas | null;
}

export function useKeyboardShortcuts({ getCanvas }: UseKeyboardShortcutsOptions) {
  const setActiveTool = useUiStore((s) => s.setActiveTool);
  const activeTool = useUiStore((s) => s.activeTool);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    // Skip shortcuts when typing in an input or textarea
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
      return;
    }

    const isCtrl = e.ctrlKey || e.metaKey;

    // Tool shortcuts (no modifier keys)
    if (!isCtrl && !e.altKey) {
      const toolMap: Record<string, ToolType> = {
        v: "select",
        b: "pen",
        r: "rectangle",
        t: "text",
      };
      const tool = toolMap[e.key.toLowerCase()];
      if (tool) {
        e.preventDefault();
        setActiveTool(tool);
        return;
      }
    }

    // Ctrl+Z — Undo
    if (isCtrl && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      const store = useCanvasStore.getState();
      if (store.historyIndex >= 0) {
        const snapshot = store.goBack();
        if (snapshot) {
          const canvas = getCanvas();
          if (canvas) {
            loadCanvasJSON(canvas, snapshot);
          }
        }
      }
      return;
    }

    // Ctrl+Y or Ctrl+Shift+Z — Redo
    if (isCtrl && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
      e.preventDefault();
      const store = useCanvasStore.getState();
      if (store.historyIndex < store.history.length - 1) {
        const snapshot = store.goForward();
        if (snapshot) {
          const canvas = getCanvas();
          if (canvas) {
            loadCanvasJSON(canvas, snapshot);
          }
        }
      }
      return;
    }

    // Delete key — delete selected objects
    if (e.key === "Delete" || e.key === "Backspace") {
      const canvas = getCanvas();
      if (!canvas) return;
      const active = canvas.getActiveObjects();
      if (active.length > 0) {
        e.preventDefault();
        for (const obj of active) {
          canvas.remove(obj);
        }
        canvas.discardActiveObject();
        canvas.renderAll();
      }
      return;
    }

    // Ctrl+D — duplicate selected objects
    if (isCtrl && e.key === "d") {
      e.preventDefault();
      const canvas = getCanvas();
      if (!canvas) return;
      const active = canvas.getActiveObject();
      if (active) {
        active.clone().then((cloned) => {
          if (!cloned) return;
          cloned.set({
            left: (cloned.left ?? 0) + 20,
            top: (cloned.top ?? 0) + 20,
          });
          canvas.add(cloned);
          canvas.setActiveObject(cloned);
          canvas.renderAll();
        });
      }
      return;
    }
  }, [setActiveTool, getCanvas]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useKeyboardShortcuts.ts
git commit -m "feat: add keyboard shortcuts for tools, undo/redo, delete, and duplicate"
```

---

## Task 13: Wire Canvas Mode, Auto-Save, and Keyboard Shortcuts into CanvasArea

**Files:**
- Modify: `src/components/editor/CanvasArea.tsx`
- Modify: `src/components/editor/EditorLayout.tsx` (integrate auto-save on page switch)

- [ ] **Step 1: Update CanvasArea to integrate all systems**

Replace `src/components/editor/CanvasArea.tsx`:

```typescript
import { useRef, useCallback, useEffect } from "react";
import { CanvasRenderer, type CanvasRendererHandle } from "@/components/canvas/CanvasRenderer";
import { ViewportControls } from "@/components/canvas/ViewportControls";
import { useProjectStore } from "@/stores/projectStore";
import { useUiStore } from "@/stores/uiStore";
import { useToolManager } from "@/hooks/useToolManager";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useAutoSave } from "@/hooks/useAutoSave";
import { applyCanvasMode } from "@/components/canvas/modes/canvasModes";
import { createGridOverlay } from "@/components/canvas/GridOverlay";
import { getCanvasJSON } from "@/utils/canvasSerializer";
import type { Canvas } from "fabric";
import type { Page } from "@/types";

function CanvasAreaInner({ currentPageId, currentPage }: { currentPageId: string; currentPage: Page }) {
  const rendererRef = useRef<CanvasRendererHandle>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const gridOverlayRef = useRef<ReturnType<typeof createGridOverlay> | null>(null);
  const currentProject = useProjectStore((s) => s.currentProject);
  const canvasMode = useUiStore((s) => s.canvasMode);
  const gridVisible = useUiStore((s) => s.gridVisible);

  const { triggerSave } = useAutoSave({
    projectId: currentProject?.id ?? "",
    pageId: currentPageId,
    enabled: !!currentProject,
    debounceMs: 2000,
  });

  const handleCanvasReady = useCallback((canvas: Canvas) => {
    canvasRef.current = canvas;
    gridOverlayRef.current = createGridOverlay(canvas);

    // Load saved canvas data for this page
    (async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const json = await invoke("load_canvas_json", {
          projectId: currentProject?.id ?? "",
          pageId: currentPageId,
        });
        if (json) {
          const parsed = typeof json === "string" ? JSON.parse(json) : json;
          try {
            await canvas.loadFromJSON(parsed);
          } catch (loadError) {
            canvas.clear();
            canvas.renderAll();
            console.error("Failed to load canvas data:", loadError);
          }
        }
      } catch (error) {
        console.error("Failed to load canvas data:", error);
      }
    })();

    // Auto-save on canvas changes
    canvas.on("object:added", () => {
      const data = getCanvasJSON(canvas);
      triggerSave(JSON.stringify(data));
    });
    canvas.on("object:modified", () => {
      const data = getCanvasJSON(canvas);
      triggerSave(JSON.stringify(data));
    });
    canvas.on("object:removed", () => {
      const data = getCanvasJSON(canvas);
      triggerSave(JSON.stringify(data));
    });
  }, [currentPageId, currentProject?.id, triggerSave]);

  // Apply canvas mode changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    applyCanvasMode(canvas, canvasMode);
  }, [canvasMode]);

  // Apply grid visibility (design mode only)
  useEffect(() => {
    const grid = gridOverlayRef.current;
    if (!grid) return;
    if (canvasMode === "design" && gridVisible) {
      grid.showGrid(20);
      grid.enableSnapToGrid(20);
    } else {
      grid.hideGrid();
      grid.disableSnapToGrid();
    }
  }, [canvasMode, gridVisible]);

  useToolManager(canvasRef.current);
  useKeyboardShortcuts({ getCanvas: () => canvasRef.current });

  return (
    <div className="flex-1 bg-bg-primary flex items-center justify-center relative overflow-hidden">
      <div className="relative" style={{ maxWidth: "100%", maxHeight: "100%" }}>
        <CanvasRenderer
          ref={rendererRef}
          width={currentPage.canvasWidth}
          height={currentPage.canvasHeight}
          onCanvasReady={handleCanvasReady}
        />
      </div>
      <ViewportControls getCanvas={() => rendererRef.current?.getCanvas() ?? null} />
    </div>
  );
}

export function CanvasArea() {
  const currentPageId = useUiStore((s) => s.currentPageId);
  const pages = useProjectStore((s) => s.pages);
  const currentPage = pages.find((p) => p.id === currentPageId);

  if (!currentPageId || !currentPage) {
    return (
      <div className="flex-1 bg-bg-primary flex items-center justify-center">
        <div className="text-text-muted text-sm">
          请从左侧面板选择或创建页面
        </div>
      </div>
    );
  }

  return <CanvasAreaInner currentPageId={currentPageId} currentPage={currentPage} />;
}
```

- [ ] **Step 2: Update EditorLayout if needed (verify it still renders correctly)**

The existing `src/components/editor/EditorLayout.tsx` from Plan 1 should work as-is with the updated components. No changes needed since CanvasArea, PagePanel, Toolbar, and StatusBar all maintain the same export signatures.

- [ ] **Step 3: Verify build**

Run: `npm run build`

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/editor/CanvasArea.tsx
git commit -m "feat: wire canvas mode, auto-save, keyboard shortcuts, and grid into canvas area"
```

---

## Task 14: Update EditorLayout Test and Existing Tests

**Files:**
- Modify: `tests/components/editor/EditorLayout.test.tsx`
- Run all tests to verify no regressions

- [ ] **Step 1: Update EditorLayout test**

Update `tests/components/editor/EditorLayout.test.tsx`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { EditorLayout } from "@/components/editor/EditorLayout";
import { useProjectStore } from "@/stores/projectStore";
import { useUiStore } from "@/stores/uiStore";
import type { Page } from "@/types";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue([]),
}));

const mockPages: Page[] = [
  {
    id: "page-1",
    projectId: "proj-1",
    name: "Home",
    thumbnail: "",
    sortOrder: 0,
    canvasWidth: 1440,
    canvasHeight: 900,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
];

describe("EditorLayout", () => {
  beforeEach(() => {
    useUiStore.setState({ view: "editor", currentPageId: "page-1" });
    useProjectStore.setState({
      currentProject: {
        id: "proj-1",
        name: "Test",
        description: "",
        coverImage: "",
        canvasPreset: "desktop_1440x900",
        createdAt: "",
        updatedAt: "",
      },
      pages: mockPages,
    });
  });

  it("should render page panel", () => {
    render(<EditorLayout />);
    expect(screen.getByText("页面")).toBeInTheDocument();
  });

  it("should render status bar with save status", () => {
    render(<EditorLayout />);
    expect(screen.getByText("已保存")).toBeInTheDocument();
  });

  it("should render toolbar with tool buttons", () => {
    render(<EditorLayout />);
    expect(screen.getByTitle("选择")).toBeInTheDocument();
  });

  it("should show page content in page panel", () => {
    render(<EditorLayout />);
    expect(screen.getByText("Home")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run all tests**

Run: `npm test`

Expected: All tests PASS across all test files. No regressions from Plan 1 code.

- [ ] **Step 3: Commit**

```bash
git add tests/components/editor/EditorLayout.test.tsx
git commit -m "test: update editor layout tests for canvas and page panel integration"
```

---

## Task 15: End-to-End Integration Verification

**Files:** None new -- verifying existing code.

- [ ] **Step 1: Run full Rust test suite**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`

Expected: All Rust tests PASS.

- [ ] **Step 2: Run full frontend test suite**

Run: `npm test`

Expected: All frontend tests PASS with no failures.

- [ ] **Step 3: Run Tauri dev build**

Run: `npm run tauri dev`

Expected: App window opens showing the welcome screen.

Verify:
1. Create a new project -- switches to editor view
2. Left panel shows "暂无页面" -- click "+" to create a new page
3. New page "未命名页面 1" appears in the page list
4. Click the page -- canvas area shows a white 1440x900 canvas
5. Select rectangle tool (R key or toolbar button) -- cursor changes to crosshair
6. Drag on canvas to draw a rectangle
7. Select text tool (T key) -- click canvas to place text "文本"
8. Select pen tool (B key) -- draw freehand line
9. Select tool (V key) -- click and move objects
10. Press Ctrl+Z -- undo last action
11. Press Ctrl+Y -- redo
12. Select an object, press Delete -- object removed
13. Click "手绘模式" toggle -- switches to sketch mode with pen tool active
14. Click "设计模式" toggle -- switches back to design mode with grid visible
15. Click grid toggle button -- grid disappears
16. Status bar shows: page name, canvas size, object count, save status
17. Right-click a page item -- context menu with rename, duplicate, delete, export
18. Create a second page, drag to reorder

- [ ] **Step 4: Verify canvas.json is saved to disk**

After drawing on a page, check:
```bash
ls ~/Documents/AI-Prototyper/projects/{project_id}/pages/{page_id}/
cat ~/Documents/AI-Prototyper/projects/{project_id}/pages/{page_id}/canvas.json
```

Expected: `canvas.json` exists and contains the serialized Fabric.js objects.

- [ ] **Step 5: Verify page switching loads canvas data**

1. Draw several objects on page 1
2. Create page 2 and draw different objects
3. Switch back to page 1 -- original objects should be restored
4. Switch to page 2 -- those objects should be restored

- [ ] **Step 6: Run production build**

Run: `npm run tauri build`

Expected: Build completes without errors, producing an executable.

- [ ] **Step 7: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: integration fixes from end-to-end canvas engine verification"
```

Only commit if changes were needed. Skip if everything passed.

---

## Summary

After completing all 15 tasks, the project will have:

- **Fabric.js canvas** initialized in the center panel with configurable dimensions from canvas presets
- **Four drawing tools** -- Select (V), Pen (B), Rectangle (R), Text (T) -- with toolbar buttons and keyboard shortcuts
- **Canvas viewport controls** -- zoom in/out, fit-to-screen
- **Grid overlay** with configurable visibility and snap-to-grid alignment
- **Undo/Redo system** -- 50-step history stack with Ctrl+Z / Ctrl+Y
- **Canvas modes** -- Sketch mode (hand-drawn, pen-focused, no grid) and Design mode (precise editing, grid, snap)
- **Page management panel** -- page list with thumbnails, drag-and-drop reorder (dnd-kit), right-click context menu (rename, duplicate, delete, export), new page button
- **Auto-save** -- debounced canvas.json save after each change, status shown in StatusBar
- **Keyboard shortcuts** -- tool switching (V/B/R/T), undo/redo (Ctrl+Z/Y), delete (Delete), duplicate (Ctrl+D)
- **Rust backend** -- save_canvas_json, load_canvas_json, save_page_thumbnail, update_page_thumbnail_path, reorder_pages, duplicate_page, update_page_dimensions commands
- **canvasStore** -- Zustand store with history stack, save status, and object count
- **i18n** -- Chinese translations for all new canvas, page, and mode labels

**Next plan:** Plan 3 -- AI Integration (Chat panel, model configuration, prototype generation from text/sketch)
