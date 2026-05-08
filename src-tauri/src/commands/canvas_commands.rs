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
    pool: tauri::State<'_, sqlx::SqlitePool>,
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
