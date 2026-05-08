use crate::db::repository::Project;
use crate::fs::dirs;
use crate::fs::io;
use serde::Deserialize;
use tauri::State;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateProjectInput {
    pub name: String,
    pub description: String,
    pub canvas_preset: String,
}

#[tauri::command]
pub async fn create_project(
    pool: State<'_, sqlx::SqlitePool>,
    input: CreateProjectInput,
) -> Result<Project, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let project = Project {
        id: id.clone(),
        name: input.name,
        description: input.description,
        cover_image: String::new(),
        canvas_preset: input.canvas_preset,
        created_at: now.clone(),
        updated_at: now,
    };

    sqlx::query(
        "INSERT INTO projects (id, name, description, cover_image, canvas_preset, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&project.id)
    .bind(&project.name)
    .bind(&project.description)
    .bind(&project.cover_image)
    .bind(&project.canvas_preset)
    .bind(&project.created_at)
    .bind(&project.updated_at)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let app_dir = dirs::get_app_data_dir()?;
    dirs::create_project_directories(&app_dir, &id)?;

    let meta_path = app_dir.join("projects").join(&id).join("meta.json");
    io::write_json(&meta_path, &project)?;

    Ok(project)
}

#[tauri::command]
pub async fn list_projects(pool: State<'_, sqlx::SqlitePool>) -> Result<Vec<Project>, String> {
    let projects = sqlx::query_as::<_, Project>(
        "SELECT id, name, description, cover_image, canvas_preset, created_at, updated_at FROM projects ORDER BY updated_at DESC"
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(projects)
}

#[tauri::command]
pub async fn get_project(pool: State<'_, sqlx::SqlitePool>, id: String) -> Result<Project, String> {
    let project = sqlx::query_as::<_, Project>(
        "SELECT id, name, description, cover_image, canvas_preset, created_at, updated_at FROM projects WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(project)
}

#[tauri::command]
pub async fn delete_project(pool: State<'_, sqlx::SqlitePool>, id: String) -> Result<(), String> {
    sqlx::query("DELETE FROM projects WHERE id = ?")
        .bind(&id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    let app_dir = dirs::get_app_data_dir()?;
    let project_dir = app_dir.join("projects").join(&id);
    if project_dir.exists() {
        std::fs::remove_dir_all(&project_dir)
            .map_err(|e| format!("Failed to remove project directory: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn update_project(
    pool: State<'_, sqlx::SqlitePool>,
    id: String,
    name: String,
    description: String,
) -> Result<Project, String> {
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query("UPDATE projects SET name = ?, description = ?, updated_at = ? WHERE id = ?")
        .bind(&name)
        .bind(&description)
        .bind(&now)
        .bind(&id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query_as::<_, Project>(
        "SELECT id, name, description, cover_image, canvas_preset, created_at, updated_at FROM projects WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(&*pool)
    .await
    .map_err(|e| e.to_string())
}
