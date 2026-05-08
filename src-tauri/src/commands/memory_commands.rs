use crate::fs::{dirs, io};
use std::path::PathBuf;

fn validate_path(app_dir: &std::path::Path, path: &str) -> Result<PathBuf, String> {
    let full_path = app_dir.join(path);
    let canonical_app = app_dir.canonicalize().unwrap_or_else(|_| app_dir.to_path_buf());
    let canonical_full = full_path
        .canonicalize()
        .unwrap_or_else(|_| full_path.clone());
    if !canonical_full.starts_with(&canonical_app) {
        return Err("Path traversal detected: path escapes app data directory".to_string());
    }
    Ok(full_path)
}

fn validate_id(id: &str) -> Result<(), String> {
    if id.contains('/') || id.contains('\\') || id.contains("..") {
        return Err("Invalid module id: contains path separators".to_string());
    }
    Ok(())
}

#[tauri::command]
pub async fn read_json_file(path: String) -> Result<serde_json::Value, String> {
    let app_dir = dirs::get_app_data_dir()?;
    let full_path = validate_path(&app_dir, &path)?;
    if !full_path.exists() {
        return Err("File not found".to_string());
    }
    io::read_json(&full_path)
}

#[tauri::command]
pub async fn write_json_file(path: String, data: serde_json::Value) -> Result<(), String> {
    let app_dir = dirs::get_app_data_dir()?;
    let full_path = validate_path(&app_dir, &path)?;
    if let Some(parent) = full_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }
    io::write_json(&full_path, &data)
}

#[tauri::command]
pub async fn list_saved_modules() -> Result<Vec<serde_json::Value>, String> {
    let app_dir = dirs::get_app_data_dir()?;
    let modules_dir = app_dir.join("memory/saved_modules");
    if !modules_dir.exists() {
        return Ok(vec![]);
    }
    let mut modules = Vec::new();
    for entry in std::fs::read_dir(&modules_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let meta_path = entry.path().join("meta.json");
        if meta_path.exists() {
            let meta: serde_json::Value = io::read_json(&meta_path)?;
            modules.push(meta);
        }
    }
    Ok(modules)
}

#[tauri::command]
pub async fn save_module(module: serde_json::Value) -> Result<(), String> {
    let app_dir = dirs::get_app_data_dir()?;
    let id = module["id"].as_str().ok_or("Missing module id")?;
    validate_id(id)?;
    let module_dir = app_dir.join("memory/saved_modules").join(id);
    std::fs::create_dir_all(&module_dir).map_err(|e| e.to_string())?;
    io::write_json(&module_dir.join("meta.json"), &module)
}

#[tauri::command]
pub async fn delete_module(id: String) -> Result<(), String> {
    validate_id(&id)?;
    let app_dir = dirs::get_app_data_dir()?;
    let module_dir = app_dir.join("memory/saved_modules").join(&id);
    let canonical_app = app_dir.canonicalize().unwrap_or_else(|_| app_dir.to_path_buf());
    let canonical_module = module_dir
        .canonicalize()
        .unwrap_or_else(|_| module_dir.clone());
    if !canonical_module.starts_with(&canonical_app) {
        return Err("Path traversal detected: module path escapes app data directory".to_string());
    }
    if module_dir.exists() {
        std::fs::remove_dir_all(&module_dir).map_err(|e| e.to_string())?;
    }
    Ok(())
}
