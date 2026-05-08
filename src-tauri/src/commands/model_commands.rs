use crate::db::repository::ModelConfig;
use serde::Deserialize;
use tauri::State;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
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
