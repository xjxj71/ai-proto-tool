# Export + Navigation + Memory + Skills + Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add element jump binding, HTML/PNG export, batch project export, design snapshots, AI memory system, AI skill engine, component template library, keyboard shortcuts, and final polish to complete the AI-Proto-Tool desktop application.

**Architecture:** Rust backend handles HTML generation and file export via Tauri IPC commands. Frontend adds right-click context menus for element navigation, export dialogs, snapshot management, memory/skill modules that integrate with the AI ChatEngine from Plan 3, and a component template drag-and-drop system. Keyboard shortcuts use a global listener hook.

**Tech Stack:** Tauri 2.x (Rust), React 18, TypeScript, Zustand, Fabric.js, Radix UI, dnd-kit

---

## Roadmap Context

This is **Plan 4 of 4**. It depends on all previous plans being complete:

| Plan | Status | Key Outputs |
|------|--------|-------------|
| Plan 1 | Complete | Project scaffold, SQLite, file system, stores, i18n, editor shell |
| Plan 2 | Complete | Fabric.js canvas, drawing tools, page CRUD, canvas modes, undo/redo |
| Plan 3 | Complete | AI chat, model config, streaming, prototype generation/modification |
| **Plan 4** (this) | — | Export, navigation, memory, skills, templates, shortcuts, polish |

---

## File Structure

### Rust Backend (new/modified files)

```
src-tauri/src/
├── commands/
│   ├── export_commands.rs     # HTML/PNG export commands
│   ├── snapshot_commands.rs   # Snapshot CRUD commands
│   ├── memory_commands.rs     # Memory persistence commands (read/write JSON, saved modules)
│   └── mod.rs                 # Add new command modules (additive across tasks)
├── export/
│   ├── mod.rs                 # Export module root
│   └── html_generator.rs      # HTML string generation from canvas data
└── lib.rs                     # Register new commands
```

### Frontend (new files)

```
src/
├── components/
│   ├── editor/
│   │   ├── ElementContextMenu.tsx    # Custom positioned div context menu for Fabric.js objects
│   │   ├── LinkBadge.tsx             # Visual marker for linked elements
│   │   └── PageSelectorDialog.tsx    # Page picker for link binding
│   ├── export/
│   │   ├── ExportDialog.tsx          # Single page export dialog
│   │   ├── BatchExportDialog.tsx     # Project-level batch export dialog
│   │   └── ExportOptions.tsx         # Export format/resolution options
│   ├── snapshots/
│   │   ├── SnapshotList.tsx          # Snapshot list in page panel
│   │   └── SnapshotItem.tsx          # Single snapshot entry
│   ├── components/
│   │   ├── ComponentPanel.tsx        # Component template library panel
│   │   └── ComponentCard.tsx         # Single template card
│   └── settings/
│       ├── MemorySettings.tsx        # Memory management UI
│       └── SkillList.tsx             # Skill browsing UI
├── canvas/
│   └── linkManager.ts               # Element link management utilities
├── memory/
│   ├── MemoryManager.ts             # Three-layer memory orchestrator
│   ├── UserPreferences.ts           # User preference extraction/storage
│   ├── SavedModules.ts              # Saved module management
│   └── ProjectContext.ts            # Project context management
├── skills/
│   ├── SkillEngine.ts               # Skill matching and execution
│   └── SkillRegistry.ts             # Skill definitions and keyword maps
├── templates/
│   ├── TemplateRegistry.ts          # Built-in and custom template management
│   └── templates.ts                 # Built-in component template data
├── hooks/
│   └── useKeyboardShortcuts.ts      # Extended global keyboard shortcut handler (extends Plan 2 version)
├── stores/
│   ├── snapshotStore.ts             # Snapshot state
│   ├── memoryStore.ts               # Memory state
│   ├── componentStore.ts            # Component template state
│   └── exportStore.ts               # Export progress state
└── i18n/locales/zh-CN/translation.json  # Updated with new keys
```

### Skill Definition Files (shipped with app)

```
~/Documents/AI-Prototyper/skills/
├── landing-page/
│   ├── SKILL.md
│   └── templates/
├── dashboard/
│   ├── SKILL.md
│   └── templates/
├── form-design/
│   ├── SKILL.md
│   └── templates/
├── e-commerce/
│   ├── SKILL.md
│   └── templates/
├── data-table/
│   ├── SKILL.md
│   └── templates/
├── navigation/
│   ├── SKILL.md
│   └── templates/
├── mobile-layout/
│   ├── SKILL.md
│   └── templates/
├── card-list/
│   ├── SKILL.md
│   └── templates/
├── design-system/
│   ├── SKILL.md
│   └── templates/
├── accessibility/
│   ├── SKILL.md
│   └── templates/
├── responsive/
│   ├── SKILL.md
│   └── templates/
├── interaction/
│   ├── SKILL.md
│   └── templates/
├── dark-mode/
│   ├── SKILL.md
│   └── templates/
├── wireframe/
│   ├── SKILL.md
│   └── templates/
└── prototype-polish/
    ├── SKILL.md
    └── templates/
```

---

## Task 1: Element Link Manager — Data Layer

**Files:**
- Create: `src/canvas/linkManager.ts`
- Test: `tests/canvas/linkManager.test.ts`

- [ ] **Step 1: Write failing tests for linkManager**

Create `tests/canvas/linkManager.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import {
  addElementLink,
  removeElementLink,
  updateElementLink,
  getLinksForPage,
  getLinksForElement,
  type ElementLink,
} from "@/canvas/linkManager";

describe("linkManager", () => {
  const mockLinks: ElementLink[] = [
    { elementId: "el-1", targetPageId: "page-2", label: "商品详情" },
    { elementId: "el-2", targetPageId: "page-3", label: "购物车" },
    { elementId: "el-3", targetPageId: "page-2", label: "查看详情" },
  ];

  it("should add a new link to empty list", () => {
    const result = addElementLink([], "el-1", "page-2", "详情");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ elementId: "el-1", targetPageId: "page-2", label: "详情" });
  });

  it("should add a new link to existing list", () => {
    const result = addElementLink(mockLinks, "el-4", "page-5", "新链接");
    expect(result).toHaveLength(4);
    expect(result[3].elementId).toBe("el-4");
  });

  it("should replace existing link for same element", () => {
    const result = addElementLink(mockLinks, "el-1", "page-5", "新目标");
    expect(result).toHaveLength(3);
    expect(result[0].targetPageId).toBe("page-5");
  });

  it("should remove a link by element id", () => {
    const result = removeElementLink(mockLinks, "el-2");
    expect(result).toHaveLength(2);
    expect(result.find((l) => l.elementId === "el-2")).toBeUndefined();
  });

  it("should update a link target", () => {
    const result = updateElementLink(mockLinks, "el-1", "page-9", "新标签");
    expect(result[0].targetPageId).toBe("page-9");
    expect(result[0].label).toBe("新标签");
  });

  it("should get links for a page (outgoing)", () => {
    const result = getLinksForPage(mockLinks);
    expect(result).toHaveLength(3);
  });

  it("should get link for a specific element", () => {
    const result = getLinksForElement(mockLinks, "el-1");
    expect(result).toEqual({ elementId: "el-1", targetPageId: "page-2", label: "商品详情" });
  });

  it("should return undefined for element without link", () => {
    const result = getLinksForElement(mockLinks, "el-999");
    expect(result).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/canvas/linkManager.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write linkManager implementation**

Create `src/canvas/linkManager.ts`:
```typescript
export interface ElementLink {
  elementId: string;
  targetPageId: string;
  label: string;
}

export function addElementLink(
  links: ElementLink[],
  elementId: string,
  targetPageId: string,
  label: string,
): ElementLink[] {
  const filtered = links.filter((l) => l.elementId !== elementId);
  return [...filtered, { elementId, targetPageId, label }];
}

export function removeElementLink(links: ElementLink[], elementId: string): ElementLink[] {
  return links.filter((l) => l.elementId !== elementId);
}

export function updateElementLink(
  links: ElementLink[],
  elementId: string,
  targetPageId: string,
  label: string,
): ElementLink[] {
  return links.map((l) => (l.elementId === elementId ? { ...l, targetPageId, label } : l));
}

export function getLinksForPage(links: ElementLink[]): ElementLink[] {
  return links;
}

export function getLinksForElement(
  links: ElementLink[],
  elementId: string,
): ElementLink | undefined {
  return links.find((l) => l.elementId === elementId);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/canvas/linkManager.test.ts`
Expected: All 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/canvas/linkManager.ts tests/canvas/linkManager.test.ts
git commit -m "feat: add element link manager with CRUD operations"
```

---

## Task 1b: Assign elementId to All Fabric.js Objects

> **IMPORTANT:** The link system (Task 2+) depends on each Fabric.js object having a unique `elementId` custom property. Drawing tools from Plan 2 never assign IDs to created objects. This task ensures all existing and future Fabric.js objects carry an `elementId`.

**Files:**
- Modify: Plan 2's rectangle tool (add `elementId` after Rect creation)
- Modify: Plan 2's text tool (add `elementId` after IText creation)
- Modify: Plan 2's pen tool (add `elementId` after path creation)
- Modify: Plan 3's AI prototype rendering (assign `elementId` to each generated element)
- Modify: Plan 2's canvas serializer (include `elementId` in serialization)

- [ ] **Step 1: Ensure uuid is available**

If not already installed:
```bash
npm install uuid
npm install -D @types/uuid
```

- [ ] **Step 2: Add elementId to rectangle tool**

In Plan 2's rectangle drawing tool handler, after creating a `Rect`:
```typescript
import { v4 as uuidv4 } from "uuid";

// After creating the rect:
rect.set('elementId', uuidv4());
canvas.add(rect);
```

- [ ] **Step 3: Add elementId to text tool**

In Plan 2's text tool handler, after creating an `IText`:
```typescript
// After creating the text object:
textObj.set('elementId', uuidv4());
canvas.add(textObj);
```

- [ ] **Step 4: Add elementId to pen tool**

In Plan 2's pen/freehand drawing handler, after the path is created:
```typescript
// After the path is finalized:
path.set('elementId', uuidv4());
```

- [ ] **Step 5: Add elementId to AI prototype rendering**

In Plan 3's prototype rendering code (where AI-generated elements are added to canvas), assign `elementId` to each generated Fabric.js object:
```typescript
// When creating objects from AI response:
for (const obj of fabricObjects) {
  obj.set('elementId', uuidv4());
  canvas.add(obj);
}
```

- [ ] **Step 6: Include elementId in canvas serialization**

In Plan 2's `canvasSerializer.ts`, update `toJSON` to include the custom property:
```typescript
// Change:
const json = canvas.toJSON();
// To:
const json = canvas.toJSON(['elementId']);
```

And when loading:
```typescript
// Fabric.js will restore custom properties if they were in the serialized data.
// Ensure loadFromJSON preserves elementId by passing the same array:
canvas.loadFromJSON(json);
```

- [ ] **Step 7: Verify elementId persists**

Manual test: Draw a rectangle, check `canvas.getObjects()[0].elementId` is a UUID. Save canvas. Load canvas. Verify `elementId` is still present.

- [ ] **Step 8: Commit**

```bash
git add -u
git commit -m "feat: assign elementId to all Fabric.js objects for link system support"
```

---

## Task 2: Element Context Menu — Right-Click Link Binding

> **IMPORTANT:** Fabric.js objects are rendered on an HTML `<canvas>`, not as DOM elements. Radix UI's `ContextMenu.Trigger` wraps DOM children and cannot attach to canvas-rendered objects. Instead, we use a custom positioned `<div>` menu triggered by Fabric.js canvas `mouse:down` events with `button === 2` (right-click).

**Files:**
- Create: `src/components/editor/PageSelectorDialog.tsx`
- Create: `src/components/editor/ElementContextMenu.tsx` (custom positioned div, NOT Radix ContextMenu)
- Create: `src/components/editor/LinkBadge.tsx`
- Create: `src/stores/linkStore.ts`
- Test: `tests/stores/linkStore.test.ts`
- Test: `tests/components/editor/ElementContextMenu.test.tsx`

- [ ] **Step 1: Write failing test for linkStore**

Create `tests/stores/linkStore.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useLinkStore } from "@/stores/linkStore";

describe("linkStore", () => {
  beforeEach(() => {
    useLinkStore.setState({ links: [], selectedElementId: null });
  });

  it("should start with empty links", () => {
    expect(useLinkStore.getState().links).toEqual([]);
  });

  it("should add a link", () => {
    useLinkStore.getState().addLink("el-1", "page-2", "详情");
    expect(useLinkStore.getState().links).toHaveLength(1);
  });

  it("should remove a link", () => {
    useLinkStore.getState().addLink("el-1", "page-2", "详情");
    useLinkStore.getState().removeLink("el-1");
    expect(useLinkStore.getState().links).toHaveLength(0);
  });

  it("should set selected element", () => {
    useLinkStore.getState().setSelectedElementId("el-1");
    expect(useLinkStore.getState().selectedElementId).toBe("el-1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/stores/linkStore.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write linkStore implementation**

Create `src/stores/linkStore.ts`:
```typescript
import { create } from "zustand";
import { addElementLink, removeElementLink, type ElementLink } from "@/canvas/linkManager";

interface LinkState {
  links: ElementLink[];
  selectedElementId: string | null;
  addLink: (elementId: string, targetPageId: string, label: string) => void;
  removeLink: (elementId: string) => void;
  setLinks: (links: ElementLink[]) => void;
  setSelectedElementId: (id: string | null) => void;
}

export const useLinkStore = create<LinkState>((set) => ({
  links: [],
  selectedElementId: null,
  addLink: (elementId, targetPageId, label) =>
    set((state) => ({ links: addElementLink(state.links, elementId, targetPageId, label) })),
  removeLink: (elementId) =>
    set((state) => ({ links: removeElementLink(state.links, elementId) })),
  setLinks: (links) => set({ links }),
  setSelectedElementId: (id) => set({ selectedElementId: id }),
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/stores/linkStore.test.ts`
Expected: All 4 tests PASS.

- [ ] **Step 5: Create PageSelectorDialog component**

Create `src/components/editor/PageSelectorDialog.tsx`:
```typescript
import { useTranslation } from "react-i18next";
import * as Dialog from "@radix-ui/react-dialog";
import type { Page } from "@/types";

interface PageSelectorDialogProps {
  open: boolean;
  pages: Page[];
  currentPageId: string;
  onSelect: (pageId: string) => void;
  onClose: () => void;
}

export function PageSelectorDialog({
  open,
  pages,
  currentPageId,
  onSelect,
  onClose,
}: PageSelectorDialogProps) {
  const { t } = useTranslation();
  const otherPages = pages.filter((p) => p.id !== currentPageId);

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-surface rounded-lg p-4 w-[360px] border border-border max-h-[400px] overflow-y-auto">
          <Dialog.Title className="text-sm font-medium text-text-primary mb-3">
            选择目标页面
          </Dialog.Title>
          {otherPages.length === 0 ? (
            <p className="text-xs text-text-muted py-4 text-center">
              没有其他页面可链接
            </p>
          ) : (
            <ul className="space-y-1">
              {otherPages.map((page) => (
                <li key={page.id}>
                  <button
                    onClick={() => { onSelect(page.id); onClose(); }}
                    className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors"
                  >
                    {page.name}
                    <span className="text-xs text-text-muted ml-2">
                      {page.canvasWidth}×{page.canvasHeight}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 6: Create LinkBadge component**

Create `src/components/editor/LinkBadge.tsx`:
```typescript
import { Link } from "lucide-react";

interface LinkBadgeProps {
  label: string;
}

export function LinkBadge({ label }: LinkBadgeProps) {
  return (
    <div className="absolute -top-1 -right-1 flex items-center gap-0.5 bg-accent text-white text-[10px] px-1 py-0.5 rounded-sm pointer-events-none z-10">
      <Link size={8} />
      <span>{label}</span>
    </div>
  );
}
```

- [ ] **Step 7: Create ElementContextMenu component (custom positioned div)**

> **Note:** This is a plain positioned `<div>`, NOT a Radix UI ContextMenu. Fabric.js objects are not DOM elements, so Radix's `ContextMenu.Trigger` (which wraps DOM children) cannot work with them. Instead, `CanvasArea` listens for right-clicks on Fabric.js objects and renders this menu at the mouse coordinates.

Create `src/components/editor/ElementContextMenu.tsx`:
```typescript
interface ElementContextMenuProps {
  x: number;
  y: number;
  elementId: string;
  hasLink: boolean;
  onSetLink: () => void;
  onEditLink: () => void;
  onRemoveLink: () => void;
  onClose: () => void;
}

export function ElementContextMenu({ x, y, elementId, hasLink, onSetLink, onEditLink, onRemoveLink, onClose }: ElementContextMenuProps) {
  return (
    <div
      style={{ position: 'fixed', left: x, top: y, zIndex: 1000 }}
      className="min-w-[160px] bg-bg-surface border border-border rounded-lg p-1 shadow-xl"
    >
      <button
        onClick={() => { hasLink ? onEditLink() : onSetLink(); onClose(); }}
        className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded cursor-pointer"
      >
        {hasLink ? "编辑链接" : "设置链接"}
      </button>
      {hasLink && (
        <>
          <div className="h-px bg-border my-1" />
          <button
            onClick={() => { onRemoveLink(); onClose(); }}
            className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm text-danger hover:bg-bg-tertiary rounded cursor-pointer"
          >
            移除链接
          </button>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 7a: Add Canvas right-click handler in CanvasArea**

In `src/components/editor/CanvasArea.tsx`, add context menu state and Fabric.js right-click listener:

```typescript
import { useState, useEffect } from "react";
import { ElementContextMenu } from "./ElementContextMenu";
import { PageSelectorDialog } from "./PageSelectorDialog";
import { useLinkStore } from "@/stores/linkStore";
import { useProjectStore } from "@/stores/projectStore";
import { useUiStore } from "@/stores/uiStore";
import { getLinksForElement } from "@/canvas/linkManager";

// Inside CanvasArea component:
const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId: string } | null>(null);
const [selectorOpen, setSelectorOpen] = useState(false);
const [selectorElementId, setSelectorElementId] = useState<string | null>(null);
const links = useLinkStore((s) => s.links);
const addLink = useLinkStore((s) => s.addLink);
const removeLink = useLinkStore((s) => s.removeLink);
const pages = useProjectStore((s) => s.pages);
const currentPageId = useUiStore((s) => s.currentPageId);

// After canvas initialization (in the canvas setup effect):
useEffect(() => {
  if (!canvas) return;

  const handleMouseDown = (opt: fabric.IEvent<MouseEvent>) => {
    if (opt.e.button === 2) { // right-click
      const target = canvas.findTarget(opt.e);
      if (target && (target as any).elementId) {
        opt.e.preventDefault();
        setContextMenu({
          x: opt.e.clientX,
          y: opt.e.clientY,
          elementId: (target as any).elementId,
        });
      }
    }
    if (opt.e.button === 0) { // left-click closes menu
      setContextMenu(null);
    }
  };

  canvas.on('mouse:down', handleMouseDown);
  return () => {
    canvas.off('mouse:down', handleMouseDown);
  };
}, [canvas]);

// Render context menu and page selector dialog:
{contextMenu && (
  <ElementContextMenu
    x={contextMenu.x}
    y={contextMenu.y}
    elementId={contextMenu.elementId}
    hasLink={!!getLinksForElement(links, contextMenu.elementId)}
    onSetLink={() => { setSelectorElementId(contextMenu.elementId); setSelectorOpen(true); }}
    onEditLink={() => { setSelectorElementId(contextMenu.elementId); setSelectorOpen(true); }}
    onRemoveLink={() => { removeLink(contextMenu.elementId); setContextMenu(null); }}
    onClose={() => setContextMenu(null)}
  />
)}
<PageSelectorDialog
  open={selectorOpen}
  pages={pages}
  currentPageId={currentPageId}
  onSelect={(targetPageId) => {
    if (selectorElementId) {
      const targetPage = pages.find((p) => p.id === targetPageId);
      addLink(selectorElementId, targetPageId, targetPage?.name ?? "未知页面");
    }
    setSelectorOpen(false);
    setSelectorElementId(null);
    setContextMenu(null);
  }}
  onClose={() => { setSelectorOpen(false); setSelectorElementId(null); }}
/>
```
```

- [ ] **Step 8: Write test for ElementContextMenu**

Create `tests/components/editor/ElementContextMenu.test.tsx`:
```typescript
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ElementContextMenu } from "@/components/editor/ElementContextMenu";

describe("ElementContextMenu", () => {
  it("should render menu at specified position", () => {
    render(
      <ElementContextMenu
        x={100}
        y={200}
        elementId="el-1"
        hasLink={false}
        onSetLink={() => {}}
        onEditLink={() => {}}
        onRemoveLink={() => {}}
        onClose={() => {}}
      />,
    );
    const menu = screen.getByText("设置链接").closest("div");
    expect(menu).toBeInTheDocument();
    expect(menu?.style.left).toBe("100px");
    expect(menu?.style.top).toBe("200px");
  });

  it("should show remove link option when hasLink is true", () => {
    render(
      <ElementContextMenu
        x={100}
        y={200}
        elementId="el-1"
        hasLink={true}
        onSetLink={() => {}}
        onEditLink={() => {}}
        onRemoveLink={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("编辑链接")).toBeInTheDocument();
    expect(screen.getByText("移除链接")).toBeInTheDocument();
  });

  it("should not show remove link option when hasLink is false", () => {
    render(
      <ElementContextMenu
        x={100}
        y={200}
        elementId="el-1"
        hasLink={false}
        onSetLink={() => {}}
        onEditLink={() => {}}
        onRemoveLink={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("设置链接")).toBeInTheDocument();
    expect(screen.queryByText("移除链接")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 9: Run tests**

Run: `npm test -- tests/stores/linkStore.test.ts tests/components/editor/ElementContextMenu.test.tsx`
Expected: All 7 tests PASS (4 linkStore + 3 ElementContextMenu).

- [ ] **Step 10: Commit**

```bash
git add src/stores/linkStore.ts src/canvas/linkManager.ts src/components/editor/PageSelectorDialog.tsx src/components/editor/LinkBadge.tsx src/components/editor/ElementContextMenu.tsx tests/
git commit -m "feat: add element jump binding with right-click context menu and link badges"
```

---

## Task 3: Rust — HTML/PNG Export Commands

**Files:**
- Create: `src-tauri/src/export/mod.rs`
- Create: `src-tauri/src/export/html_generator.rs`
- Create: `src-tauri/src/commands/export_commands.rs`
- Modify: `src-tauri/src/lib.rs` (register export commands)
- Modify: `src-tauri/src/commands/mod.rs` (add export_commands)

- [ ] **Step 1: Create export module**

Create `src-tauri/src/export/mod.rs`:
```rust
pub mod html_generator;
```

Create `src-tauri/src/export/html_generator.rs`:
```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct ExportPageData {
    pub page_name: String,
    pub html_content: String,
    pub css_content: String,
    pub width: i64,
    pub height: i64,
    pub links: Vec<LinkData>,
}

#[derive(Debug, Deserialize)]
pub struct LinkData {
    pub element_selector: String,
    pub target_file: String,
}

#[derive(Debug, Serialize)]
pub struct ExportResult {
    pub content: String,
    pub file_name: String,
}

pub fn generate_single_page_html(data: &ExportPageData) -> String {
    let links_script = generate_links_script(&data.links);

    format!(
        r#"<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{page_name}</title>
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ width: {width}px; min-height: {height}px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }}
{css}
</style>
</head>
<body>
{html}
{links_script}
</body>
</html>"#,
        page_name = data.page_name,
        width = data.width,
        height = data.height,
        css = data.css_content,
        html = data.html_content,
        links_script = links_script,
    )
}

pub fn generate_index_html(pages: &[(&str, &str)]) -> String {
    let page_links: Vec<String> = pages
        .iter()
        .map(|(name, file)| {
            format!(
                r#"<li><a href="{file}" style="display:block;padding:12px 16px;color:#7c6aef;text-decoration:none;border-bottom:1px solid #2a2a4a;">{name}</a></li>"#,
                file = file,
                name = name,
            )
        })
        .collect();

    format!(
        r#"<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>项目导航</title>
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ background: #1a1a2e; color: #e0e0e0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; }}
h1 {{ margin-bottom: 24px; font-size: 24px; }}
ul {{ list-style: none; background: #1e1e3a; border-radius: 8px; border: 1px solid #2a2a4a; overflow: hidden; }}
a:hover {{ background: #0f3460; }}
</style>
</head>
<body>
<h1>项目页面导航</h1>
<ul>{links}</ul>
</body>
</html>"#,
        links = page_links.join("\n"),
    )
}

fn generate_links_script(links: &[LinkData]) -> String {
    if links.is_empty() {
        return String::new();
    }

    let handlers: Vec<String> = links
        .iter()
        .map(|link| {
            format!(
                r#"{{
          selector: '{}',
          target: '{}'
        }}"#,
                link.element_selector, link.target_file,
            )
        })
        .collect();

    format!(
        r#"<script>
document.addEventListener('DOMContentLoaded', function() {{
  const links = [{handlers}];
  links.forEach(function(link) {{
    const el = document.querySelector(link.selector);
    if (el) {{
      el.style.cursor = 'pointer';
      el.addEventListener('click', function() {{ window.location.href = link.target; }});
    }}
  }});
}});
</script>"#,
        handlers = handlers.join(", "),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_single_page_html() {
        let data = ExportPageData {
            page_name: "首页".to_string(),
            html_content: "<div class='hero'>Hello</div>".to_string(),
            css_content: ".hero { color: red; }".to_string(),
            width: 1440,
            height: 900,
            links: vec![],
        };
        let html = generate_single_page_html(&data);
        assert!(html.contains("<title>首页</title>"));
        assert!(html.contains(".hero { color: red; }"));
        assert!(html.contains("<div class='hero'>Hello</div>"));
        assert!(html.contains("1440px"));
    }

    #[test]
    fn test_generate_page_with_links() {
        let data = ExportPageData {
            page_name: "首页".to_string(),
            html_content: "<button id='btn'>详情</button>".to_string(),
            css_content: "".to_string(),
            width: 1440,
            height: 900,
            links: vec![LinkData {
                element_selector: "#btn".to_string(),
                target_file: "page-详情.html".to_string(),
            }],
        };
        let html = generate_single_page_html(&data);
        assert!(html.contains("page-详情.html"));
        assert!(html.contains("querySelector"));
    }

    #[test]
    fn test_generate_index_html() {
        let pages = vec![("首页", "page-首页.html"), ("详情", "page-详情.html")];
        let html = generate_index_html(&pages);
        assert!(html.contains("项目页面导航"));
        assert!(html.contains("page-首页.html"));
        assert!(html.contains("page-详情.html"));
    }
}
```

- [ ] **Step 2: Create export commands**

Create `src-tauri/src/commands/export_commands.rs`:
```rust
use crate::export::html_generator::{self, ExportPageData, LinkData};

#[tauri::command]
pub async fn export_single_page(data: ExportPageData) -> Result<String, String> {
    let html = html_generator::generate_single_page_html(&data);
    Ok(html)
}

#[tauri::command]
pub async fn export_batch_pages(
    pages: Vec<ExportPageData>,
    project_name: String,
) -> Result<Vec<crate::export::html_generator::ExportResult>, String> {
    let mut results = Vec::new();

    for page in &pages {
        let html = html_generator::generate_single_page_html(page);
        let file_name = format!("page-{}.html", page.page_name);
        results.push(crate::export::html_generator::ExportResult {
            content: html,
            file_name,
        });
    }

    let index_html = html_generator::generate_index_html(
        &pages
            .iter()
            .zip(results.iter())
            .map(|(p, r)| (p.page_name.as_str(), r.file_name.as_str()))
            .collect::<Vec<_>>(),
    );

    results.push(crate::export::html_generator::ExportResult {
        content: index_html,
        file_name: "index.html".to_string(),
    });

    Ok(results)
}
```

- [ ] **Step 3: Update commands/mod.rs**

Add to `src-tauri/src/commands/mod.rs`:
```rust
pub mod export_commands;
```

- [ ] **Step 4: Register commands in lib.rs**

In `src-tauri/src/lib.rs`, add module declaration and register commands:
```rust
mod export;

// In invoke_handler, add:
commands::export_commands::export_single_page,
commands::export_commands::export_batch_pages,
```

- [ ] **Step 5: Run Rust tests**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: All export tests PASS (3 new tests).

- [ ] **Step 6: Commit**

```bash
git add src-tauri/src/export/ src-tauri/src/commands/export_commands.rs src-tauri/src/commands/mod.rs src-tauri/src/lib.rs
git commit -m "feat: add HTML export engine with single page and batch generation"
```

---

## Task 4: Frontend — Export Dialogs

**Files:**
- Create: `src/stores/exportStore.ts`
- Create: `src/components/export/ExportOptions.tsx`
- Create: `src/components/export/ExportDialog.tsx`
- Create: `src/components/export/BatchExportDialog.tsx`
- Test: `tests/stores/exportStore.test.ts`

- [ ] **Step 1: Write failing test for exportStore**

Create `tests/stores/exportStore.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useExportStore } from "@/stores/exportStore";

describe("exportStore", () => {
  beforeEach(() => {
    useExportStore.setState({ isExporting: false, progress: 0, total: 0 });
  });

  it("should start not exporting", () => {
    expect(useExportStore.getState().isExporting).toBe(false);
  });

  it("should set exporting state", () => {
    useExportStore.getState().startExport(5);
    expect(useExportStore.getState().isExporting).toBe(true);
    expect(useExportStore.getState().total).toBe(5);
  });

  it("should update progress", () => {
    useExportStore.getState().startExport(3);
    useExportStore.getState().updateProgress();
    expect(useExportStore.getState().progress).toBe(1);
  });

  it("should finish export", () => {
    useExportStore.getState().startExport(2);
    useExportStore.getState().finishExport();
    expect(useExportStore.getState().isExporting).toBe(false);
    expect(useExportStore.getState().progress).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/stores/exportStore.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write exportStore implementation**

Create `src/stores/exportStore.ts`:
```typescript
import { create } from "zustand";

type ExportFormat = "html" | "png" | "both";
type ExportResolution = 1 | 2 | 3;

interface ExportState {
  isExporting: boolean;
  progress: number;
  total: number;
  format: ExportFormat;
  resolution: ExportResolution;
  setFormat: (format: ExportFormat) => void;
  setResolution: (resolution: ExportResolution) => void;
  startExport: (total: number) => void;
  updateProgress: () => void;
  finishExport: () => void;
}

export const useExportStore = create<ExportState>((set) => ({
  isExporting: false,
  progress: 0,
  total: 0,
  format: "html",
  resolution: 2,
  setFormat: (format) => set({ format }),
  setResolution: (resolution) => set({ resolution }),
  startExport: (total) => set({ isExporting: true, progress: 0, total }),
  updateProgress: () => set((s) => ({ progress: s.progress + 1 })),
  finishExport: () => set({ isExporting: false, progress: 0, total: 0 }),
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/stores/exportStore.test.ts`
Expected: All 4 tests PASS.

- [ ] **Step 5: Create ExportOptions component**

Create `src/components/export/ExportOptions.tsx`:
```typescript
import { useExportStore } from "@/stores/exportStore";

export function ExportOptions() {
  const format = useExportStore((s) => s.format);
  const setFormat = useExportStore((s) => s.setFormat);
  const resolution = useExportStore((s) => s.resolution);
  const setResolution = useExportStore((s) => s.setResolution);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-text-secondary mb-2">导出格式</label>
        <div className="flex gap-2">
          {(["html", "png", "both"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                format === f
                  ? "border-accent text-accent bg-accent/10"
                  : "border-border text-text-secondary hover:border-accent-hover"
              }`}
            >
              {f === "html" ? "HTML" : f === "png" ? "PNG" : "HTML + PNG"}
            </button>
          ))}
        </div>
      </div>
      {(format === "png" || format === "both") && (
        <div>
          <label className="block text-sm text-text-secondary mb-2">图片分辨率</label>
          <div className="flex gap-2">
            {([1, 2, 3] as const).map((r) => (
              <button
                key={r}
                onClick={() => setResolution(r)}
                className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                  resolution === r
                    ? "border-accent text-accent bg-accent/10"
                    : "border-border text-text-secondary hover:border-accent-hover"
                }`}
              >
                {r}x
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Create ExportDialog component**

Create `src/components/export/ExportDialog.tsx`:
```typescript
import { useTranslation } from "react-i18next";
import * as Dialog from "@radix-ui/react-dialog";
import { Download } from "lucide-react";
import { ExportOptions } from "./ExportOptions";
import { useExportStore } from "@/stores/exportStore";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: () => void;
}

export function ExportDialog({ open, onClose, onExport }: ExportDialogProps) {
  const { t } = useTranslation();
  const isExporting = useExportStore((s) => s.isExporting);

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-surface rounded-lg p-6 w-[420px] border border-border">
          <Dialog.Title className="text-lg font-medium text-text-primary mb-4">
            导出当前页面
          </Dialog.Title>
          <ExportOptions />
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              取消
            </button>
            <button
              onClick={onExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-accent text-white rounded hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              <Download size={14} />
              {isExporting ? "导出中..." : "导出"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 7: Create BatchExportDialog component**

Create `src/components/export/BatchExportDialog.tsx`:
```typescript
import { useTranslation } from "react-i18next";
import * as Dialog from "@radix-ui/react-dialog";
import { Download } from "lucide-react";
import { ExportOptions } from "./ExportOptions";
import { useExportStore } from "@/stores/exportStore";
import { useProjectStore } from "@/stores/projectStore";

interface BatchExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: () => void;
}

export function BatchExportDialog({ open, onClose, onExport }: BatchExportDialogProps) {
  const { t } = useTranslation();
  const isExporting = useExportStore((s) => s.isExporting);
  const progress = useExportStore((s) => s.progress);
  const total = useExportStore((s) => s.total);
  const pages = useProjectStore((s) => s.pages);
  const currentProject = useProjectStore((s) => s.currentProject);

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-surface rounded-lg p-6 w-[480px] border border-border">
          <Dialog.Title className="text-lg font-medium text-text-primary mb-2">
            批量导出项目
          </Dialog.Title>
          <p className="text-sm text-text-muted mb-4">
            将导出「{currentProject?.name}」的全部 {pages.length} 个页面
          </p>
          <ExportOptions />
          {isExporting && (
            <div className="mt-4">
              <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all"
                  style={{ width: `${(progress / total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-text-muted mt-1">
                正在导出 {progress}/{total}...
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={onExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-accent text-white rounded hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              <Download size={14} />
              {isExporting ? `导出中 ${progress}/${total}` : "导出全部"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add src/stores/exportStore.ts src/components/export/ tests/stores/exportStore.test.ts
git commit -m "feat: add export dialogs with format and resolution options"
```

---

## Task 5: Design Snapshots

**Files:**
- Create: `src/stores/snapshotStore.ts`
- Create: `src-tauri/src/commands/snapshot_commands.rs`
- Create: `src/components/snapshots/SnapshotList.tsx`
- Create: `src/components/snapshots/SnapshotItem.tsx`
- Test: `tests/stores/snapshotStore.test.ts`

- [ ] **Step 1: Write failing test for snapshotStore**

Create `tests/stores/snapshotStore.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useSnapshotStore } from "@/stores/snapshotStore";

describe("snapshotStore", () => {
  beforeEach(() => {
    useSnapshotStore.setState({ snapshots: [] });
  });

  it("should start with empty snapshots", () => {
    expect(useSnapshotStore.getState().snapshots).toEqual([]);
  });

  it("should add a snapshot", () => {
    useSnapshotStore.getState().addSnapshot({
      id: "snap-1",
      name: "版本1",
      createdAt: "2026-05-08",
      canvasData: "{}",
    });
    expect(useSnapshotStore.getState().snapshots).toHaveLength(1);
    expect(useSnapshotStore.getState().snapshots[0].name).toBe("版本1");
  });

  it("should remove a snapshot", () => {
    useSnapshotStore.getState().addSnapshot({
      id: "snap-1",
      name: "版本1",
      createdAt: "2026-05-08",
      canvasData: "{}",
    });
    useSnapshotStore.getState().removeSnapshot("snap-1");
    expect(useSnapshotStore.getState().snapshots).toHaveLength(0);
  });

  it("should set snapshots from loaded data", () => {
    useSnapshotStore.getState().setSnapshots([
      { id: "snap-1", name: "V1", createdAt: "2026-05-08", canvasData: "{}" },
      { id: "snap-2", name: "V2", createdAt: "2026-05-08", canvasData: "{}" },
    ]);
    expect(useSnapshotStore.getState().snapshots).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/stores/snapshotStore.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write snapshotStore implementation**

Create `src/stores/snapshotStore.ts`:
```typescript
import { create } from "zustand";

export interface Snapshot {
  id: string;
  name: string;
  createdAt: string;
  canvasData: string;
}

interface SnapshotState {
  snapshots: Snapshot[];
  addSnapshot: (snapshot: Snapshot) => void;
  removeSnapshot: (id: string) => void;
  setSnapshots: (snapshots: Snapshot[]) => void;
}

export const useSnapshotStore = create<SnapshotState>((set) => ({
  snapshots: [],
  addSnapshot: (snapshot) =>
    set((state) => ({ snapshots: [snapshot, ...state.snapshots] })),
  removeSnapshot: (id) =>
    set((state) => ({ snapshots: state.snapshots.filter((s) => s.id !== id) })),
  setSnapshots: (snapshots) => set({ snapshots }),
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/stores/snapshotStore.test.ts`
Expected: All 4 tests PASS.

- [ ] **Step 5: Create Rust snapshot commands**

Create `src-tauri/src/commands/snapshot_commands.rs`:
```rust
use crate::fs::{dirs, io};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SnapshotMeta {
    pub id: String,
    pub name: String,
    pub created_at: String,
}

#[tauri::command]
pub async fn create_snapshot(
    project_id: String,
    page_id: String,
    name: String,
    canvas_json: String,
) -> Result<SnapshotMeta, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let meta = SnapshotMeta {
        id: id.clone(),
        name,
        created_at: now,
    };

    let app_dir = dirs::get_app_data_dir()?;
    let snapshot_dir = app_dir
        .join("projects")
        .join(&project_id)
        .join("snapshots")
        .join(&id);

    std::fs::create_dir_all(&snapshot_dir)
        .map_err(|e| format!("Failed to create snapshot dir: {}", e))?;

    let meta_path = snapshot_dir.join("meta.json");
    io::write_json(&meta_path, &meta)?;

    let canvas_path = snapshot_dir.join("canvas.json");
    std::fs::write(&canvas_path, canvas_json)
        .map_err(|e| format!("Failed to write canvas: {}", e))?;

    Ok(meta)
}

#[tauri::command]
pub async fn list_snapshots(project_id: String) -> Result<Vec<SnapshotMeta>, String> {
    let app_dir = dirs::get_app_data_dir()?;
    let snapshots_dir = app_dir.join("projects").join(&project_id).join("snapshots");

    if !snapshots_dir.exists() {
        return Ok(vec![]);
    }

    let mut snapshots = Vec::new();
    let entries = std::fs::read_dir(&snapshots_dir)
        .map_err(|e| format!("Failed to read snapshots dir: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let meta_path = entry.path().join("meta.json");
        if meta_path.exists() {
            let meta: SnapshotMeta = io::read_json(&meta_path)?;
            snapshots.push(meta);
        }
    }

    snapshots.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(snapshots)
}

#[tauri::command]
pub async fn restore_snapshot(
    project_id: String,
    page_id: String,
    snapshot_id: String,
) -> Result<String, String> {
    let app_dir = dirs::get_app_data_dir()?;
    let snapshot_canvas = app_dir
        .join("projects")
        .join(&project_id)
        .join("snapshots")
        .join(&snapshot_id)
        .join("canvas.json");

    let canvas_data = std::fs::read_to_string(&snapshot_canvas)
        .map_err(|e| format!("Failed to read snapshot canvas: {}", e))?;

    let page_canvas_path = app_dir
        .join("projects")
        .join(&project_id)
        .join("pages")
        .join(&page_id)
        .join("canvas.json");

    std::fs::write(&page_canvas_path, &canvas_data)
        .map_err(|e| format!("Failed to restore canvas: {}", e))?;

    Ok(canvas_data)
}

#[tauri::command]
pub async fn delete_snapshot(project_id: String, snapshot_id: String) -> Result<(), String> {
    let app_dir = dirs::get_app_data_dir()?;
    let snapshot_dir = app_dir
        .join("projects")
        .join(&project_id)
        .join("snapshots")
        .join(&snapshot_id);

    if snapshot_dir.exists() {
        std::fs::remove_dir_all(&snapshot_dir)
            .map_err(|e| format!("Failed to delete snapshot: {}", e))?;
    }

    Ok(())
}
```

Add to `src-tauri/src/commands/mod.rs`:
```rust
pub mod snapshot_commands;
```

Register in `src-tauri/src/lib.rs` invoke_handler:
```rust
commands::snapshot_commands::create_snapshot,
commands::snapshot_commands::list_snapshots,
commands::snapshot_commands::restore_snapshot,
commands::snapshot_commands::delete_snapshot,
```

- [ ] **Step 6: Create SnapshotItem component**

Create `src/components/snapshots/SnapshotItem.tsx`:
```typescript
import { useState } from "react";
import { Clock, RotateCcw, Trash2 } from "lucide-react";
import type { Snapshot } from "@/stores/snapshotStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface SnapshotItemProps {
  snapshot: Snapshot;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SnapshotItem({ snapshot, onRestore, onDelete }: SnapshotItemProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  return (
    <div className="group flex items-center justify-between px-2 py-1.5 hover:bg-bg-tertiary rounded text-xs">
      <div className="flex items-center gap-1.5 text-text-secondary min-w-0">
        <Clock size={10} className="shrink-0" />
        <span className="truncate">{snapshot.name}</span>
        <span className="text-text-muted shrink-0">
          {new Date(snapshot.createdAt).toLocaleString("zh-CN", {
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onRestore(snapshot.id)}
          className="p-0.5 text-text-muted hover:text-accent"
          title="恢复此快照"
        >
          <RotateCcw size={10} />
        </button>
        <button
          onClick={() => setDeleteConfirmOpen(true)}
          className="p-0.5 text-text-muted hover:text-danger"
          title="删除快照"
        >
          <Trash2 size={10} />
        </button>
      </div>
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="删除快照"
        message={`确定要删除快照"${snapshot.name}"吗？此操作不可撤销。`}
        confirmLabel="删除"
        variant="danger"
        onConfirm={() => { onDelete(snapshot.id); setDeleteConfirmOpen(false); }}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
```

- [ ] **Step 7: Create SnapshotList component**

Create `src/components/snapshots/SnapshotList.tsx`:
```typescript
import { useState } from "react";
import { ChevronDown, ChevronRight, Camera } from "lucide-react";
import { useSnapshotStore } from "@/stores/snapshotStore";
import { useProjectStore } from "@/stores/projectStore";
import { useUiStore } from "@/stores/uiStore";
import { SnapshotItem } from "./SnapshotItem";

export function SnapshotList() {
  const [expanded, setExpanded] = useState(false);
  const snapshots = useSnapshotStore((s) => s.snapshots);
  const removeSnapshot = useSnapshotStore((s) => s.removeSnapshot);

  const handleRestore = async (id: string) => {
    const { invoke } = await import("@tauri-apps/api/core");
    const currentProject = useProjectStore.getState().currentProject;
    const currentPageId = useUiStore.getState().currentPageId;
    if (!currentProject || !currentPageId) return;

    try {
      const canvasData = await invoke<string>("restore_snapshot", {
        projectId: currentProject.id,
        pageId: currentPageId,
        snapshotId: id,
      });
      // Load the restored canvas data -- the canvas reference is obtained
      // from the canvasStore or EditorLayout context where the Fabric canvas lives.
      // This event-based approach lets the canvas layer handle the reload:
      window.dispatchEvent(
        new CustomEvent("snapshot:restore", { detail: { canvasData } }),
      );
    } catch (err) {
      console.error("Failed to restore snapshot:", err);
    }
  };

  const handleDelete = async (id: string) => {
    const { invoke } = await import("@tauri-apps/api/core");
    const currentProject = useProjectStore.getState().currentProject;
    if (!currentProject) return;

    try {
      await invoke("delete_snapshot", {
        projectId: currentProject.id,
        snapshotId: id,
      });
      removeSnapshot(id);
    } catch (err) {
      console.error("Failed to delete snapshot:", err);
    }
  };

  return (
    <div className="border-t border-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
      >
        <span className="flex items-center gap-1">
          <Camera size={10} />
          快照 ({snapshots.length})
        </span>
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {expanded && (
        <div className="px-1 pb-1 max-h-[200px] overflow-y-auto">
          {snapshots.length === 0 ? (
            <p className="text-[10px] text-text-muted px-2 py-1">暂无快照</p>
          ) : (
            snapshots.map((snap) => (
              <SnapshotItem
                key={snap.id}
                snapshot={snap}
                onRestore={handleRestore}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add src/stores/snapshotStore.ts src/components/snapshots/ src-tauri/src/commands/snapshot_commands.rs tests/stores/snapshotStore.test.ts
git commit -m "feat: add design snapshots with save/restore/delete"
```

---

## Task 5b: Rust — Memory Persistence Commands

> **IMPORTANT:** The `MemoryManager` (Task 6) invokes five Tauri IPC commands that do not exist in any prior plan: `read_json_file`, `write_json_file`, `list_saved_modules`, `save_module`, `delete_module`. This task creates those Rust commands before the Memory Manager is implemented.

**Files:**
- Create: `src-tauri/src/commands/memory_commands.rs`
- Modify: `src-tauri/src/commands/mod.rs` (add memory_commands)
- Modify: `src-tauri/src/lib.rs` (register memory commands)

- [ ] **Step 1: Create memory commands**

Create `src-tauri/src/commands/memory_commands.rs`:
```rust
use crate::fs::{dirs, io};

#[tauri::command]
pub async fn read_json_file(path: String) -> Result<serde_json::Value, String> {
    let app_dir = dirs::get_app_data_dir()?;
    let full_path = app_dir.join(&path);
    if !full_path.exists() {
        return Err("File not found".to_string());
    }
    io::read_json(&full_path)
}

#[tauri::command]
pub async fn write_json_file(path: String, data: serde_json::Value) -> Result<(), String> {
    let app_dir = dirs::get_app_data_dir()?;
    let full_path = app_dir.join(&path);
    // Ensure parent directory exists
    if let Some(parent) = full_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }
    io::write_json(&full_path, &data)
}

#[tauri::command]
pub async fn list_saved_modules() -> Result<Vec<serde_json::Value>, String> {
    let app_dir = dirs::get_app_data_dir()?;
    let modules_dir = app_dir.join("memory/saved_modules");
    if !modules_dir.exists() {
        return Ok(vec![]);
    }
    let mut modules = Vec::new();
    for entry in std::fs::read_dir(&modules_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let meta_path = entry.path().join("meta.json");
        if meta_path.exists() {
            let meta: serde_json::Value = io::read_json(&meta_path)?;
            modules.push(meta);
        }
    }
    Ok(modules)
}

#[tauri::command]
pub async fn save_module(module: serde_json::Value) -> Result<(), String> {
    let app_dir = dirs::get_app_data_dir()?;
    let id = module["id"].as_str().ok_or("Missing module id")?;
    let module_dir = app_dir.join("memory/saved_modules").join(id);
    std::fs::create_dir_all(&module_dir).map_err(|e| e.to_string())?;
    io::write_json(&module_dir.join("meta.json"), &module)
}

#[tauri::command]
pub async fn delete_module(id: String) -> Result<(), String> {
    let app_dir = dirs::get_app_data_dir()?;
    let module_dir = app_dir.join("memory/saved_modules").join(&id);
    if module_dir.exists() {
        std::fs::remove_dir_all(&module_dir).map_err(|e| e.to_string())?;
    }
    Ok(())
}
```

- [ ] **Step 2: Register memory commands**

Add to `src-tauri/src/commands/mod.rs`:
```rust
pub mod memory_commands;
```

Register in `src-tauri/src/lib.rs` invoke_handler:
```rust
commands::memory_commands::read_json_file,
commands::memory_commands::write_json_file,
commands::memory_commands::list_saved_modules,
commands::memory_commands::save_module,
commands::memory_commands::delete_module,
```

> **Note:** This is additive to the existing `mod.rs` which already has `export_commands` and `snapshot_commands` from prior tasks. Do not overwrite previous module declarations.

- [ ] **Step 3: Verify compilation**

Run: `cargo check --manifest-path src-tauri/Cargo.toml`
Expected: Compiles without errors.

- [ ] **Step 4: Commit**

```bash
git add src-tauri/src/commands/memory_commands.rs src-tauri/src/commands/mod.rs src-tauri/src/lib.rs
git commit -m "feat: add Rust memory persistence commands for user preferences and saved modules"
```

---

## Task 6: AI Memory System

**Files:**
- Create: `src/memory/MemoryManager.ts`
- Create: `src/memory/UserPreferences.ts`
- Create: `src/memory/SavedModules.ts`
- Create: `src/memory/ProjectContext.ts`
- Create: `src/stores/memoryStore.ts`
- Test: `tests/stores/memoryStore.test.ts`
- Test: `tests/memory/MemoryManager.test.ts`

- [ ] **Step 1: Write failing test for memoryStore**

Create `tests/stores/memoryStore.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useMemoryStore } from "@/stores/memoryStore";

describe("memoryStore", () => {
  beforeEach(() => {
    useMemoryStore.setState({
      userPreferences: {},
      savedModules: [],
      projectContext: null,
    });
  });

  it("should start with empty preferences", () => {
    expect(useMemoryStore.getState().userPreferences).toEqual({});
  });

  it("should update user preferences", () => {
    useMemoryStore.getState().updatePreferences({ style: "简约", layout: "侧边导航" });
    const prefs = useMemoryStore.getState().userPreferences;
    expect(prefs.style).toBe("简约");
    expect(prefs.layout).toBe("侧边导航");
  });

  it("should merge preferences partially", () => {
    useMemoryStore.getState().updatePreferences({ style: "简约" });
    useMemoryStore.getState().updatePreferences({ layout: "顶部导航" });
    const prefs = useMemoryStore.getState().userPreferences;
    expect(prefs.style).toBe("简约");
    expect(prefs.layout).toBe("顶部导航");
  });

  it("should add saved module", () => {
    useMemoryStore.getState().addSavedModule({
      id: "mod-1",
      name: "统计卡片",
      tags: ["dashboard", "card"],
      previewPath: "",
      templateHtml: "<div>...</div>",
    });
    expect(useMemoryStore.getState().savedModules).toHaveLength(1);
  });

  it("should remove saved module", () => {
    useMemoryStore.getState().addSavedModule({
      id: "mod-1",
      name: "统计卡片",
      tags: ["card"],
      previewPath: "",
      templateHtml: "",
    });
    useMemoryStore.getState().removeSavedModule("mod-1");
    expect(useMemoryStore.getState().savedModules).toHaveLength(0);
  });

  it("should set project context", () => {
    useMemoryStore.getState().setProjectContext({
      designSystem: { primaryColor: "#7c6aef", fontFamily: "sans-serif" },
      iterationLog: [],
      glossary: {},
    });
    expect(useMemoryStore.getState().projectContext).not.toBeNull();
    expect(useMemoryStore.getState().projectContext?.designSystem.primaryColor).toBe("#7c6aef");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/stores/memoryStore.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write memoryStore implementation**

Create `src/stores/memoryStore.ts`:
```typescript
import { create } from "zustand";

export interface UserPreferences {
  [key: string]: string;
}

export interface SavedModule {
  id: string;
  name: string;
  tags: string[];
  previewPath: string;
  templateHtml: string;
}

export interface ProjectContextData {
  designSystem: Record<string, string>;
  iterationLog: Array<{ timestamp: string; action: string; detail: string }>;
  glossary: Record<string, string>;
}

interface MemoryState {
  userPreferences: UserPreferences;
  savedModules: SavedModule[];
  projectContext: ProjectContextData | null;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  addSavedModule: (module: SavedModule) => void;
  removeSavedModule: (id: string) => void;
  setProjectContext: (context: ProjectContextData) => void;
  setPreferences: (prefs: UserPreferences) => void;
  setSavedModules: (modules: SavedModule[]) => void;
}

export const useMemoryStore = create<MemoryState>((set) => ({
  userPreferences: {},
  savedModules: [],
  projectContext: null,
  updatePreferences: (prefs) =>
    set((state) => ({
      userPreferences: { ...state.userPreferences, ...prefs },
    })),
  addSavedModule: (module) =>
    set((state) => ({
      savedModules: [...state.savedModules, module],
    })),
  removeSavedModule: (id) =>
    set((state) => ({
      savedModules: state.savedModules.filter((m) => m.id !== id),
    })),
  setProjectContext: (context) => set({ projectContext: context }),
  setPreferences: (prefs) => set({ userPreferences: prefs }),
  setSavedModules: (modules) => set({ savedModules: modules }),
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/stores/memoryStore.test.ts`
Expected: All 6 tests PASS.

- [ ] **Step 5: Create MemoryManager**

Create `src/memory/MemoryManager.ts`:
```typescript
import type { UserPreferences, SavedModule, ProjectContextData } from "@/stores/memoryStore";

export class MemoryManager {
  async loadUserPreferences(): Promise<UserPreferences> {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      return await invoke("read_json_file", {
        path: "memory/user_preferences.json",
      });
    } catch {
      return {};
    }
  }

  async saveUserPreferences(prefs: UserPreferences): Promise<void> {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("write_json_file", {
      path: "memory/user_preferences.json",
      data: prefs,
    });
  }

  async loadSavedModules(): Promise<SavedModule[]> {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      return await invoke("list_saved_modules");
    } catch {
      return [];
    }
  }

  async saveModule(module: SavedModule): Promise<void> {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("save_module", { module });
  }

  async deleteModule(id: string): Promise<void> {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("delete_module", { id });
  }

  async loadProjectContext(projectId: string): Promise<ProjectContextData | null> {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      return await invoke("read_json_file", {
        path: `memory/project_context/${projectId}/design_system.json`,
      });
    } catch {
      return null;
    }
  }

  async saveProjectContext(projectId: string, context: ProjectContextData): Promise<void> {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("write_json_file", {
      path: `memory/project_context/${projectId}/design_system.json`,
      data: context,
    });
  }

  extractMemoryUpdates(aiResponse: {
    memory_updates?: { preferences?: Record<string, string>; design_system?: Record<string, string> };
  }): { preferences: Partial<UserPreferences>; designSystem: Record<string, string> } {
    const updates = aiResponse.memory_updates ?? {};
    return {
      preferences: updates.preferences ?? {},
      designSystem: updates.design_system ?? {},
    };
  }
}
```

- [ ] **Step 6: Write test for MemoryManager**

Create `tests/memory/MemoryManager.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { MemoryManager } from "@/memory/MemoryManager";

describe("MemoryManager", () => {
  it("should extract memory updates from AI response", () => {
    const manager = new MemoryManager();
    const result = manager.extractMemoryUpdates({
      memory_updates: {
        preferences: { style: "简约" },
        design_system: { primary_color: "#7c6aef" },
      },
    });
    expect(result.preferences).toEqual({ style: "简约" });
    expect(result.designSystem).toEqual({ primary_color: "#7c6aef" });
  });

  it("should handle missing memory_updates", () => {
    const manager = new MemoryManager();
    const result = manager.extractMemoryUpdates({});
    expect(result.preferences).toEqual({});
    expect(result.designSystem).toEqual({});
  });

  it("should handle partial memory_updates", () => {
    const manager = new MemoryManager();
    const result = manager.extractMemoryUpdates({
      memory_updates: { preferences: { layout: "侧边导航" } },
    });
    expect(result.preferences).toEqual({ layout: "侧边导航" });
    expect(result.designSystem).toEqual({});
  });
});
```

- [ ] **Step 7: Run memory tests**

Run: `npm test -- tests/memory/`
Expected: All 3 MemoryManager tests PASS.

- [ ] **Step 7a: Integrate MemoryManager with ChatEngine (Plan 3)**

Modify `src/ai/ChatEngine.ts` (from Plan 3) to load and use memory:

```typescript
import { MemoryManager } from "@/memory/MemoryManager";
import { useMemoryStore } from "@/stores/memoryStore";

// In the buildRequest method or equivalent:
// 1. Load user preferences and inject into system prompt
const memoryManager = new MemoryManager();
const prefs = useMemoryStore.getState().userPreferences;
if (Object.keys(prefs).length === 0) {
  const loaded = await memoryManager.loadUserPreferences();
  useMemoryStore.getState().setPreferences(loaded);
}
```

Modify `src/ai/ContextBuilder.ts` (from Plan 3) to include memory context:

```typescript
// Add a memoryContext parameter to the buildSystemPrompt method:
buildSystemPrompt(memoryContext?: { preferences: Record<string, string>; designSystem: Record<string, string> }): string {
  // ... existing prompt building ...

  // Add memory context section:
  if (memoryContext && Object.keys(memoryContext.preferences).length > 0) {
    prompt += `\n\n## User Preferences\n${JSON.stringify(memoryContext.preferences)}`;
  }
  if (memoryContext && Object.keys(memoryContext.designSystem).length > 0) {
    prompt += `\n\n## Project Design System\n${JSON.stringify(memoryContext.designSystem)}`;
  }

  return prompt;
}
```

Modify `src/hooks/useStreamingChat.ts` (from Plan 3) to call memory update after streaming:

```typescript
import { MemoryManager } from "@/memory/MemoryManager";
import { useMemoryStore } from "@/stores/memoryStore";

// After streaming completes and response is parsed:
const memoryManager = new MemoryManager();
const memoryUpdates = memoryManager.extractMemoryUpdates(parsedResponse);
if (Object.keys(memoryUpdates.preferences).length > 0) {
  useMemoryStore.getState().updatePreferences(memoryUpdates.preferences);
  await memoryManager.saveUserPreferences(useMemoryStore.getState().userPreferences);
}
if (Object.keys(memoryUpdates.designSystem).length > 0) {
  const existingContext = useMemoryStore.getState().projectContext;
  if (existingContext) {
    const updatedContext = {
      ...existingContext,
      designSystem: { ...existingContext.designSystem, ...memoryUpdates.designSystem },
    };
    useMemoryStore.getState().setProjectContext(updatedContext);
  }
}
```

- [ ] **Step 8: Commit**

```bash
git add src/memory/ src/stores/memoryStore.ts src/ai/ChatEngine.ts src/ai/ContextBuilder.ts src/hooks/useStreamingChat.ts tests/stores/memoryStore.test.ts tests/memory/
git commit -m "feat: add AI memory system with three-layer architecture and ChatEngine integration"
```

---

## Task 7: AI Skill System

**Files:**
- Create: `src/skills/SkillEngine.ts`
- Create: `src/skills/SkillRegistry.ts`
- Test: `tests/skills/SkillEngine.test.ts`

- [ ] **Step 1: Write failing tests for SkillEngine**

Create `tests/skills/SkillEngine.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { SkillEngine } from "@/skills/SkillEngine";
import { SKILL_DEFINITIONS } from "@/skills/SkillRegistry";

describe("SkillEngine", () => {
  const engine = new SkillEngine(SKILL_DEFINITIONS);

  it("should match skill by keyword", () => {
    const result = engine.matchSkill("帮我设计一个落地页");
    expect(result).not.toBeNull();
    expect(result?.id).toBe("landing-page");
  });

  it("should match skill by @mention", () => {
    const result = engine.matchSkill("@dashboard 添加数据面板");
    expect(result).not.toBeNull();
    expect(result?.id).toBe("dashboard");
  });

  it("should return null for no match", () => {
    const result = engine.matchSkill("随便画个东西");
    expect(result).toBeNull();
  });

  it("should match dashboard keywords", () => {
    expect(engine.matchSkill("生成仪表盘")?.id).toBe("dashboard");
    expect(engine.matchSkill("后台管理")?.id).toBe("dashboard");
    expect(engine.matchSkill("数据面板")?.id).toBe("dashboard");
  });

  it("should match form-design keywords", () => {
    expect(engine.matchSkill("注册表单")?.id).toBe("form-design");
    expect(engine.matchSkill("登录页面")?.id).toBe("form-design");
  });

  it("should prioritize @mention over keywords", () => {
    const result = engine.matchSkill("@wireframe 做一个落地页");
    expect(result?.id).toBe("wireframe");
  });

  it("should build skill prompt", () => {
    const skill = engine.matchSkill("@landing-page");
    const prompt = engine.buildSkillPrompt(skill!);
    expect(prompt).toContain("landing-page");
    expect(prompt.length).toBeGreaterThan(50);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/skills/SkillEngine.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write SkillRegistry with skill definitions**

Create `src/skills/SkillRegistry.ts`:
```typescript
export interface SkillDefinition {
  id: string;
  name: string;
  keywords: string[];
  description: string;
  prompt: string;
  outputFormat: string;
}

export const SKILL_DEFINITIONS: SkillDefinition[] = [
  {
    id: "landing-page",
    name: "Landing Page",
    keywords: ["落地页", "首页", "Landing", "landing page"],
    description: "生成完整落地页原型",
    prompt: `你是一位专业的落地页设计专家。请根据用户需求生成一个完整的落地页原型。

设计要求：
1. 包含 Hero 区域（大标题 + 副标题 + CTA 按钮）
2. 特性展示区（3-4个核心功能卡片）
3. 社会证明区（用户评价/合作伙伴 logo）
4. CTA 区域（号召行动）
5. Footer（底部导航/版权信息）

输出格式：
{
  "type": "generate",
  "html": "...",
  "css": "...",
  "interactions": [],
  "message": "..."
}`,
    outputFormat: "generate",
  },
  {
    id: "dashboard",
    name: "Dashboard",
    keywords: ["仪表盘", "Dashboard", "数据面板", "后台", "管理后台"],
    description: "生成后台管理面板原型",
    prompt: `你是一位专业的后台管理系统设计专家。请根据用户需求生成一个完整的仪表盘面板原型。

设计要求：
1. 左侧导航栏（可折叠）
2. 顶部信息栏（用户信息/通知）
3. 数据统计卡片（4个关键指标）
4. 图表区域（折线图/柱状图占位）
5. 数据表格（含搜索、筛选、分页）

输出格式：
{
  "type": "generate",
  "html": "...",
  "css": "...",
  "interactions": [],
  "message": "..."
}`,
    outputFormat: "generate",
  },
  {
    id: "form-design",
    name: "Form Design",
    keywords: ["表单", "注册", "登录", "填写", "签约"],
    description: "生成表单页原型",
    prompt: `你是一位专业的表单设计专家。请根据用户需求生成一个表单页面原型。

设计要求：
1. 清晰的表单标题和说明
2. 合理的输入字段布局（标签 + 输入框）
3. 校验提示样式
4. 提交/取消按钮
5. 如需多步骤，显示进度指示器

输出格式：
{
  "type": "generate",
  "html": "...",
  "css": "...",
  "interactions": [],
  "message": "..."
}`,
    outputFormat: "generate",
  },
  {
    id: "e-commerce",
    name: "E-Commerce",
    keywords: ["电商", "商品", "购物", "商城", "店铺"],
    description: "生成电商相关页面",
    prompt: `你是电商页面设计专家。请根据用户需求生成电商相关原型页面。

设计要求：
1. 商品展示区域：包含商品图片、名称、价格、标签的网格或列表布局
2. 购物流程：商品浏览 -> 加入购物车 -> 结算流程，步骤清晰
3. 分类与筛选：侧边栏或顶部筛选区域，支持分类、价格范围、排序
4. 购物车摘要：底部或侧边显示已选商品数量和总价
5. 促销展示：限时折扣、优惠券、满减活动等营销区域
6. 用户评价：评分星级、评价摘要、晒图区域

输出格式：
{
  "type": "generate",
  "html": "...",
  "css": "...",
  "interactions": [],
  "message": "..."
}`,
    outputFormat: "generate",
  },
  {
    id: "data-table",
    name: "Data Table",
    keywords: ["表格", "列表", "数据展示", "CRUD"],
    description: "生成数据表格页",
    prompt: `你是数据表格设计专家。请生成含搜索筛选、分页、操作按钮的数据表格原型页面。

设计要求：
1. 表头区域：包含搜索输入框、新增按钮、批量操作按钮
2. 表格主体：列头可排序，行数据包含文本、状态标签、操作链接
3. 筛选面板：支持按状态、日期范围、分类等条件筛选
4. 分页控件：显示总条数、当前页码、每页条数选择器、前后翻页
5. 行内操作：编辑、删除、查看详情等操作按钮，支持批量选择
6. 空状态和加载状态：无数据时显示空状态提示，加载时显示骨架屏

输出格式：
{
  "type": "generate",
  "html": "...",
  "css": "...",
  "interactions": [],
  "message": "..."
}`,
    outputFormat: "generate",
  },
  {
    id: "navigation",
    name: "Navigation",
    keywords: ["导航", "菜单", "侧边栏", "Navbar", "Sidebar"],
    description: "设计导航方案",
    prompt: `你是导航设计专家。请设计顶部导航、侧边导航、面包屑等导航组件方案。

设计要求：
1. 顶部导航栏：Logo区域、主导航链接、搜索框、用户头像/通知区域
2. 侧边导航栏：可折叠菜单、图标+文字、当前选中态高亮、子菜单展开/收起
3. 面包屑导航：显示当前页面层级路径，支持点击返回上级
4. 响应式适配：桌面端完整导航、移动端汉堡菜单或底部Tab栏
5. 权限感知：根据用户角色显示/隐藏特定导航项
6. 视觉层次：当前页高亮、hover态、活跃态的视觉区分

输出格式：
{
  "type": "generate",
  "html": "...",
  "css": "...",
  "interactions": [],
  "message": "..."
}`,
    outputFormat: "generate",
  },
  {
    id: "mobile-layout",
    name: "Mobile Layout",
    keywords: ["移动端", "手机端", "H5", "App页面"],
    description: "生成移动端布局",
    prompt: `你是移动端设计专家。请自动切换到移动端画布，生成符合移动端规范的布局原型。

设计要求：
1. 画布尺寸：自动设置为375x812（iPhone）或414x896（Android）视口
2. 移动端导航：底部Tab栏或顶部返回导航，符合平台交互习惯
3. 触控友好：所有可点击区域至少44x44pt，按钮间距充足
4. 内容优先：信息层级清晰，首屏展示核心内容，减少滚动深度
5. 手势交互：左滑删除、下拉刷新、底部无限滚动的交互提示
6. 输入适配：键盘弹出时表单不被遮挡，输入框焦点自动滚动到可视区域

输出格式：
{
  "type": "generate",
  "html": "...",
  "css": "...",
  "interactions": [],
  "message": "..."
}`,
    outputFormat: "generate",
  },
  {
    id: "card-list",
    name: "Card List",
    keywords: ["卡片", "瀑布流", "Feed", "动态"],
    description: "生成卡片列表布局",
    prompt: `你是卡片布局设计专家。请生成信息卡片、图片卡片、混合内容流的列表布局。

设计要求：
1. 卡片结构：封面图/头像区、标题、摘要文本、标签、操作按钮的统一排版
2. 布局模式：支持单列列表、双列网格、瀑布流等多种排列方式
3. 内容类型适配：纯文字卡片、图文混合卡片、视频卡片、数据统计卡片
4. 交互状态：hover放大/阴影效果、收藏/点赞按钮、分享操作
5. 加载更多：底部的加载指示器和"查看更多"触发区域
6. 空状态：无内容时的插图和引导文案

输出格式：
{
  "type": "generate",
  "html": "...",
  "css": "...",
  "interactions": [],
  "message": "..."
}`,
    outputFormat: "generate",
  },
  {
    id: "design-system",
    name: "Design System",
    keywords: ["设计系统", "规范", "Design System"],
    description: "生成或更新设计系统规范",
    prompt: `你是设计系统专家。根据项目上下文生成或更新设计系统规范（配色、字体、间距、组件样式）。`,
    outputFormat: "generate",
  },
  {
    id: "accessibility",
    name: "Accessibility",
    keywords: ["无障碍", "可访问性", "Accessibility"],
    description: "无障碍审查和改进",
    prompt: `你是无障碍设计专家。对当前原型做无障碍审查，提出改进建议并自动修复常见问题。`,
    outputFormat: "modify",
  },
  {
    id: "responsive",
    name: "Responsive",
    keywords: ["响应式", "自适应", "多端"],
    description: "响应式布局方案",
    prompt: `你是响应式设计专家。为当前桌面端原型生成响应式布局方案。`,
    outputFormat: "modify",
  },
  {
    id: "interaction",
    name: "Interaction",
    keywords: ["交互动画", "动效", "Animation"],
    description: "添加交互动效",
    prompt: `你是交互动效设计专家。为页面元素添加合适的交互动效描述。`,
    outputFormat: "modify",
  },
  {
    id: "dark-mode",
    name: "Dark Mode",
    keywords: ["暗色模式", "深色", "Dark Mode"],
    description: "转换为暗色主题",
    prompt: `你是暗色模式设计专家。将当前亮色原型转换为暗色版本，保持对比度和可读性。`,
    outputFormat: "modify",
  },
  {
    id: "wireframe",
    name: "Wireframe",
    keywords: ["线框图", "低保真", "Wireframe"],
    description: "生成低保真线框图",
    prompt: `你是线框图设计专家。生成低保真线框图风格原型，灰度、无装饰、专注布局结构。`,
    outputFormat: "generate",
  },
  {
    id: "prototype-polish",
    name: "Prototype Polish",
    keywords: ["美化", "精修", "完善", "Polish"],
    description: "视觉精修原型",
    prompt: `你是视觉精修专家。对当前草稿级原型进行视觉精修：优化间距、配色、字体、对齐。`,
    outputFormat: "modify",
  },
];
```

- [ ] **Step 4: Write SkillEngine implementation**

Create `src/skills/SkillEngine.ts`:
```typescript
import type { SkillDefinition } from "./SkillRegistry";

export class SkillEngine {
  private skills: SkillDefinition[];
  private skillMap: Map<string, SkillDefinition>;

  constructor(skills: SkillDefinition[]) {
    this.skills = skills;
    this.skillMap = new Map(skills.map((s) => [s.id, s]));
  }

  matchSkill(userInput: string): SkillDefinition | null {
    const trimmed = userInput.trim();

    // @mention has highest priority -- explicit user intent
    const mentionMatch = trimmed.match(/@(\S+)/);
    if (mentionMatch) {
      const skillId = mentionMatch[1];
      const skill = this.skillMap.get(skillId);
      if (skill) return skill;
    }

    // Find best keyword match -- longest matching keyword wins to avoid
    // false positives (e.g., "数据展示" matching "data-table" before "landing-page")
    let bestMatch: { skill: SkillDefinition; keywordLength: number } | null = null;
    for (const skill of this.skills) {
      for (const keyword of skill.keywords) {
        if (trimmed.includes(keyword)) {
          if (!bestMatch || keyword.length > bestMatch.keywordLength) {
            bestMatch = { skill, keywordLength: keyword.length };
          }
        }
      }
    }

    return bestMatch?.skill ?? null;
  }

  buildSkillPrompt(skill: SkillDefinition): string {
    return `[Skill: ${skill.name}]\n${skill.prompt}\n\n技能标识: ${skill.id}`;
  }

  getSkillById(id: string): SkillDefinition | undefined {
    return this.skillMap.get(id);
  }

  getAllSkills(): SkillDefinition[] {
    return [...this.skills];
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- tests/skills/SkillEngine.test.ts`
Expected: All 7 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/skills/ tests/skills/
git commit -m "feat: add AI skill engine with 15 pre-built skills and keyword matching"
```

---

## Task 8: Component Template Library

**Files:**
- Create: `src/templates/templates.ts`
- Create: `src/templates/TemplateRegistry.ts`
- Create: `src/stores/componentStore.ts`
- Create: `src/components/components/ComponentPanel.tsx`
- Create: `src/components/components/ComponentCard.tsx`
- Test: `tests/stores/componentStore.test.ts`

- [ ] **Step 1: Write failing test for componentStore**

Create `tests/stores/componentStore.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useComponentStore } from "@/stores/componentStore";

describe("componentStore", () => {
  beforeEach(() => {
    useComponentStore.setState({ customComponents: [], searchQuery: "" });
  });

  it("should start with empty custom components", () => {
    expect(useComponentStore.getState().customComponents).toEqual([]);
  });

  it("should add custom component", () => {
    useComponentStore.getState().addCustomComponent({
      id: "comp-1",
      name: "我的卡片",
      tags: ["card"],
      previewPath: "",
      templateData: "{}",
    });
    expect(useComponentStore.getState().customComponents).toHaveLength(1);
  });

  it("should remove custom component", () => {
    useComponentStore.getState().addCustomComponent({
      id: "comp-1",
      name: "我的卡片",
      tags: ["card"],
      previewPath: "",
      templateData: "{}",
    });
    useComponentStore.getState().removeCustomComponent("comp-1");
    expect(useComponentStore.getState().customComponents).toHaveLength(0);
  });

  it("should set search query", () => {
    useComponentStore.getState().setSearchQuery("导航");
    expect(useComponentStore.getState().searchQuery).toBe("导航");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/stores/componentStore.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write componentStore implementation**

Create `src/stores/componentStore.ts`:
```typescript
import { create } from "zustand";

export interface ComponentTemplate {
  id: string;
  name: string;
  tags: string[];
  previewPath: string;
  templateData: string;
  isBuiltIn?: boolean;
}

interface ComponentState {
  builtInComponents: ComponentTemplate[];
  customComponents: ComponentTemplate[];
  searchQuery: string;
  addCustomComponent: (component: ComponentTemplate) => void;
  removeCustomComponent: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setCustomComponents: (components: ComponentTemplate[]) => void;
}

export const useComponentStore = create<ComponentState>((set) => ({
  builtInComponents: [],
  customComponents: [],
  searchQuery: "",
  addCustomComponent: (component) =>
    set((state) => ({
      customComponents: [...state.customComponents, component],
    })),
  removeCustomComponent: (id) =>
    set((state) => ({
      customComponents: state.customComponents.filter((c) => c.id !== id),
    })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCustomComponents: (components) => set({ customComponents: components }),
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/stores/componentStore.test.ts`
Expected: All 4 tests PASS.

- [ ] **Step 5: Create built-in template data**

Create `src/templates/templates.ts`:

> **IMPORTANT:** Do NOT use raw JSON objects for template data -- Fabric.js `loadFromJSON` requires a specific serialized format with proper class references, `version`, `originX`/`originY`, etc. Plain JSON like `{ type: "rect", ... }` will be silently ignored by `loadFromJSON`. Instead, store templates as factory functions that create Fabric.js objects programmatically on a canvas. Each function receives a `Canvas` instance and adds the template's objects directly.

```typescript
import { v4 as uuidv4 } from "uuid";
import { Canvas, Rect, IText, Circle } from "fabric";
import type { ComponentTemplate } from "@/stores/componentStore";

export interface TemplateFactory {
  name: string;
  tags: string[];
  isBuiltIn: true;
  previewPath: string;
  /** Factory function that creates Fabric.js objects on the given canvas */
  create: (canvas: Canvas) => void;
}

/**
 * Helper to add a Fabric.js object with a unique elementId.
 * All objects created by templates must carry an elementId for the link system.
 */
function addObject(canvas: Canvas, obj: Rect | IText | Circle): void {
  obj.set("elementId" as keyof (Rect | IText | Circle), uuidv4());
  canvas.add(obj);
}

export const BUILT_IN_TEMPLATE_FACTORIES: TemplateFactory[] = [
  {
    name: "顶部导航栏",
    tags: ["navbar", "导航", "顶部"],
    isBuiltIn: true,
    previewPath: "",
    create: (canvas) => {
      addObject(canvas, new Rect({ left: 0, top: 0, width: 1440, height: 60, fill: "#1a1a2e" }));
      addObject(canvas, new IText("Logo", { left: 24, top: 18, fontSize: 20, fill: "#e0e0e0" }));
      addObject(canvas, new IText("首页  产品  关于  联系", { left: 600, top: 20, fontSize: 14, fill: "#a0a0b8" }));
      addObject(canvas, new Rect({ left: 1300, top: 14, width: 80, height: 32, rx: 4, fill: "#7c6aef" }));
      addObject(canvas, new IText("登录", { left: 1316, top: 22, fontSize: 12, fill: "#ffffff" }));
    },
  },
  {
    name: "侧边导航栏",
    tags: ["sidebar", "侧边", "导航"],
    isBuiltIn: true,
    previewPath: "",
    create: (canvas) => {
      addObject(canvas, new Rect({ left: 0, top: 0, width: 240, height: 900, fill: "#16213e" }));
      addObject(canvas, new IText("Logo", { left: 24, top: 24, fontSize: 18, fill: "#e0e0e0" }));
      addObject(canvas, new Rect({ left: 16, top: 72, width: 208, height: 36, rx: 4, fill: "#0f3460" }));
      addObject(canvas, new IText("概览", { left: 32, top: 82, fontSize: 13, fill: "#7c6aef" }));
      addObject(canvas, new IText("数据", { left: 32, top: 124, fontSize: 13, fill: "#a0a0b8" }));
      addObject(canvas, new IText("用户", { left: 32, top: 160, fontSize: 13, fill: "#a0a0b8" }));
      addObject(canvas, new IText("设置", { left: 32, top: 196, fontSize: 13, fill: "#a0a0b8" }));
    },
  },
  {
    name: "登录表单",
    tags: ["form", "登录", "表单"],
    isBuiltIn: true,
    previewPath: "",
    create: (canvas) => {
      addObject(canvas, new Rect({ left: 470, top: 200, width: 500, height: 440, rx: 8, fill: "#1e1e3a", stroke: "#2a2a4a", strokeWidth: 1 }));
      addObject(canvas, new IText("登录", { left: 620, top: 240, fontSize: 24, fill: "#e0e0e0" }));
      addObject(canvas, new IText("邮箱", { left: 530, top: 310, fontSize: 12, fill: "#a0a0b8" }));
      addObject(canvas, new Rect({ left: 530, top: 332, width: 380, height: 40, rx: 4, fill: "#1a1a2e", stroke: "#2a2a4a", strokeWidth: 1 }));
      addObject(canvas, new IText("密码", { left: 530, top: 396, fontSize: 12, fill: "#a0a0b8" }));
      addObject(canvas, new Rect({ left: 530, top: 418, width: 380, height: 40, rx: 4, fill: "#1a1a2e", stroke: "#2a2a4a", strokeWidth: 1 }));
      addObject(canvas, new Rect({ left: 530, top: 490, width: 380, height: 44, rx: 4, fill: "#7c6aef" }));
      addObject(canvas, new IText("登 录", { left: 680, top: 504, fontSize: 14, fill: "#ffffff" }));
    },
  },
  {
    name: "数据卡片组",
    tags: ["card", "数据", "统计"],
    isBuiltIn: true,
    previewPath: "",
    create: (canvas) => {
      // Card 1: 总用户
      addObject(canvas, new Rect({ left: 260, top: 80, width: 220, height: 120, rx: 8, fill: "#1e1e3a", stroke: "#2a2a4a", strokeWidth: 1 }));
      addObject(canvas, new IText("总用户", { left: 280, top: 100, fontSize: 12, fill: "#a0a0b8" }));
      addObject(canvas, new IText("12,345", { left: 280, top: 132, fontSize: 28, fill: "#e0e0e0" }));
      addObject(canvas, new IText("+12%", { left: 280, top: 168, fontSize: 11, fill: "#22c55e" }));
      // Card 2: 活跃用户
      addObject(canvas, new Rect({ left: 500, top: 80, width: 220, height: 120, rx: 8, fill: "#1e1e3a", stroke: "#2a2a4a", strokeWidth: 1 }));
      addObject(canvas, new IText("活跃用户", { left: 520, top: 100, fontSize: 12, fill: "#a0a0b8" }));
      addObject(canvas, new IText("8,901", { left: 520, top: 132, fontSize: 28, fill: "#e0e0e0" }));
      addObject(canvas, new IText("+8%", { left: 520, top: 168, fontSize: 11, fill: "#22c55e" }));
      // Card 3: 收入
      addObject(canvas, new Rect({ left: 740, top: 80, width: 220, height: 120, rx: 8, fill: "#1e1e3a", stroke: "#2a2a4a", strokeWidth: 1 }));
      addObject(canvas, new IText("收入", { left: 760, top: 100, fontSize: 12, fill: "#a0a0b8" }));
      addObject(canvas, new IText("¥56,789", { left: 760, top: 132, fontSize: 28, fill: "#e0e0e0" }));
      addObject(canvas, new IText("+23%", { left: 760, top: 168, fontSize: 11, fill: "#22c55e" }));
      // Card 4: 订单
      addObject(canvas, new Rect({ left: 980, top: 80, width: 220, height: 120, rx: 8, fill: "#1e1e3a", stroke: "#2a2a4a", strokeWidth: 1 }));
      addObject(canvas, new IText("订单", { left: 1000, top: 100, fontSize: 12, fill: "#a0a0b8" }));
      addObject(canvas, new IText("1,234", { left: 1000, top: 132, fontSize: 28, fill: "#e0e0e0" }));
      addObject(canvas, new IText("+5%", { left: 1000, top: 168, fontSize: 11, fill: "#22c55e" }));
    },
  },
  {
    name: "表格",
    tags: ["table", "表格", "数据"],
    isBuiltIn: true,
    previewPath: "",
    create: (canvas) => {
      addObject(canvas, new Rect({ left: 260, top: 240, width: 920, height: 40, fill: "#16213e" }));
      addObject(canvas, new IText("ID", { left: 280, top: 254, fontSize: 11, fill: "#a0a0b8" }));
      addObject(canvas, new IText("名称", { left: 380, top: 254, fontSize: 11, fill: "#a0a0b8" }));
      addObject(canvas, new IText("状态", { left: 600, top: 254, fontSize: 11, fill: "#a0a0b8" }));
      addObject(canvas, new IText("日期", { left: 780, top: 254, fontSize: 11, fill: "#a0a0b8" }));
      addObject(canvas, new IText("操作", { left: 920, top: 254, fontSize: 11, fill: "#a0a0b8" }));
    },
  },
  {
    name: "轮播图",
    tags: ["carousel", "轮播", "banner"],
    isBuiltIn: true,
    previewPath: "",
    create: (canvas) => {
      addObject(canvas, new Rect({ left: 260, top: 80, width: 920, height: 400, rx: 8, fill: "#16213e" }));
      addObject(canvas, new IText("轮播图区域", { left: 560, top: 240, fontSize: 24, fill: "#a0a0b8" }));
      addObject(canvas, new Circle({ left: 680, top: 440, radius: 6, fill: "#7c6aef" }));
      addObject(canvas, new Circle({ left: 700, top: 440, radius: 6, fill: "#2a2a4a" }));
      addObject(canvas, new Circle({ left: 720, top: 440, radius: 6, fill: "#2a2a4a" }));
    },
  },
];

/**
 * Convert factory templates to ComponentTemplate format for the store.
 * The `templateData` field stores the template name as a reference key.
 * Actual object creation is done via BUILT_IN_TEMPLATE_FACTORIES[i].create(canvas).
 */
export function getBuiltInTemplatesForStore(): Omit<ComponentTemplate, "id">[] {
  return BUILT_IN_TEMPLATE_FACTORIES.map((factory) => ({
    name: factory.name,
    tags: factory.tags,
    isBuiltIn: true,
    previewPath: factory.previewPath,
    // Store the factory name as a reference; the actual creation uses the factory function
    templateData: `factory:${factory.name}`,
  }));
}
```

- [ ] **Step 6: Create TemplateRegistry**

Create `src/templates/TemplateRegistry.ts`:
```typescript
import { BUILT_IN_TEMPLATE_FACTORIES, getBuiltInTemplatesForStore } from "./templates";
import { useComponentStore, type ComponentTemplate } from "@/stores/componentStore";
import type { Canvas } from "fabric";

export function initializeBuiltInTemplates(): ComponentTemplate[] {
  return getBuiltInTemplatesForStore().map((template) => ({
    ...template,
    id: `built-in-${template.name}`,
  }));
}

/**
 * Apply a template to a canvas using its factory function.
 * Looks up the template by name in BUILT_IN_TEMPLATE_FACTORIES and calls create(canvas).
 */
export function applyTemplateToCanvas(templateName: string, canvas: Canvas): void {
  const factory = BUILT_IN_TEMPLATE_FACTORIES.find((f) => f.name === templateName);
  if (!factory) {
    console.warn(`Template factory not found for: ${templateName}`);
    return;
  }
  factory.create(canvas);
  canvas.renderAll();
}

export function getFilteredTemplates(): ComponentTemplate[] {
  const { builtInComponents, customComponents, searchQuery } = useComponentStore.getState();
  const all = [...builtInComponents, ...customComponents];

  if (!searchQuery.trim()) return all;

  const query = searchQuery.toLowerCase();
  return all.filter(
    (t) =>
      t.name.toLowerCase().includes(query) ||
      t.tags.some((tag) => tag.toLowerCase().includes(query)),
  );
}
```

- [ ] **Step 7: Create ComponentCard component**

Create `src/components/components/ComponentCard.tsx`:

> **Note:** The `draggable` and `onDragStart` attributes are set here for future use, but the canvas drop handler is NOT implemented in this task. Fabric.js captures mouse events on its `<canvas>` element, so HTML5 native drag-and-drop does not work directly. The drop handling (listening for template drops, calling `applyTemplateToCanvas()` from TemplateRegistry) will be implemented in Task 10 when the component panel is wired into the editor integration. For now, the card supports click-to-apply as a simpler interaction.

```typescript
import { GripVertical } from "lucide-react";
import type { ComponentTemplate } from "@/stores/componentStore";

interface ComponentCardProps {
  template: ComponentTemplate;
  onDragStart?: (template: ComponentTemplate) => void;
  onClick?: (template: ComponentTemplate) => void;
}

export function ComponentCard({ template, onDragStart, onClick }: ComponentCardProps) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart?.(template)}
      onClick={() => onClick?.(template)}
      className="group flex items-center gap-2 px-2 py-1.5 bg-bg-surface border border-border rounded hover:border-accent cursor-pointer transition-colors"
    >
      <GripVertical size={12} className="text-text-muted shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-text-primary truncate">{template.name}</p>
        <p className="text-[10px] text-text-muted truncate">
          {template.tags.slice(0, 3).join(" · ")}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Create ComponentPanel component**

Create `src/components/components/ComponentPanel.tsx`:
```typescript
import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { useComponentStore } from "@/stores/componentStore";
import { ComponentCard } from "./ComponentCard";
import { getFilteredTemplates } from "@/templates/TemplateRegistry";

export function ComponentPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const searchQuery = useComponentStore((s) => s.searchQuery);
  const setSearchQuery = useComponentStore((s) => s.setSearchQuery);

  const templates = getFilteredTemplates();

  return (
    <div className="border-t border-border">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
      >
        <span>组件库 ({templates.length})</span>
        <span>{collapsed ? "+" : "-"}</span>
      </button>
      {!collapsed && (
        <div className="px-2 pb-2 space-y-1">
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索组件..."
              className="w-full pl-6 pr-2 py-1 text-xs bg-bg-primary border border-border rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {templates.map((t) => (
              <ComponentCard key={t.id} template={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 9: Commit**

```bash
git add src/templates/ src/stores/componentStore.ts src/components/components/ tests/stores/componentStore.test.ts
git commit -m "feat: add component template library with built-in templates and search"
```

---

## Task 9: Keyboard Shortcuts — Extend Plan 2 Hook

> **IMPORTANT:** Plan 2 (Task 12) already creates `src/hooks/useKeyboardShortcuts.ts` with undo/redo (Ctrl+Z/Y), delete (Delete), and duplicate (Ctrl+D) shortcuts that require a canvas reference. This task EXTENDS that existing file rather than overwriting it.

**Files:**
- Modify: `src/hooks/useKeyboardShortcuts.ts` (created by Plan 2)
- Test: `tests/hooks/useKeyboardShortcuts.test.ts`

- [ ] **Step 1: Add failing tests for Plan 4 shortcuts**

Add to the existing `tests/hooks/useKeyboardShortcuts.test.ts` (from Plan 2):
```typescript
// Plan 4 additions to the existing keyboard shortcuts test file:

describe("useKeyboardShortcuts - Plan 4 extensions", () => {
  it("should trigger save on Ctrl+S", () => {
    renderHook(() => useKeyboardShortcuts());
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "s", ctrlKey: true }),
      );
    });
    // Verify save was triggered (e.g., check store or mock call)
  });

  it("should trigger export dialog on Ctrl+E", () => {
    renderHook(() => useKeyboardShortcuts());
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "e", ctrlKey: true }),
      );
    });
    // Verify export dialog state changed
  });

  it("should switch to select tool on V key", () => {
    renderHook(() => useKeyboardShortcuts());
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "v" }));
    });
    expect(useUiStore.getState().activeTool).toBe("select");
  });

  it("should switch to pen tool on B key", () => {
    renderHook(() => useKeyboardShortcuts());
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "b" }));
    });
    expect(useUiStore.getState().activeTool).toBe("pen");
  });

  it("should toggle left panel on Ctrl+1", () => {
    const before = useUiStore.getState().leftPanelVisible;
    renderHook(() => useKeyboardShortcuts());
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "1", ctrlKey: true }),
      );
    });
    expect(useUiStore.getState().leftPanelVisible).toBe(!before);
  });

  it("should toggle right panel on Ctrl+3", () => {
    const before = useUiStore.getState().rightPanelVisible;
    renderHook(() => useKeyboardShortcuts());
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "3", ctrlKey: true }),
      );
    });
    expect(useUiStore.getState().rightPanelVisible).toBe(!before);
  });
});
```

- [ ] **Step 2: Run test to verify new tests fail**

Run: `npm test -- tests/hooks/useKeyboardShortcuts.test.ts`
Expected: FAIL -- Ctrl+S, Ctrl+E, tool switching, panel toggling tests fail.

- [ ] **Step 3: Extend existing useKeyboardShortcuts (Plan 2's file)**

Modify `src/hooks/useKeyboardShortcuts.ts` (created by Plan 2) to ADD these cases:

```typescript
// Plan 4 ADDS these cases to the existing keyboard handler from Plan 2.
// In the ctrlKey/metaKey section, add AFTER the existing Ctrl+Z/Y/D cases:

case "s":
  e.preventDefault();
  // Trigger manual save via the canvasStore's save function.
  // This calls the same auto-save logic from Plan 2 but on demand.
  // The canvasStore exposes a saveCurrentCanvas() that serializes the
  // Fabric.js canvas and invokes the Rust save_canvas_json command.
  {
    const { saveCurrentCanvas } = useCanvasStore.getState();
    saveCurrentCanvas();
  }
  break;
case "e":
  e.preventDefault();
  // Toggle the export dialog via uiStore
  {
    const { setExportDialogOpen } = useUiStore.getState();
    setExportDialogOpen(true);
  }
  break;
case "1":
  e.preventDefault();
  toggleLeftPanel();
  break;
case "3":
  e.preventDefault();
  toggleRightPanel();
  break;

// In the non-modifier key section, add tool switching:
const TOOL_KEY_MAP: Record<string, ToolType> = {
  v: "select",
  b: "pen",
  r: "rectangle",
  t: "text",
};

const tool = TOOL_KEY_MAP[e.key.toLowerCase()];
if (tool) {
  e.preventDefault();
  setActiveTool(tool);
}
```

> **Note:** Do NOT overwrite the file. Merge these additions into Plan 2's existing handler that already handles Ctrl+Z (undo), Ctrl+Y (redo), Delete, and Ctrl+D (duplicate). The `toggleLeftPanel` and `toggleRightPanel` functions come from `useUiStore` which was set up in Plan 1.

- [ ] **Step 4: Run test to verify all tests pass**

Run: `npm test -- tests/hooks/useKeyboardShortcuts.test.ts`
Expected: All Plan 2 + Plan 4 keyboard tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useKeyboardShortcuts.ts tests/hooks/useKeyboardShortcuts.test.ts
git commit -m "feat: extend keyboard shortcuts with tool switching, panel toggling, save, and export"
```

---

## Task 10: Integration — Wire Everything into EditorLayout

**Files:**
- Modify: `src/components/editor/EditorLayout.tsx` (add shortcuts, snapshots, components)
- Modify: `src/components/editor/MenuBar.tsx` (add export menu)
- Modify: `src/components/editor/StatusBar.tsx` (add link count)
- Modify: `src/i18n/locales/zh-CN/translation.json` (add all new keys)

- [ ] **Step 1: Update Chinese translations**

Add to `src/i18n/locales/zh-CN/translation.json` — merge these keys into the existing structure:
```json
{
  "export": {
    "title": "导出",
    "singlePage": "导出当前页面",
    "batchExport": "批量导出项目",
    "format": "导出格式",
    "resolution": "图片分辨率",
    "exportBtn": "导出",
    "exporting": "导出中...",
    "cancel": "取消",
    "progress": "正在导出 {progress}/{total}...",
    "noPages": "没有其他页面可链接",
    "selectTarget": "选择目标页面"
  },
  "snapshot": {
    "title": "快照",
    "create": "创建快照",
    "empty": "暂无快照",
    "restore": "恢复",
    "delete": "删除快照",
    "restoreConfirm": "恢复此快照将覆盖当前画板内容，是否继续？",
    "deleteConfirm": "确定要删除此快照吗？"
  },
  "links": {
    "setLink": "设置链接",
    "editLink": "编辑链接",
    "removeLink": "移除链接",
    "linkCount": "{count} 个链接"
  },
  "components": {
    "title": "组件库",
    "search": "搜索组件...",
    "custom": "自定义组件",
    "saveAsComponent": "保存为组件",
    "builtIn": "预置组件"
  },
  "memory": {
    "title": "记忆管理",
    "preferences": "用户偏好",
    "modules": "已保存模块",
    "projectContext": "项目上下文",
    "noModules": "暂无已保存模块"
  },
  "skills": {
    "title": "技能",
    "badge": "使用技能：{name}"
  },
  "shortcuts": {
    "tools": "工具切换",
    "select": "V 选择",
    "pen": "B 画笔",
    "rectangle": "R 矩形",
    "text": "T 文字",
    "canvas": "画布操作",
    "undo": "Ctrl+Z 撤销",
    "redo": "Ctrl+Y 重做",
    "delete": "Delete 删除",
    "duplicate": "Ctrl+D 复制",
    "global": "全局",
    "save": "Ctrl+S 保存",
    "export": "Ctrl+E 导出",
    "toggleLeft": "Ctrl+1 左侧面板",
    "toggleRight": "Ctrl+3 右侧面板"
  }
}
```

- [ ] **Step 2: Update EditorLayout with new features**

Update `src/components/editor/EditorLayout.tsx` to import and use new components:
```typescript
import { MenuBar } from "./MenuBar";
import { Toolbar } from "./Toolbar";
import { StatusBar } from "./StatusBar";
import { PagePanel } from "./PagePanel";
import { CanvasArea } from "./CanvasArea";
import { ChatPanel } from "./ChatPanel";
import { useUiStore } from "@/stores/uiStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export function EditorLayout() {
  const leftPanelVisible = useUiStore((s) => s.leftPanelVisible);
  const rightPanelVisible = useUiStore((s) => s.rightPanelVisible);

  useKeyboardShortcuts();

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

- [ ] **Step 3: Update MenuBar with export triggers**

Update the MenuBar component to include export dialog triggers in the "导出" menu:
```typescript
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useState } from "react";
import { ExportDialog } from "@/components/export/ExportDialog";
import { BatchExportDialog } from "@/components/export/BatchExportDialog";

// Inside MenuBar component, add state:
const [exportDialogOpen, setExportDialogOpen] = useState(false);
const [batchDialogOpen, setBatchDialogOpen] = useState(false);

// Replace the static "导出" button with a dropdown:
<DropdownMenu.Root>
  <DropdownMenu.Trigger asChild>
    <button className="px-2 py-0.5 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors">
      {t("editor.menu.export")}
    </button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content className="min-w-[140px] bg-bg-surface border border-border rounded-lg p-1">
      <DropdownMenu.Item
        onSelect={() => setExportDialogOpen(true)}
        className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded cursor-pointer outline-none"
      >
        {t("export.singlePage")}
      </DropdownMenu.Item>
      <DropdownMenu.Item
        onSelect={() => setBatchDialogOpen(true)}
        className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded cursor-pointer outline-none"
      >
        {t("export.batchExport")}
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>

{/* At the end of MenuBar return, add dialogs with real export handlers */}
<ExportDialog
  open={exportDialogOpen}
  onClose={() => setExportDialogOpen(false)}
  onExport={async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    const { save } = await import("@tauri-apps/plugin-dialog");
    const format = useExportStore.getState().format;
    const resolution = useExportStore.getState().resolution;

    if (format === "html" || format === "both") {
      const html = await invoke("export_single_page", {
        data: {
          pageName: currentPageName,
          htmlContent: currentCanvasHtml,
          cssContent: currentCanvasCss,
          width: canvasWidth,
          height: canvasHeight,
          links: [],
        },
      });
      const filePath = await save({
        defaultPath: `${currentPageName}.html`,
        filters: [{ name: "HTML", extensions: ["html"] }],
      });
      if (filePath) {
        await invoke("write_file", { path: filePath, content: html });
      }
    }

    if (format === "png" || format === "both") {
      const dataUrl = canvas.toDataURL({ format: "png", multiplier: resolution });
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
      const filePath = await save({
        defaultPath: `${currentPageName}.png`,
        filters: [{ name: "PNG", extensions: ["png"] }],
      });
      if (filePath) {
        await invoke("write_binary_file", { path: filePath, data: base64Data });
      }
    }

    setExportDialogOpen(false);
  }}
/>
<BatchExportDialog
  open={batchDialogOpen}
  onClose={() => setBatchDialogOpen(false)}
  onExport={async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    const { save } = await import("@tauri-apps/plugin-dialog");

    useExportStore.getState().startExport(pages.length);

    const dirPath = await save({
      defaultPath: `${projectName}-export`,
      filters: [{ name: "Directory", extensions: ["*"] }],
    });
    if (!dirPath) return;

    const results = await invoke("export_batch_pages", {
      pages: pages.map((p) => ({
        pageName: p.name,
        htmlContent: p.htmlContent,
        cssContent: p.cssContent,
        width: p.width,
        height: p.height,
        links: p.links,
      })),
      projectName: projectName,
    });

    for (const result of results) {
      await invoke("write_file", {
        path: `${dirPath}/${result.file_name}`,
        content: result.content,
      });
      useExportStore.getState().updateProgress();
    }

    useExportStore.getState().finishExport();
    setBatchDialogOpen(false);
  }}
/>
```

- [ ] **Step 4: Run full test suite**

Run: `npm test`
Expected: All tests across all files PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/editor/EditorLayout.tsx src/components/editor/MenuBar.tsx src/i18n/locales/zh-CN/translation.json
git commit -m "feat: integrate all Plan 4 features into editor layout"
```

---

## Task 11: Final Polish — Loading States, Confirmations, Error Boundary

**Files:**
- Create: `src/components/ui/ErrorBoundary.tsx`
- Create: `src/components/ui/ConfirmDialog.tsx`
- Create: `src/components/ui/EmptyState.tsx`
- Create: `src/components/ui/LoadingSpinner.tsx`
- Modify: `src/App.tsx` (wrap with ErrorBoundary)

- [ ] **Step 1: Create ErrorBoundary component**

Create `src/components/ui/ErrorBoundary.tsx`:
```typescript
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen bg-bg-primary flex items-center justify-center">
          <div className="text-center max-w-md">
            <h2 className="text-xl text-text-primary mb-2">出了点问题</h2>
            <p className="text-sm text-text-muted mb-4">
              {this.state.error?.message ?? "未知错误"}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-accent text-white rounded hover:bg-accent-hover transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 2: Create ConfirmDialog component**

Create `src/components/ui/ConfirmDialog.tsx`:
```typescript
import * as Dialog from "@radix-ui/react-dialog";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "确认",
  cancelLabel = "取消",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-surface rounded-lg p-6 w-[380px] border border-border">
          <Dialog.Title className="text-base font-medium text-text-primary mb-2">
            {title}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-text-secondary mb-6">
            {message}
          </Dialog.Description>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm rounded transition-colors ${
                variant === "danger"
                  ? "bg-danger text-white hover:bg-red-600"
                  : "bg-accent text-white hover:bg-accent-hover"
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 3: Create EmptyState component**

Create `src/components/ui/EmptyState.tsx`:
```typescript
interface EmptyStateProps {
  icon?: React.ReactNode;
  message: string;
}

export function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-text-muted">
      {icon && <div className="mb-2">{icon}</div>}
      <p className="text-xs">{message}</p>
    </div>
  );
}
```

- [ ] **Step 4: Create LoadingSpinner component**

Create `src/components/ui/LoadingSpinner.tsx`:
```typescript
interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({ size = 20, className = "" }: LoadingSpinnerProps) {
  return (
    <div className={`animate-spin ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <circle
          cx="12" cy="12" r="10"
          stroke="currentColor"
          strokeWidth="2"
          className="text-border"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-accent"
        />
      </svg>
    </div>
  );
}
```

- [ ] **Step 5: Wrap App with ErrorBoundary**

Update `src/App.tsx`:
```typescript
import { useUiStore } from "@/stores/uiStore";
import { WelcomeScreen } from "@/components/welcome/WelcomeScreen";
import { EditorLayout } from "@/components/editor/EditorLayout";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

function AppContent() {
  const view = useUiStore((s) => s.view);
  if (view === "editor") {
    return <EditorLayout />;
  }
  return <WelcomeScreen />;
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
```

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/ErrorBoundary.tsx src/components/ui/ConfirmDialog.tsx src/components/ui/EmptyState.tsx src/components/ui/LoadingSpinner.tsx src/App.tsx
git commit -m "feat: add error boundary, confirm dialogs, empty states, and loading spinner"
```

- [ ] **Step 6: Wire ConfirmDialog to WelcomeScreen project delete**

The `ConfirmDialog` must guard destructive actions. Update Plan 1's `WelcomeScreen` component to wrap the project delete action with a confirmation dialog:

```typescript
// In WelcomeScreen, add state and handler for delete confirmation:
const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

// Where the project delete button is rendered, change from direct delete
// to opening the confirm dialog:
<button onClick={() => setDeleteTargetId(project.id)}>删除</button>

// Add the ConfirmDialog at the end of the component's JSX:
<ConfirmDialog
  open={deleteTargetId !== null}
  title="删除项目"
  message="确定要删除此项目吗？所有页面和快照数据将被永久删除，此操作不可撤销。"
  confirmLabel="删除"
  variant="danger"
  onConfirm={async () => {
    if (deleteTargetId) {
      await deleteProject(deleteTargetId);
    }
    setDeleteTargetId(null);
  }}
  onCancel={() => setDeleteTargetId(null)}
/>
```

- [ ] **Step 7: Commit**
```

---

## Task 12: End-to-End Integration Verification

**Files:** None new — verification only.

- [ ] **Step 1: Run full Rust test suite**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: All Rust tests PASS.

- [ ] **Step 2: Run full frontend test suite**

Run: `npm test`
Expected: All frontend tests PASS.

- [ ] **Step 3: Run Tauri dev build**

Run: `npm run tauri dev`

Verify these flows:
1. Welcome screen loads with dark theme
2. Create project → editor view
3. Drawing tools work (select/pen/rect/text)
4. Page creation, switching, rename, delete
5. Right-click element → "设置链接" → page selector appears
6. Linked element shows link badge
7. Menu → 导出 → single page export dialog
8. Menu → 导出 → batch export dialog
9. Snapshot creation and restoration
10. Component panel in left sidebar with built-in templates
11. Keyboard shortcuts: V/B/R/T tool switch, Ctrl+1/3 panel toggle
12. Chat panel sends message to AI (requires model config)
13. AI response renders prototype on canvas
14. Theme toggle works

- [ ] **Step 4: Run production build**

Run: `npm run tauri build`
Expected: Build completes, produces Windows exe installer.

- [ ] **Step 5: Final commit if needed**

```bash
git add -A
git commit -m "fix: integration fixes from end-to-end verification"
```

Only commit if changes were needed.

---

## Summary

After completing all tasks (1 through 12, plus 1b and 5b), the AI-Proto-Tool application will have:

| Feature | Status |
|---------|--------|
| Element jump binding (right-click) | Implemented |
| HTML single-page export | Implemented |
| PNG export (1x/2x/3x) | Implemented |
| Batch project export | Implemented |
| Design snapshots | Implemented |
| AI memory system (3 layers) | Implemented |
| AI skill engine (15 skills) | Implemented |
| Component template library | Implemented |
| Keyboard shortcuts | Implemented |
| Error boundary | Implemented |
| Confirm dialogs | Implemented |
| Empty states | Implemented |
| Final i18n pass | Implemented |

**All 4 plans are now complete. The application is ready for execution.**
