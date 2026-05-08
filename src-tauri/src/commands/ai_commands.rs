use futures_util::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};

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
    pool: State<'_, sqlx::SqlitePool>,
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
        let text = response.text().await.unwrap_or_else(|e| {
            eprintln!("Failed to read error response body: {}", e);
            String::new()
        });
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
    pool: State<'_, sqlx::SqlitePool>,
    active: State<'_, ActiveRequests>,
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
        let text = response.text().await.unwrap_or_else(|e| {
            eprintln!("Failed to read error response body: {}", e);
            String::new()
        });
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
        let mut current_event = String::new();
        let request_id = input.request_id.clone();

        // Register request as active so it can be cancelled
        {
            let mut map = active.0.lock().map_err(|e| format!("Lock error: {}", e))?;
            map.insert(request_id.clone(), true);
        }

        let cleanup = || {
            if let Ok(mut map) = active.0.lock() {
                map.remove(&request_id);
            }
        };

        while let Some(chunk_result) = stream.next().await {
            // Check if request was cancelled
            {
                let map = active.0.lock().map_err(|e| format!("Lock error: {}", e))?;
                if !map.contains_key(&request_id) {
                    let cancel_chunk = StreamChunk {
                        request_id: request_id.clone(),
                        event_type: "cancelled".to_string(),
                        content: None,
                        error: None,
                    };
                    let _ = app.emit("ai-stream", &cancel_chunk);
                    cleanup();
                    return Ok(());
                }
            }

            let chunk = chunk_result.map_err(|e| format!("Stream error: {}", e))?;
            buffer.push_str(&String::from_utf8_lossy(&chunk));

            while let Some(line) = extract_sse_line(&mut buffer) {
                if let Some(event_type) = line.strip_prefix("event: ") {
                    current_event = event_type.trim().to_string();
                    continue;
                }

                if config.provider == "anthropic" && current_event == "message_stop" {
                    let done_chunk = StreamChunk {
                        request_id: request_id.clone(),
                        event_type: "done".to_string(),
                        content: None,
                        error: None,
                    };
                    let _ = app.emit("ai-stream", &done_chunk);
                    cleanup();
                    return Ok(());
                }

                if line.starts_with("data: [DONE]") || line.starts_with("data: [done]") {
                    let done_chunk = StreamChunk {
                        request_id: request_id.clone(),
                        event_type: "done".to_string(),
                        content: None,
                        error: None,
                    };
                    let _ = app.emit("ai-stream", &done_chunk);
                    cleanup();
                    return Ok(());
                }

                if let Some(data) = line.strip_prefix("data: ") {
                    if let Some(content) =
                        extract_content_from_sse(&config, data, &current_event)
                    {
                        let stream_chunk = StreamChunk {
                            request_id: request_id.clone(),
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
            request_id: request_id.clone(),
            event_type: "done".to_string(),
            content: None,
            error: None,
        };
        let _ = app.emit("ai-stream", &done_chunk);
        cleanup();
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

fn extract_content_from_sse(
    config: &ModelConfig,
    data: &str,
    current_event: &str,
) -> Option<String> {
    let parsed: serde_json::Value = serde_json::from_str(data).ok()?;

    if config.provider == "anthropic" {
        if current_event == "content_block_delta" {
            parsed
                .get("delta")
                .and_then(|d| d.get("text"))
                .and_then(|t| t.as_str())
                .map(|s| s.to_string())
        } else {
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
    pool: &State<'_, sqlx::SqlitePool>,
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
    pool: State<'_, sqlx::SqlitePool>,
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

    if is_default_text {
        sqlx::query("UPDATE model_configs SET is_default_text = 0")
            .execute(pool.inner())
            .await
            .map_err(|e| e.to_string())?;
    }
    if is_default_vision {
        sqlx::query("UPDATE model_configs SET is_default_vision = 0")
            .execute(pool.inner())
            .await
            .map_err(|e| e.to_string())?;
    }

    sqlx::query("UPDATE model_configs SET name=?, provider=?, auth_mode=?, base_url=?, api_key=?, token=?, model_name=?, model_type=?, is_default_text=?, is_default_vision=?, updated_at=? WHERE id=?")
        .bind(&name).bind(&provider).bind(&auth_mode).bind(&base_url)
        .bind(&api_key).bind(&token).bind(&model_name).bind(&model_type)
        .bind(is_default_text).bind(is_default_vision).bind(&now).bind(&id)
        .execute(pool.inner())
        .await.map_err(|e| e.to_string())?;

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
            config
                .api_key
                .parse()
                .map_err(|_| "Invalid API key".to_string())?,
        );
        headers.insert("anthropic-version", "2023-06-01".parse().unwrap());
        format!("{}/v1/messages", config.base_url.trim_end_matches('/'))
    } else if config.provider == "gemini" {
        headers.insert(
            "x-goog-api-key",
            config
                .api_key
                .parse()
                .map_err(|_| "Invalid API key".to_string())?,
        );
        format!(
            "{}/v1beta/models/{}:streamGenerateContent?alt=sse",
            config.base_url.trim_end_matches('/'),
            config.model_name,
        )
    } else {
        let auth = if config.auth_mode == "token_plan" {
            config.token.clone()
        } else {
            config.api_key.clone()
        };
        headers.insert(
            reqwest::header::AUTHORIZATION,
            format!("Bearer {}", auth)
                .parse()
                .map_err(|_| "Invalid auth token".to_string())?,
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
            let role = if msg.role == "assistant" {
                "model"
            } else {
                "user"
            };
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
