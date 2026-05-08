# Plan 2 Review: Canvas Engine + Page Management + Drawing Tools

**Reviewer:** Claude Code (automated plan review)
**Date:** 2026-05-08
**Plan:** `2026-05-08-canvas-engine.md` (Plan 2 of 4)
**Dependencies reviewed:** Plan 1 (`2026-05-08-project-foundation.md`)

---

## Summary of Findings

The plan is well-structured with clear TDD steps and comprehensive coverage of canvas engine features. However, it contains **17 issues** across the 10 review categories: 5 critical, 7 moderate, 5 minor. The most severe problems are a Fabric.js version mismatch (v7 installed but v6 API assumed), module-level mutable state leaking across canvas instances, and duplicate canvas event handler registration causing double history pushes and double auto-saves.

---

## CRITICAL Issues

### C1. Fabric.js version mismatch -- v7 installed but code uses v6 patterns

**Location:** Plan 1, Task 1 (line 241), `npm install fabric` without version pin
**Affected files in Plan 2:** All files importing from `"fabric"`

Plan 1 installs `fabric` with no version constraint:
```
npm install ... fabric
```

As of 2026-05-08, `npm install fabric` resolves to v7.3.0+. The plan's code uses Fabric.js v6 API patterns that break in v7. Confirmed breaking changes from the Fabric.js CHANGELOG:

**v7 breaking change -- originX/originY defaults changed to center/center:**
In v7, new objects default to `originX: "center", originY: "center"` instead of `left/top`. This silently breaks all rectangle and text positioning in `rectangleTool.ts` (line ~1362) and `textTool.ts` (line ~1437), since the plan does not explicitly set `originX/originY`. Objects will appear offset from where the user clicks.

**v7 breaking change -- fireRightClick, fireMiddleClick, stopContextMenu deprecated:**
While the plan does not use these directly, if any future code or plugin references them, they will fail silently.

**v6+ breaking change -- `getPointer` deprecated:**
The plan uses `canvas.getScenePoint(opt.e)` in `rectangleTool.ts` and `textTool.ts`, which is the correct v6+ replacement. This part is fine.

**v6+ breaking change -- `clone(obj, true)` to `cloneDeep(obj)`:**
In `useKeyboardShortcuts.ts` (line ~2939), the code calls `active.clone().then((cloned) => ...)`. In v6+, `clone()` returns a promise but does not deep-clone linked objects. For a simple Ctrl+D duplicate, this works, but if the selected object has sub-objects (e.g., a Group), the clone will share references.

**Fix:** Pin Fabric.js to v6 in Plan 1:
```
npm install fabric@^6.0.0
```

Alternatively, if v7 is desired, add explicit `originX: "left", originY: "top"` to all object creation calls and audit for other v7 breakages.

### C2. `@types/fabric` conflicts with Fabric.js v6+ built-in types

**Location:** Plan 1, Task 1 (line 246)
```
npm install -D ... @types/fabric
```

`@types/fabric` is the community-maintained type definitions for Fabric.js v5. Starting with Fabric.js v6, the library ships its own built-in TypeScript types. Installing `@types/fabric` alongside `fabric@6+` causes type conflicts: duplicate declarations for `Canvas`, `Rect`, `IText`, `PencilBrush`, `Line`, etc. This will produce TypeScript compilation errors like:

```
Duplicate identifier 'Canvas'
Module '"fabric"' has duplicate exports
```

**Fix:** Remove `@types/fabric` from Plan 1's dev dependencies. Fabric.js v6+ provides its own types.

### C3. Canvas events double-registered -- history pushed twice and auto-save triggered twice per change

**Location:** Task 4 `useCanvas.ts` (lines ~968-984) AND Task 13 `CanvasArea.tsx` (lines ~3030-3041)

Both locations register `object:added`, `object:modified`, and `object:removed` handlers on the same canvas instance:

**In `useCanvas.ts` initCanvas:**
```typescript
canvas.on("object:added", () => {
  setObjectCount(canvas.getObjects().length);
  const json = getCanvasJSON(canvas);
  pushHistory(json);
});
```

**In CanvasArea.tsx handleCanvasReady:**
```typescript
canvas.on("object:added", () => {
  const data = getCanvasJSON(canvas);
  triggerSave(JSON.stringify(data));
});
```

Every canvas change fires both handlers, resulting in:
1. `pushHistory()` called twice per change (history fills at 2x rate, hitting the 50-entry limit prematurely)
2. `triggerSave()` called twice per change (unnecessary IPC traffic)

This is a design conflict between Task 4 (which adds history tracking in `useCanvas`) and Task 13 (which adds auto-save in `CanvasArea`). The plan was updated across tasks but the original `useCanvas` handlers were never removed.

**Fix:** Choose one location for event registration. Recommended approach:
- `useCanvas.ts` should handle only canvas lifecycle (init, resize, destroy, loadJSON, getJSON) -- remove the `object:*` event handlers from initCanvas.
- `CanvasArea.tsx` handleCanvasReady should register all `object:*` events for both history tracking and auto-save in a single set of handlers.

### C4. Module-level mutable state in tools leaks across canvas instances

**Location:**
- `src/components/canvas/tools/rectangleTool.ts` (lines ~1346-1351)
- `src/components/canvas/tools/textTool.ts` (lines ~1432-1437, via `onMouseDown` closure)
- `src/components/canvas/GridOverlay.ts` (lines ~1617-1620)

**rectangleTool.ts:**
```typescript
const state: RectState = {
  isDrawing: false,
  startX: 0,
  startY: 0,
  currentRect: null,
};
```

This state is module-level (not scoped per canvas instance). If the canvas is destroyed and recreated (e.g., page switch), the stale `state.currentRect` reference points to an object on the old canvas. On the next `onMouseDown`, the old rect is orphaned.

**GridOverlay.ts:**
```typescript
const state: GridState = {
  lines: [],
  gridSize: DEFAULT_GRID_SIZE,
};
```

Same problem: if `showGrid` is called for a second canvas, `hideGrid` on the first canvas is called (which is correct for cleanup), but `state.lines` now only references lines from the second canvas. Any remaining lines from the first canvas that were not removed are leaked.

**textTool.ts:** The `onMouseDown` function uses `this as unknown as Canvas` (see C5), but has no module-level state to leak. This entry is downgraded -- the issue is the `this` binding pattern, not state leakage.

**Fix:** Refactor tool modules to use a factory pattern that returns `{ activate, deactivate }` closures with private state scoped per canvas instance:
```typescript
export function createRectangleTool(canvas: Canvas): ToolActivator {
  let isDrawing = false;
  let startX = 0;
  // ... etc
  return { activate, deactivate };
}
```

### C5. `this` binding in tool event handlers is a fragile Fabric.js v5-era pattern

**Location:**
- `src/components/canvas/tools/rectangleTool.ts` `onMouseDown` (line ~1354), `onMouseMove` (line ~1377)
- `src/components/canvas/tools/textTool.ts` `onMouseDown` (line ~1432)

```typescript
function onMouseDown(opt: { e: MouseEvent }) {
  const canvas = (this as unknown as Canvas);
  if (!canvas) return;
```

This relies on Fabric.js calling event handlers with `this` bound to the Canvas instance. This is a Fabric.js v5 pattern. In v6+, while `this` binding is still supported, it is considered fragile because:
1. TypeScript cannot verify this pattern -- the `as unknown as Canvas` cast suppresses all type checking.
2. If the handler is ever called outside Fabric.js's event system (e.g., in a test), `this` is `undefined` and the handler silently does nothing.

**Fix:** Use the `opt` parameter which contains the canvas reference in v6+. Replace:
```typescript
function onMouseDown(opt: { e: MouseEvent }) {
  const canvas = (this as unknown as Canvas);
```
With a closure that captures the canvas reference:
```typescript
function createMouseDownHandler(canvas: Canvas) {
  return function onMouseDown(opt: { e: MouseEvent }) {
    const pointer = canvas.getScenePoint(opt.e);
    // ...
  };
}
```

---

## MODERATE Issues

### M1. Undo history `goBack()` edge case creates inconsistent state

**Location:** `src/stores/canvasStore.ts` (lines ~588-600)

```typescript
goBack: () => {
  const { historyIndex, history } = get();
  if (historyIndex <= 0) {
    if (historyIndex === 0) {
      set({ historyIndex: -1 });
      return history[0] ?? null;
    }
    return null;
  }
  // ...
},
```

When `historyIndex === 0`, `goBack()` sets `historyIndex` to `-1` but returns `history[0]`. This means the store state says "no valid history position" (-1) but a snapshot was returned and will be loaded onto the canvas. If the user then calls `goBack()` again, `historyIndex === -1` returns `null` (correct). But if the user calls `goForward()`, it advances to index 0 and returns `history[0]` -- the same snapshot that was already displayed. The user must press Ctrl+Y twice (0, then 1) to get back to where they were.

This creates a "phantom undo" where the first undo from index 0 shows the first snapshot but sets index to -1, making the forward path require an extra step.

**Fix:** When `historyIndex === 0`, return `null` (cannot undo past the first snapshot). Alternatively, allow `historyIndex` to reach -1 and make `goForward()` from -1 return `history[0]`:
```typescript
goForward: () => {
  const { historyIndex, history } = get();
  if (historyIndex >= history.length - 1) return null;
  const newIndex = historyIndex + 1;
  set({ historyIndex: newIndex });
  return history[newIndex] ?? null;
},
```
With this fix, when `historyIndex === -1`, `goForward()` returns `history[0]` (index becomes 0), which is correct. But the current `goForward` already handles this correctly. The issue is that `goBack` from 0 returns a snapshot while setting index to -1 -- the state says "nothing to redo" but the canvas shows a different state. Recommend returning `null` from `goBack()` when `historyIndex <= 0`.

### M2. `disableSnapToGrid` removes ALL `object:moving` handlers, not just the snap handler

**Location:** `src/components/canvas/GridOverlay.ts` (line ~1682)

```typescript
export function disableSnapToGrid(canvas: Canvas): void {
  canvas.off("object:moving");
}
```

`canvas.off("object:moving")` with no second argument removes ALL registered `object:moving` handlers, not just the one registered by `enableSnapToGrid`. If any other system registers an `object:moving` handler, it will be silently removed.

**Fix:** Store a reference to the snap handler and remove only that specific handler:
```typescript
let snapHandler: ((e: any) => void) | null = null;

export function enableSnapToGrid(canvas: Canvas, gridSize: number = DEFAULT_GRID_SIZE): void {
  snapHandler = (e) => {
    const obj = e.target;
    if (!obj) return;
    obj.set({
      left: snapToGrid(obj.left ?? 0, gridSize),
      top: snapToGrid(obj.top ?? 0, gridSize),
    });
  };
  canvas.on("object:moving", snapHandler);
}

export function disableSnapToGrid(canvas: Canvas): void {
  if (snapHandler) {
    canvas.off("object:moving", snapHandler);
    snapHandler = null;
  }
}
```
Note: This interacts with C4 -- the handler should also be scoped per canvas instance.

### M3. Toolbar calls `canUndo()`/`canRedo()` during render -- function calls, not reactive state

**Location:** `src/components/editor/Toolbar.tsx` (lines ~1927-1945)

```typescript
const canUndo = useCanvasStore((s) => s.canUndo);
const canRedo = useCanvasStore((s) => s.canRedo);

// ... in JSX:
disabled={!canUndo()}
```

`canUndo` and `canRedo` are functions (not state values). Zustand's `useStore(selector)` tracks changes based on reference equality of the selector's return value. Since `canUndo` is a function reference that never changes (it's defined once in the store), Zustand will never re-render the component when undo/redo state changes.

The component will show stale disabled states for the undo/redo buttons.

**Fix:** Use derived state instead of functions:
```typescript
const canUndo = useCanvasStore((s) => s.historyIndex >= 0);
const canRedo = useCanvasStore((s) => s.historyIndex < s.history.length - 1);
```

### M4. useAutoSave test may be flaky with fake timers + async dynamic imports

**Location:** `tests/hooks/useAutoSave.test.ts` (lines ~2556-2579)

The test uses `vi.useFakeTimers()` and then does `await import("@tauri-apps/api/core")` inside the test body. Dynamic imports are asynchronous, but fake timers can interfere with microtask resolution. The test at line 2567:
```typescript
act(() => {
  vi.advanceTimersByTime(1000);
});
expect(invoke).toHaveBeenCalledWith("save_canvas_json", { ... });
```

The `flushSave` callback uses `await import("@tauri-apps/api/core")` (dynamic import), which creates a Promise. With fake timers, the timer callback fires synchronously but the async dynamic import inside it creates a microtask that may not resolve before the assertion.

**Fix:** Either:
1. Use `vi.advanceTimersByTimeAsync(1000)` which properly flushes microtasks.
2. Or hoist the `@tauri-apps/api/core` mock to the top level and use `await vi.runAllTimersAsync()`.
3. Or add `await vi.runOnlyPendingTimersAsync()` followed by a `flushPromises()` helper.

### M5. Task 3 has duplicate Step 2 numbering

**Location:** Task 3 (lines ~655 and ~738)

Both "Create canvas_commands.rs" and "Add page reorder and duplicate commands" are labeled as "Step 2". This is a documentation formatting issue but could confuse an implementing agent.

**Fix:** Renumber: Step 1 (base64 dependency), Step 2 (canvas_commands.rs), Step 3 (page reorder/duplicate), Step 4 (register commands), Step 5 (verify), Step 6 (commit). Currently the plan has: Step 1, Step 2, Step 2, Step 3, Step 4, Step 5.

### M6. File structure listing is incomplete

**Location:** File Structure section (lines ~46-75)

The file structure section does not list:
- `src/hooks/useToolManager.ts` -- created in Task 5
- `src/hooks/useKeyboardShortcuts.ts` -- created in Task 12
- `src/hooks/useAutoSave.ts` -- created in Task 10

These are all mentioned in their respective tasks but missing from the top-level file structure overview.

**Fix:** Add to the hooks section:
```
├── hooks/
│   ├── useCanvas.ts
│   ├── useToolManager.ts            # NEW: tool activation/deactivation manager
│   ├── useKeyboardShortcuts.ts      # NEW: global keyboard shortcuts
│   └── useAutoSave.ts              # NEW: debounced canvas save hook
```

### M7. `loadCanvasJSON` return type mismatch with Fabric.js v6+

**Location:** `src/utils/canvasSerializer.ts` (lines ~394-396)

```typescript
export function loadCanvasJSON(canvas: Canvas, json: CanvasJSON): Promise<void> {
  return canvas.loadFromJSON(json);
}
```

In Fabric.js v6+, `canvas.loadFromJSON()` returns `Promise<Canvas>` (not `Promise<void>`). The TypeScript compiler with strict mode would flag this as a return type mismatch. The function works at runtime (the Promise resolves and the extra return value is ignored), but the type annotation is incorrect.

**Fix:** Either:
```typescript
export async function loadCanvasJSON(canvas: Canvas, json: CanvasJSON): Promise<void> {
  await canvas.loadFromJSON(json);
}
```
Or change the return type to `Promise<Canvas>` if callers need the canvas reference.

---

## MINOR Issues

### m1. StatusBar displays dimensions with `x` (Latin letter) instead of a proper separator

**Location:** `src/components/editor/StatusBar.tsx` (line ~2767)

```typescript
{currentPage.canvasWidth}x{currentPage.canvasHeight}
```

This uses the Latin letter `x` to separate width and height. While functional, the common convention for dimensions uses either an en-dash (`1440x900`), a multiplication sign (`1440x900`), or the explicit letter `x`. The current approach is fine for display, but if i18n requires different separators for different locales, this should be a translation key.

Similarly in `PageItem.tsx` (line ~2162):
```typescript
{page.canvasWidth}x{page.canvasHeight}
```

**Severity:** Cosmetic only. No functional impact.

### m2. Test file path duplication in file structure

**Location:** File Structure > Tests (lines ~86-93)

```
tests/
├── components/
│   └── canvas/
│       └── canvasSerializer.test.ts   # NEW
├── hooks/
│   └── useAutoSave.test.ts           # NEW
└── utils/
    └── canvasSerializer.test.ts      # NEW (mirror of above, kept flat)
```

The `canvasSerializer.test.ts` file is listed twice: once under `components/canvas/` and once under `utils/`. But Task 2 only creates one file at `tests/utils/canvasSerializer.test.ts`. The `tests/components/canvas/` entry is either:
1. A mistake (should not exist)
2. An intentional duplication that was not reflected in the actual task steps

Either way, an implementing agent might create a test file that is never run.

**Fix:** Remove the `tests/components/canvas/canvasSerializer.test.ts` entry from the file structure, or add a corresponding test creation step in a task.

### m3. No error handling for `canvas.loadFromJSON` failures during page switch

**Location:** Task 13 `CanvasArea.tsx` (lines ~3013-3027)

```typescript
const json = await invoke("load_canvas_json", { ... });
if (json) {
  await canvas.loadFromJSON(typeof json === "string" ? JSON.parse(json) : json);
  canvas.renderAll();
}
```

If the JSON is corrupted or was saved by a different Fabric.js version, `canvas.loadFromJSON()` will throw. The outer try-catch logs the error, but the canvas is left in a partially loaded state (some objects may have been added before the error). The user sees no feedback -- just a blank or broken canvas.

**Fix:** Wrap the `loadFromJSON` in its own try-catch, and if it fails, clear the canvas and show a user-visible warning:
```typescript
try {
  await canvas.loadFromJSON(parsed);
} catch (loadError) {
  canvas.clear();
  canvas.renderAll();
  console.error("Failed to load canvas data, starting fresh:", loadError);
}
```

### m4. `reorder_pages` makes N individual SQL queries instead of batch

**Location:** `src-tauri/src/commands/page_commands.rs` (lines ~744-760)

```rust
for (index, page_id) in page_ids.iter().enumerate() {
    sqlx::query("UPDATE pages SET sort_order = ?, updated_at = ? WHERE id = ? AND project_id = ?")
        .bind(index as i64)
        // ...
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;
}
```

This executes one UPDATE query per page. For a project with 20 pages, that is 20 sequential queries. While acceptable for small page counts, it is inefficient for larger projects and leaves the database in a partially updated state if a middle query fails.

**Fix:** Use a transaction:
```rust
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
```

### m5. `PageItem` passes drag `listeners` to the outer wrapper, blocking click events

**Location:** `src/components/editor/PageItem.tsx` (lines ~2114-2165)

The `useSortable` hook returns `{ attributes, listeners, setNodeRef, ... }`. The plan spreads both `attributes` and `listeners` onto the same `div` as the `onClick` handler:
```typescript
<div
  ref={setNodeRef}
  style={style}
  {...attributes}
  {...listeners}
  className={...}
  onClick={() => { if (!isRenaming) onClick(page.id); }}
>
```

The `listeners` from `useSortable` include `onPointerDown`, which can conflict with `onClick`. With `PointerSensor` configured with `activationConstraint: { distance: 8 }`, short clicks (less than 8px movement) should still trigger `onClick`. However, in practice, some browsers may not fire `click` after `pointerdown` has been handled by dnd-kit's listener, especially on touch devices.

**Severity:** Likely works fine with mouse on desktop (Tauri), but worth noting. The `distance: 8` constraint is a reasonable safeguard.

---

## Category-by-Category Checklist

### 1. Continuity with Plan 1

| Item | Status |
|------|--------|
| Imports from Plan 1 stores (projectStore, uiStore, settingsStore) | OK |
| Uses existing Rust commands (create_page, list_pages, delete_page, rename_page) | OK |
| Extends uiStore with new fields (canvasMode, gridVisible, currentPageId) | OK -- proper TDD approach |
| Reuses Plan 1 types (Page, Project, CANVAS_PRESETS) | OK |
| **Issue:** Fabric.js installed without version pin in Plan 1 | **C1** |
| **Issue:** `@types/fabric` conflicts with v6+ types | **C2** |

### 2. Fabric.js v6 API Accuracy

| Item | Status |
|------|--------|
| `Canvas` constructor with `document.createElement("canvas")` | OK (v6+) |
| `canvas.getScenePoint(opt.e)` for pointer position | OK (v6 replacement for getPointer) |
| `canvas.toJSON()` / `canvas.loadFromJSON()` async pattern | OK (v6+) |
| `canvas.setDimensions({ width, height })` | OK |
| `canvas.zoomToPoint({ x, y }, zoom)` | OK |
| `PencilBrush`, `Rect`, `IText`, `Line` imports from `"fabric"` | OK |
| `canvas.getElement()` for DOM access | OK |
| **Issue:** Version mismatch -- v7 breaking changes for originX/originY | **C1** |
| **Issue:** `this as unknown as Canvas` pattern is v5-era | **C5** |

### 3. Missing Steps

| Item | Status |
|------|--------|
| No step to remove `@types/fabric` from package.json | **C2** |
| No step to remove duplicate event handlers from useCanvas | **C3** |
| No step to add error handling for loadFromJSON on page switch | **m3** |
| File structure missing hooks entries | **M6** |

### 4. Type Mismatches

| Item | Status |
|------|--------|
| `@types/fabric` vs built-in types conflict | **C2** |
| `loadCanvasJSON` return type `Promise<void>` vs `Promise<Canvas>` | **M7** |
| `setPages(updatedPages as never[])` -- `never[]` cast in PagePanel | Unsafe but functional |
| `Canvas` import from `"fabric"` -- may be ambiguous with v7 type changes | **C1** |

### 5. Broken Imports

| Item | Status |
|------|--------|
| All imports use `@/` path aliases -- consistent with Plan 1 Vite config | OK |
| `import { Canvas } from "fabric"` -- correct for v6+ tree-shakeable imports | OK |
| `import { PencilBrush } from "fabric"` -- correct | OK |
| `import { Rect } from "fabric"` -- correct | OK |
| `import { IText } from "fabric"` -- correct | OK |
| `import { Line } from "fabric"` -- correct | OK |
| `import { useSortable } from "@dnd-kit/sortable"` -- correct | OK |
| `import { CSS } from "@dnd-kit/utilities"` -- correct | OK |
| `import { DndContext, closestCenter, ... } from "@dnd-kit/core"` -- correct | OK |
| No broken import paths detected | OK |

### 6. Canvas Serialization Correctness

| Item | Status |
|------|--------|
| `canvas.toJSON()` returns plain object with `version` and `objects` | OK |
| `canvas.loadFromJSON(json)` returns Promise, awaited correctly | OK |
| `createEmptyCanvasJSON()` hardcoded version `"6"` -- fragile but functional | Note: should read from Fabric.js |
| Grid lines with `excludeFromExport: true` will not appear in serialized JSON | OK |
| **Issue:** Double serialization per change (two event handlers) | **C3** |
| **Issue:** No error handling for deserialization failures | **m3** |

### 7. dnd-kit Usage

| Item | Status |
|------|--------|
| `DndContext` with `closestCenter` collision detection | OK |
| `SortableContext` with `verticalListSortingStrategy` | OK |
| `useSortable` returns `{ attributes, listeners, setNodeRef, transform, transition, isDragging }` | OK |
| `CSS.Transform.toString(transform)` for style application | OK |
| `PointerSensor` with `activationConstraint: { distance: 8 }` | OK |
| `KeyboardSensor` with `sortableKeyboardCoordinates` | OK |
| `handleDragEnd` correctly computes old/new indices and reorders array | OK |
| dnd-kit API usage verified against official documentation -- all correct | OK |

### 8. Test Validity

| Item | Status |
|------|--------|
| uiStore tests: straightforward state assertions | OK |
| canvasStore tests: good coverage of push/goBack/goForward/canUndo/canRedo | OK |
| canvasSerializer tests: basic serialization/deserialization | OK |
| Toolbar tests: render, click, state changes | OK |
| PagePanel tests: render, click, empty state | OK |
| useAutoSave tests: debounce timing | **M4** (flaky with fake timers + dynamic import) |
| StatusBar tests: basic render assertions | OK |
| EditorLayout tests: integration-level | OK |
| **Note:** No tests for tool modules (selectTool, penTool, rectangleTool, textTool) | Gap |
| **Note:** No tests for GridOverlay module | Gap |
| **Note:** No tests for canvasModes module | Gap |

### 9. File Size Compliance (400-line guideline)

| File | Approximate Lines | Status |
|------|-------------------|--------|
| `canvasStore.ts` | ~80 | OK |
| `canvasSerializer.ts` | ~35 | OK |
| `useCanvas.ts` | ~100 | OK |
| `CanvasRenderer.tsx` | ~60 | OK |
| `ViewportControls.tsx` | ~55 | OK |
| `CanvasArea.tsx` (Task 13 final) | ~120 | OK |
| `selectTool.ts` | ~25 | OK |
| `penTool.ts` | ~25 | OK |
| `rectangleTool.ts` | ~90 | OK |
| `textTool.ts` | ~45 | OK |
| `useToolManager.ts` | ~40 | OK |
| `GridOverlay.ts` | ~85 | OK |
| `canvasModes.ts` | ~60 | OK |
| `Toolbar.tsx` | ~90 | OK |
| `PagePanel.tsx` | ~210 | OK |
| `PageItem.tsx` | ~115 | OK |
| `PageContextMenu.tsx` | ~55 | OK |
| `StatusBar.tsx` | ~60 | OK |
| `useAutoSave.ts` | ~60 | OK |
| `useKeyboardShortcuts.ts` | ~110 | OK |
| `canvas_commands.rs` | ~75 | OK |
| `page_commands.rs` (additions) | ~120 | OK |

All files are well within the 400-line guideline. No files exceed 210 lines.

### 10. Zustand Store Immutability Patterns

| Item | Status |
|------|--------|
| `pushHistory` uses `state.history.slice(0, ...)` + `newHistory.push()` | **Violation** -- mutates `newHistory` array with `.push()` |
| `pushHistory` uses `newHistory.shift()` to enforce MAX_HISTORY | **Violation** -- mutates in place |
| `goBack`/`goForward` only set `historyIndex` (primitive) | OK |
| `clearHistory` creates new empty array | OK |
| `setSaveStatus`, `setObjectCount` set primitives | OK |
| uiStore `setCanvasMode`, `setCurrentPageId` set primitives | OK |
| uiStore `toggleGrid` uses `set((state) => ({ ... }))` correctly | OK |
| PagePanel `handleRename` creates new array with `.map()` | OK (immutable) |
| PagePanel `handleDelete` creates new array with `.filter()` | OK (immutable) |
| PagePanel `handleDragEnd` creates new array with splice pattern | **Violation** -- `reordered.splice()` mutates in place |

**pushHistory fix:**
```typescript
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
```

**handleDragEnd fix:** Already uses `[...pages]` spread before splice, so it creates a new array. The mutation is on the copy, not the original. This is actually OK.

---

## Recommendations Summary

1. **Before starting Plan 2 implementation, fix Plan 1:**
   - Pin `fabric` to `^6.0.0` (or audit all code for v7 compatibility)
   - Remove `@types/fabric` from dev dependencies

2. **Refactor tool modules to use factory pattern** to avoid module-level mutable state (C4, C5)

3. **Consolidate canvas event registration** into one location (C3) -- either `useCanvas` or `CanvasArea`, not both

4. **Fix `canUndo`/`canRedo` in Toolbar** to use derived state instead of function calls (M3)

5. **Add missing test coverage** for tool modules, GridOverlay, and canvasModes

6. **Wrap `reorder_pages` in a SQL transaction** (m4)

7. **Add error handling for `canvas.loadFromJSON`** on page switch (m3)
