use std::fs;
use std::path::Path;

pub fn write_json<T: serde::Serialize>(path: &Path, data: &T) -> Result<(), String> {
    let parent = path.parent().ok_or("Invalid path: no parent directory")?;
    fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
    let json = serde_json::to_string_pretty(data).map_err(|e| format!("Failed to serialize: {}", e))?;
    fs::write(path, json).map_err(|e| format!("Failed to write file: {}", e))?;
    Ok(())
}

pub fn read_json<T: serde::de::DeserializeOwned>(path: &Path) -> Result<T, String> {
    let content = fs::read_to_string(path).map_err(|e| format!("Failed to read file: {}", e))?;
    serde_json::from_str(&content).map_err(|e| format!("Failed to parse JSON: {}", e))
}

pub fn file_exists(path: &Path) -> bool {
    path.exists() && path.is_file()
}
