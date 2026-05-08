use crate::fs::{dirs, io};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SnapshotMeta {
    pub id: String,
    pub name: String,
    pub created_at: String,
}

#[tauri::command]
pub async fn create_snapshot(
    project_id: String,
    page_id: String,
    name: String,
    canvas_json: String,
) -> Result<SnapshotMeta, String> {
    let _ = page_id; // Used for future page-specific snapshot scoping
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let meta = SnapshotMeta {
        id: id.clone(),
        name,
        created_at: now,
    };

    let app_dir = dirs::get_app_data_dir()?;
    let snapshot_dir = app_dir
        .join("projects")
        .join(&project_id)
        .join("snapshots")
        .join(&id);

    std::fs::create_dir_all(&snapshot_dir)
        .map_err(|e| format!("Failed to create snapshot dir: {}", e))?;

    let meta_path = snapshot_dir.join("meta.json");
    io::write_json(&meta_path, &meta)?;

    let canvas_path = snapshot_dir.join("canvas.json");
    std::fs::write(&canvas_path, canvas_json)
        .map_err(|e| format!("Failed to write canvas: {}", e))?;

    Ok(meta)
}

#[tauri::command]
pub async fn list_snapshots(project_id: String) -> Result<Vec<SnapshotMeta>, String> {
    let app_dir = dirs::get_app_data_dir()?;
    let snapshots_dir = app_dir.join("projects").join(&project_id).join("snapshots");

    if !snapshots_dir.exists() {
        return Ok(vec![]);
    }

    let mut snapshots = Vec::new();
    let entries = std::fs::read_dir(&snapshots_dir)
        .map_err(|e| format!("Failed to read snapshots dir: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let meta_path = entry.path().join("meta.json");
        if meta_path.exists() {
            let meta: SnapshotMeta = io::read_json(&meta_path)?;
            snapshots.push(meta);
        }
    }

    snapshots.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(snapshots)
}

#[tauri::command]
pub async fn restore_snapshot(
    project_id: String,
    page_id: String,
    snapshot_id: String,
) -> Result<String, String> {
    let app_dir = dirs::get_app_data_dir()?;
    let snapshot_canvas = app_dir
        .join("projects")
        .join(&project_id)
        .join("snapshots")
        .join(&snapshot_id)
        .join("canvas.json");

    let canvas_data = std::fs::read_to_string(&snapshot_canvas)
        .map_err(|e| format!("Failed to read snapshot canvas: {}", e))?;

    let page_canvas_path = app_dir
        .join("projects")
        .join(&project_id)
        .join("pages")
        .join(&page_id)
        .join("canvas.json");

    std::fs::write(&page_canvas_path, &canvas_data)
        .map_err(|e| format!("Failed to restore canvas: {}", e))?;

    Ok(canvas_data)
}

#[tauri::command]
pub async fn delete_snapshot(project_id: String, snapshot_id: String) -> Result<(), String> {
    let app_dir = dirs::get_app_data_dir()?;
    let snapshot_dir = app_dir
        .join("projects")
        .join(&project_id)
        .join("snapshots")
        .join(&snapshot_id);

    if snapshot_dir.exists() {
        std::fs::remove_dir_all(&snapshot_dir)
            .map_err(|e| format!("Failed to delete snapshot: {}", e))?;
    }

    Ok(())
}
