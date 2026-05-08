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
        return Ok(
            r#"{"pageId":"","projectId":"","messages":[],"updatedAt":""}"#.to_string(),
        );
    }

    std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read chat_history.json: {}", e))
}
