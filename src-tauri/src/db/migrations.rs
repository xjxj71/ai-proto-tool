pub const CREATE_PROJECTS: &str = r#"
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    cover_image TEXT NOT NULL DEFAULT '',
    canvas_preset TEXT NOT NULL DEFAULT 'desktop_1440x900',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
"#;

pub const CREATE_PAGES: &str = r#"
CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    thumbnail TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    canvas_width INTEGER NOT NULL DEFAULT 1440,
    canvas_height INTEGER NOT NULL DEFAULT 900,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
"#;

pub const CREATE_MODEL_CONFIGS: &str = r#"
CREATE TABLE IF NOT EXISTS model_configs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    auth_mode TEXT NOT NULL DEFAULT 'standard_api',
    base_url TEXT NOT NULL DEFAULT '',
    api_key TEXT NOT NULL DEFAULT '',
    token TEXT NOT NULL DEFAULT '',
    model_name TEXT NOT NULL,
    model_type TEXT NOT NULL DEFAULT 'text',
    is_default_text INTEGER NOT NULL DEFAULT 0,
    is_default_vision INTEGER NOT NULL DEFAULT 0,
    connection_status TEXT NOT NULL DEFAULT '',
    last_tested_at TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
"#;
