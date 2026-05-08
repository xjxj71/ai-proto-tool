use std::fs;
use std::path::{Path, PathBuf};

pub fn get_app_data_dir() -> Result<PathBuf, String> {
    let dir = ::dirs::document_dir()
        .ok_or("Cannot determine Documents directory")?
        .join("AI-Prototyper");
    Ok(dir)
}

pub fn initialize_app_directories(base_dir: &Path) -> Result<(), String> {
    let dirs = [
        base_dir.join("projects"),
        base_dir.join("components").join("built-in"),
        base_dir.join("components").join("custom"),
        base_dir.join("memory").join("saved_modules"),
        base_dir.join("memory").join("project_context"),
        base_dir.join("memory").join("chat_summaries"),
        base_dir.join("skills"),
        base_dir.join("config"),
    ];

    for dir in &dirs {
        fs::create_dir_all(dir).map_err(|e| format!("Failed to create {}: {}", dir.display(), e))?;
    }

    Ok(())
}

pub fn create_project_directories(base_dir: &Path, project_id: &str) -> Result<PathBuf, String> {
    let project_dir = base_dir.join("projects").join(project_id);
    let dirs = [
        project_dir.join("pages"),
        project_dir.join("sketches"),
        project_dir.join("snapshots"),
    ];

    for dir in &dirs {
        fs::create_dir_all(dir).map_err(|e| format!("Failed to create {}: {}", dir.display(), e))?;
    }

    Ok(project_dir)
}

pub fn create_page_directory(base_dir: &Path, project_id: &str, page_id: &str) -> Result<PathBuf, String> {
    let page_dir = base_dir
        .join("projects")
        .join(project_id)
        .join("pages")
        .join(page_id);

    fs::create_dir_all(&page_dir)
        .map_err(|e| format!("Failed to create {}: {}", page_dir.display(), e))?;

    Ok(page_dir)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_app_data_dir_returns_path() {
        let dir = get_app_data_dir();
        if let Ok(path) = dir {
            assert!(path.to_string_lossy().contains("AI-Prototyper"));
        }
    }

    #[test]
    fn test_initialize_app_directories_creates_structure() {
        let temp_dir = std::env::temp_dir().join("ai_proto_test_dirs");
        let _ = fs::remove_dir_all(&temp_dir);
        let result = initialize_app_directories(temp_dir.as_path());
        assert!(result.is_ok());
        assert!(temp_dir.join("projects").exists());
        assert!(temp_dir.join("components/built-in").exists());
        assert!(temp_dir.join("components/custom").exists());
        assert!(temp_dir.join("memory/saved_modules").exists());
        assert!(temp_dir.join("memory/project_context").exists());
        assert!(temp_dir.join("memory/chat_summaries").exists());
        assert!(temp_dir.join("skills").exists());
        assert!(temp_dir.join("config").exists());
        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_create_project_directories() {
        let temp_dir = std::env::temp_dir().join("ai_proto_test_proj");
        let _ = fs::remove_dir_all(&temp_dir);
        let result = create_project_directories(temp_dir.as_path(), "test-proj-id");
        assert!(result.is_ok());
        let proj_dir = result.unwrap();
        assert!(proj_dir.join("pages").exists());
        assert!(proj_dir.join("sketches").exists());
        assert!(proj_dir.join("snapshots").exists());
        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_create_page_directory() {
        let temp_dir = std::env::temp_dir().join("ai_proto_test_page");
        let _ = fs::remove_dir_all(&temp_dir);
        let result = create_page_directory(temp_dir.as_path(), "proj-id", "page-id");
        assert!(result.is_ok());
        assert!(temp_dir.join("projects/proj-id/pages/page-id").exists());
        let _ = fs::remove_dir_all(&temp_dir);
    }
}
