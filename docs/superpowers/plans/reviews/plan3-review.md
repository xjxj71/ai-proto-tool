# Plan 3 Review: AI Integration -- Chat + Model Config + Generation

**Reviewer:** Claude Code (automated plan review)
**Date:** 2026-05-08
**Plan:** `2026-05-08-ai-integration.md` (Plan 3 of 4)
**Dependencies reviewed:** Plan 1 (`2026-05-08-project-foundation.md`), Plan 2 (`2026-05-08-canvas-engine.md`)

---

## Summary of Findings

The plan is well-structured with clear TDD steps, but contains **20 issues** across 8 categories: 4 critical, 7 high, 9 medium. The most severe problems are a broken import dependency on canvasStore, an incorrect Anthropic SSE parser, missing state transitions in the chat streaming state machine, and an API key exposure risk in Gemini requests.

---

## CRITICAL Issues

### C1. useStreamingChat imports canvasStore from Plan 2 but assumes incorrect interface

**Location:** Task 9, `useStreamingChat.ts` (line 2113 of plan)

```typescript
import { useCanvasStore } from "@/stores/canvasStore";
```

The code then accesses:
```typescript
const lastSnapshot = canvasStore.history[canvasStore.historyIndex];
```

**Problem:** In Plan 2's canvasStore, `history` is typed as `CanvasJSON[]` (from `@/utils/canvasSerializer`). When `historyIndex` is `-1` (the initial state), `canvasStore.history[-1]` returns `undefined`. The code handles this with a fallback, but there is a more subtle issue: the code references `useUiStore.getState().currentPageId` and `useCanvasStore` together without any null-check on whether a page is actually loaded. When the chat is opened with no page selected, it still attempts to build context from an empty canvas, which works but is misleading.

**Severity:** Critical because it will cause a build failure if `canvasStore` does not exist yet, or a runtime crash if the store shape has diverged between Plan 2's implementation and Plan 3's assumptions.

**Fix:** Add a defensive check for canvasStore state:
```typescript
const canvasStore = useCanvasStore.getState();
const canvasJSON = (canvasStore.history.length > 0 && canvasStore.historyIndex >= 0)
  ? JSON.stringify(canvasStore.history[canvasStore.historyIndex])
  : '{"version":"6","objects":[]}';
```

### C2. Anthropic SSE stream parsing is wrong -- uses incorrect event format

**Location:** Task 2, `ai_commands.rs`, `extract_content_from_sse` function (line 504-545 of plan)

```rust
if config.provider == "anthropic" {
    parsed
        .get("delta")
        .and_then(|d| d.get("text"))
        .and_then(|t| t.as_str())
        .map(|s| s.to_string())
        .or_else(|| {
            parsed
                .get("type")
                .and_then(|t| t.as_str())
                .filter(|&t| t == "content_block_delta")
                .and_then(|_| {
                    parsed
                        .get("delta")
                        .and_then(|d| d.get("text"))
                        .and_then(|t| t.as_str())
                        .map(|s| s.to_string())
                })
        })
}
```

**Problem:** The Anthropic Messages API SSE format sends events like:
```
event: content_block_delta
data: {"type": "content_block_delta", "index": 0, "delta": {"type": "text_delta", "text": "Hello"}}
```

The correct path to the text content is `delta.text`, but the `delta` object also contains a `type` field (`"text_delta"`). The current code checks for `delta.text` which is correct, but the fallback branch is redundant -- the first `.get("delta").and_then(|d| d.get("text"))` already captures both cases, making the `.or_else()` dead code.

More critically, this parser does NOT handle:
1. `event: message_stop` -- the stream end signal for Anthropic. The current code only checks for `data: [DONE]` which is OpenAI's format.
2. `event: message_start` and `event: content_block_start` events that precede the actual content deltas.
3. Anthropic SSE uses `event:` lines to indicate event types, not just `data:` lines. The `extract_sse_line` function only looks at `data:` prefixed lines and ignores `event:` lines entirely.

**Fix:** The `extract_sse_line` / stream processing loop needs to handle `event:` lines and recognize `message_stop` as the end-of-stream marker for Anthropic. Additionally, Anthropic's `[DONE]` equivalent is NOT sent as `data: [DONE]` -- the stream simply ends after `message_stop`.

### C3. Anthropic `anthropic-version` header is outdated

**Location:** Task 2, `build_endpoint_and_headers` function (line 629 of plan)

```rust
headers.insert("anthropic-version", "2023-06-01".parse().unwrap());
```

**Problem:** The `2023-06-01` version is the original Messages API version. By 2026, Anthropic has moved to newer API versions. The `2023-06-01` version predates many features including proper streaming, tool use, and extended thinking. While it still works for basic completions, it may lack support for features the app needs. At minimum, `2024-10-22` or later should be used.

**Fix:** Update to a recent stable version header, e.g., `"2023-06-01"` is technically still supported but `"2024-10-22"` would be more appropriate for 2026.

### C4. Gemini API key is exposed in the URL

**Location:** Task 2, `build_endpoint_and_headers` function (line 632-637 of plan)

```rust
format!(
    "{}/v1beta/models/{}:streamGenerateContent?key={}",
    config.base_url.trim_end_matches('/'),
    config.model_name,
    config.api_key
)
```

**Problem:** The Gemini API key is placed directly in the URL query string. This means the API key will appear in:
1. HTTP request logs
2. Any proxy or gateway logs
3. Tauri's debug console if network requests are logged
4. Browser DevTools equivalent in the Tauri webview

The Gemini REST API also supports passing the key via `x-goog-api-key` header, which is the recommended approach for server-side usage.

**Fix:** Use the header-based authentication approach:
```rust
headers.insert("x-goog-api-key", config.api_key.parse().map_err(|_| "Invalid API key")?);
format!(
    "{}/v1beta/models/{}:streamGenerateContent",
    config.base_url.trim_end_matches('/'),
    config.model_name,
)
```

---

## HIGH Issues

### H1. ViewType extension conflicts between Plan 2 and Plan 3

**Location:** Task 12, Step 6 (line 3583-3587 of plan)

Plan 3 specifies:
```typescript
export type ViewType = "welcome" | "editor" | "settings";
```

But Plan 2 already defined (and may have been implemented as):
```typescript
export type ViewType = "welcome" | "editor";
```

The plan says "Also add `settings` to the `ViewType`" but does not specify this as a modification to the existing `uiStore.ts` -- it just shows the new type. This is ambiguous: does the implementer replace the entire `uiStore.ts` file or just add `"settings"` to the existing union type?

**Fix:** Make the instruction explicit: "Modify the `ViewType` union in `src/stores/uiStore.ts` to add `| "settings"` to the existing type definition."

### H2. Gemini streaming response does not use SSE format -- parser will fail

**Location:** Task 2, stream processing loop (line 423-456 of plan)

The Gemini `streamGenerateContent` endpoint returns JSON objects separated by newlines, NOT SSE `data:` prefixed lines. Each chunk is a JSON object like:
```json
{"candidates": [{"content": {"parts": [{"text": "Hello"}]}}]}
```

The current code only looks for `data: ` prefixed lines:
```rust
if let Some(data) = line.strip_prefix("data: ") {
```

For Gemini, this will never match, and the stream content will be silently discarded while the `done` event never fires (since `[DONE]` is also an OpenAI convention).

**Fix:** Add a Gemini-specific branch in the stream processing that does NOT expect `data:` prefixes, or add the `alt=sse` query parameter to the Gemini URL to get SSE-formatted responses:
```
{}/v1beta/models/{}:streamGenerateContent?alt=sse&key={}
```

This is the simpler fix and makes Gemini responses parse correctly with the existing SSE logic.

### H3. `canvas_commands` module referenced in mod.rs but never created

**Location:** Task 2, Step 4 (line 795-801 of plan)

```rust
pub mod ai_commands;
pub mod canvas_commands;
pub mod chat_commands;
pub mod model_commands;
pub mod page_commands;
pub mod project_commands;
```

The `canvas_commands` module is included in the module list, but no task in Plan 3 creates `src-tauri/src/commands/canvas_commands.rs`. This module is presumably created by Plan 2. If Plan 3 is executed independently and Plan 2 has not been completed, this will cause a Rust compilation error.

**Fix:** The plan should either:
1. Note that `canvas_commands` is already created by Plan 2, or
2. Only add the new modules (`ai_commands`, `chat_commands`) and instruct the implementer to append to the existing `mod.rs`.

### H4. Missing `update_model_config` Tauri command -- edit uses delete+recreate

**Location:** Task 12, `ModelConfigList.tsx`, `handleSubmit` (line 3395-3423 of plan)

```typescript
if (editConfig) {
    // Delete old and recreate (simple approach, avoids needing update command)
    await invoke("delete_model_config", { id: editConfig.id });
}
await invoke("create_model_config", { ... });
```

**Problem:** The delete-then-recreate approach:
1. Changes the `id` of the config on every edit, breaking any references that might store the config ID.
2. Creates a race condition: if the create fails after the delete, the config is lost.
3. Does not preserve `created_at` timestamp.
4. If the config was the default text/vision model, `delete_model_config` removes it and `create_model_config` creates a new one with a new ID, but the store's `defaultTextModel` still references the old ID until the next full config reload.

**Fix:** Add an `update_model_config` Tauri command, or at minimum document this limitation explicitly.

### H5. Streaming state machine has a gap -- `stopStreaming(true)` is called before response parsing

**Location:** Task 9, `useStreamingChat.ts` (line 2158-2183 of plan)

The `done` event handler:
```typescript
const currentContent = useChatStore.getState().streamingContent;
stopStreaming(true);  // This adds streamingContent as an assistant message
// Then immediately tries to update that message
const parsed = parseAIResponse(currentContent);
```

**Problem:** `stopStreaming(true)` creates a new assistant message from `streamingContent` and clears `streamingContent`. Then the code reads `useChatStore.getState().messages` to find the last message and update it. This works but is fragile:
1. If any async operation occurs between `stopStreaming(true)` and `setMessages`, another message could have been added.
2. The message content is set to the raw accumulated stream, then immediately replaced with `parsed.replyText`. This means for one render frame, the raw JSON-in-markdown is visible before being replaced.

**Fix:** Restructure to parse first, then stop streaming with the final content:
```typescript
} else if (payload.event_type === "done") {
    const currentContent = useChatStore.getState().streamingContent;
    const parsed = parseAIResponse(currentContent);
    // Stop streaming but provide the final content directly
    stopStreaming(true);
    if (parsed.response) {
        // Update the last message with parsed data
        // ...
    }
}
```

Or better, add a `stopStreamingWithContent(content, metadata)` method to the store.

### H6. MenuBar in Plan 1 only shows 4 menus (file, edit, view, export) -- "settings" is missing from iteration

**Location:** Task 13 (line 3740-3750 of plan)

Plan 1's `MenuBar.tsx` iterates over:
```typescript
{(["file", "edit", "view", "export"] as const).map((menu) => (
```

Task 13 says to "Add a click handler to the settings button" but there IS no settings button in the menu -- it is not in the iteration array. The Plan 1 i18n has `editor.menu.settings` as "设置" but the MenuBar component does not render it.

**Fix:** Task 13 needs to explicitly instruct adding `"settings"` to the menu array:
```typescript
{(["file", "edit", "view", "export", "settings"] as const).map((menu) => (
```

And only the "settings" item should have the click handler; the others remain as non-interactive buttons or get dropdown menus later.

### H7. `useStreamingChat` uses `activeTool` selector but never uses it

**Location:** Task 9, `useStreamingChat.ts` (line 2143 of plan)

```typescript
const activeTool = useUiStore((s) => s.activeTool);
```

This selector is imported but never referenced anywhere in the hook. It is dead code that unnecessarily subscribes to state changes.

**Fix:** Remove the unused selector.

---

## MEDIUM Issues

### M1. i18n keys split across multiple tasks with merge conflicts risk

**Location:** Task 11 (line 2770) and Task 15 (line 3925)

Task 11 adds chat/settings i18n keys. Task 15 says to "verify and merge all i18n keys." But Task 11 shows a full JSON block for `chat` and `settings`, and the existing translation.json from Plan 1 already has `settings.title`, `settings.theme`, etc. The plan says "Merge with existing settings keys; do not duplicate" but does not provide the merged result.

**Fix:** Provide the complete final `translation.json` in a single task rather than splitting across two tasks with ambiguous merge instructions.

### M2. ChatInput test references wrong placeholder text

**Location:** Task 10, `ChatInput.test.tsx` (line 2713 of plan)

```typescript
expect(screen.getByPlaceholderText("Type a message...")).toBeInTheDocument();
```

But the component uses:
```typescript
placeholder={t("chat.inputPlaceholder")}
```

And the i18n defines:
```json
"inputPlaceholder": "输入消息..."
```

The test will fail because the placeholder renders as Chinese text "输入消息...", not "Type a message...".

**Fix:** Update the test to use the Chinese placeholder text, or mock i18next to return English in tests.

Similarly, `screen.getByTitle("Send")` and `screen.getByTitle("Upload image")` use English title text, but the component uses `t("chat.send")` and `t("chat.uploadImage")` which resolve to Chinese. These tests will fail.

### M3. `extract_sse_line` recursively calls itself on empty lines -- stack overflow risk

**Location:** Task 2, `extract_sse_line` function (line 491-501 of plan)

```rust
fn extract_sse_line(buffer: &mut String) -> Option<String> {
    if let Some(pos) = buffer.find('\n') {
        let line = buffer[..pos].trim_end_matches('\r').to_string();
        *buffer = buffer[pos + 1..].to_string();
        if line.is_empty() {
            return extract_sse_line(buffer);  // recursive call
        }
        Some(line)
    } else {
        None
    }
}
```

If the buffer contains many consecutive `\n` characters (e.g., `\n\n\n\n\n...`), this will recurse for each empty line. While unlikely to cause a real stack overflow in practice (the buffer would need thousands of consecutive newlines), it is a code quality issue.

**Fix:** Convert to a loop:
```rust
fn extract_sse_line(buffer: &mut String) -> Option<String> {
    while let Some(pos) = buffer.find('\n') {
        let line = buffer[..pos].trim_end_matches('\r').to_string();
        *buffer = buffer[pos + 1..].to_string();
        if !line.is_empty() {
            return Some(line);
        }
    }
    None
}
```

### M4. `build_chat_body` for Gemini does not pass `stream` parameter

**Location:** Task 2, `build_chat_body` function (line 705-722 of plan)

```rust
} else if config.provider == "gemini" {
    // ...
    serde_json::json!({
        "contents": contents,
        "generationConfig": {
            "maxOutputTokens": input.max_tokens.unwrap_or(4096),
        }
    })
}
```

For the Gemini streaming endpoint, the streaming is controlled by the URL endpoint (`:streamGenerateContent`), not a body parameter. This is actually correct for Gemini. However, the non-streaming Gemini endpoint should use `:generateContent` instead. The current code always uses `:streamGenerateContent` even when `input.stream` is `false`, which will always return a streaming response.

**Fix:** In `build_endpoint_and_headers` or the calling code, select the appropriate Gemini endpoint based on `input.stream`:
- `true` -> `:streamGenerateContent`
- `false` -> `:generateContent`

### M5. Anthropic system message handling discards structured system content

**Location:** Task 2, `build_chat_body` for Anthropic (line 681-704 of plan)

```rust
if msg.role == "system" {
    system_msg = msg.content.as_str().unwrap_or("").to_string();
}
```

The `content` field of `ChatMessageInput` is `serde_json::Value`. If the system message content is an array (content parts with images), `as_str()` returns `None` and the system message is silently dropped. The plan's TypeScript side always sends system messages as plain text strings, so this may not be a practical issue, but it is a fragile assumption.

**Fix:** Add a comment documenting that system messages must be plain text strings, or handle the array case by extracting text parts.

### M6. `get_model_config` function takes `State` but could be called from non-command context

**Location:** Task 2, `get_model_config` function (line 585-596 of plan)

```rust
async fn get_model_config(
    pool: &State<'_, SqlitePool>,
    id: &str,
) -> Result<ModelConfig, String> {
```

The `State` type is a Tauri extractor that can only be used within command handlers. If this function is ever needed from a non-command context (e.g., a background task), it will not work. This is fine for the current plan scope but limits extensibility.

### M7. Model config edit creates new ID -- store references become stale

**Related to H4.** The `defaultTextModel` and `defaultVisionModel` in `modelStore` hold `ModelConfig` objects. When an edit happens (delete + recreate), the store calls `setConfigs(result as ModelConfig[])` to reload from the database, which updates `configs` and re-derives defaults. However, between the delete and the reload, there is a window where the defaults point to the now-deleted config. If any component reads defaults during this window, it gets stale data.

### M8. `ResponseParser.extractJSONFromMarkdown` uses greedy brace matching that may capture wrong content

**Location:** Task 6, `extractJSONFromMarkdown` (line 1411-1437 of plan)

```typescript
const braceStart = text.indexOf("{");
const braceEnd = text.lastIndexOf("}");
```

If the AI response contains multiple JSON-like objects or curly braces in explanatory text (e.g., "I added a `transition: all 0.3s` property"), the greedy matching could capture a very large span or the wrong content. The code then validates that `parsed.type === "generate" || "modify"`, which helps, but could still parse incorrectly if the outer braces happen to contain a valid-looking object.

**Fix:** This is an acceptable trade-off for a fallback parser. Consider adding a max-length check on the extracted substring.

### M9. `PrototypeRenderer.buildPrototypeIframeSrc` uses `btoa` with Unicode workaround

**Location:** Task 14, `buildPrototypeIframeSrc` (line 3904-3906 of plan)

```typescript
const encoded = btoa(unescape(encodeURIComponent(fullHTML)));
```

The `unescape` function is deprecated. While it still works in all browsers, it will produce a linting warning in strict TypeScript configurations.

**Fix:** Use a modern alternative:
```typescript
const encoded = Buffer.from(fullHTML, 'utf-8').toString('base64');
// Or in browser context:
const encoded = btoa(new TextEncoder().encode(fullHTML).reduce((s, b) => s + String.fromCharCode(b), ''));
```

Or simply suppress the deprecation warning with a comment.

---

## LOW / Informational Issues

### L1. Provider presets include model names that may be outdated

The presets list `gpt-4-turbo` (deprecated in favor of `gpt-4o`), `gemini-1.5-pro` (likely superseded by Gemini 2.x models by 2026), and `claude-3-5-haiku-20241022` (likely superseded). The presets are used as suggestions in a datalist, so this is cosmetic, not functional.

### L2. No `ai_abort_request` command implementation

The file structure mentions `ai_abort_request` in the comment on line 36, but no task implements it. The `cancel` function in `useStreamingChat` only clears the frontend state -- it does not abort the in-flight Rust HTTP request. This means cancelled requests continue consuming API tokens and bandwidth.

### L3. No error retry logic for transient network failures

If the SSE stream disconnects mid-response, the user sees a partial message and must re-send the entire prompt. There is no automatic retry for transient failures.

### L4. The `providers/` subdirectory in the file structure is never created

The file structure lists `src/components/ai/providers/` with `BaseProvider.ts`, `OpenAIProvider.ts`, `AnthropicProvider.ts`, and `GeminiProvider.ts`, but no task creates these files. All provider logic is in the Rust backend instead. These files are listed in the file structure but have no corresponding implementation tasks.

---

## Cross-Cutting Concerns

### Security

| Concern | Status |
|---------|--------|
| API keys stored in SQLite `model_configs` table | Acceptable for desktop app, but keys are stored in plaintext. Consider OS keychain integration in Plan 4. |
| API key exposed in Gemini URL (C4) | **Must fix** -- use header-based auth |
| API keys transmitted to Rust backend via IPC | Acceptable -- Tauri IPC is local |
| Chat history on disk contains user messages | Acceptable for desktop app |

### Continuity with Plan 1 and Plan 2

| Dependency | Status |
|-----------|--------|
| `useUiStore` from Plan 1, extended in Plan 2 | Plan 3 adds `"settings"` to `ViewType` -- requires Plan 2's version as base |
| `canvasStore` from Plan 2 | Imported in `useStreamingChat` -- hard dependency |
| `ModelConfig` type from Plan 1 | Used consistently |
| `AuthMode`, `ModelType` types from Plan 1 | Used consistently |
| Tauri IPC command registration pattern from Plan 1 | Followed correctly |
| i18n keys from Plans 1 and 2 | Must merge carefully (see M1) |

### Test Validity

Several tests will fail due to i18n mismatches (M2). The `useStreamingChat` tests mock Tauri APIs but do not set up `canvasStore`, which will cause errors if `useCanvasStore` is imported at module level.

---

## Recommended Priority for Fixes

1. **C4** (Gemini API key in URL) -- Security risk
2. **C2** (Anthropic SSE parsing) -- Functional correctness
3. **H2** (Gemini SSE format) -- Functional correctness
4. **C1** (canvasStore dependency) -- Build/runtime correctness
5. **H1** (ViewType extension) -- Build correctness
6. **H6** (MenuBar settings button) -- Functional correctness
7. **M2** (Test placeholder text) -- Test correctness
8. **H4/H5** (Model edit approach and streaming state machine) -- Robustness
9. **C3** (Anthropic version header) -- Compatibility
10. Remaining items -- Code quality and robustness
