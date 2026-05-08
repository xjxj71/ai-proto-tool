import type { ChatMessage, ContentPart } from "@/types";
import type { UserPreferences, ProjectContextData } from "@/stores/memoryStore";

interface CanvasContextInput {
  canvasJSON: string;
  canvasWidth: number;
  canvasHeight: number;
  screenshotDataUrl?: string;
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

  return `You are an expert UI/UX prototype designer. You create web prototypes using HTML and CSS.

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

Rules:
- type "generate" means full HTML replacement; "modify" means incremental changes to existing prototype.
- The HTML should be a self-contained snippet (wrapped in a root div with class "prototype").
- CSS should target elements within .prototype to avoid global conflicts.
- Use modern CSS (flexbox, grid, variables) and semantic HTML.
- All interactions should list clickable elements and their target pages.
- The message field is displayed in the chat panel as your reply.
- If the user asks a non-design question, respond with plain text (no JSON block).
- Design for the specified canvas dimensions.
- Use a clean, professional design aesthetic.
- Include hover states and basic transitions where appropriate.
- Prefer Chinese text for UI copy unless the user specifies English.`;
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

  let context = `[Current Canvas State]\nCanvas size: ${input.canvasWidth}x${input.canvasHeight}\nCanvas is ${state}.`;

  if (objectCount > 0) {
    context += `\nCanvas objects JSON: ${input.canvasJSON}`;
  }

  if (input.screenshotDataUrl) {
    context += `\n[A screenshot of the current canvas is attached as an image]`;
  }

  return context;
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
