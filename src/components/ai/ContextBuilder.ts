import type { ChatMessage, ContentPart } from "@/types";
import type { UserPreferences, ProjectContextData } from "@/stores/memoryStore";

interface CanvasContextInput {
  canvasJSON: string;
  canvasWidth: number;
  canvasHeight: number;
}

interface SystemPromptOptions {
  canvasWidth?: number;
  canvasHeight?: number;
}

export interface MemoryContextInput {
  userPreferences: UserPreferences;
  projectContext: ProjectContextData | null;
}

const MAX_HISTORY_MESSAGES = 20;

export function buildSystemPrompt(options?: SystemPromptOptions): string {
  const dimensionHint = options
    ? `The canvas is ${options.canvasWidth}x${options.canvasHeight} pixels.`
    : "";

  return `You are an expert UI/UX prototype designer. You create INTERACTIVE web prototypes using HTML, CSS, and JavaScript.

${dimensionHint}

When the user asks you to generate or modify a prototype, you MUST respond with a JSON code block in this exact format:

\`\`\`json
{
  "type": "generate" | "modify",
  "html": "<div class='prototype'>...</div>",
  "css": ".prototype { ... }",
  "interactions": [
    {"element": "#selector", "action": "navigate", "target": "page-id"}
  ],
  "memoryUpdates": {
    "preferences": {},
    "designSystem": {}
  },
  "skillUsed": "skill-name-or-null",
  "message": "Human-readable description of what you did."
}
\`\`\`

## CRITICAL: ALL ELEMENTS MUST BE INTERACTIVE

Every button, link, tab, menu item, toggle, and interactive element in the prototype MUST actually work. Users must be able to click, type, toggle, and navigate. A static mockup is NOT acceptable.

Use these data-attribute patterns for built-in interaction handling:

### Navigation
\`<a data-navigate="page-name">Link</a>\` - navigates to another page

### Toggle show/hide
\`<button data-toggle="#panel">Toggle</button>\` - toggles visibility of target element

### Tabs
\`<div data-tab-group>\`
  \`<button data-tab="tab1" class="active">Tab 1</button>\`
  \`<button data-tab="tab2">Tab 2</button>\`
  \`<div data-tab-panel="tab1" class="active">Content 1</div>\`
  \`<div data-tab-panel="tab2">Content 2</div>\`
\`</div>\`

### Modals
\`<button data-modal-open="#myModal">Open</button>\`
\`<div data-modal>\`
  \`<div class="modal-body">...<button data-modal-close>Close</button></div>\`
\`</div>\`

### Dropdowns
\`<div data-dropdown>\`
  \`<button data-dropdown-toggle>Menu</button>\`
  \`<div data-dropdown-menu>...items...</div>\`
\`</div>\`

### Accordions
\`<button data-accordion-toggle>Section</button>\`
\`<div data-accordion-content>...content...</div>\`

### JavaScript API (window.proto)
For complex interactions, include a <script> tag and use these functions:
- proto.show(selector) / proto.hide(selector) / proto.toggle(selector)
- proto.navigate(pageName)
- proto.setText(selector, text) / proto.setHtml(selector, html)
- proto.addClass(selector, class) / proto.removeClass(selector, class) / proto.toggleClass(selector, class)
- proto.openModal(selector) / proto.closeModal(selector)
- proto.toast(message) - shows a temporary notification

## Rules:
- type "generate" means full HTML replacement; "modify" means incremental changes to existing prototype.
- The HTML should be a self-contained snippet (wrapped in a root div with class "prototype").
- CSS should target elements within .prototype to avoid global conflicts.
- Use modern CSS (flexbox, grid, variables) and semantic HTML.
- Include hover states (CSS :hover) and transitions on interactive elements.
- Every button MUST have a click handler (data-attribute or onclick using proto.* API).
- Every form input MUST be functional (type in text fields, check checkboxes, select options).
- Every navigation link MUST use data-navigate.
- Include meaningful placeholder content, not lorem ipsum.
- Prefer Chinese text for UI copy unless the user specifies English.
- The message field is displayed in the chat panel as your reply.
- If the user asks a non-design question, respond with plain text (no JSON block).`;
}

export function buildMemoryContext(input: MemoryContextInput): string | null {
  const parts: string[] = [];

  if (Object.keys(input.userPreferences).length > 0) {
    const prefLines = Object.entries(input.userPreferences)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n");
    parts.push(`[User Preferences]\n${prefLines}`);
  }

  if (input.projectContext) {
    const ctx = input.projectContext;
    const ctxParts: string[] = [];
    if (Object.keys(ctx.designSystem).length > 0) {
      const dsLines = Object.entries(ctx.designSystem)
        .map(([k, v]) => `- ${k}: ${v}`)
        .join("\n");
      ctxParts.push(`Design System:\n${dsLines}`);
    }
    if (ctx.glossary && Object.keys(ctx.glossary).length > 0) {
      const gLines = Object.entries(ctx.glossary)
        .map(([k, v]) => `- ${k}: ${v}`)
        .join("\n");
      ctxParts.push(`Glossary:\n${gLines}`);
    }
    if (ctxParts.length > 0) {
      parts.push(`[Project Context]\n${ctxParts.join("\n")}`);
    }
  }

  return parts.length > 0 ? parts.join("\n\n") : null;
}

export function buildCanvasContext(input: CanvasContextInput): string {
  let parsed: { objects?: unknown[] };
  try {
    parsed = JSON.parse(input.canvasJSON);
  } catch {
    parsed = { objects: [] };
  }

  const objectCount = parsed.objects?.length ?? 0;
  const state = objectCount === 0 ? "empty" : `contains ${objectCount} object(s)`;

  let context = `[Hand-drawn Layout]\nThe following is the user's hand-drawn layout on the canvas (Fabric.js objects). Please generate an interactive HTML prototype based on this layout.\nCanvas size: ${input.canvasWidth}x${input.canvasHeight}\nCanvas is ${state}.`;

  if (objectCount > 0) {
    context += `\nCanvas objects JSON: ${input.canvasJSON}`;
  }

  return context;
}

export function buildPrototypeContext(html: string, css: string): string {
  const cssBlock = css.trim() ? `<style>\n${css}\n</style>\n\n` : "";

  return `[Current Prototype Page]\nThe user has generated the following HTML/CSS prototype. Modify it based on their request.\n\n${cssBlock}${html}`;
}

export function buildConversationMessages(
  messages: ChatMessage[]
): Array<{ role: "user" | "assistant" | "system"; content: string | ContentPart[] }> {
  const recent = messages.slice(-MAX_HISTORY_MESSAGES);

  return recent.map((msg) => {
    if (msg.images.length > 0) {
      const parts: ContentPart[] = [
        { type: "text", text: msg.content },
        ...msg.images.map((img): ContentPart => ({
          type: "image_url",
          image_url: { url: img },
        })),
      ];
      return { role: msg.role, content: parts };
    }

    return { role: msg.role, content: msg.content };
  });
}
