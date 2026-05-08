mod commands;
mod db;
mod fs;

use sqlx::SqlitePool;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::project_commands::create_project,
            commands::project_commands::list_projects,
            commands::project_commands::get_project,
            commands::project_commands::delete_project,
            commands::project_commands::update_project,
            commands::page_commands::create_page,
            commands::page_commands::list_pages,
            commands::page_commands::delete_page,
            commands::page_commands::rename_page,
            commands::model_commands::create_model_config,
            commands::model_commands::list_model_configs,
            commands::model_commands::delete_model_config,
        ])
        .setup(|app| {
            let app_data_dir = match app.path().app_data_dir() {
                Ok(dir) => dir,
                Err(e) => {
                    eprintln!("Failed to get app data directory: {}", e);
                    return Err(e.into());
                }
            };

            if let Err(e) = std::fs::create_dir_all(&app_data_dir) {
                eprintln!("Failed to create app data directory: {}", e);
                return Err(Box::new(std::io::Error::new(
                    std::io::ErrorKind::Other,
                    format!("Failed to create app data directory: {}", e),
                )) as Box<dyn std::error::Error>);
            }

            let doc_dir = match fs::dirs::get_app_data_dir() {
                Ok(dir) => dir,
                Err(e) => {
                    eprintln!("Failed to get document directory: {}", e);
                    return Err(Box::new(std::io::Error::new(
                        std::io::ErrorKind::Other,
                        format!("Failed to get document directory: {}", e),
                    )) as Box<dyn std::error::Error>);
                }
            };

            if let Err(e) = fs::dirs::initialize_app_directories(&doc_dir) {
                eprintln!("Failed to initialize directories: {}", e);
                return Err(Box::new(std::io::Error::new(
                    std::io::ErrorKind::Other,
                    format!("Failed to initialize directories: {}", e),
                )) as Box<dyn std::error::Error>);
            }

            let db_path = format!("sqlite:{}/app.db?mode=rwc", app_data_dir.display());
            let pool = tauri::async_runtime::block_on(async {
                let pool = match SqlitePool::connect(&db_path).await {
                    Ok(pool) => pool,
                    Err(e) => {
                        eprintln!("Database initialization failed: {}", e);
                        panic!("Database initialization failed: {}", e);
                    }
                };

                if let Err(e) = sqlx::query(db::migrations::CREATE_PROJECTS).execute(&pool).await {
                    eprintln!("Projects migration failed: {}", e);
                    panic!("Projects migration failed: {}", e);
                }
                if let Err(e) = sqlx::query(db::migrations::CREATE_PAGES).execute(&pool).await {
                    eprintln!("Pages migration failed: {}", e);
                    panic!("Pages migration failed: {}", e);
                }
                if let Err(e) = sqlx::query(db::migrations::CREATE_MODEL_CONFIGS).execute(&pool).await {
                    eprintln!("Model configs migration failed: {}", e);
                    panic!("Model configs migration failed: {}", e);
                }

                pool
            });

            app.manage(pool);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
