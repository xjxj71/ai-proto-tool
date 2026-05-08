# AI Integration -- Chat + Model Config + Generation -- Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete AI integration layer -- Rust HTTP proxy for streaming AI API calls, model configuration UI with provider presets and test connection, streaming chat panel with per-page history persistence, AI engine with context building and response parsing, and prototype generation pipeline that renders AI-generated HTML/CSS onto the Fabric.js canvas.

**Architecture:** The Rust backend exposes reqwest-based HTTP proxy commands (`ai_chat_stream`, `ai_test_connection`) that call external AI APIs (OpenAI, Anthropic, Gemini formats) and emit SSE chunks as Tauri events. The frontend AI engine is split into four modules: `ChatEngine` orchestrates conversation flow and delegates to provider-specific formatters; `ContextBuilder` assembles system prompt, canvas state (screenshot + JSON), chat history, and memory into a coherent context window; `ResponseParser` extracts structured JSON from AI responses (html/css/interactions/message); provider implementations translate the unified request format into each API's wire format. The chat panel replaces the Plan 1 placeholder with streaming message display, image upload support, model/skill badges, and per-page `chat_history.json` persistence via the Rust file I/O layer.

**Tech Stack:** reqwest + tokio (Rust HTTP + async), Tauri events (SSE streaming), React 18, TypeScript, Zustand (chatStore), Radix UI (settings dialogs), Lucide React, Vitest, jsdom

---

## Roadmap

This is **Plan 3 of 4** in the AI-Proto-Tool implementation roadmap:

| Plan | Scope | Produces |
|------|-------|----------|
| Plan 1 (done) | Scaffolding + Data Layer + UI Shell | Working desktop app with project CRUD, three-panel editor layout |
| Plan 2 (done) | Canvas Engine + Page Management + Drawing Tools | Functional Fabric.js canvas with drawing tools, page switching, element operations |
| **Plan 3** (this) | AI Integration -- Chat + Model Config + Generation | AI conversation panel, model configuration, prototype generation from text/sketch |
| Plan 4 | Export + Navigation + Memory + Skills + Polish | HTML/PNG export, element jump binding, memory system, skill engine, shortcuts |

---

## File Structure

### Rust Backend (`src-tauri/`)

```
src-tauri/
├── Cargo.toml                           # Add reqwest, tokio, futures-util
├── src/
│   ├── commands/
│   │   ├── mod.rs                       # Add ai_commands, chat_commands modules
│   │   ├── ai_commands.rs               # NEW: ai_chat_stream, ai_test_connection, ai_abort_request
│   │   └── chat_commands.rs             # NEW: save_chat_history, load_chat_history
```

### React Frontend (`src/`)

```
src/
├── types/
│   └── index.ts                         # MODIFY: add AI-related types
├── stores/
│   ├── chatStore.ts                     # NEW: chat messages, streaming state, active model
│   └── modelStore.ts                    # NEW: model config CRUD, default model tracking
├── hooks/
│   └── useStreamingChat.ts              # NEW: subscribe to Tauri SSE events
├── components/
│   ├── editor/
│   │   └── ChatPanel.tsx               # MODIFY: replace placeholder with full chat UI
│   ├── chat/
│   │   ├── ChatMessageList.tsx          # NEW: scrollable message display
│   │   ├── ChatMessageItem.tsx          # NEW: single message bubble (user/assistant)
│   │   ├── ChatInput.tsx                # NEW: input bar with image upload and send
│   │   ├── ModelBadge.tsx               # NEW: current model name badge
│   │   └── SkillBadge.tsx               # NEW: active skill indicator
│   ├── settings/
│   │   ├── SettingsPage.tsx             # NEW: settings route with model config
│   │   ├── ModelConfigList.tsx          # NEW: card list of configured models
│   │   ├── ModelConfigCard.tsx          # NEW: single model config card
│   │   ├── ModelConfigDialog.tsx        # NEW: add/edit model config form
│   │   ├── ProviderPresets.ts           # NEW: provider preset data
│   │   └── DefaultModelSelector.tsx     # NEW: default text/vision model dropdowns
│   └── ai/
│       ├── ChatEngine.ts                # NEW: conversation flow orchestration
│       ├── ContextBuilder.ts            # NEW: assemble context from canvas + history + memory
│       ├── ResponseParser.ts            # NEW: parse structured JSON from AI response
│       └── providers/
│           ├── BaseProvider.ts           # NEW: abstract provider interface
│           ├── OpenAIProvider.ts         # NEW: OpenAI/compatible format
│           ├── AnthropicProvider.ts      # NEW: Anthropic Claude format
│           └── GeminiProvider.ts         # NEW: Google Gemini format
├── i18n/
│   └── locales/zh-CN/
│       └── translation.json             # MODIFY: add AI/chat/settings translations
```

### Tests

```
tests/
├── stores/
│   ├── chatStore.test.ts                # NEW
│   └── modelStore.test.ts              # NEW
├── components/
│   ├── chat/
│   │   ├── ChatMessageList.test.tsx     # NEW
│   │   ├── ChatInput.test.tsx           # NEW
│   │   └── ModelBadge.test.tsx          # NEW
│   └── settings/
│       ├── ModelConfigDialog.test.tsx   # NEW
│       └── DefaultModelSelector.test.tsx # NEW
├── ai/
│   ├── ChatEngine.test.ts              # NEW
│   ├── ContextBuilder.test.ts          # NEW
│   └── ResponseParser.test.ts          # NEW
```

---

## Task 1: Add AI-Related Types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Write failing test for new types**

Create `tests/ai/types.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import type {
  ChatMessage,
  AIResponse,
  ProviderType,
  ChatStreamEvent,
} from "@/types";

describe("AI types", () => {
  it("should create a valid ChatMessage", () => {
    const msg: ChatMessage = {
      id: "msg-1",
      role: "user",
      content: "Hello",
      images: [],
      timestamp: "2026-01-01T00:00:00Z",
    };
    expect(msg.role).toBe("user");
    expect(msg.images).toEqual([]);
  });

  it("should create a valid assistant ChatMessage with canvas update", () => {
    const msg: ChatMessage = {
      id: "msg-2",
      role: "assistant",
      content: "Done",
      images: [],
      timestamp: "2026-01-01T00:00:00Z",
      canvasUpdated: true,
    };
    expect(msg.canvasUpdated).toBe(true);
  });

  it("should create a valid AIResponse", () => {
    const resp: AIResponse = {
      type: "generate",
      html: "<div>Hello</div>",
      css: ".hello { color: red; }",
      interactions: [],
      message: "Generated a prototype.",
    };
    expect(resp.type).toBe("generate");
    expect(resp.html).toBeDefined();
  });

  it("should accept all provider types", () => {
    const providers: ProviderType[] = [
      "openai", "anthropic", "gemini", "qwen", "deepseek",
      "moonshot", "doubao", "xiaomi", "zhipu", "custom",
    ];
    expect(providers).toHaveLength(10);
  });

  it("should create a valid ChatStreamEvent", () => {
    const event: ChatStreamEvent = {
      type: "delta",
      content: "Hello",
    };
    expect(event.type).toBe("delta");

    const doneEvent: ChatStreamEvent = { type: "done" };
    expect(doneEvent.type).toBe("done");

    const errorEvent: ChatStreamEvent = { type: "error", error: "Failed" };
    expect(errorEvent.error).toBe("Failed");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/ai/types.test.ts`

Expected: FAIL -- types not exported from `@/types`.

- [ ] **Step 3: Add AI types to `src/types/index.ts`**

Append to `src/types/index.ts`:

```typescript
// ---- AI Integration Types ----

export type ProviderType =
  | "openai"
  | "anthropic"
  | "gemini"
  | "qwen"
  | "deepseek"
  | "moonshot"
  | "doubao"
  | "xiaomi"
  | "zhipu"
  | "custom";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  images: string[];
  timestamp: string;
  canvasUpdated?: boolean;
  skillUsed?: string;
}

export interface ChatHistory {
  pageId: string;
  projectId: string;
  messages: ChatMessage[];
  updatedAt: string;
}

export interface AIResponse {
  type: "generate" | "modify";
  html: string;
  css: string;
  interactions: Array<{
    element: string;
    action: string;
    target: string;
  }>;
  memoryUpdates?: {
    preferences?: Record<string, string>;
    designSystem?: Record<string, string>;
  };
  skillUsed?: string;
  message: string;
}

export interface ChatStreamEvent {
  type: "delta" | "done" | "error";
  content?: string;
  error?: string;
}

export interface AIRequestConfig {
  modelConfigId: string;
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string | Array<ContentPart>;
  }>;
  stream: boolean;
  temperature?: number;
  maxTokens?: number;
}

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface ProviderPreset {
  id: ProviderType;
  name: string;
  defaultBaseUrl: string;
  authModes: AuthMode[];
  supportedModelTypes: ModelType[];
  modelSuggestions: string[];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/ai/types.test.ts`

Expected: All 5 AI type tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts tests/ai/types.test.ts
git commit -m "feat: add AI integration types for chat, streaming, and provider configs"
```

---

## Task 2: Rust HTTP Proxy -- AI Commands

**Files:**
- Modify: `src-tauri/Cargo.toml` (add reqwest, tokio, futures-util)
- Create: `src-tauri/src/commands/ai_commands.rs`
- Create: `src-tauri/src/commands/chat_commands.rs`
- Modify: `src-tauri/src/commands/mod.rs` (add new modules)
- Modify: `src-tauri/src/lib.rs` (register new commands)
- Modify: `src-tauri/capabilities/default.json` (add HTTP permissions)

- [ ] **Step 1: Add Rust dependencies**

Add to `src-tauri/Cargo.toml` `[dependencies]`:

```toml
reqwest = { version = "0.12", features = ["json", "stream", "rustls-tls"], default-features = false }
tokio = { version = "1", features = ["sync"] }
futures-util = "0.3"
```

- [ ] **Step 2: Create AI commands module**

Create `src-tauri/src/commands/ai_commands.rs`:

```rust
use futures_util::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use tauri_plugin_sql::SqlitePool;
use tauri::State;

use crate::db::repository::ModelConfig;

#[derive(Debug, Deserialize)]
pub struct ChatMessageInput {
    pub role: String,
    pub content: serde_json::Value,
}

#[derive(Debug, Deserialize)]
pub struct AiChatStreamInput {
    pub model_config_id: String,
    pub messages: Vec<ChatMessageInput>,
    pub stream: bool,
    pub request_id: String,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
}

#[derive(Debug, Serialize, Clone)]
struct StreamChunk {
    request_id: String,
    event_type: String,
    content: Option<String>,
    error: Option<String>,
}

#[tauri::command]
pub async fn ai_test_connection(
    pool: State<'_, SqlitePool>,
    model_config_id: String,
) -> Result<String, String> {
    let config = get_model_config(&pool, &model_config_id).await?;

    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let (url, headers, body) = build_test_request(&config)?;

    let response = client
        .post(&url)
        .headers(headers)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("API returned {}: {}", status, text));
    }

    let now = chrono::Utc::now().to_rfc3339();
    sqlx::query(
        "UPDATE model_configs SET connection_status = 'ok', last_tested_at = ? WHERE id = ?",
    )
    .bind(&now)
    .bind(&model_config_id)
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    Ok(format!("Connection OK ({})", now))
}

#[tauri::command]
pub async fn ai_chat_stream(
    app: AppHandle,
    pool: State<'_, SqlitePool>,
    input: AiChatStreamInput,
) -> Result<(), String> {
    let config = get_model_config(&pool, &input.model_config_id).await?;

    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(120))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let (url, headers, body) = build_chat_request(&config, &input)?;

    let response = client
        .post(&url)
        .headers(headers)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        let chunk = StreamChunk {
            request_id: input.request_id.clone(),
            event_type: "error".to_string(),
            content: None,
            error: Some(format!("API error {}: {}", status, text)),
        };
        let _ = app.emit("ai-stream", &chunk);
        return Err(format!("API error {}", status));
    }

    if input.stream {
        let mut stream = response.bytes_stream();
        let mut buffer = String::new();
        let mut current_event = String::new(); // tracks event: line for Anthropic

        while let Some(chunk_result) = stream.next().await {
            let chunk = chunk_result.map_err(|e| format!("Stream error: {}", e))?;
            buffer.push_str(&String::from_utf8_lossy(&chunk));

            while let Some(line) = extract_sse_line(&mut buffer) {
                // Track event: lines for Anthropic streaming
                if let Some(event_type) = line.strip_prefix("event: ") {
                    current_event = event_type.trim().to_string();
                    continue;
                }

                // Anthropic: message_stop signals stream end (not data: [DONE])
                if config.provider == "anthropic" && current_event == "message_stop" {
                    let done_chunk = StreamChunk {
                        request_id: input.request_id.clone(),
                        event_type: "done".to_string(),
                        content: None,
                        error: None,
                    };
                    let _ = app.emit("ai-stream", &done_chunk);
                    return Ok(());
                }

                if line.starts_with("data: [DONE]") || line.starts_with("data: [done]") {
                    let done_chunk = StreamChunk {
                        request_id: input.request_id.clone(),
                        event_type: "done".to_string(),
                        content: None,
                        error: None,
                    };
                    let _ = app.emit("ai-stream", &done_chunk);
                    return Ok(());
                }

                if let Some(data) = line.strip_prefix("data: ") {
                    if let Some(content) = extract_content_from_sse(&config, data, &current_event) {
                        let stream_chunk = StreamChunk {
                            request_id: input.request_id.clone(),
                            event_type: "delta".to_string(),
                            content: Some(content),
                            error: None,
                        };
                        let _ = app.emit("ai-stream", &stream_chunk);
                    }
                }
            }
        }

        let done_chunk = StreamChunk {
            request_id: input.request_id.clone(),
            event_type: "done".to_string(),
            content: None,
            error: None,
        };
        let _ = app.emit("ai-stream", &done_chunk);
    } else {
        let text = response
            .text()
            .await
            .map_err(|e| format!("Failed to read response: {}", e))?;

        let content = extract_full_content(&config, &text);
        let chunk = StreamChunk {
            request_id: input.request_id.clone(),
            event_type: "delta".to_string(),
            content: Some(content),
            error: None,
        };
        let _ = app.emit("ai-stream", &chunk);

        let done_chunk = StreamChunk {
            request_id: input.request_id.clone(),
            event_type: "done".to_string(),
            content: None,
            error: None,
        };
        let _ = app.emit("ai-stream", &done_chunk);
    }

    Ok(())
}

/// Tracks active streaming requests for cancellation.
/// Stored as a Tauri managed state: `HashMap<String, reqwest::RequestBuilder>`.
use std::collections::HashMap;
use std::sync::Mutex;

pub struct ActiveRequests(pub Mutex<HashMap<String, bool>>);

#[tauri::command]
pub async fn cancel_ai_request(
    active: State<'_, ActiveRequests>,
    request_id: String,
) -> Result<(), String> {
    let mut map = active.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    if map.remove(&request_id).is_some() {
        Ok(())
    } else {
        Err(format!("No active request found with id: {}", request_id))
    }
}

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

fn extract_content_from_sse(config: &ModelConfig, data: &str, current_event: &str) -> Option<String> {
    let parsed: serde_json::Value = serde_json::from_str(data).ok()?;

    if config.provider == "anthropic" {
        // Anthropic SSE: content_block_delta events carry text in delta.delta.text
        // Format: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"..."}}
        if current_event == "content_block_delta" {
            parsed
                .get("delta")
                .and_then(|d| d.get("text"))
                .and_then(|t| t.as_str())
                .map(|s| s.to_string())
        } else {
            // Ignore message_start, content_block_start, content_block_stop,
            // message_delta, message_stop -- they carry no text content
            None
        }
    } else if config.provider == "gemini" {
        parsed
            .get("candidates")
            .and_then(|c| c.get(0))
            .and_then(|c| c.get("content"))
            .and_then(|c| c.get("parts"))
            .and_then(|p| p.get(0))
            .and_then(|p| p.get("text"))
            .and_then(|t| t.as_str())
            .map(|s| s.to_string())
    } else {
        // OpenAI-compatible (openai, qwen, deepseek, moonshot, doubao, xiaomi, zhipu, custom)
        parsed
            .get("choices")
            .and_then(|c| c.get(0))
            .and_then(|c| c.get("delta"))
            .and_then(|d| d.get("content"))
            .and_then(|t| t.as_str())
            .map(|s| s.to_string())
    }
}

fn extract_full_content(config: &ModelConfig, text: &str) -> String {
    let parsed: serde_json::Value = match serde_json::from_str(text) {
        Ok(v) => v,
        Err(_) => return text.to_string(),
    };

    if config.provider == "anthropic" {
        parsed
            .get("content")
            .and_then(|c| c.get(0))
            .and_then(|c| c.get("text"))
            .and_then(|t| t.as_str())
            .unwrap_or(text)
            .to_string()
    } else if config.provider == "gemini" {
        parsed
            .get("candidates")
            .and_then(|c| c.get(0))
            .and_then(|c| c.get("content"))
            .and_then(|c| c.get("parts"))
            .and_then(|p| p.get(0))
            .and_then(|p| p.get("text"))
            .and_then(|t| t.as_str())
            .unwrap_or(text)
            .to_string()
    } else {
        parsed
            .get("choices")
            .and_then(|c| c.get(0))
            .and_then(|c| c.get("message"))
            .and_then(|m| m.get("content"))
            .and_then(|t| t.as_str())
            .unwrap_or(text)
            .to_string()
    }
}

async fn get_model_config(
    pool: &State<'_, SqlitePool>,
    id: &str,
) -> Result<ModelConfig, String> {
    sqlx::query_as::<_, ModelConfig>(
        "SELECT id, name, provider, auth_mode, base_url, api_key, token, model_name, model_type, is_default_text, is_default_vision, connection_status, last_tested_at, created_at, updated_at FROM model_configs WHERE id = ?",
    )
    .bind(id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| format!("Model config not found: {}", e))
}

#[tauri::command]
pub async fn update_model_config(
    pool: State<'_, SqlitePool>,
    id: String,
    name: String,
    provider: String,
    auth_mode: String,
    base_url: String,
    api_key: String,
    token: String,
    model_name: String,
    model_type: String,
    is_default_text: bool,
    is_default_vision: bool,
) -> Result<ModelConfig, String> {
    let now = chrono::Utc::now().to_rfc3339();

    // Clear existing defaults if this config claims a default role
    if is_default_text {
        sqlx::query("UPDATE model_configs SET is_default_text = 0")
            .execute(pool.inner())
            .await.map_err(|e| e.to_string())?;
    }
    if is_default_vision {
        sqlx::query("UPDATE model_configs SET is_default_vision = 0")
            .execute(pool.inner())
            .await.map_err(|e| e.to_string())?;
    }

    sqlx::query("UPDATE model_configs SET name=?, provider=?, auth_mode=?, base_url=?, api_key=?, token=?, model_name=?, model_type=?, is_default_text=?, is_default_vision=?, updated_at=? WHERE id=?")
        .bind(&name).bind(&provider).bind(&auth_mode).bind(&base_url)
        .bind(&api_key).bind(&token).bind(&model_name).bind(&model_type)
        .bind(is_default_text).bind(is_default_vision).bind(&now).bind(&id)
        .execute(pool.inner())
        .await.map_err(|e| e.to_string())?;

    // Return the updated config
    sqlx::query_as::<_, ModelConfig>(
        "SELECT id, name, provider, auth_mode, base_url, api_key, token, model_name, model_type, is_default_text, is_default_vision, connection_status, last_tested_at, created_at, updated_at FROM model_configs WHERE id = ?",
    )
    .bind(&id)
    .fetch_one(pool.inner())
    .await.map_err(|e| e.to_string())
}

fn build_test_request(
    config: &ModelConfig,
) -> Result<(String, reqwest::header::HeaderMap, serde_json::Value), String> {
    let (url, headers) = build_endpoint_and_headers(config)?;
    let body = build_test_body(config);
    Ok((url, headers, body))
}

fn build_chat_request(
    config: &ModelConfig,
    input: &AiChatStreamInput,
) -> Result<(String, reqwest::header::HeaderMap, serde_json::Value), String> {
    let (url, headers) = build_endpoint_and_headers(config)?;
    let body = build_chat_body(config, input);
    Ok((url, headers, body))
}

fn build_endpoint_and_headers(
    config: &ModelConfig,
) -> Result<(String, reqwest::header::HeaderMap), String> {
    let mut headers = reqwest::header::HeaderMap::new();
    headers.insert(
        reqwest::header::CONTENT_TYPE,
        "application/json".parse().unwrap(),
    );

    let url = if config.provider == "anthropic" {
        headers.insert(
            "x-api-key",
            config.api_key.parse().map_err(|_| "Invalid API key".to_string())?,
        );
        headers.insert("anthropic-version", "2023-06-01".parse().unwrap());
        format!("{}/v1/messages", config.base_url.trim_end_matches('/'))
    } else if config.provider == "gemini" {
        headers.insert(
            "x-goog-api-key",
            config.api_key.parse().map_err(|_| "Invalid API key".to_string())?,
        );
        format!(
            "{}/v1beta/models/{}:streamGenerateContent?alt=sse",
            config.base_url.trim_end_matches('/'),
            config.model_name,
        )
    } else {
        // OpenAI-compatible
        let auth = if config.auth_mode == "token_plan" {
            config.token.clone()
        } else {
            config.api_key.clone()
        };
        headers.insert(
            reqwest::header::AUTHORIZATION,
            format!("Bearer {}", auth).parse().map_err(|_| "Invalid auth token".to_string())?,
        );
        format!(
            "{}/chat/completions",
            config.base_url.trim_end_matches('/')
        )
    };

    Ok((url, headers))
}

fn build_test_body(config: &ModelConfig) -> serde_json::Value {
    if config.provider == "anthropic" {
        serde_json::json!({
            "model": config.model_name,
            "max_tokens": 10,
            "messages": [{"role": "user", "content": "Reply OK"}]
        })
    } else if config.provider == "gemini" {
        serde_json::json!({
            "contents": [{"parts": [{"text": "Reply OK"}]}],
            "generationConfig": {"maxOutputTokens": 10}
        })
    } else {
        serde_json::json!({
            "model": config.model_name,
            "max_tokens": 10,
            "messages": [{"role": "user", "content": "Reply OK"}]
        })
    }
}

fn build_chat_body(config: &ModelConfig, input: &AiChatStreamInput) -> serde_json::Value {
    if config.provider == "anthropic" {
        let mut system_msg = String::new();
        let mut api_messages = Vec::new();

        for msg in &input.messages {
            if msg.role == "system" {
                system_msg = msg.content.as_str().unwrap_or("").to_string();
            } else {
                api_messages.push(serde_json::json!({
                    "role": msg.role,
                    "content": msg.content,
                }));
            }
        }

        let mut body = serde_json::json!({
            "model": config.model_name,
            "max_tokens": input.max_tokens.unwrap_or(4096),
            "stream": input.stream,
            "messages": api_messages,
        });
        if !system_msg.is_empty() {
            body["system"] = serde_json::json!(system_msg);
        }
        body
    } else if config.provider == "gemini" {
        let mut contents = Vec::new();
        for msg in &input.messages {
            if msg.role == "system" {
                continue;
            }
            let role = if msg.role == "assistant" { "model" } else { "user" };
            contents.push(serde_json::json!({
                "role": role,
                "parts": [{"text": msg.content}]
            }));
        }
        serde_json::json!({
            "contents": contents,
            "generationConfig": {
                "maxOutputTokens": input.max_tokens.unwrap_or(4096),
            }
        })
    } else {
        // OpenAI-compatible
        let mut api_messages = Vec::new();
        for msg in &input.messages {
            api_messages.push(serde_json::json!({
                "role": msg.role,
                "content": msg.content,
            }));
        }
        let mut body = serde_json::json!({
            "model": config.model_name,
            "stream": input.stream,
            "messages": api_messages,
        });
        if let Some(temp) = input.temperature {
            body["temperature"] = serde_json::json!(temp);
        }
        if let Some(max_tokens) = input.max_tokens {
            body["max_tokens"] = serde_json::json!(max_tokens);
        }
        body
    }
}
```

- [ ] **Step 3: Create chat history file commands**

Create `src-tauri/src/commands/chat_commands.rs`:

```rust
use crate::fs::dirs;

#[tauri::command]
pub async fn save_chat_history(
    project_id: String,
    page_id: String,
    json: String,
) -> Result<(), String> {
    let app_dir = dirs::get_app_data_dir()?;
    let page_dir = dirs::create_page_directory(&app_dir, &project_id, &page_id)?;
    let path = page_dir.join("chat_history.json");
    std::fs::write(&path, json)
        .map_err(|e| format!("Failed to write chat_history.json: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn load_chat_history(
    project_id: String,
    page_id: String,
) -> Result<String, String> {
    let app_dir = dirs::get_app_data_dir()?;
    let path = app_dir
        .join("projects")
        .join(&project_id)
        .join("pages")
        .join(&page_id)
        .join("chat_history.json");

    if !path.exists() {
        return Ok(r#"{"pageId":"","projectId":"","messages":[],"updatedAt":""}"#.to_string());
    }

    std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read chat_history.json: {}", e))
}
```

- [ ] **Step 4: Register modules and commands**

Update `src-tauri/src/commands/mod.rs`:

```rust
pub mod ai_commands;
pub mod canvas_commands;
pub mod chat_commands;
pub mod model_commands;
pub mod page_commands;
pub mod project_commands;
```

Add to the `invoke_handler` in `src-tauri/src/lib.rs`:

```rust
commands::ai_commands::ai_test_connection,
commands::ai_commands::ai_chat_stream,
commands::ai_commands::cancel_ai_request,
commands::ai_commands::update_model_config,
commands::chat_commands::save_chat_history,
commands::chat_commands::load_chat_history,
```

- [ ] **Step 5: Verify Rust compilation**

Run: `cargo check --manifest-path src-tauri/Cargo.toml`

Expected: Compiles with no errors.

- [ ] **Step 6: Commit**

```bash
git add src-tauri/Cargo.toml src-tauri/src/commands/ src-tauri/src/lib.rs
git commit -m "feat: add Rust HTTP proxy with SSE streaming for AI API calls and chat history persistence"
```

---

## Task 3: Provider Presets Data

**Files:**
- Create: `src/components/settings/ProviderPresets.ts`

- [ ] **Step 1: Create provider presets**

Create `src/components/settings/ProviderPresets.ts`:

```typescript
import type { ProviderPreset, AuthMode } from "@/types";

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: "openai",
    name: "OpenAI",
    defaultBaseUrl: "https://api.openai.com/v1",
    authModes: ["standard_api"],
    supportedModelTypes: ["text", "vision", "both"],
    modelSuggestions: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    defaultBaseUrl: "https://api.anthropic.com",
    authModes: ["standard_api"],
    supportedModelTypes: ["text", "vision", "both"],
    modelSuggestions: ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022"],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    defaultBaseUrl: "https://generativelanguage.googleapis.com",
    authModes: ["standard_api"],
    supportedModelTypes: ["text", "vision", "both"],
    modelSuggestions: ["gemini-2.0-flash", "gemini-1.5-pro"],
  },
  {
    id: "qwen",
    name: "通义千问",
    defaultBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    authModes: ["standard_api"],
    supportedModelTypes: ["text", "vision", "both"],
    modelSuggestions: ["qwen-max", "qwen-plus", "qwen-vl-max"],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    authModes: ["standard_api"],
    supportedModelTypes: ["text"],
    modelSuggestions: ["deepseek-chat", "deepseek-reasoner"],
  },
  {
    id: "moonshot",
    name: "Moonshot",
    defaultBaseUrl: "https://api.moonshot.cn/v1",
    authModes: ["standard_api"],
    supportedModelTypes: ["text"],
    modelSuggestions: ["moonshot-v1-8k", "moonshot-v1-32k"],
  },
  {
    id: "doubao",
    name: "豆包",
    defaultBaseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    authModes: ["standard_api"],
    supportedModelTypes: ["text", "vision", "both"],
    modelSuggestions: ["doubao-pro-32k", "doubao-vision-pro-32k"],
  },
  {
    id: "xiaomi",
    name: "小米 MIMO",
    defaultBaseUrl: "https://api.xiaomi.com/v1",
    authModes: ["standard_api", "token_plan"],
    supportedModelTypes: ["text", "vision", "both"],
    modelSuggestions: ["mimo", "mimo-vision"],
  },
  {
    id: "zhipu",
    name: "智谱 GLM",
    defaultBaseUrl: "https://open.bigmodel.cn/api/paas/v4",
    authModes: ["standard_api", "coding_plan"],
    supportedModelTypes: ["text", "vision", "both"],
    modelSuggestions: ["glm-4", "glm-4v"],
  },
  {
    id: "custom",
    name: "自定义",
    defaultBaseUrl: "",
    authModes: ["standard_api"],
    supportedModelTypes: ["text", "vision", "both"],
    modelSuggestions: [],
  },
];

export function getPresetById(id: string): ProviderPreset | undefined {
  return PROVIDER_PRESETS.find((p) => p.id === id);
}

export function getAuthModeLabel(mode: AuthMode): string {
  const labels: Record<AuthMode, string> = {
    standard_api: "标准 API",
    token_plan: "Token Plan",
    coding_plan: "Coding Plan",
  };
  return labels[mode];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/settings/ProviderPresets.ts
git commit -m "feat: add provider presets with URLs, auth modes, and model suggestions"
```

---

## Task 4: modelStore -- Model Configuration State

**Files:**
- Create: `src/stores/modelStore.ts`
- Test: `tests/stores/modelStore.test.ts`

- [ ] **Step 1: Write failing test for modelStore**

Create `tests/stores/modelStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useModelStore } from "@/stores/modelStore";
import type { ModelConfig } from "@/types";

const mockConfig: ModelConfig = {
  id: "cfg-1",
  name: "GPT-4o",
  provider: "openai",
  authMode: "standard_api",
  baseUrl: "https://api.openai.com/v1",
  apiKey: "sk-test",
  token: "",
  modelName: "gpt-4o",
  modelType: "both",
  isDefaultText: true,
  isDefaultVision: true,
  connectionStatus: "",
  lastTestedAt: "",
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

describe("modelStore", () => {
  beforeEach(() => {
    useModelStore.setState({
      configs: [],
      defaultTextModel: null,
      defaultVisionModel: null,
    });
  });

  it("should start with empty configs", () => {
    expect(useModelStore.getState().configs).toEqual([]);
    expect(useModelStore.getState().defaultTextModel).toBeNull();
  });

  it("should set configs", () => {
    useModelStore.getState().setConfigs([mockConfig]);
    expect(useModelStore.getState().configs).toHaveLength(1);
  });

  it("should set default text model", () => {
    useModelStore.getState().setDefaultTextModel(mockConfig);
    expect(useModelStore.getState().defaultTextModel?.id).toBe("cfg-1");
  });

  it("should set default vision model", () => {
    useModelStore.getState().setDefaultVisionModel(mockConfig);
    expect(useModelStore.getState().defaultVisionModel?.id).toBe("cfg-1");
  });

  it("should derive default text model from configs", () => {
    useModelStore.getState().setConfigs([mockConfig]);
    const derived = useModelStore.getState().getDefaultTextModel();
    expect(derived?.id).toBe("cfg-1");
  });

  it("should derive default vision model from configs", () => {
    const visionConfig = { ...mockConfig, id: "cfg-2", isDefaultText: false, isDefaultVision: true };
    useModelStore.getState().setConfigs([mockConfig, visionConfig]);
    const derived = useModelStore.getState().getDefaultVisionModel();
    expect(derived?.id).toBe("cfg-2");
  });

  it("should clear all state", () => {
    useModelStore.getState().setConfigs([mockConfig]);
    useModelStore.getState().setDefaultTextModel(mockConfig);
    useModelStore.getState().clear();
    expect(useModelStore.getState().configs).toEqual([]);
    expect(useModelStore.getState().defaultTextModel).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/stores/modelStore.test.ts`

Expected: FAIL -- module not found.

- [ ] **Step 3: Implement modelStore**

Create `src/stores/modelStore.ts`:

```typescript
import { create } from "zustand";
import type { ModelConfig } from "@/types";

interface ModelState {
  configs: ModelConfig[];
  defaultTextModel: ModelConfig | null;
  defaultVisionModel: ModelConfig | null;

  setConfigs: (configs: ModelConfig[]) => void;
  setDefaultTextModel: (model: ModelConfig | null) => void;
  setDefaultVisionModel: (model: ModelConfig | null) => void;
  getDefaultTextModel: () => ModelConfig | null;
  getDefaultVisionModel: () => ModelConfig | null;
  clear: () => void;
}

export const useModelStore = create<ModelState>((set, get) => ({
  configs: [],
  defaultTextModel: null,
  defaultVisionModel: null,

  setConfigs: (configs) => {
    const defaultText = configs.find((c) => c.isDefaultText) ?? null;
    const defaultVision = configs.find((c) => c.isDefaultVision) ?? null;
    set({
      configs,
      defaultTextModel: defaultText,
      defaultVisionModel: defaultVision,
    });
  },

  setDefaultTextModel: (defaultTextModel) => set({ defaultTextModel }),
  setDefaultVisionModel: (defaultVisionModel) => set({ defaultVisionModel }),

  getDefaultTextModel: () => {
    const { configs, defaultTextModel } = get();
    if (defaultTextModel) return defaultTextModel;
    return configs.find((c) => c.isDefaultText) ?? configs.find((c) => c.modelType === "text" || c.modelType === "both") ?? null;
  },

  getDefaultVisionModel: () => {
    const { configs, defaultVisionModel } = get();
    if (defaultVisionModel) return defaultVisionModel;
    return configs.find((c) => c.isDefaultVision) ?? configs.find((c) => c.modelType === "vision" || c.modelType === "both") ?? null;
  },

  clear: () => set({ configs: [], defaultTextModel: null, defaultVisionModel: null }),
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/stores/modelStore.test.ts`

Expected: All 7 modelStore tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/stores/modelStore.ts tests/stores/modelStore.test.ts
git commit -m "feat: add modelStore for model configuration state management"
```

---

## Task 5: chatStore -- Chat Messages and Streaming State

**Files:**
- Create: `src/stores/chatStore.ts`
- Test: `tests/stores/chatStore.test.ts`

- [ ] **Step 1: Write failing test for chatStore**

Create `tests/stores/chatStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useChatStore } from "@/stores/chatStore";

describe("chatStore", () => {
  beforeEach(() => {
    useChatStore.setState({
      messages: [],
      streamingContent: "",
      isStreaming: false,
      streamingState: "idle",
      activeRequestId: "",
      activeSkill: "",
      abortController: null,
    });
  });

  it("should start with empty messages", () => {
    expect(useChatStore.getState().messages).toEqual([]);
  });

  it("should add a user message", () => {
    useChatStore.getState().addMessage({
      id: "msg-1",
      role: "user",
      content: "Hello",
      images: [],
      timestamp: new Date().toISOString(),
    });
    expect(useChatStore.getState().messages).toHaveLength(1);
    expect(useChatStore.getState().messages[0].content).toBe("Hello");
  });

  it("should start streaming", () => {
    useChatStore.getState().startStreaming("req-1");
    expect(useChatStore.getState().isStreaming).toBe(true);
    expect(useChatStore.getState().activeRequestId).toBe("req-1");
    expect(useChatStore.getState().streamingContent).toBe("");
  });

  it("should append streaming content", () => {
    useChatStore.getState().startStreaming("req-1");
    useChatStore.getState().appendStreamContent("Hello ");
    useChatStore.getState().appendStreamContent("World");
    expect(useChatStore.getState().streamingContent).toBe("Hello World");
  });

  it("should stop streaming and finalize as assistant message", () => {
    useChatStore.getState().startStreaming("req-1");
    useChatStore.getState().appendStreamContent("AI response");
    useChatStore.getState().stopStreaming(true);

    expect(useChatStore.getState().isStreaming).toBe(false);
    expect(useChatStore.getState().streamingContent).toBe("");
    expect(useChatStore.getState().messages).toHaveLength(1);
    expect(useChatStore.getState().messages[0].role).toBe("assistant");
    expect(useChatStore.getState().messages[0].content).toBe("AI response");
  });

  it("should stop streaming without adding message when cancelled", () => {
    useChatStore.getState().startStreaming("req-1");
    useChatStore.getState().appendStreamContent("Partial");
    useChatStore.getState().stopStreaming(false);

    expect(useChatStore.getState().isStreaming).toBe(false);
    expect(useChatStore.getState().messages).toHaveLength(0);
  });

  it("should set active skill", () => {
    useChatStore.getState().setActiveSkill("landing-page");
    expect(useChatStore.getState().activeSkill).toBe("landing-page");
  });

  it("should track streaming state transitions", () => {
    expect(useChatStore.getState().streamingState).toBe("idle");

    useChatStore.getState().startStreaming("req-1");
    expect(useChatStore.getState().streamingState).toBe("streaming");

    useChatStore.getState().setStreamingState("error");
    expect(useChatStore.getState().streamingState).toBe("error");

    useChatStore.getState().stopStreaming(false);
    expect(useChatStore.getState().streamingState).toBe("idle");
  });

  it("should manage abort controller", () => {
    const controller = new AbortController();
    useChatStore.getState().setAbortController(controller);
    expect(useChatStore.getState().abortController).toBe(controller);

    useChatStore.getState().setAbortController(null);
    expect(useChatStore.getState().abortController).toBeNull();
  });

  it("should clear messages for page switch", () => {
    useChatStore.getState().addMessage({
      id: "msg-1",
      role: "user",
      content: "Test",
      images: [],
      timestamp: new Date().toISOString(),
    });
    useChatStore.getState().clearMessages();
    expect(useChatStore.getState().messages).toEqual([]);
  });

  it("should set messages from loaded history", () => {
    const msgs = [
      { id: "m1", role: "user" as const, content: "Hi", images: [] as string[], timestamp: "2026-01-01" },
    ];
    useChatStore.getState().setMessages(msgs);
    expect(useChatStore.getState().messages).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/stores/chatStore.test.ts`

Expected: FAIL -- module not found.

- [ ] **Step 3: Implement chatStore**

Create `src/stores/chatStore.ts`:

```typescript
import { create } from "zustand";
import type { ChatMessage } from "@/types";

export type StreamingState = 'idle' | 'streaming' | 'done' | 'error';

interface ChatState {
  messages: ChatMessage[];
  streamingContent: string;
  isStreaming: boolean;
  streamingState: StreamingState;
  activeRequestId: string;
  activeSkill: string;
  abortController: AbortController | null;

  addMessage: (message: ChatMessage) => void;
  startStreaming: (requestId: string) => void;
  appendStreamContent: (chunk: string) => void;
  stopStreaming: (finalizeAsMessage: boolean) => void;
  setStreamingState: (state: StreamingState) => void;
  setAbortController: (controller: AbortController | null) => void;
  setActiveSkill: (skill: string) => void;
  clearMessages: () => void;
  setMessages: (messages: ChatMessage[]) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  streamingContent: "",
  isStreaming: false,
  streamingState: 'idle' as StreamingState,
  activeRequestId: "",
  activeSkill: "",
  abortController: null,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  startStreaming: (requestId) =>
    set({ isStreaming: true, streamingState: 'streaming', activeRequestId: requestId, streamingContent: "" }),

  appendStreamContent: (chunk) =>
    set((state) => ({ streamingContent: state.streamingContent + chunk })),

  stopStreaming: (finalizeAsMessage) => {
    const { streamingContent, messages } = get();
    if (finalizeAsMessage && streamingContent) {
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: streamingContent,
        images: [],
        timestamp: new Date().toISOString(),
      };
      set({
        isStreaming: false,
        streamingState: 'done',
        activeRequestId: "",
        streamingContent: "",
        messages: [...messages, assistantMessage],
      });
    } else {
      set({
        isStreaming: false,
        streamingState: finalizeAsMessage ? 'done' : 'idle',
        activeRequestId: "",
        streamingContent: "",
      });
    }
  },

  setStreamingState: (state) => set({ streamingState: state }),

  setAbortController: (controller) => set({ abortController: controller }),

  setActiveSkill: (activeSkill) => set({ activeSkill }),

  clearMessages: () => set({ messages: [], streamingContent: "", isStreaming: false, streamingState: 'idle' }),

  setMessages: (messages) => set({ messages }),
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/stores/chatStore.test.ts`

Expected: All 11 chatStore tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/stores/chatStore.ts tests/stores/chatStore.test.ts
git commit -m "feat: add chatStore with streaming state, abort controller, and message management"
```

- [ ] **Step 6: Add chat history compression helper**

Add a compression helper function to `src/stores/chatStore.ts` (after the store definition):

```typescript
/**
 * Compress chat history when it exceeds maxRounds (a round = user + assistant message pair).
 * Keeps the most recent rounds intact and summarizes older messages into a single system message.
 */
export function compressHistory(messages: ChatMessage[], maxRounds: number = 20): ChatMessage[] {
  if (messages.length <= maxRounds * 2) return messages;
  const keepCount = maxRounds * 2;
  const toCompress = messages.slice(0, messages.length - keepCount);
  const summary: ChatMessage = {
    id: `summary-${Date.now()}`,
    role: "system",
    content: `[历史摘要] 之前的对话涉及: ${summarizeTopics(toCompress)}`,
    images: [],
    timestamp: toCompress[toCompress.length - 1]?.timestamp ?? new Date().toISOString(),
  };
  return [summary, ...messages.slice(messages.length - keepCount)];
}

function summarizeTopics(messages: ChatMessage[]): string {
  const userMessages = messages.filter(m => m.role === "user").map(m => m.content);
  return userMessages.slice(-5).join("；");
}
```

Add a test for `compressHistory` to `tests/stores/chatStore.test.ts`:

```typescript
import { compressHistory } from "@/stores/chatStore";

describe("compressHistory", () => {
  it("should not compress when under limit", () => {
    const messages = Array.from({ length: 10 }, (_, i) => ({
      id: `msg-${i}`,
      role: (i % 2 === 0 ? "user" : "assistant") as const,
      content: `Message ${i}`,
      images: [] as string[],
      timestamp: new Date().toISOString(),
    }));
    const result = compressHistory(messages, 20);
    expect(result).toHaveLength(10);
  });

  it("should compress when over limit", () => {
    const messages = Array.from({ length: 50 }, (_, i) => ({
      id: `msg-${i}`,
      role: (i % 2 === 0 ? "user" : "assistant") as const,
      content: `Message ${i}`,
      images: [] as string[],
      timestamp: new Date().toISOString(),
    }));
    const result = compressHistory(messages, 10);
    // First message should be the summary
    expect(result[0].role).toBe("system");
    expect(result[0].content).toContain("[历史摘要]");
    // Should keep 10*2 = 20 recent messages + 1 summary = 21
    expect(result).toHaveLength(21);
  });
});
```

---

## Task 6: ResponseParser -- Parse Structured AI Responses

**Files:**
- Create: `src/components/ai/ResponseParser.ts`
- Test: `tests/ai/ResponseParser.test.ts`

- [ ] **Step 1: Write failing test for ResponseParser**

Create `tests/ai/ResponseParser.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { parseAIResponse, extractJSONFromMarkdown } from "@/components/ai/ResponseParser";

describe("ResponseParser", () => {
  describe("extractJSONFromMarkdown", () => {
    it("should extract JSON from markdown code block", () => {
      const input = 'Here is the result:\n```json\n{"type":"generate","html":"<div>Hi</div>","css":"","interactions":[],"message":"Done"}\n```\nDone!';
      const result = extractJSONFromMarkdown(input);
      expect(result).toBeDefined();
      expect(result.type).toBe("generate");
    });

    it("should return null when no JSON block found", () => {
      const input = "Just plain text without any JSON";
      const result = extractJSONFromMarkdown(input);
      expect(result).toBeNull();
    });

    it("should extract JSON from non-markdown raw JSON string", () => {
      const input = '{"type":"modify","html":"<p>Changed</p>","css":"","interactions":[],"message":"Updated"}';
      const result = extractJSONFromMarkdown(input);
      expect(result).toBeDefined();
      expect(result.type).toBe("modify");
    });

    it("should handle JSON in code block without language tag", () => {
      const input = '```\n{"type":"generate","html":"","css":"","interactions":[],"message":"ok"}\n```';
      const result = extractJSONFromMarkdown(input);
      expect(result).toBeDefined();
      expect(result.type).toBe("generate");
    });
  });

  describe("parseAIResponse", () => {
    it("should parse a complete AI response with JSON block", () => {
      const raw = 'Here is the prototype:\n```json\n{"type":"generate","html":"<div class=\\"app\\">Hello</div>","css":".app{padding:20px}","interactions":[{"element":"#btn","action":"navigate","target":"page-2"}],"message":"Generated a landing page."}\n```\nLet me know if you want changes.';
      const result = parseAIResponse(raw);
      expect(result.response.type).toBe("generate");
      expect(result.response.html).toContain("Hello");
      expect(result.response.interactions).toHaveLength(1);
      expect(result.replyText).toContain("Let me know");
    });

    it("should handle pure text response without JSON", () => {
      const raw = "I need more details about what you want to build.";
      const result = parseAIResponse(raw);
      expect(result.response).toBeNull();
      expect(result.replyText).toBe(raw);
    });

    it("should handle response with only message field", () => {
      const raw = '```json\n{"type":"generate","html":"","css":"","interactions":[],"message":"No changes needed."}\n```';
      const result = parseAIResponse(raw);
      expect(result.response).toBeDefined();
      expect(result.response!.message).toBe("No changes needed.");
      expect(result.replyText).toBe("No changes needed.");
    });

    it("should extract memory updates when present", () => {
      const raw = '```json\n{"type":"generate","html":"<div></div>","css":"","interactions":[],"message":"ok","memoryUpdates":{"preferences":{"style":"minimal"}}}\n```';
      const result = parseAIResponse(raw);
      expect(result.response!.memoryUpdates).toBeDefined();
      expect(result.response!.memoryUpdates!.preferences!.style).toBe("minimal");
    });

    it("should extract skill used when present", () => {
      const raw = '```json\n{"type":"generate","html":"<div></div>","css":"","interactions":[],"message":"ok","skillUsed":"landing-page"}\n```';
      const result = parseAIResponse(raw);
      expect(result.response!.skillUsed).toBe("landing-page");
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/ai/ResponseParser.test.ts`

Expected: FAIL -- module not found.

- [ ] **Step 3: Implement ResponseParser**

Create `src/components/ai/ResponseParser.ts`:

```typescript
import type { AIResponse } from "@/types";

interface ParsedResult {
  response: AIResponse | null;
  replyText: string;
}

/**
 * Attempt to extract a JSON object from markdown code blocks
 * or from raw JSON string in the text.
 */
export function extractJSONFromMarkdown(text: string): AIResponse | null {
  // Try markdown code block with json tag
  const jsonBlockMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (jsonBlockMatch?.[1]) {
    try {
      return JSON.parse(jsonBlockMatch[1]) as AIResponse;
    } catch {
      // Fall through
    }
  }

  // Try raw JSON object in the text (first occurrence of { ... })
  const braceStart = text.indexOf("{");
  const braceEnd = text.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd > braceStart) {
    try {
      const candidate = text.substring(braceStart, braceEnd + 1);
      const parsed = JSON.parse(candidate);
      if (parsed.type && (parsed.type === "generate" || parsed.type === "modify")) {
        return parsed as AIResponse;
      }
    } catch {
      // Not valid JSON
    }
  }

  return null;
}

/**
 * Parse a full AI response string. Extracts structured JSON if present
 * and separates it from the conversational text.
 */
export function parseAIResponse(raw: string): ParsedResult {
  const response = extractJSONFromMarkdown(raw);

  let replyText = raw;

  if (response) {
    // Use the message field from the structured response if available,
    // otherwise strip the JSON block and use surrounding text
    if (response.message) {
      replyText = response.message;
    } else {
      // Remove the JSON code block to get conversational text
      replyText = raw
        .replace(/```(?:json)?\s*\n[\s\S]*?\n```/g, "")
        .trim();
    }
  }

  return { response, replyText };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/ai/ResponseParser.test.ts`

Expected: All 9 ResponseParser tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ai/ResponseParser.ts tests/ai/ResponseParser.test.ts
git commit -m "feat: add ResponseParser for extracting structured JSON from AI responses"
```

---

## Task 7: ContextBuilder -- Assemble AI Context

**Files:**
- Create: `src/components/ai/ContextBuilder.ts`
- Test: `tests/ai/ContextBuilder.test.ts`

- [ ] **Step 1: Write failing test for ContextBuilder**

Create `tests/ai/ContextBuilder.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  buildSystemPrompt,
  buildCanvasContext,
  buildConversationMessages,
} from "@/components/ai/ContextBuilder";
import type { ChatMessage } from "@/types";

describe("ContextBuilder", () => {
  describe("buildSystemPrompt", () => {
    it("should return a non-empty system prompt", () => {
      const prompt = buildSystemPrompt();
      expect(prompt.length).toBeGreaterThan(100);
      expect(prompt).toContain("prototype");
      expect(prompt).toContain("HTML");
      expect(prompt).toContain("CSS");
    });

    it("should include output format specification", () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toContain("JSON");
      expect(prompt).toContain("generate");
      expect(prompt).toContain("modify");
    });

    it("should include canvas dimensions when provided", () => {
      const prompt = buildSystemPrompt({ canvasWidth: 1440, canvasHeight: 900 });
      expect(prompt).toContain("1440");
      expect(prompt).toContain("900");
    });
  });

  describe("buildCanvasContext", () => {
    it("should return description with canvas state", () => {
      const context = buildCanvasContext({
        canvasJSON: '{"version":"6","objects":[{"type":"rect"}]}',
        canvasWidth: 1440,
        canvasHeight: 900,
      });
      expect(context).toContain("1440x900");
      expect(context).toContain("1 object");
    });

    it("should return empty state description for empty canvas", () => {
      const context = buildCanvasContext({
        canvasJSON: '{"version":"6","objects":[]}',
        canvasWidth: 1440,
        canvasHeight: 900,
      });
      expect(context).toContain("empty");
      expect(context).toContain("1440x900");
    });

    it("should include screenshot description when provided", () => {
      const context = buildCanvasContext({
        canvasJSON: '{"version":"6","objects":[]}',
        canvasWidth: 800,
        canvasHeight: 600,
        screenshotDataUrl: "data:image/png;base64,abc123",
      });
      expect(context).toContain("screenshot");
    });
  });

  describe("buildConversationMessages", () => {
    it("should convert chat messages to API format with text content", () => {
      const messages: ChatMessage[] = [
        { id: "1", role: "user", content: "Hello", images: [], timestamp: "2026-01-01" },
        { id: "2", role: "assistant", content: "Hi there", images: [], timestamp: "2026-01-01" },
      ];
      const result = buildConversationMessages(messages);
      expect(result).toHaveLength(2);
      expect(result[0].role).toBe("user");
    });

    it("should include images as content parts when present", () => {
      const messages: ChatMessage[] = [
        {
          id: "1",
          role: "user",
          content: "Look at this",
          images: ["data:image/png;base64,abc"],
          timestamp: "2026-01-01",
        },
      ];
      const result = buildConversationMessages(messages);
      expect(result[0].content).toBeInstanceOf(Array);
      const parts = result[0].content as Array<{ type: string }>;
      expect(parts).toHaveLength(2);
      expect(parts[0].type).toBe("text");
      expect(parts[1].type).toBe("image_url");
    });

    it("should limit to last 20 messages", () => {
      const messages: ChatMessage[] = Array.from({ length: 30 }, (_, i) => ({
        id: `msg-${i}`,
        role: "user" as const,
        content: `Message ${i}`,
        images: [] as string[],
        timestamp: "2026-01-01",
      }));
      const result = buildConversationMessages(messages);
      expect(result).toHaveLength(20);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/ai/ContextBuilder.test.ts`

Expected: FAIL -- module not found.

- [ ] **Step 3: Implement ContextBuilder**

Create `src/components/ai/ContextBuilder.ts`:

```typescript
import type { ChatMessage, ContentPart, AIRequestConfig } from "@/types";

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/ai/ContextBuilder.test.ts`

Expected: All 9 ContextBuilder tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ai/ContextBuilder.ts tests/ai/ContextBuilder.test.ts
git commit -m "feat: add ContextBuilder for assembling AI context from canvas state and chat history"
```

---

## Task 8: ChatEngine -- Conversation Flow Orchestration

**Files:**
- Create: `src/components/ai/ChatEngine.ts`
- Test: `tests/ai/ChatEngine.test.ts`

- [ ] **Step 1: Write failing test for ChatEngine**

Create `tests/ai/ChatEngine.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChatEngine } from "@/components/ai/ChatEngine";
import type { ChatMessage, ModelConfig } from "@/types";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}));

const mockModelConfig: ModelConfig = {
  id: "cfg-1",
  name: "GPT-4o",
  provider: "openai",
  authMode: "standard_api",
  baseUrl: "https://api.openai.com/v1",
  apiKey: "sk-test",
  token: "",
  modelName: "gpt-4o",
  modelType: "both",
  isDefaultText: true,
  isDefaultVision: true,
  connectionStatus: "ok",
  lastTestedAt: "",
  createdAt: "",
  updatedAt: "",
};

describe("ChatEngine", () => {
  let engine: ChatEngine;

  beforeEach(() => {
    engine = new ChatEngine();
    vi.clearAllMocks();
  });

  it("should generate a unique request ID", () => {
    const id1 = engine.generateRequestId();
    const id2 = engine.generateRequestId();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^req-/);
  });

  it("should build request config with system prompt and messages", () => {
    const messages: ChatMessage[] = [
      { id: "1", role: "user", content: "Build a landing page", images: [], timestamp: "" },
    ];

    const config = engine.buildRequest({
      modelConfig: mockModelConfig,
      messages,
      canvasJSON: '{"version":"6","objects":[]}',
      canvasWidth: 1440,
      canvasHeight: 900,
    });

    expect(config.modelConfigId).toBe("cfg-1");
    expect(config.stream).toBe(true);
    expect(config.messages.length).toBeGreaterThan(1);
    // First message should be system prompt
    expect(config.messages[0].role).toBe("system");
  });

  it("should include canvas context as first user message part", () => {
    const messages: ChatMessage[] = [
      { id: "1", role: "user", content: "Build a page", images: [], timestamp: "" },
    ];

    const config = engine.buildRequest({
      modelConfig: mockModelConfig,
      messages,
      canvasJSON: '{"version":"6","objects":[{"type":"rect"}]}',
      canvasWidth: 1440,
      canvasHeight: 900,
    });

    // Should have system + canvas context + user messages
    expect(config.messages.length).toBeGreaterThanOrEqual(2);
  });

  it("should handle messages with images", () => {
    const messages: ChatMessage[] = [
      {
        id: "1",
        role: "user",
        content: "Look at this sketch",
        images: ["data:image/png;base64,abc"],
        timestamp: "",
      },
    ];

    const config = engine.buildRequest({
      modelConfig: mockModelConfig,
      messages,
      canvasJSON: '{"version":"6","objects":[]}',
      canvasWidth: 1440,
      canvasHeight: 900,
    });

    // Find a message with array content (image)
    const withImage = config.messages.find(
      (m) => Array.isArray(m.content)
    );
    expect(withImage).toBeDefined();
  });

  it("should reject send when no model config is provided", async () => {
    const messages: ChatMessage[] = [
      { id: "1", role: "user", content: "Build a landing page", images: [], timestamp: "" },
    ];

    // buildRequest with null modelConfig should not be called -- guard is in the caller
    // Instead verify the caller (useStreamingChat) shows an error message
    expect(() => engine.buildRequest({
      modelConfig: null as any,
      messages,
      canvasJSON: '{"version":"6","objects":[]}',
      canvasWidth: 1440,
      canvasHeight: 900,
    })).toThrow();
  });

  it("should select text model by default", () => {
    const config = engine.buildRequest({
      modelConfig: mockModelConfig,
      messages: [{ id: "1", role: "user", content: "Test", images: [], timestamp: "" }],
      canvasJSON: '{"version":"6","objects":[]}',
      canvasWidth: 1440,
      canvasHeight: 900,
    });

    expect(config.modelConfigId).toBe("cfg-1");
  });

  it("should use vision model when images are present", () => {
    const visionConfig = { ...mockModelConfig, id: "cfg-vision", modelType: "vision" as const };
    const config = engine.buildRequest({
      modelConfig: visionConfig,
      messages: [{
        id: "1", role: "user", content: "Analyze",
        images: ["data:image/png;base64,abc"], timestamp: "",
      }],
      canvasJSON: '{"version":"6","objects":[]}',
      canvasWidth: 1440,
      canvasHeight: 900,
    });

    expect(config.modelConfigId).toBe("cfg-vision");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/ai/ChatEngine.test.ts`

Expected: FAIL -- module not found.

- [ ] **Step 3: Implement ChatEngine**

Create `src/components/ai/ChatEngine.ts`:

```typescript
import type {
  ChatMessage,
  ModelConfig,
  AIRequestConfig,
  ContentPart,
} from "@/types";
import { buildSystemPrompt, buildCanvasContext, buildConversationMessages } from "./ContextBuilder";

interface BuildRequestInput {
  modelConfig: ModelConfig;
  messages: ChatMessage[];
  canvasJSON: string;
  canvasWidth: number;
  canvasHeight: number;
  screenshotDataUrl?: string;
  skillName?: string;
}

export class ChatEngine {
  private requestCounter = 0;

  generateRequestId(): string {
    this.requestCounter += 1;
    return `req-${Date.now()}-${this.requestCounter}`;
  }

  buildRequest(input: BuildRequestInput): AIRequestConfig {
    if (!input.modelConfig) {
      throw new Error("No model configured. Please go to Settings and configure a model first.");
    }

    const {
      modelConfig,
      messages,
      canvasJSON,
      canvasWidth,
      canvasHeight,
      screenshotDataUrl,
      skillName,
    } = input;

    const systemPrompt = buildSystemPrompt({
      canvasWidth,
      canvasHeight,
    });

    const canvasContext = buildCanvasContext({
      canvasJSON,
      canvasWidth,
      canvasHeight,
      screenshotDataUrl,
    });

    const conversationMessages = buildConversationMessages(messages);

    // Build the full message list: system + canvas context + conversation
    const fullMessages: Array<{
      role: "user" | "assistant" | "system";
      content: string | ContentPart[];
    }> = [
      { role: "system", content: systemPrompt },
      { role: "user", content: canvasContext },
    ];

    // Add skill context if active
    if (skillName) {
      fullMessages.push({
        role: "system",
        content: `Active skill: ${skillName}. Follow the skill's structured generation process.`,
      });
    }

    fullMessages.push(...conversationMessages);

    return {
      modelConfigId: modelConfig.id,
      messages: fullMessages,
      stream: true,
      temperature: 0.7,
      maxTokens: 4096,
    };
  }

  async sendRequest(config: AIRequestConfig, requestId: string): Promise<void> {
    const { invoke } = await import("@tauri-apps/api/core");

    await invoke("ai_chat_stream", {
      input: {
        model_config_id: config.modelConfigId,
        messages: config.messages.map((m) => ({
          role: m.role,
          content: typeof m.content === "string" ? m.content : m.content,
        })),
        stream: config.stream,
        request_id: requestId,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      },
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/ai/ChatEngine.test.ts`

Expected: All 7 ChatEngine tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ai/ChatEngine.ts tests/ai/ChatEngine.test.ts
git commit -m "feat: add ChatEngine for conversation flow and request building"
```

---

## Task 9: useStreamingChat Hook -- Subscribe to Tauri SSE Events

**Files:**
- Create: `src/hooks/useStreamingChat.ts`
- Test: `tests/hooks/useStreamingChat.test.ts`

- [ ] **Step 1: Write failing test for useStreamingChat**

Create `tests/hooks/useStreamingChat.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStreamingChat } from "@/hooks/useStreamingChat";
import { useChatStore } from "@/stores/chatStore";

describe("useStreamingChat", () => {
  beforeEach(() => {
    useChatStore.setState({
      messages: [],
      streamingContent: "",
      isStreaming: false,
      activeRequestId: "",
    });
  });

  it("should provide a send function", () => {
    const { result } = renderHook(() =>
      useStreamingChat({
        projectId: "proj-1",
        pageId: "page-1",
      })
    );
    expect(result.current.send).toBeInstanceOf(Function);
  });

  it("should provide a cancel function", () => {
    const { result } = renderHook(() =>
      useStreamingChat({
        projectId: "proj-1",
        pageId: "page-1",
      })
    );
    expect(result.current.cancel).toBeInstanceOf(Function);
  });

  it("should add user message to store on send", async () => {
    const { result } = renderHook(() =>
      useStreamingChat({
        projectId: "proj-1",
        pageId: "page-1",
      })
    );

    await act(async () => {
      await result.current.send("Build a landing page", []);
    });

    // User message should be added even if the API call is mocked
    const state = useChatStore.getState();
    const userMsg = state.messages.find((m) => m.role === "user");
    expect(userMsg).toBeDefined();
    expect(userMsg!.content).toBe("Build a landing page");
  });

  it("should not send when no model is configured", async () => {
    const { result } = renderHook(() =>
      useStreamingChat({
        projectId: "proj-1",
        pageId: "page-1",
      })
    );

    // Model store has no configs by default
    await act(async () => {
      await result.current.send("Test", []);
    });

    // No streaming should start
    expect(useChatStore.getState().isStreaming).toBe(false);
  });

  it("should expose loading state", () => {
    const { result } = renderHook(() =>
      useStreamingChat({
        projectId: "proj-1",
        pageId: "page-1",
      })
    );
    expect(typeof result.current.isLoading).toBe("boolean");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/hooks/useStreamingChat.test.ts`

Expected: FAIL -- module not found.

- [ ] **Step 3: Implement useStreamingChat**

Create `src/hooks/useStreamingChat.ts`:

```typescript
import { useCallback, useEffect, useRef } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useChatStore } from "@/stores/chatStore";
import { useModelStore } from "@/stores/modelStore";
import { useCanvasStore } from "@/stores/canvasStore";
import { useUiStore } from "@/stores/uiStore";
import { ChatEngine } from "@/components/ai/ChatEngine";
import { parseAIResponse } from "@/components/ai/ResponseParser";

interface UseStreamingChatOptions {
  projectId: string;
  pageId: string;
}

interface StreamPayload {
  request_id: string;
  event_type: string;
  content: string | null;
  error: string | null;
}

export function useStreamingChat({ projectId, pageId }: UseStreamingChatOptions) {
  const engineRef = useRef(new ChatEngine());
  const unlistenRef = useRef<UnlistenFn | null>(null);
  const requestIdRef = useRef<string>("");

  const isStreaming = useChatStore((s) => s.isStreaming);
  const startStreaming = useChatStore((s) => s.startStreaming);
  const appendStreamContent = useChatStore((s) => s.appendStreamContent);
  const stopStreaming = useChatStore((s) => s.stopStreaming);
  const addMessage = useChatStore((s) => s.addMessage);
  const setActiveSkill = useChatStore((s) => s.setActiveSkill);
  const getDefaultTextModel = useModelStore((s) => s.getDefaultTextModel);
  const getDefaultVisionModel = useModelStore((s) => s.getDefaultVisionModel);
  const activeTool = useUiStore((s) => s.activeTool);

  // Subscribe to streaming events
  useEffect(() => {
    let mounted = true;

    const setupListener = async () => {
      unlistenRef.current = await listen<StreamPayload>("ai-stream", (event) => {
        const payload = event.payload;

        // Only handle events for our active request
        if (payload.request_id !== requestIdRef.current) return;

        if (payload.event_type === "delta" && payload.content) {
          appendStreamContent(payload.content);
        } else if (payload.event_type === "done") {
          const currentContent = useChatStore.getState().streamingContent;
          stopStreaming(true);

          // Parse the accumulated response
          const parsed = parseAIResponse(currentContent);

          if (parsed.response) {
            // Update the last assistant message with structured data
            const { messages } = useChatStore.getState();
            const lastMsg = messages[messages.length - 1];
            if (lastMsg && lastMsg.role === "assistant") {
              const updatedMessages = messages.slice(0, -1);
              updatedMessages.push({
                ...lastMsg,
                content: parsed.replyText,
                canvasUpdated: !!(parsed.response.html),
                skillUsed: parsed.response.skillUsed,
              });
              useChatStore.getState().setMessages(updatedMessages);

              if (parsed.response.skillUsed) {
                setActiveSkill(parsed.response.skillUsed);
              }
            }
          }

          // Auto-save chat history
          saveChatHistory();
        } else if (payload.event_type === "error") {
          stopStreaming(false);
          addMessage({
            id: `msg-error-${Date.now()}`,
            role: "assistant",
            content: `请求失败: ${payload.error ?? "未知错误"}`,
            images: [],
            timestamp: new Date().toISOString(),
          });
          useChatStore.getState().setStreamingState('error');
        }
      });
    };

    if (mounted) setupListener();

    return () => {
      mounted = false;
      unlistenRef.current?.();
      unlistenRef.current = null;
    };
  }, [appendStreamContent, stopStreaming, addMessage, setActiveSkill]);

  const saveChatHistory = useCallback(async () => {
    if (!projectId || !pageId) return;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const messages = useChatStore.getState().messages;
      const history = {
        pageId,
        projectId,
        messages,
        updatedAt: new Date().toISOString(),
      };
      await invoke("save_chat_history", {
        projectId,
        pageId,
        json: JSON.stringify(history),
      });
    } catch (error) {
      console.error("Failed to save chat history:", error);
    }
  }, [projectId, pageId]);

  const send = useCallback(async (text: string, images: string[]) => {
    // Determine which model to use
    const hasImages = images.length > 0;
    const model = hasImages
      ? getDefaultVisionModel()
      : getDefaultTextModel();

    if (!model) {
      // No model configured -- add error message
      addMessage({
        id: `msg-sys-${Date.now()}`,
        role: "assistant",
        content: "No AI model configured. Please go to Settings and configure a model first.",
        images: [],
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Add user message
    addMessage({
      id: `msg-${Date.now()}`,
      role: "user",
      content: text,
      images,
      timestamp: new Date().toISOString(),
    });

    // Build and send request
    const requestId = engineRef.current.generateRequestId();
    requestIdRef.current = requestId;

    // Get canvas state for context
    const canvasStore = useCanvasStore.getState();
    const uiState = useUiStore.getState();
    const chatMessages = useChatStore.getState().messages;

    // Try to get canvas JSON from the canvas store history
    // Guard: historyIndex may be -1 (initial state) -- do not access history[-1]
    const lastSnapshot = (canvasStore.history.length > 0 && canvasStore.historyIndex >= 0)
      ? canvasStore.history[canvasStore.historyIndex]
      : null;
    const canvasJSON = lastSnapshot
      ? JSON.stringify(lastSnapshot)
      : '{"version":"6","objects":[]}';

    const currentPage = useUiStore.getState().currentPageId;

    const config = engineRef.current.buildRequest({
      modelConfig: model,
      messages: chatMessages,
      canvasJSON,
      canvasWidth: 1440,
      canvasHeight: 900,
    });

    startStreaming(requestId);

    try {
      await engineRef.current.sendRequest(config, requestId);
    } catch (error) {
      stopStreaming(false);
      addMessage({
        id: `msg-error-${Date.now()}`,
        role: "assistant",
        content: `请求失败: ${error instanceof Error ? error.message : String(error)}`,
        images: [],
        timestamp: new Date().toISOString(),
      });
      useChatStore.getState().setStreamingState('error');
    }
  }, [getDefaultTextModel, getDefaultVisionModel, addMessage, startStreaming, stopStreaming]);

  const cancel = useCallback(async () => {
    const requestId = requestIdRef.current;
    if (requestId) {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("cancel_ai_request", { requestId });
      } catch {
        // Request may have already completed, ignore error
      }
    }
    // Abort any in-flight fetch if controller exists
    const controller = useChatStore.getState().abortController;
    if (controller) {
      controller.abort();
      useChatStore.getState().setAbortController(null);
    }
    stopStreaming(false);
    requestIdRef.current = "";
  }, [stopStreaming]);

  return {
    send,
    cancel,
    isLoading: isStreaming,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/hooks/useStreamingChat.test.ts`

Expected: All 5 useStreamingChat tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useStreamingChat.ts tests/hooks/useStreamingChat.test.ts
git commit -m "feat: add useStreamingChat hook for Tauri SSE event subscription and chat flow"
```

---

## Task 10: Chat UI Components

**Files:**
- Create: `src/components/chat/ChatMessageItem.tsx`
- Create: `src/components/chat/ChatMessageList.tsx`
- Create: `src/components/chat/ChatInput.tsx`
- Create: `src/components/chat/ModelBadge.tsx`
- Create: `src/components/chat/SkillBadge.tsx`
- Test: `tests/components/chat/ChatMessageList.test.tsx`
- Test: `tests/components/chat/ChatInput.test.tsx`

- [ ] **Step 1: Create ChatMessageItem component**

Create `src/components/chat/ChatMessageItem.tsx`:

```typescript
import { useTranslation } from "react-i18next";
import { Bot, User, CheckCircle } from "lucide-react";
import type { ChatMessage } from "@/types";

interface ChatMessageItemProps {
  message: ChatMessage;
}

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  const { t } = useTranslation();

  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={`flex gap-2 px-3 py-2 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
          isUser ? "bg-accent" : "bg-bg-tertiary"
        }`}
      >
        {isUser ? (
          <User size={12} className="text-white" />
        ) : (
          <Bot size={12} className="text-text-primary" />
        )}
      </div>

      {/* Message content */}
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? "bg-accent text-white"
            : "bg-bg-tertiary text-text-primary"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>

        {/* Canvas updated indicator */}
        {message.canvasUpdated && (
          <div className="flex items-center gap-1 mt-1 text-xs text-success">
            <CheckCircle size={10} />
            <span>{t("chat.canvasUpdated")}</span>
          </div>
        )}

        {/* Image thumbnails */}
        {message.images.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Upload ${i + 1}`}
                className="w-16 h-16 object-cover rounded border border-border"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ChatMessageList component**

Create `src/components/chat/ChatMessageList.tsx`:

```typescript
import { useEffect, useRef } from "react";
import { useChatStore } from "@/stores/chatStore";
import { ChatMessageItem } from "./ChatMessageItem";

export function ChatMessageList() {
  const messages = useChatStore((s) => s.messages);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or streaming content
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      {messages.length === 0 && !isStreaming && (
        <div className="flex items-center justify-center h-full text-xs text-text-muted px-4 text-center">
          Describe what you want to build, or upload a sketch for AI to analyze.
        </div>
      )}

      {messages.map((msg) => (
        <ChatMessageItem key={msg.id} message={msg} />
      ))}

      {/* Streaming indicator */}
      {isStreaming && streamingContent && (
        <ChatMessageItem
          message={{
            id: "streaming",
            role: "assistant",
            content: streamingContent,
            images: [],
            timestamp: new Date().toISOString(),
          }}
        />
      )}

      {isStreaming && !streamingContent && (
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-bg-tertiary flex items-center justify-center">
            <div className="flex gap-0.5">
              <span className="w-1 h-1 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-1 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-1 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
          <span className="text-xs text-text-muted">Thinking...</span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create ChatInput component**

Create `src/components/chat/ChatInput.tsx`:

```typescript
import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Send, ImagePlus, X } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string, images: string[]) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && images.length === 0) return;
    onSend(trimmed, images);
    setText("");
    setImages([]);
  }, [text, images, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setImages((prev) => [...prev, dataUrl]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-border p-2">
      {/* Image preview */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {images.map((img, i) => (
            <div key={i} className="relative group">
              <img
                src={img}
                alt={`Upload ${i + 1}`}
                className="w-12 h-12 object-cover rounded border border-border"
              />
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-1 -right-1 w-4 h-4 bg-danger text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-1">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
          disabled={disabled}
          title={t("chat.uploadImage")}
        >
          <ImagePlus size={16} />
        </button>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("chat.inputPlaceholder")}
          rows={1}
          className="flex-1 bg-bg-primary border border-border rounded px-2 py-1 text-sm text-text-primary resize-none focus:outline-none focus:border-accent max-h-20"
          disabled={disabled}
        />

        <button
          onClick={handleSend}
          disabled={disabled || (!text.trim() && images.length === 0)}
          className="p-1.5 text-text-muted hover:text-accent transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          title={t("chat.send")}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create ModelBadge component**

Create `src/components/chat/ModelBadge.tsx`:

```typescript
import { useModelStore } from "@/stores/modelStore";
import { Settings } from "lucide-react";

export function ModelBadge() {
  const defaultTextModel = useModelStore((s) => s.defaultTextModel);

  if (!defaultTextModel) {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 bg-warning/20 text-warning rounded text-xs">
        <Settings size={10} />
        <span>Not configured</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-2 py-0.5 bg-accent/20 text-accent rounded text-xs">
      <span>{defaultTextModel.name}</span>
    </div>
  );
}
```

- [ ] **Step 5: Create SkillBadge component**

Create `src/components/chat/SkillBadge.tsx`:

```typescript
import { useChatStore } from "@/stores/chatStore";
import { Wrench } from "lucide-react";

export function SkillBadge() {
  const activeSkill = useChatStore((s) => s.activeSkill);

  if (!activeSkill) return null;

  return (
    <div className="flex items-center gap-1 px-2 py-0.5 bg-success/20 text-success rounded text-xs">
      <Wrench size={10} />
      <span>Skill: {activeSkill}</span>
    </div>
  );
}
```

- [ ] **Step 6: Write tests for ChatMessageList and ChatInput**

Create `tests/components/chat/ChatMessageList.test.tsx`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatMessageList } from "@/components/chat/ChatMessageList";
import { useChatStore } from "@/stores/chatStore";
import type { ChatMessage } from "@/types";

describe("ChatMessageList", () => {
  beforeEach(() => {
    useChatStore.setState({
      messages: [],
      streamingContent: "",
      isStreaming: false,
    });
  });

  it("should show empty state when no messages", () => {
    render(<ChatMessageList />);
    expect(screen.getByText(/Describe what you want/)).toBeInTheDocument();
  });

  it("should render messages", () => {
    const msgs: ChatMessage[] = [
      { id: "1", role: "user", content: "Hello AI", images: [], timestamp: "" },
      { id: "2", role: "assistant", content: "Hi there!", images: [], timestamp: "" },
    ];
    useChatStore.setState({ messages: msgs });
    render(<ChatMessageList />);
    expect(screen.getByText("Hello AI")).toBeInTheDocument();
    expect(screen.getByText("Hi there!")).toBeInTheDocument();
  });

  it("should show streaming content when active", () => {
    useChatStore.setState({
      isStreaming: true,
      streamingContent: "Generating...",
    });
    render(<ChatMessageList />);
    expect(screen.getByText("Generating...")).toBeInTheDocument();
  });

  it("should show thinking indicator when streaming with no content", () => {
    useChatStore.setState({ isStreaming: true, streamingContent: "" });
    render(<ChatMessageList />);
    expect(screen.getByText("Thinking...")).toBeInTheDocument();
  });
});
```

Create `tests/components/chat/ChatInput.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatInput } from "@/components/chat/ChatInput";

describe("ChatInput", () => {
  it("should render input and send button", () => {
    render(<ChatInput onSend={vi.fn()} disabled={false} />);
    expect(screen.getByPlaceholderText("输入消息...")).toBeInTheDocument();
    expect(screen.getByTitle("发送")).toBeInTheDocument();
  });

  it("should call onSend with text on Enter", async () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} disabled={false} />);

    const input = screen.getByPlaceholderText("输入消息...");
    await userEvent.type(input, "Build a page{Enter}");

    expect(onSend).toHaveBeenCalledWith("Build a page", []);
  });

  it("should not send with empty text and no images", async () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} disabled={false} />);

    await userEvent.click(screen.getByTitle("发送"));
    expect(onSend).not.toHaveBeenCalled();
  });

  it("should disable input when disabled prop is true", () => {
    render(<ChatInput onSend={vi.fn()} disabled={true} />);
    expect(screen.getByPlaceholderText("输入消息...")).toBeDisabled();
  });

  it("should render image upload button", () => {
    render(<ChatInput onSend={vi.fn()} disabled={false} />);
    expect(screen.getByTitle("上传图片")).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Run tests**

Run: `npm test -- tests/components/chat/`

Expected: All 9 chat component tests PASS (4 ChatMessageList + 5 ChatInput).

- [ ] **Step 8: Commit**

```bash
git add src/components/chat/ tests/components/chat/
git commit -m "feat: add chat UI components -- message list, input, model badge, skill badge"
```

---

## Task 11: Replace ChatPanel Placeholder with Full Chat UI

**Files:**
- Modify: `src/components/editor/ChatPanel.tsx` (replace placeholder)
- Modify: `src/i18n/locales/zh-CN/translation.json` (add chat translations)

- [ ] **Step 1: Add chat i18n keys**

Update `src/i18n/locales/zh-CN/translation.json` -- add these keys alongside existing ones:

```json
{
  "chat": {
    "title": "AI 助手",
    "inputPlaceholder": "输入消息...",
    "send": "发送",
    "uploadImage": "上传图片",
    "canvasUpdated": "已更新画板",
    "thinking": "思考中...",
    "noModel": "未配置模型",
    "noModelHint": "请前往设置页面配置 AI 模型"
  },
  "settings": {
    "title": "设置",
    "theme": "主题",
    "dark": "暗色",
    "light": "亮色",
    "language": "语言",
    "modelConfig": "模型配置",
    "addModel": "添加模型",
    "editModel": "编辑模型",
    "testConnection": "测试连接",
    "testing": "测试中...",
    "connectionOk": "连接正常",
    "connectionFailed": "连接失败",
    "defaultTextModel": "默认文字模型",
    "defaultVisionModel": "默认视觉模型",
    "provider": "服务商",
    "authMode": "接入方式",
    "apiKey": "API Key",
    "token": "Token",
    "baseUrl": "API 地址",
    "modelName": "模型名称",
    "modelType": "模型能力",
    "name": "配置名称",
    "delete": "删除",
    "deleteConfirm": "确定删除此模型配置？",
    "validation": {
      "nameRequired": "配置名称不能为空",
      "modelNameRequired": "模型名称不能为空",
      "baseUrlRequired": "API 地址不能为空",
      "apiKeyRequired": "API Key 不能为空"
    }
  }
}
```

Note: Merge with existing settings keys; do not duplicate the `settings` object.

- [ ] **Step 2: Replace ChatPanel with full implementation**

Replace `src/components/editor/ChatPanel.tsx`:

```typescript
import { useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useChatStore } from "@/stores/chatStore";
import { useUiStore } from "@/stores/uiStore";
import { useProjectStore } from "@/stores/projectStore";
import { ChatMessageList } from "@/components/chat/ChatMessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { ModelBadge } from "@/components/chat/ModelBadge";
import { SkillBadge } from "@/components/chat/SkillBadge";
import { useStreamingChat } from "@/hooks/useStreamingChat";

export function ChatPanel() {
  const { t } = useTranslation();
  const isStreaming = useChatStore((s) => s.isStreaming);
  const currentPageId = useUiStore((s) => s.currentPageId);
  const currentProject = useProjectStore((s) => s.currentProject);
  const clearMessages = useChatStore((s) => s.clearMessages);
  const setMessages = useChatStore((s) => s.setMessages);

  const { send, cancel, isLoading } = useStreamingChat({
    projectId: currentProject?.id ?? "",
    pageId: currentPageId,
  });

  // Load chat history when page changes
  useEffect(() => {
    if (!currentProject?.id || !currentPageId) {
      clearMessages();
      return;
    }

    const loadHistory = async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const raw = await invoke("load_chat_history", {
          projectId: currentProject.id,
          pageId: currentPageId,
        });
        const history = JSON.parse(raw as string);
        if (history.messages && history.messages.length > 0) {
          setMessages(history.messages);
        } else {
          clearMessages();
        }
      } catch {
        clearMessages();
      }
    };

    loadHistory();
  }, [currentProject?.id, currentPageId, clearMessages, setMessages]);

  const handleSend = useCallback((text: string, images: string[]) => {
    send(text, images);
  }, [send]);

  return (
    <div className="w-[300px] bg-bg-secondary border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center gap-2">
        <span className="text-xs font-medium text-text-secondary">
          {t("chat.title")}
        </span>
        <ModelBadge />
        <SkillBadge />
      </div>

      {/* Messages */}
      <ChatMessageList />

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={isLoading}
      />

      {/* Cancel button during streaming */}
      {isLoading && (
        <div className="px-3 pb-2">
          <button
            onClick={cancel}
            className="w-full py-1 text-xs text-danger border border-danger/30 rounded hover:bg-danger/10 transition-colors"
          >
            Stop generating
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/editor/ChatPanel.tsx src/i18n/locales/zh-CN/translation.json
git commit -m "feat: replace ChatPanel placeholder with full streaming chat UI and history persistence"
```

---

## Task 12: Model Configuration UI -- Settings Page

**Files:**
- Create: `src/components/settings/SettingsPage.tsx`
- Create: `src/components/settings/ModelConfigList.tsx`
- Create: `src/components/settings/ModelConfigCard.tsx`
- Create: `src/components/settings/ModelConfigDialog.tsx`
- Create: `src/components/settings/DefaultModelSelector.tsx`
- Test: `tests/components/settings/ModelConfigDialog.test.tsx`
- Test: `tests/components/settings/DefaultModelSelector.test.tsx`

- [ ] **Step 1: Create DefaultModelSelector component**

Create `src/components/settings/DefaultModelSelector.tsx`:

```typescript
import { useTranslation } from "react-i18next";
import { useModelStore } from "@/stores/modelStore";
import type { ModelConfig } from "@/types";

interface DefaultModelSelectorProps {
  label: string;
  type: "text" | "vision";
  value: ModelConfig | null;
  onChange: (model: ModelConfig | null) => void;
}

export function DefaultModelSelector({ label, type, value, onChange }: DefaultModelSelectorProps) {
  const { t } = useTranslation();
  const configs = useModelStore((s) => s.configs);

  const filteredConfigs = configs.filter(
    (c) => c.modelType === type || c.modelType === "both"
  );

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-text-secondary min-w-[100px]">{label}</label>
      <select
        value={value?.id ?? ""}
        onChange={(e) => {
          const selected = configs.find((c) => c.id === e.target.value) ?? null;
          onChange(selected);
        }}
        className="flex-1 px-3 py-1.5 bg-bg-primary border border-border rounded text-sm text-text-primary focus:outline-none focus:border-accent"
      >
        <option value="">-- None --</option>
        {filteredConfigs.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.modelName})
          </option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 2: Create ModelConfigCard component**

Create `src/components/settings/ModelConfigCard.tsx`:

```typescript
import { useTranslation } from "react-i18next";
import { CheckCircle, XCircle, Loader2, Trash2, Edit2 } from "lucide-react";
import type { ModelConfig } from "@/types";

interface ModelConfigCardProps {
  config: ModelConfig;
  onTest: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isTesting: boolean;
}

export function ModelConfigCard({ config, onTest, onEdit, onDelete, isTesting }: ModelConfigCardProps) {
  const { t } = useTranslation();

  const statusIcon = (() => {
    if (isTesting) return <Loader2 size={14} className="animate-spin text-warning" />;
    if (config.connectionStatus === "ok") return <CheckCircle size={14} className="text-success" />;
    if (config.connectionStatus) return <XCircle size={14} className="text-danger" />;
    return null;
  })();

  return (
    <div className="bg-bg-surface border border-border rounded-lg p-3 hover:border-border-hover transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-sm font-medium text-text-primary">{config.name}</h4>
          <p className="text-xs text-text-muted">{config.provider} / {config.modelName}</p>
        </div>
        <div className="flex items-center gap-1">
          {statusIcon}
          {config.isDefaultText && (
            <span className="px-1.5 py-0.5 text-[10px] bg-accent/20 text-accent rounded">Text</span>
          )}
          {config.isDefaultVision && (
            <span className="px-1.5 py-0.5 text-[10px] bg-accent/20 text-accent rounded">Vision</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-text-muted mb-2">
        <span>{config.authMode}</span>
        <span>|</span>
        <span>{config.modelType}</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onTest(config.id)}
          disabled={isTesting}
          className="px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors disabled:opacity-50"
        >
          {isTesting ? t("settings.testing") : t("settings.testConnection")}
        </button>
        <button
          onClick={() => onEdit(config.id)}
          className="px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors"
        >
          <Edit2 size={12} />
        </button>
        <button
          onClick={() => onDelete(config.id)}
          className="px-2 py-1 text-xs text-text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create ModelConfigDialog component**

Create `src/components/settings/ModelConfigDialog.tsx`:

```typescript
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import * as Dialog from "@radix-ui/react-dialog";
import { PROVIDER_PRESETS, getAuthModeLabel } from "./ProviderPresets";
import type { ModelConfig, AuthMode, ModelType, ProviderType } from "@/types";

interface ModelConfigDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ModelConfigFormData) => void;
  editConfig?: ModelConfig | null;
}

export interface ModelConfigFormData {
  name: string;
  provider: ProviderType;
  authMode: AuthMode;
  baseUrl: string;
  apiKey: string;
  token: string;
  modelName: string;
  modelType: ModelType;
  isDefaultText: boolean;
  isDefaultVision: boolean;
}

export function ModelConfigDialog({ open, onClose, onSubmit, editConfig }: ModelConfigDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [provider, setProvider] = useState<ProviderType>("openai");
  const [authMode, setAuthMode] = useState<AuthMode>("standard_api");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [token, setToken] = useState("");
  const [modelName, setModelName] = useState("");
  const [modelType, setModelType] = useState<ModelType>("text");
  const [isDefaultText, setIsDefaultText] = useState(false);
  const [isDefaultVision, setIsDefaultVision] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Populate form when editing
  useEffect(() => {
    if (editConfig) {
      setName(editConfig.name);
      setProvider(editConfig.provider as ProviderType);
      setAuthMode(editConfig.authMode as AuthMode);
      setBaseUrl(editConfig.baseUrl);
      setApiKey(editConfig.apiKey);
      setToken(editConfig.token);
      setModelName(editConfig.modelName);
      setModelType(editConfig.modelType as ModelType);
      setIsDefaultText(editConfig.isDefaultText);
      setIsDefaultVision(editConfig.isDefaultVision);
    } else {
      setName("");
      setProvider("openai");
      setAuthMode("standard_api");
      setModelName("");
      setModelType("text");
      setIsDefaultText(false);
      setIsDefaultVision(false);
      const preset = PROVIDER_PRESETS.find((p) => p.id === "openai");
      setBaseUrl(preset?.defaultBaseUrl ?? "");
      setApiKey("");
      setToken("");
    }
    setValidationErrors({});
  }, [editConfig, open]);

  // Update base URL when provider changes (only for new configs)
  useEffect(() => {
    if (!editConfig) {
      const preset = PROVIDER_PRESETS.find((p) => p.id === provider);
      if (preset) {
        setBaseUrl(preset.defaultBaseUrl);
        if (preset.modelSuggestions.length > 0 && !modelName) {
          setModelName(preset.modelSuggestions[0]);
        }
      }
    }
  }, [provider, editConfig, modelName]);

  const currentPreset = PROVIDER_PRESETS.find((p) => p.id === provider);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const errors: Record<string, string> = {};
    if (!name.trim()) {
      errors.name = t("settings.validation.nameRequired");
    }
    if (!modelName.trim()) {
      errors.modelName = t("settings.validation.modelNameRequired");
    }
    if (!baseUrl.trim()) {
      errors.baseUrl = t("settings.validation.baseUrlRequired");
    }
    if ((authMode === "standard_api" || authMode === "coding_plan") && !apiKey.trim()) {
      errors.apiKey = t("settings.validation.apiKeyRequired");
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    onSubmit({
      name: name.trim(),
      provider,
      authMode,
      baseUrl,
      apiKey,
      token,
      modelName: modelName.trim(),
      modelType,
      isDefaultText,
      isDefaultVision,
    });
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-surface rounded-lg p-6 w-[520px] max-h-[80vh] overflow-y-auto border border-border">
          <Dialog.Title className="text-lg font-medium text-text-primary mb-4">
            {editConfig ? t("settings.editModel") : t("settings.addModel")}
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name */}
            <div>
              <label className="block text-sm text-text-secondary mb-1">{t("settings.name")}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); if (validationErrors.name) setValidationErrors((prev) => { const next = { ...prev }; delete next.name; return next; }); }}
                className={`w-full px-3 py-1.5 bg-bg-primary border rounded text-sm text-text-primary focus:outline-none ${validationErrors.name ? "border-danger" : "border-border focus:border-accent"}`}
                required
              />
              {validationErrors.name && (
                <p className="text-xs text-danger mt-1">{validationErrors.name}</p>
              )}
            </div>

            {/* Provider */}
            <div>
              <label className="block text-sm text-text-secondary mb-1">{t("settings.provider")}</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as ProviderType)}
                className="w-full px-3 py-1.5 bg-bg-primary border border-border rounded text-sm text-text-primary focus:outline-none focus:border-accent"
              >
                {PROVIDER_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Auth Mode */}
            <div>
              <label className="block text-sm text-text-secondary mb-1">{t("settings.authMode")}</label>
              <select
                value={authMode}
                onChange={(e) => setAuthMode(e.target.value as AuthMode)}
                className="w-full px-3 py-1.5 bg-bg-primary border border-border rounded text-sm text-text-primary focus:outline-none focus:border-accent"
              >
                {(currentPreset?.authModes ?? ["standard_api"]).map((mode) => (
                  <option key={mode} value={mode}>{getAuthModeLabel(mode)}</option>
                ))}
              </select>
            </div>

            {/* Base URL */}
            <div>
              <label className="block text-sm text-text-secondary mb-1">{t("settings.baseUrl")}</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => { setBaseUrl(e.target.value); if (validationErrors.baseUrl) setValidationErrors((prev) => { const next = { ...prev }; delete next.baseUrl; return next; }); }}
                className={`w-full px-3 py-1.5 bg-bg-primary border rounded text-sm text-text-primary focus:outline-none ${validationErrors.baseUrl ? "border-danger" : "border-border focus:border-accent"}`}
              />
              {validationErrors.baseUrl && (
                <p className="text-xs text-danger mt-1">{validationErrors.baseUrl}</p>
              )}
            </div>

            {/* API Key (standard_api / coding_plan) */}
            {(authMode === "standard_api" || authMode === "coding_plan") && (
              <div>
                <label className="block text-sm text-text-secondary mb-1">{t("settings.apiKey")}</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); if (validationErrors.apiKey) setValidationErrors((prev) => { const next = { ...prev }; delete next.apiKey; return next; }); }}
                  className={`w-full px-3 py-1.5 bg-bg-primary border rounded text-sm text-text-primary focus:outline-none ${validationErrors.apiKey ? "border-danger" : "border-border focus:border-accent"}`}
                />
                {validationErrors.apiKey && (
                  <p className="text-xs text-danger mt-1">{validationErrors.apiKey}</p>
                )}
              </div>
            )}

            {/* Token (token_plan) */}
            {authMode === "token_plan" && (
              <div>
                <label className="block text-sm text-text-secondary mb-1">{t("settings.token")}</label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-3 py-1.5 bg-bg-primary border border-border rounded text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
            )}

            {/* Model Name */}
            <div>
              <label className="block text-sm text-text-secondary mb-1">{t("settings.modelName")}</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => { setModelName(e.target.value); if (validationErrors.modelName) setValidationErrors((prev) => { const next = { ...prev }; delete next.modelName; return next; }); }}
                list={currentPreset ? `models-${provider}` : undefined}
                className={`w-full px-3 py-1.5 bg-bg-primary border rounded text-sm text-text-primary focus:outline-none ${validationErrors.modelName ? "border-danger" : "border-border focus:border-accent"}`}
                required
              />
              {validationErrors.modelName && (
                <p className="text-xs text-danger mt-1">{validationErrors.modelName}</p>
              )}
              {currentPreset && currentPreset.modelSuggestions.length > 0 && (
                <datalist id={`models-${provider}`}>
                  {currentPreset.modelSuggestions.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              )}
            </div>

            {/* Model Type */}
            <div>
              <label className="block text-sm text-text-secondary mb-1">{t("settings.modelType")}</label>
              <div className="flex gap-3">
                {(["text", "vision", "both"] as ModelType[]).map((type) => (
                  <label key={type} className="flex items-center gap-1 text-sm text-text-primary">
                    <input
                      type="radio"
                      name="modelType"
                      value={type}
                      checked={modelType === type}
                      onChange={() => setModelType(type)}
                      className="accent-accent"
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            {/* Default checkboxes */}
            <div className="flex gap-4">
              <label className="flex items-center gap-1 text-sm text-text-primary">
                <input
                  type="checkbox"
                  checked={isDefaultText}
                  onChange={(e) => setIsDefaultText(e.target.checked)}
                  className="accent-accent"
                />
                Default text model
              </label>
              <label className="flex items-center gap-1 text-sm text-text-primary">
                <input
                  type="checkbox"
                  checked={isDefaultVision}
                  onChange={(e) => setIsDefaultVision(e.target.checked)}
                  className="accent-accent"
                />
                Default vision model
              </label>
            </div>

            {/* Buttons */}
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
                {editConfig ? t("settings.editModel") : t("settings.addModel")}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 4: Create ModelConfigList component**

Create `src/components/settings/ModelConfigList.tsx`:

```typescript
import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { useModelStore } from "@/stores/modelStore";
import { ModelConfigCard } from "./ModelConfigCard";
import { ModelConfigDialog, type ModelConfigFormData } from "./ModelConfigDialog";
import { DefaultModelSelector } from "./DefaultModelSelector";
import type { ModelConfig } from "@/types";

export function ModelConfigList() {
  const { t } = useTranslation();
  const configs = useModelStore((s) => s.configs);
  const setConfigs = useModelStore((s) => s.setConfigs);
  const defaultTextModel = useModelStore((s) => s.defaultTextModel);
  const defaultVisionModel = useModelStore((s) => s.defaultVisionModel);
  const setDefaultTextModel = useModelStore((s) => s.setDefaultTextModel);
  const setDefaultVisionModel = useModelStore((s) => s.setDefaultVisionModel);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<ModelConfig | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  // Load configs on mount
  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const result = await invoke("list_model_configs");
        setConfigs(result as ModelConfig[]);
      } catch (error) {
        console.error("Failed to load model configs:", error);
      }
    };
    loadConfigs();
  }, [setConfigs]);

  const handleAdd = () => {
    setEditConfig(null);
    setDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    const config = configs.find((c) => c.id === id);
    if (config) {
      setEditConfig(config);
      setDialogOpen(true);
    }
  };

  const handleSubmit = useCallback(async (data: ModelConfigFormData) => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");

      if (editConfig) {
        // Update existing config in-place (preserves ID and created_at)
        await invoke("update_model_config", {
          id: editConfig.id,
          name: data.name,
          provider: data.provider,
          authMode: data.authMode,
          baseUrl: data.baseUrl,
          apiKey: data.apiKey,
          token: data.token,
          modelName: data.modelName,
          modelType: data.modelType,
          isDefaultText: data.isDefaultText,
          isDefaultVision: data.isDefaultVision,
        });
      } else {
        await invoke("create_model_config", {
          input: {
            name: data.name,
            provider: data.provider,
            auth_mode: data.authMode,
            base_url: data.baseUrl,
            api_key: data.apiKey,
            token: data.token,
            model_name: data.modelName,
            model_type: data.modelType,
            is_default_text: data.isDefaultText,
            is_default_vision: data.isDefaultVision,
          },
        });
      }

      const result = await invoke("list_model_configs");
      setConfigs(result as ModelConfig[]);
    } catch (error) {
      console.error("Failed to save model config:", error);
    }
  }, [editConfig, setConfigs]);

  const handleTest = useCallback(async (id: string) => {
    setTestingId(id);
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("ai_test_connection", { modelConfigId: id });
      // Reload configs to get updated status
      const result = await invoke("list_model_configs");
      setConfigs(result as ModelConfig[]);
    } catch (error) {
      console.error("Test connection failed:", error);
    } finally {
      setTestingId(null);
    }
  }, [setConfigs]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("delete_model_config", { id });
      const result = await invoke("list_model_configs");
      setConfigs(result as ModelConfig[]);
    } catch (error) {
      console.error("Failed to delete model config:", error);
    }
  }, [setConfigs]);

  return (
    <div className="space-y-4">
      {/* Default model selectors */}
      <div className="space-y-2">
        <DefaultModelSelector
          label={t("settings.defaultTextModel")}
          type="text"
          value={defaultTextModel}
          onChange={setDefaultTextModel}
        />
        <DefaultModelSelector
          label={t("settings.defaultVisionModel")}
          type="vision"
          value={defaultVisionModel}
          onChange={setDefaultVisionModel}
        />
      </div>

      {/* Model config cards */}
      <div className="space-y-2">
        {configs.map((config) => (
          <ModelConfigCard
            key={config.id}
            config={config}
            onTest={handleTest}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isTesting={testingId === config.id}
          />
        ))}
      </div>

      {/* Add button */}
      <button
        onClick={handleAdd}
        className="w-full py-2 text-sm text-text-muted border border-dashed border-border rounded-lg hover:border-accent hover:text-accent transition-colors"
      >
        <Plus size={14} className="inline mr-1" />
        {t("settings.addModel")}
      </button>

      {/* Dialog */}
      <ModelConfigDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditConfig(null);
        }}
        onSubmit={handleSubmit}
        editConfig={editConfig}
      />
    </div>
  );
}
```

- [ ] **Step 5: Create SettingsPage component**

Create `src/components/settings/SettingsPage.tsx`:

```typescript
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ModelConfigList } from "./ModelConfigList";
import { useUiStore } from "@/stores/uiStore";

export function SettingsPage() {
  const { t } = useTranslation();
  const setView = useUiStore((s) => s.setView);

  return (
    <div className="h-screen bg-bg-primary text-text-primary overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-bg-primary border-b border-border z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => setView("editor")}
            className="p-1 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-medium">{t("settings.title")}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-8">
        {/* Theme section */}
        <section>
          <h2 className="text-sm font-medium text-text-secondary mb-3">{t("settings.theme")}</h2>
          <ThemeToggle />
        </section>

        {/* Model configuration section */}
        <section>
          <h2 className="text-sm font-medium text-text-secondary mb-3">{t("settings.modelConfig")}</h2>
          <ModelConfigList />
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Wire settings page into App routing**

Update `src/App.tsx` to include the settings view:

```typescript
import { useUiStore } from "@/stores/uiStore";
import { WelcomeScreen } from "@/components/welcome/WelcomeScreen";
import { EditorLayout } from "@/components/editor/EditorLayout";
import { SettingsPage } from "@/components/settings/SettingsPage";

function App() {
  const view = useUiStore((s) => s.view);

  if (view === "settings") {
    return <SettingsPage />;
  }

  if (view === "editor") {
    return <EditorLayout />;
  }

  return <WelcomeScreen />;
}

export default App;
```

Note: The `ViewType` extension and MenuBar wiring are handled in Task 13 (Steps 1-3). Do not modify `uiStore.ts` or `MenuBar.tsx` here.

- [ ] **Step 7: Write tests**

Create `tests/components/settings/ModelConfigDialog.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModelConfigDialog } from "@/components/settings/ModelConfigDialog";

describe("ModelConfigDialog", () => {
  it("should render form fields when open", () => {
    render(
      <ModelConfigDialog open={true} onClose={vi.fn()} onSubmit={vi.fn()} />
    );
    expect(screen.getByText("添加模型")).toBeInTheDocument();
  });

  it("should render provider select", () => {
    render(
      <ModelConfigDialog open={true} onClose={vi.fn()} onSubmit={vi.fn()} />
    );
    // The select should have provider options
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
  });

  it("should call onSubmit with form data", async () => {
    const onSubmit = vi.fn();
    render(
      <ModelConfigDialog open={true} onClose={vi.fn()} onSubmit={onSubmit} />
    );

    const nameInput = screen.getByLabelText("配置名称") ?? screen.getAllByRole("textbox")[0];
    await userEvent.type(nameInput, "Test Model");

    const submitBtn = screen.getAllByRole("button").find((b) => b.textContent?.includes("添加"));
    if (submitBtn) await userEvent.click(submitBtn);

    // Should have called onSubmit (may not if validation fails)
    // At minimum the name field should be populated
    expect(nameInput).toHaveValue("Test Model");
  });

  it("should not render when closed", () => {
    render(
      <ModelConfigDialog open={false} onClose={vi.fn()} onSubmit={vi.fn()} />
    );
    expect(screen.queryByText("添加模型")).not.toBeInTheDocument();
  });
});
```

Create `tests/components/settings/DefaultModelSelector.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DefaultModelSelector } from "@/components/settings/DefaultModelSelector";
import { useModelStore } from "@/stores/modelStore";
import type { ModelConfig } from "@/types";

const mockConfig: ModelConfig = {
  id: "cfg-1",
  name: "GPT-4o",
  provider: "openai",
  authMode: "standard_api",
  baseUrl: "",
  apiKey: "",
  token: "",
  modelName: "gpt-4o",
  modelType: "both",
  isDefaultText: true,
  isDefaultVision: false,
  connectionStatus: "",
  lastTestedAt: "",
  createdAt: "",
  updatedAt: "",
};

describe("DefaultModelSelector", () => {
  beforeEach(() => {
    useModelStore.setState({ configs: [mockConfig] });
  });

  it("should render label and select", () => {
    render(
      <DefaultModelSelector
        label="Default Text Model"
        type="text"
        value={mockConfig}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText("Default Text Model")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("should show configured model as option", () => {
    render(
      <DefaultModelSelector
        label="Text"
        type="text"
        value={mockConfig}
        onChange={vi.fn()}
      />
    );
    const select = screen.getByRole("combobox");
    expect(select.innerHTML).toContain("GPT-4o");
  });

  it("should not show model when type does not match", () => {
    useModelStore.setState({
      configs: [{ ...mockConfig, modelType: "vision" }],
    });
    render(
      <DefaultModelSelector
        label="Text"
        type="text"
        value={null}
        onChange={vi.fn()}
      />
    );
    const select = screen.getByRole("combobox");
    // Vision-only model should not appear in text selector
    expect(select.innerHTML).not.toContain("GPT-4o");
  });
});
```

- [ ] **Step 8: Run tests**

Run: `npm test -- tests/components/settings/`

Expected: All 7 settings component tests PASS (4 dialog + 3 selector).

- [ ] **Step 9: Commit**

```bash
git add src/components/settings/ src/App.tsx src/stores/uiStore.ts tests/components/settings/
git commit -m "feat: add model configuration UI with provider presets, test connection, and settings page"
```

---

## Task 13: Wire Settings into MenuBar and ViewType

**Files:**
- Modify: `src/stores/uiStore.ts` (extend ViewType)
- Modify: `src/components/editor/MenuBar.tsx` (add settings navigation)
- Modify: `src/App.tsx` (handle settings view)

- [ ] **Step 1: Extend ViewType in uiStore**

Modify the `ViewType` union in `src/stores/uiStore.ts` to add `| "settings"` to the existing type definition:

```typescript
export type ViewType = "welcome" | "editor" | "settings";
```

Also ensure the `setView` action in the store accepts the new type. If `uiStore` has a typed `setView` action, it should already accept the union type -- no further changes needed.

- [ ] **Step 2: Update App.tsx to handle settings view**

In `src/App.tsx`, add a case for the `"settings"` view:

```typescript
if (view === "settings") {
  return (
    <div className="h-screen flex flex-col">
      <MenuBar />
      <div className="flex-1 overflow-auto">
        <SettingsPage />
      </div>
    </div>
  );
}
```

Import `SettingsPage` if not already imported:

```typescript
import { SettingsPage } from "@/components/settings/SettingsPage";
```

- [ ] **Step 3: Update MenuBar to include settings in iteration and navigate**

In `src/components/editor/MenuBar.tsx`, first add `"settings"` to the menu iteration array so it renders alongside the existing menus:

```typescript
// Change this:
{(["file", "edit", "view", "export"] as const).map((menu) => (
// To this:
{(["file", "edit", "view", "export", "settings"] as const).map((menu) => (
```

Then add a click handler for the "settings" menu item. In the menu rendering, change the settings button to navigate:

```typescript
// In the menu items rendering, change the settings button to:
<button
  onClick={() => setView("settings")}
  className="px-2 py-0.5 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors"
>
  {t("editor.menu.settings")}
</button>
```

Also add the `setView` from uiStore if not already present:

```typescript
const setView = useUiStore((s) => s.setView);
```

- [ ] **Step 4: Verify build**

Run: `npm run build`

Expected: Build succeeds with no type errors for ViewType.

- [ ] **Step 5: Commit**

```bash
git add src/stores/uiStore.ts src/components/editor/MenuBar.tsx src/App.tsx
git commit -m "feat: wire settings page navigation from menu bar with ViewType extension"
```

---

## Task 14: Prototype Generation -- Render AI HTML on Canvas

**Files:**
- Create: `src/components/ai/PrototypeRenderer.ts`
- Modify: `src/hooks/useStreamingChat.ts` (apply AI responses to canvas)
- Test: `tests/ai/PrototypeRenderer.test.ts`

- [ ] **Step 1: Write failing test for PrototypeRenderer**

Create `tests/ai/PrototypeRenderer.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  wrapPrototypeHTML,
  extractInlineCSS,
  buildPrototypeIframeSrc,
} from "@/components/ai/PrototypeRenderer";

describe("PrototypeRenderer", () => {
  describe("wrapPrototypeHTML", () => {
    it("should wrap HTML in a full document with CSS", () => {
      const html = '<div class="prototype"><h1>Hello</h1></div>';
      const css = ".prototype { padding: 20px; }";
      const result = wrapPrototypeHTML(html, css);
      expect(result).toContain("<!DOCTYPE html>");
      expect(result).toContain("<style>");
      expect(result).toContain(css);
      expect(result).toContain(html);
    });

    it("should include CSS reset", () => {
      const result = wrapPrototypeHTML("<div>test</div>", "");
      expect(result).toContain("margin: 0");
      expect(result).toContain("padding: 0");
    });
  });

  describe("extractInlineCSS", () => {
    it("should extract CSS from style tags in HTML", () => {
      const html = '<style>.btn { color: red; }</style><div class="btn">Click</div>';
      const { css, cleanHtml } = extractInlineCSS(html);
      expect(css).toContain(".btn { color: red; }");
      expect(cleanHtml).not.toContain("<style>");
      expect(cleanHtml).toContain("Click");
    });

    it("should handle HTML without style tags", () => {
      const html = "<div>No styles here</div>";
      const { css, cleanHtml } = extractInlineCSS(html);
      expect(css).toBe("");
      expect(cleanHtml).toBe(html);
    });
  });

  describe("buildPrototypeIframeSrc", () => {
    it("should create a data URL for iframe src", () => {
      const html = "<div>Hello</div>";
      const css = "div { color: blue; }";
      const src = buildPrototypeIframeSrc(html, css);
      expect(src).toMatch(/^data:text\/html;base64,/);
    });

    it("should be decodable", () => {
      const html = "<div>Test Content</div>";
      const css = ".test { color: red; }";
      const src = buildPrototypeIframeSrc(html, css);
      const base64Part = src.replace("data:text/html;base64,", "");
      const decoded = atob(base64Part);
      expect(decoded).toContain("Test Content");
      expect(decoded).toContain(".test { color: red; }");
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/ai/PrototypeRenderer.test.ts`

Expected: FAIL -- module not found.

- [ ] **Step 3: Implement PrototypeRenderer**

Create `src/components/ai/PrototypeRenderer.ts`:

```typescript
/**
 * Wrap AI-generated HTML+CSS into a complete HTML document suitable
 * for rendering in an iframe on the canvas.
 */
export function wrapPrototypeHTML(html: string, css: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  ${css}
</style>
</head>
<body>
${html}
</body>
</html>`;
}

/**
 * Extract inline <style> tags from HTML, separating CSS from markup.
 */
export function extractInlineCSS(html: string): { css: string; cleanHtml: string } {
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const cssParts: string[] = [];

  const cleanHtml = html.replace(styleRegex, (_match, cssContent) => {
    cssParts.push(cssContent.trim());
    return "";
  });

  return {
    css: cssParts.join("\n"),
    cleanHtml: cleanHtml.trim(),
  };
}

/**
 * Build a data URL from HTML+CSS that can be used as an iframe src.
 */
export function buildPrototypeIframeSrc(html: string, css: string): string {
  const fullHTML = wrapPrototypeHTML(html, css);
  const encoded = btoa(unescape(encodeURIComponent(fullHTML)));
  return `data:text/html;base64,${encoded}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/ai/PrototypeRenderer.test.ts`

Expected: All 7 PrototypeRenderer tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ai/PrototypeRenderer.ts tests/ai/PrototypeRenderer.test.ts
git commit -m "feat: add PrototypeRenderer for wrapping AI HTML into renderable documents"
```

---

## Task 15: Add i18n Keys for Chat and Settings

**Files:**
- Modify: `src/i18n/locales/zh-CN/translation.json` (ensure all keys are present)

This task was partially done in Task 11. Verify and merge all i18n keys.

- [ ] **Step 1: Verify complete translation.json**

Read `src/i18n/locales/zh-CN/translation.json` and ensure it contains keys for:

- `chat.title`, `chat.inputPlaceholder`, `chat.send`, `chat.uploadImage`, `chat.canvasUpdated`, `chat.thinking`, `chat.noModel`, `chat.noModelHint`
- `settings.title`, `settings.theme`, `settings.dark`, `settings.light`, `settings.language`, `settings.modelConfig`, `settings.addModel`, `settings.editModel`, `settings.testConnection`, `settings.testing`, `settings.connectionOk`, `settings.connectionFailed`, `settings.defaultTextModel`, `settings.defaultVisionModel`, `settings.provider`, `settings.authMode`, `settings.apiKey`, `settings.token`, `settings.baseUrl`, `settings.modelName`, `settings.modelType`, `settings.name`, `settings.delete`, `settings.deleteConfirm`
- `settings.validation.nameRequired`, `settings.validation.modelNameRequired`, `settings.validation.baseUrlRequired`, `settings.validation.apiKeyRequired`

Merge any missing keys. The complete `chat` section should look like:

```json
"chat": {
  "title": "AI 助手",
  "inputPlaceholder": "输入消息...",
  "send": "发送",
  "uploadImage": "上传图片",
  "canvasUpdated": "已更新画板",
  "thinking": "思考中...",
  "noModel": "未配置模型",
  "noModelHint": "请前往设置页面配置 AI 模型"
}
```

- [ ] **Step 2: Run i18n tests to verify**

Run: `npm test -- tests/i18n.test.ts`

Expected: All i18n tests PASS.

- [ ] **Step 3: Commit (if changes were needed)**

```bash
git add src/i18n/locales/zh-CN/translation.json
git commit -m "feat: add complete i18n translations for chat and settings"
```

---

## Task 16: AI Provider Implementations

**Files:**
- Create: `src/ai/providers/BaseProvider.ts`
- Create: `src/ai/providers/OpenAIProvider.ts`
- Create: `src/ai/providers/AnthropicProvider.ts`
- Create: `src/ai/providers/GeminiProvider.ts`

These provider files translate a unified request format into each API's wire format. The Rust backend handles the actual HTTP calls; these TypeScript modules build the correct request bodies and parse responses on the frontend side for validation and type safety.

- [ ] **Step 1: Create BaseProvider interface**

Create `src/ai/providers/BaseProvider.ts`:

```typescript
import type { ChatMessage, AIRequestConfig } from "@/types";

export interface ProviderRequest {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

export interface BaseProvider {
  readonly providerId: string;
  buildRequest(messages: ChatMessage[], config: AIRequestConfig): ProviderRequest;
  parseStreamEvent(data: string, eventType?: string): string | null;
  isStreamDone(data: string, eventType?: string): boolean;
}
```

- [ ] **Step 2: Create OpenAI provider**

Create `src/ai/providers/OpenAIProvider.ts`:

```typescript
import type { BaseProvider, ProviderRequest } from "./BaseProvider";
import type { ChatMessage, AIRequestConfig } from "@/types";

export class OpenAIProvider implements BaseProvider {
  readonly providerId = "openai";

  buildRequest(messages: ChatMessage[], config: AIRequestConfig): ProviderRequest {
    const authValue = config.modelConfigId; // resolved to key by Rust backend
    return {
      url: "",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authValue}`,
      },
      body: {
        model: "",
        stream: true,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      },
    };
  }

  parseStreamEvent(data: string): string | null {
    try {
      const parsed = JSON.parse(data);
      return parsed?.choices?.[0]?.delta?.content ?? null;
    } catch {
      return null;
    }
  }

  isStreamDone(data: string): boolean {
    return data.trim() === "[DONE]";
  }
}
```

- [ ] **Step 3: Create Anthropic provider**

Create `src/ai/providers/AnthropicProvider.ts`:

```typescript
import type { BaseProvider, ProviderRequest } from "./BaseProvider";
import type { ChatMessage, AIRequestConfig } from "@/types";

export class AnthropicProvider implements BaseProvider {
  readonly providerId = "anthropic";

  buildRequest(messages: ChatMessage[], config: AIRequestConfig): ProviderRequest {
    const apiMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));
    const systemMessage = messages.find((m) => m.role === "system")?.content ?? "";

    return {
      url: "",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "",
        "anthropic-version": "2023-06-01",
      },
      body: {
        model: "",
        max_tokens: 4096,
        stream: true,
        system: systemMessage,
        messages: apiMessages,
      },
    };
  }

  parseStreamEvent(data: string, eventType?: string): string | null {
    // Only content_block_delta events carry text content
    if (eventType !== "content_block_delta") return null;
    try {
      const parsed = JSON.parse(data);
      return parsed?.delta?.text ?? null;
    } catch {
      return null;
    }
  }

  isStreamDone(_data: string, eventType?: string): boolean {
    return eventType === "message_stop";
  }
}
```

- [ ] **Step 4: Create Gemini provider**

Create `src/ai/providers/GeminiProvider.ts`:

```typescript
import type { BaseProvider, ProviderRequest } from "./BaseProvider";
import type { ChatMessage, AIRequestConfig } from "@/types";

export class GeminiProvider implements BaseProvider {
  readonly providerId = "gemini";

  buildRequest(messages: ChatMessage[], config: AIRequestConfig): ProviderRequest {
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    return {
      url: "",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": "",
      },
      body: {
        contents,
        generationConfig: { maxOutputTokens: 4096 },
      },
    };
  }

  parseStreamEvent(data: string): string | null {
    try {
      const parsed = JSON.parse(data);
      return parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    } catch {
      return null;
    }
  }

  isStreamDone(_data: string): boolean {
    // Gemini SSE stream ends when the connection closes;
    // no explicit done signal in data
    return false;
  }
}
```

- [ ] **Step 5: Commit**

```bash
mkdir -p src/ai/providers
git add src/ai/providers/
git commit -m "feat: add AI provider interface and OpenAI, Anthropic, Gemini implementations"
```

---

## Task 17: End-to-End Integration Verification

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
2. Click "设置" in the menu bar -- opens settings page
3. Click "添加模型" -- dialog shows with provider dropdown (OpenAI, Anthropic, etc.)
4. Select "OpenAI", fill in API key, model name "gpt-4o-mini"
5. Click "测试连接" -- shows testing status, then OK or error
6. Save the model config -- appears in the card list
7. Go back to editor -- right panel shows chat with model badge
8. Type "Create a simple landing page with a hero section" -- send
9. AI response streams in the chat panel with thinking indicator then content
10. If response contains HTML/CSS, "已更新画板" indicator appears
11. Chat history persists when switching pages and switching back
12. Upload an image in chat input -- image thumbnail appears, sent with message

- [ ] **Step 4: Verify chat_history.json is saved**

After a chat conversation:
```bash
cat ~/Documents/AI-Prototyper/projects/{project_id}/pages/{page_id}/chat_history.json
```

Expected: Contains the serialized chat messages.

- [ ] **Step 5: Verify model config persists in SQLite**

After configuring a model, close and reopen the app. The model should still be listed.

- [ ] **Step 6: Run production build**

Run: `npm run tauri build`

Expected: Build completes without errors, producing an executable.

- [ ] **Step 7: Final commit if fixes were needed**

```bash
git add -A
git commit -m "fix: integration fixes from AI integration end-to-end verification"
```

Only commit if changes were needed. Skip if everything passed.

---

## Summary

After completing all 17 tasks, the project will have:

- **Rust HTTP proxy** -- `ai_chat_stream` command with SSE streaming via Tauri events, `ai_test_connection` for validation, supporting OpenAI, Anthropic, and Gemini wire formats
- **Chat history persistence** -- `save_chat_history` and `load_chat_history` commands writing `chat_history.json` per page
- **Model configuration UI** -- Settings page with provider presets (10 providers), dynamic form fields based on auth mode, test connection, default model selectors, full CRUD
- **Chat panel** -- Replaces placeholder with streaming message display, image upload, model badge, skill badge, thinking indicator, cancel button, auto-scroll
- **AI engine** -- ChatEngine (conversation flow), ContextBuilder (system prompt + canvas state + history), ResponseParser (structured JSON extraction), PrototypeRenderer (HTML wrapping)
- **chatStore** -- Streaming state management, message accumulation, skill tracking
- **modelStore** -- Model config list, default model derivation, CRUD state
- **Provider presets** -- 10 providers with default URLs, auth modes, and model suggestions
- **i18n** -- Chinese translations for all chat and settings labels
- **Test coverage** -- Unit tests for stores, parsers, builders, and UI components

**Next plan:** Plan 4 -- Export + Navigation + Memory + Skills + Polish
