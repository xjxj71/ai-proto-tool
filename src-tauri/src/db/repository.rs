use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: String,
    pub cover_image: String,
    pub canvas_preset: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Page {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub thumbnail: String,
    pub sort_order: i64,
    pub canvas_width: i64,
    pub canvas_height: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ModelConfig {
    pub id: String,
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
    pub connection_status: String,
    pub last_tested_at: String,
    pub created_at: String,
    pub updated_at: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_project_struct_serialization() {
        let project = Project {
            id: "test-id".to_string(),
            name: "Test Project".to_string(),
            description: "A test".to_string(),
            cover_image: "".to_string(),
            canvas_preset: "desktop_1440x900".to_string(),
            created_at: "2026-01-01T00:00:00Z".to_string(),
            updated_at: "2026-01-01T00:00:00Z".to_string(),
        };
        let json = serde_json::to_string(&project).unwrap();
        let deserialized: Project = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.id, "test-id");
        assert_eq!(deserialized.name, "Test Project");
    }

    #[test]
    fn test_page_struct_serialization() {
        let page = Page {
            id: "page-id".to_string(),
            project_id: "proj-id".to_string(),
            name: "Home".to_string(),
            thumbnail: "".to_string(),
            sort_order: 0,
            canvas_width: 1440,
            canvas_height: 900,
            created_at: "2026-01-01T00:00:00Z".to_string(),
            updated_at: "2026-01-01T00:00:00Z".to_string(),
        };
        let json = serde_json::to_string(&page).unwrap();
        let deserialized: Page = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.project_id, "proj-id");
        assert_eq!(deserialized.canvas_width, 1440);
    }

    #[test]
    fn test_model_config_struct_serialization() {
        let config = ModelConfig {
            id: "cfg-id".to_string(),
            name: "GPT-4o".to_string(),
            provider: "openai".to_string(),
            auth_mode: "standard_api".to_string(),
            base_url: "https://api.openai.com/v1".to_string(),
            api_key: "sk-test".to_string(),
            token: "".to_string(),
            model_name: "gpt-4o".to_string(),
            model_type: "both".to_string(),
            is_default_text: true,
            is_default_vision: true,
            connection_status: "ok".to_string(),
            last_tested_at: "2026-01-01T00:00:00Z".to_string(),
            created_at: "2026-01-01T00:00:00Z".to_string(),
            updated_at: "2026-01-01T00:00:00Z".to_string(),
        };
        let json = serde_json::to_string(&config).unwrap();
        let deserialized: ModelConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.provider, "openai");
        assert!(deserialized.is_default_text);
        assert!(deserialized.is_default_vision);
    }
}
