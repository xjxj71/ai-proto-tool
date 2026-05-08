# Plan 4 Review: Export + Navigation + Memory + Skills + Polish

**Reviewer:** Critical Plan Review
**Date:** 2026-05-08
**Plan:** `2026-05-08-export-polish.md` (Plan 4 of 4)
**Status:** Issues found -- see details below

---

## 1. Continuity with Plans 1-3

### 1.1 `currentPageId` vs `pages[0]?.id` mismatch (MEDIUM)

In `ElementContextMenu` (Task 2, Step 7), line:
```typescript
const currentPageId = useProjectStore((s) => s.pages[0]?.id ?? "");
```
This hardcodes to `pages[0]` instead of using `useUiStore((s) => s.currentPageId)`, which is the canonical source established in Plan 2 (Task 1, uiStore). The `currentPageId` was added to `uiStore` specifically for tracking which page is active. Using `pages[0]` will always return the first page, not the currently selected page.

**Fix:** Replace with `const currentPageId = useUiStore((s) => s.currentPageId);`

### 1.2 `useProjectStore.pages` shape mismatch (LOW)

In `BatchExportDialog` (Task 4, Step 7), the component accesses:
```typescript
const currentProject = useProjectStore((s) => s.currentProject);
```
This is correct per Plan 1. However, `currentProject?.name` is used in JSX without null-safety on the template literal. If `currentProject` is null, the UI shows "undefined" text. Plan 1's `projectStore` has `currentProject: Project | null`, so a null guard is needed.

### 1.3 Keyboard shortcuts redefinition conflict (HIGH)

Plan 2 (Task 12) already creates `src/hooks/useKeyboardShortcuts.ts` with a signature:
```typescript
export function useKeyboardShortcuts({ getCanvas }: { getCanvas: () => Canvas | null })
```

Plan 4 (Task 9) redefines the same file with a DIFFERENT signature:
```typescript
export function useKeyboardShortcuts() // no parameters
```

The Plan 4 version drops canvas-specific shortcuts (Ctrl+Z/Y undo/redo, Delete, Ctrl+D duplicate) that depend on a canvas reference. It only handles tool switching and panel toggles. This is a **destructive overwrite** that breaks the undo/redo, delete, and duplicate keyboard shortcuts added in Plan 2.

**Fix:** Plan 4 should either (a) add tool/panel shortcuts to the existing Plan 2 implementation, or (b) create a separate hook like `useGlobalShortcuts` for tool/panel shortcuts and keep the Plan 2 hook for canvas-specific shortcuts.

### 1.4 `useUiStore` type mismatch for `toggleLeftPanel`/`toggleRightPanel` (MEDIUM)

The `useKeyboardShortcuts` in Plan 4 imports `toggleLeftPanel` and `toggleRightPanel` from `useUiStore`. These exist in the Plan 1 uiStore. However, Plan 2 updated `uiStore` to include new fields (`canvasMode`, `gridVisible`, `currentPageId`, etc.). The Plan 4 keyboard shortcuts hook needs to reference the Plan 2 version of uiStore, not the Plan 1 version. The plan text describes the correct imports but the code snippet does not import the extended types.

### 1.5 `Toolbar` component inconsistency (LOW)

Plan 4 Task 10 shows an updated `EditorLayout` that imports `Toolbar`, but the Toolbar was already heavily modified in Plan 2 (Task 8) to include canvas mode toggle, grid toggle, and undo/redo state. Plan 4 does not modify the Toolbar, which is correct, but the integration commit should verify the existing Toolbar still works with the new keyboard shortcuts.

### 1.6 Missing Rust module registration (MEDIUM)

Task 5 (Snapshots) adds `snapshot_commands.rs` and updates `commands/mod.rs`. But Task 3 (Export) also updates `commands/mod.rs`. If these are executed in order by different agents, the second update could overwrite the first's module declaration. The plan should note that `mod.rs` must be additive across all tasks.

---

## 2. HTML Generation

### 2.1 HTML is not truly self-contained (MEDIUM)

The `generate_single_page_html` function (Task 3, Step 1) produces valid HTML, but it is not truly "self-contained" as the plan claims. Issues:
- No inline images: If the canvas contains images, they are not embedded (no base64 conversion).
- No inline fonts: The HTML relies on system fonts only.
- External link navigation assumes files are in the same directory (no relative path normalization).

For a prototyping tool, this is acceptable for most use cases, but the plan description overpromises.

### 2.2 CSS content injected without sanitization (LOW)

The `css_content` parameter is injected directly into a `<style>` tag via Rust `format!()`. While the data comes from the frontend (trusted source), if the exported HTML is ever shared, injected CSS could contain malicious content. This is a minor concern since it is a desktop tool.

### 2.3 Batch export `page_refs` variable unused (MEDIUM)

In `export_commands.rs` (Task 3, Step 2):
```rust
let page_refs: Vec<(&str, &str)> = results
    .iter()
    .map(|r| ("", r.file_name.as_str()))
    .collect();
```
This variable is computed but never used. The subsequent code correctly builds a new collection for `generate_index_html`. This is dead code that will produce a compiler warning.

**Fix:** Remove the unused `page_refs` variable.

### 2.4 `export_single_page` command returns raw HTML string (LOW)

The `export_single_page` Tauri command returns the HTML as a string, but there is no file-save dialog triggered. The frontend ExportDialog has an `onExport` callback that is currently empty (`onExport={() => {}}`). The plan does not wire up the actual export flow -- the Rust command generates HTML but nothing saves it to disk or opens a save dialog.

**Fix:** The `ExportDialog` and `BatchExportDialog` `onExport` handlers need to call `invoke("export_single_page", ...)` and then use `@tauri-apps/plugin-dialog` to save the result to a user-chosen file path.

---

## 3. Element Link Integration with Fabric.js

### 3.1 Context menu does not actually wrap Fabric.js objects (HIGH)

The `ElementContextMenu` component (Task 2, Step 7) uses Radix UI's `ContextMenu.Root` + `ContextMenu.Trigger` with `asChild` to wrap `children`. However, Fabric.js canvas objects are rendered on an HTML `<canvas>` element, not as React DOM nodes. You cannot wrap a Fabric.js rectangle or text object with a React context menu trigger.

The plan provides no mechanism for:
1. Detecting which Fabric.js object was right-clicked (requires `canvas.on("mouse:down", ...)` with `e.button === 2`).
2. Converting Fabric.js canvas coordinates to screen coordinates for positioning the context menu.
3. Associating a React context menu with a non-DOM canvas element.

The `ElementContextMenu` component as designed only works with regular React DOM children, not with Fabric.js canvas objects.

**Fix:** Implement a custom right-click handler on the canvas that:
- Uses `canvas.on("mouse:down", handler)` to detect right-click on an object
- Gets the clicked object's ID (objects need a custom `elementId` property)
- Shows a positioned context menu (not Radix ContextMenu, since that requires DOM wrapping) at the mouse coordinates
- Handles the link/unlink actions

### 3.2 `LinkBadge` has no positioning mechanism (MEDIUM)

The `LinkBadge` component (Task 2, Step 6) uses `absolute` positioning (`-top-1 -right-1`) but it is never actually rendered on the canvas or positioned relative to any Fabric.js object. The component exists but is never connected to the canvas rendering pipeline.

**Fix:** Link badges would need to be rendered as Fabric.js overlay elements (or absolutely positioned divs that track canvas object positions), not as standalone React components.

### 3.3 No `elementId` on Fabric.js objects (HIGH)

The entire link system is built around `elementId` strings, but Fabric.js objects created by the drawing tools (Plan 2, Tasks 4-5) do not have an `elementId` property assigned to them. The rectangle tool, text tool, and pen tool create objects with no ID. There is no mechanism to assign or retrieve element IDs from canvas objects.

**Fix:** The drawing tools need to assign a unique `elementId` (e.g., via Fabric.js custom properties: `rect.set("elementId", uuidv4())`) when creating objects. The link system needs to read this property when right-clicking.

---

## 4. Memory System

### 4.1 Memory does not integrate with ChatEngine (HIGH)

The plan title says "Memory System" and the architecture says it "integrates with the AI ChatEngine from Plan 3," but the actual code does NOT integrate memory into the chat flow.

The `MemoryManager` class (Task 6, Step 5) has an `extractMemoryUpdates` method that can parse memory updates from AI responses. However:
- There is no code that calls `extractMemoryUpdates` after an AI response is received.
- The `MemoryManager` is never instantiated or used in `ChatEngine` or `useStreamingChat`.
- The `UserPreferences.ts`, `SavedModules.ts`, and `ProjectContext.ts` files are listed in the file structure but **never created** -- the plan jumps directly to `MemoryManager.ts` which tries to be all three in one.
- The three-layer architecture (UserPreferences / SavedModules / ProjectContext) described in the plan is collapsed into a single `MemoryManager` class and a single `memoryStore`. The individual layer files are not created.

**Fix:**
1. Create the three individual layer files (`UserPreferences.ts`, `SavedModules.ts`, `ProjectContext.ts`) as thin wrappers, or remove them from the file structure listing.
2. Wire `extractMemoryUpdates` into the streaming chat completion handler (after `stopStreaming` in `useStreamingChat`).
3. Add memory context to the `ContextBuilder.buildSystemPrompt` so the AI receives user preferences in future conversations.

### 4.2 `memoryStore.updatePreferences` uses `Partial<UserPreferences>` but `UserPreferences` is `Record<string, string>` (LOW)

`UserPreferences` is typed as `{ [key: string]: string }`, so `Partial<UserPreferences>` is identical to `UserPreferences`. This is not a bug, but the `Partial` wrapper is misleading since all fields are already optional in a record type.

### 4.3 `MemoryManager` uses non-existent Tauri commands (HIGH)

The `MemoryManager` invokes:
- `invoke("read_json_file", { path: "memory/..." })`
- `invoke("write_json_file", { path: "memory/...", data: ... })`
- `invoke("list_saved_modules")`
- `invoke("save_module", { module })`
- `invoke("delete_module", { id })`

None of these Tauri commands are defined in any of the four plans. Plan 1's Rust backend has `fs::io::read_json` and `fs::io::write_json` but these are internal Rust functions, not Tauri IPC commands. The Rust `commands/` directory does not expose generic file read/write commands.

**Fix:** Either (a) create the missing Rust IPC commands (`read_json_file`, `write_json_file`, `list_saved_modules`, `save_module`, `delete_module`), or (b) use the existing file I/O commands from Plan 2 (`save_canvas_json`, `load_canvas_json`) as a pattern and create specific memory persistence commands.

### 4.4 Missing `UserPreferences.ts`, `SavedModules.ts`, `ProjectContext.ts` files (MEDIUM)

These three files are listed in the file structure at the top of the plan but are never created in any task. The `MemoryManager.ts` file serves as the sole implementation, combining all three concerns. Either the file structure listing is wrong or the implementation is incomplete.

---

## 5. Skill Engine

### 5.1 Only 15 skills defined, but test asserts exact IDs (LOW)

The `SkillRegistry` defines 15 skills and the `SkillEngine.test.ts` tests check for specific IDs like `"landing-page"`, `"dashboard"`, `"form-design"`, `"wireframe"`. This is fine, but if skills are ever reordered or renamed, the tests break. This is a minor maintainability concern.

### 5.2 Keyword matching is order-dependent and greedy (MEDIUM)

The `matchSkill` method iterates skills in array order and returns the first match:
```typescript
for (const skill of this.skills) {
  for (const keyword of skill.keywords) {
    if (trimmed.includes(keyword)) {
      return skill;
    }
  }
}
```

Problems:
- If a user says "设计一个后台管理的表单", it matches "dashboard" (keyword "后台") instead of "form-design" (keyword "表单") because "dashboard" appears first in the array.
- Short keywords like "表格" could false-positive on longer unrelated text.
- There is no scoring or disambiguation mechanism.

**Fix:** Consider either (a) using the `@mention` syntax exclusively for skill selection (already supported), or (b) implementing a simple scoring system that counts keyword matches and returns the highest-scoring skill.

### 5.3 `buildSkillPrompt` return value is never used with ChatEngine (MEDIUM)

The `buildSkillPrompt` method generates a prompt string, but no code wires it into the `ChatEngine.buildRequest` flow. The `ChatEngine` (Plan 3) has a `skillName` parameter in `BuildRequestInput`, but Plan 4 never connects the `SkillEngine` to the `ChatEngine`.

**Fix:** In the `ChatPanel` or `useStreamingChat` hook, when a skill is matched:
1. Call `skillEngine.matchSkill(userInput)` to detect the skill
2. Set the active skill in `chatStore`
3. Pass `skillName` to `ChatEngine.buildRequest`
4. The `ContextBuilder` already has a placeholder for skill context

### 5.4 Skill definition files on disk are never loaded (MEDIUM)

The plan lists 15 skill directories under `~/Documents/AI-Prototyper/skills/` with `SKILL.md` files, but:
- No Rust command reads these directories.
- No frontend code loads skill definitions from disk.
- The `SkillRegistry.ts` hardcodes all 15 skills in TypeScript.
- The directory listing is purely decorative -- it has no functional purpose.

**Fix:** Either (a) remove the skill directory listing from the file structure (since skills are hardcoded), or (b) implement a skill loader that reads from the filesystem and merges with built-in skills.

---

## 6. Component Templates

### 6.1 Template data will NOT render correctly on Fabric.js canvas (HIGH)

The `templates.ts` file (Task 8, Step 5) defines template data with objects like:
```json
{ "type": "rect", "left": 0, "top": 0, "width": 1440, "height": 60, "fill": "#1a1a2e" }
{ "type": "text", "left": 24, "top": 18, "text": "Logo", "fontSize": 20, "fill": "#e0e0e0" }
{ "type": "circle", "left": 680, "top": 440, "radius": 6, "fill": "#7c6aef" }
```

These are plain JSON objects, NOT valid Fabric.js serialized objects. Fabric.js serialized objects require:
- A `version` field
- Specific Fabric.js property names (`strokeWidth`, not `stroke-width`)
- Type names that match Fabric.js class names exactly (`Rect`, `Text`, `Circle` -- capitalized)
- Additional properties like `originX`, `originY`, `scaleX`, `scaleY`, etc.

When loaded via `canvas.loadFromJSON()`, Fabric.js ignores objects with unrecognized types or missing required fields. The templates will produce a blank canvas.

**Fix:** Either (a) create templates using Fabric.js API and serialize them to JSON (so the format matches what `loadFromJSON` expects), or (b) implement a template-to-Fabric.js-object converter that transforms the simplified template format into proper Fabric.js class instances (`new Rect({...})`, `new Text({...})`, etc.).

### 6.2 No drag-and-drop implementation (MEDIUM)

The `ComponentCard` component (Task 8, Step 7) sets `draggable` and has an `onDragStart` prop, but:
- The `ComponentPanel` (Step 8) never passes an `onDragStart` handler to `ComponentCard`.
- There is no drop handler on the canvas area.
- The plan mentions `dnd-kit` in the tech stack but does not use it for component templates (it is only used for page reordering in Plan 2).
- HTML5 native drag-and-drop does not work well with Fabric.js canvas (the canvas captures mouse events).

**Fix:** Implement a proper drop handler that converts template data to Fabric.js objects and adds them to the canvas at the drop coordinates.

### 6.3 `initializeBuiltInTemplates` never called (MEDIUM)

The `TemplateRegistry.ts` function `initializeBuiltInTemplates()` (Task 8, Step 6) creates template objects with IDs, but this function is never called during app initialization. The `componentStore.builtInComponents` array remains empty.

**Fix:** Call `initializeBuiltInTemplates()` during app startup (in `App.tsx` or a startup effect in `EditorLayout`) and populate the `componentStore.builtInComponents`.

### 6.4 `uuid` import in TemplateRegistry but uuid not in dependencies (LOW)

`TemplateRegistry.ts` imports `import { v4 as uuidv4 } from "uuid"`, but the `uuid` package may already be available from Plan 1 (Rust uses `uuid`, but the frontend npm package needs to be installed separately). The plan does not include `npm install uuid` or note this dependency.

---

## 7. Keyboard Shortcuts

### 7.1 Input focus check incomplete (LOW)

The `useKeyboardShortcuts` hook (Task 9, Step 3) checks for `INPUT`, `TEXTAREA`, and `isContentEditable`, but does not check for `<select>` elements or elements with `role="textbox"`. When the user is interacting with a dropdown or a content-editable div within a dialog, tool shortcuts could fire unexpectedly.

### 7.2 Shortcut for Ctrl+2 does nothing (LOW)

The `switch` statement handles `case "1"` (toggle left panel) and `case "3"` (toggle right panel), but `case "2"` calls `e.preventDefault()` with no action. This silently blocks the browser's default Ctrl+2 behavior without providing any functionality. It should either do something or be removed.

### 7.3 No Ctrl+E shortcut implementation (MEDIUM)

The i18n translation keys (Task 10, Step 1) include:
```json
"export": "Ctrl+E 导出"
```
But the `useKeyboardShortcuts` hook does not implement Ctrl+E. The plan defines the shortcut in translations but never implements it.

### 7.4 No Ctrl+S shortcut implementation (MEDIUM)

Similarly, the translations include:
```json
"save": "Ctrl+S 保存"
```
But Ctrl+S is not implemented in the keyboard shortcuts hook. The auto-save system (Plan 2) handles saving automatically, but the user-visible shortcut is advertised but non-functional.

---

## 8. Missing Steps and Gaps

### 8.1 Export flow incomplete -- no file save dialog (HIGH)

The export dialogs (`ExportDialog`, `BatchExportDialog`) have `onExport` handlers that are empty:
```typescript
<ExportDialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} onExport={() => {}} />
```

The Rust backend generates HTML strings, but nothing writes them to disk or shows a save dialog. The plan creates the UI and the backend but does not connect them. The user can click "Export" but nothing happens.

**Fix:** Implement the `onExport` handler to:
1. Call the Rust export command to generate HTML
2. Use `@tauri-apps/plugin-dialog` `save()` to let the user choose a save location
3. Write the file using Tauri FS APIs

### 8.2 No PNG export implementation (MEDIUM)

The `ExportOptions` component (Task 4, Step 5) offers PNG export with resolution options (1x/2x/3x), and the `exportStore` tracks the selected format. But:
- No Rust command handles PNG generation.
- No frontend code calls `canvas.toDataURL()` to produce a PNG from the Fabric.js canvas.
- The export dialog does not implement PNG-specific logic.

The plan claims "PNG export (1x/2x/3x)" is implemented in the summary, but it is not.

**Fix:** Implement PNG export by calling `canvas.toDataURL({ format: "png", multiplier: resolution })` on the Fabric.js canvas, then saving the resulting base64 data to a file via Tauri.

### 8.3 SnapshotList TODOs never wired (MEDIUM)

In `SnapshotList.tsx` (Task 5, Step 7):
```typescript
onRestore={(id) => {
  /* TODO: wire to Rust command */
}}
onDelete={(id) => {
  /* TODO: wire to Rust command */
}}
```

The Rust snapshot commands exist (`restore_snapshot`, `delete_snapshot`), but the frontend never calls them. Snapshots can be created (via `create_snapshot`) but cannot be restored or deleted from the UI.

### 8.4 No "Create Snapshot" button (MEDIUM)

The `SnapshotList` component displays existing snapshots but there is no "Create Snapshot" button. The `create_snapshot` Rust command exists but no UI triggers it. The i18n keys include `"snapshot.create": "Create Snapshot"` but no button uses this key.

### 8.5 No Memory/Skill settings pages (LOW)

The file structure lists `src/components/settings/MemorySettings.tsx` and `src/components/settings/SkillList.tsx`, but these are never created in any task. The memory and skill data exists in stores but has no management UI.

### 8.6 `StatusBar` not updated for link count (LOW)

Task 10 (Step 3) says "Modify: StatusBar.tsx (add link count)" but the actual StatusBar update is not provided. The current Plan 2 StatusBar shows page name, canvas size, object count, and save status, but has no link count display.

### 8.7 No cleanup of skill directories (LOW)

The plan lists skill directories to be created under `~/Documents/AI-Prototyper/skills/`, but since skills are hardcoded in TypeScript, these directories serve no purpose and add maintenance burden. They should either be removed from the file structure or implemented.

---

## 9. Type Mismatches

### 9.1 `ExportPageData.width`/`height` are `i64` but HTML uses them as pixel values (LOW)

The Rust `ExportPageData` struct uses `i64` for width/height, which can be negative. The HTML template uses `{width}px` which would produce invalid CSS for negative values. This is a minor type safety concern.

### 9.2 `ProjectContextData.designSystem` is `Record<string, string>` (LOW)

In `memoryStore.ts`, `ProjectContextData.designSystem` is typed as `Record<string, string>`, but in the test:
```typescript
designSystem: { primaryColor: "#7c6aef", fontFamily: "sans-serif" },
```
This works because `Record<string, string>` accepts any string keys. However, the `MemoryManager.extractMemoryUpdates` returns `{ designSystem: Record<string, string> }` which is a flat key-value, not a nested design system structure. If the AI response contains nested design system data (e.g., `{ colors: { primary: "#7c6aef" } }`), the extraction will lose the nesting.

### 9.3 `SavedModule` type vs `ComponentTemplate` type overlap (LOW)

`SavedModule` (from `memoryStore`) has fields: `id`, `name`, `tags`, `previewPath`, `templateHtml`.
`ComponentTemplate` (from `componentStore`) has fields: `id`, `name`, `tags`, `previewPath`, `templateData`, `isBuiltIn`.

The fields `templateHtml` vs `templateData` serve the same purpose but have different names. If a saved module should be usable as a component template, a conversion is needed but is never implemented.

---

## 10. Broken Imports

### 10.1 `ElementContextMenu` imports `useProjectStore` for `pages` but missing `currentPageId` from `uiStore` (MEDIUM)

As noted in 1.1, the component uses `pages[0]?.id` instead of importing from `uiStore`.

### 10.2 `ComponentPanel` uses `getFilteredTemplates` which reads from store (LOW)

The `getFilteredTemplates` function in `TemplateRegistry.ts` accesses `useComponentStore.getState()` directly (not via React hook). This is a valid Zustand pattern but means the component will not re-render when `builtInComponents` changes unless the component also subscribes to the store. Currently, `ComponentPanel` only subscribes to `searchQuery`, so it will not update when built-in templates are loaded.

**Fix:** Also subscribe to `builtInComponents` in `ComponentPanel`, or make `getFilteredTemplates` a React hook.

### 10.3 `MenuBar` plan does not show full integration code (MEDIUM)

Task 10 (Step 3) shows code fragments for updating MenuBar but uses comments like "// Inside MenuBar component, add state:" instead of providing the complete updated component. This makes it ambiguous where exactly to insert the dropdown menu code and dialog state. The fragments also omit the necessary imports (e.g., `useState`).

---

## Summary of Issue Severity

| Severity | Count | Key Issues |
|----------|-------|------------|
| HIGH     | 5     | Keyboard shortcuts overwrite Plan 2; context menu does not work with Fabric.js; no elementId on canvas objects; memory not integrated with ChatEngine; MemoryManager calls non-existent Tauri commands |
| MEDIUM   | 13    | currentPageId mismatch; batch export unused variable; no file save dialog; export flow incomplete; no PNG export; keyword matching greedy; template data invalid for Fabric.js; no drag-drop for templates; snapshot TODOs unwired; no create snapshot button; Ctrl+E/S not implemented; MenuBar integration ambiguous; component store not reactive |
| LOW      | 10    | Type safety for width/height; SavedModule vs ComponentTemplate overlap; Partial on Record type; incomplete input focus check; Ctrl+2 does nothing; skill directories unnecessary; StatusBar not updated for links; uuid dependency not noted; etc. |

## Critical Path Before Execution

Before implementing Plan 4, the following must be resolved:

1. **Fabric.js context menu integration** -- The entire element link system (Tasks 1-2) depends on right-clicking Fabric.js objects, but the proposed implementation uses DOM-based context menus. This needs a fundamentally different approach (canvas event listeners + custom positioned menus).

2. **Template data format** -- Task 8 templates will not render on Fabric.js canvas. The data format must either match Fabric.js serialization or include a converter.

3. **Keyboard shortcuts merge** -- Plan 4's `useKeyboardShortcuts` will overwrite Plan 2's version, losing canvas undo/redo/delete/duplicate shortcuts. These must be merged.

4. **Memory integration** -- The memory system needs wiring into the chat flow and the missing Rust commands need to be created.

5. **Export save flow** -- The export buttons are non-functional. The `onExport` handlers need full implementation including Tauri save dialogs.

6. **MemoryManager Rust commands** -- Five Tauri commands called by `MemoryManager` do not exist and must be created.
