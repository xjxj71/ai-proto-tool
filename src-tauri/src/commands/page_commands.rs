use crate::db::repository::Page;
use crate::fs::dirs;
use serde::Deserialize;
use tauri::State;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePageInput {
    pub project_id: String,
    pub name: String,
    pub canvas_width: i64,
    pub canvas_height: i64,
}

#[tauri::command]
pub async fn create_page(
    pool: State<'_, sqlx::SqlitePool>,
    input: CreatePageInput,
) -> Result<Page, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let max_order: i64 = sqlx::query_scalar(
        "SELECT COALESCE(MAX(sort_order), -1) FROM pages WHERE project_id = ?"
    )
    .bind(&input.project_id)
    .fetch_one(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let sort_order = max_order + 1;

    let page = Page {
        id: id.clone(),
        project_id: input.project_id.clone(),
        name: input.name,
        thumbnail: String::new(),
        sort_order,
        canvas_width: input.canvas_width,
        canvas_height: input.canvas_height,
        created_at: now.clone(),
        updated_at: now,
    };

    sqlx::query(
        "INSERT INTO pages (id, project_id, name, thumbnail, sort_order, canvas_width, canvas_height, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&page.id)
    .bind(&page.project_id)
    .bind(&page.name)
    .bind(&page.thumbnail)
    .bind(&page.sort_order)
    .bind(&page.canvas_width)
    .bind(&page.canvas_height)
    .bind(&page.created_at)
    .bind(&page.updated_at)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let app_dir = dirs::get_app_data_dir()?;
    dirs::create_page_directory(&app_dir, &input.project_id, &id)?;

    Ok(page)
}

#[tauri::command]
pub async fn list_pages(
    pool: State<'_, sqlx::SqlitePool>,
    project_id: String,
) -> Result<Vec<Page>, String> {
    let pages = sqlx::query_as::<_, Page>(
        "SELECT id, project_id, name, thumbnail, sort_order, canvas_width, canvas_height, created_at, updated_at FROM pages WHERE project_id = ? ORDER BY sort_order ASC"
    )
    .bind(&project_id)
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(pages)
}

#[tauri::command]
pub async fn delete_page(pool: State<'_, sqlx::SqlitePool>, id: String) -> Result<(), String> {
    let page: Page = sqlx::query_as::<_, Page>(
        "SELECT id, project_id, name, thumbnail, sort_order, canvas_width, canvas_height, created_at, updated_at FROM pages WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query("DELETE FROM pages WHERE id = ?")
        .bind(&id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    let app_dir = dirs::get_app_data_dir()?;
    let page_dir = app_dir.join("projects").join(&page.project_id).join("pages").join(&id);
    if page_dir.exists() {
        std::fs::remove_dir_all(&page_dir)
            .map_err(|e| format!("Failed to remove page directory: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn rename_page(
    pool: State<'_, sqlx::SqlitePool>,
    id: String,
    name: String,
) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();
    sqlx::query("UPDATE pages SET name = ?, updated_at = ? WHERE id = ?")
        .bind(&name)
        .bind(&now)
        .bind(&id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}
