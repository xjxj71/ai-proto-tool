mod commands;
mod db;
mod export;
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
            commands::page_commands::reorder_pages,
            commands::page_commands::duplicate_page,
            commands::page_commands::update_page_dimensions,
            commands::model_commands::create_model_config,
            commands::model_commands::list_model_configs,
            commands::model_commands::delete_model_config,
            commands::canvas_commands::save_canvas_json,
            commands::canvas_commands::load_canvas_json,
            commands::canvas_commands::save_page_thumbnail,
            commands::canvas_commands::update_page_thumbnail_path,
            commands::ai_commands::ai_test_connection,
            commands::ai_commands::ai_chat_stream,
            commands::ai_commands::cancel_ai_request,
            commands::ai_commands::update_model_config,
            commands::chat_commands::save_chat_history,
            commands::chat_commands::load_chat_history,
            commands::export_commands::export_single_page,
            commands::export_commands::export_batch_pages,
            commands::snapshot_commands::create_snapshot,
            commands::snapshot_commands::list_snapshots,
            commands::snapshot_commands::restore_snapshot,
            commands::snapshot_commands::delete_snapshot,
            commands::memory_commands::read_json_file,
            commands::memory_commands::write_json_file,
            commands::memory_commands::list_saved_modules,
            commands::memory_commands::save_module,
            commands::memory_commands::delete_module,
        ])
        .manage(commands::ai_commands::ActiveRequests(std::sync::Mutex::new(std::collections::HashMap::new())))
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
                let pool = SqlitePool::connect(&db_path).await.map_err(|e| {
                    eprintln!("Database initialization failed: {}", e);
                    Box::new(std::io::Error::new(
                        std::io::ErrorKind::Other,
                        format!("Database initialization failed: {}", e),
                    )) as Box<dyn std::error::Error>
                })?;

                if let Err(e) = sqlx::query(db::migrations::CREATE_PROJECTS).execute(&pool).await {
                    eprintln!("Projects migration failed: {}", e);
                    return Err(Box::new(std::io::Error::new(
                        std::io::ErrorKind::Other,
                        format!("Projects migration failed: {}", e),
                    )) as Box<dyn std::error::Error>);
                }
                if let Err(e) = sqlx::query(db::migrations::CREATE_PAGES).execute(&pool).await {
                    eprintln!("Pages migration failed: {}", e);
                    return Err(Box::new(std::io::Error::new(
                        std::io::ErrorKind::Other,
                        format!("Pages migration failed: {}", e),
                    )) as Box<dyn std::error::Error>);
                }
                if let Err(e) = sqlx::query(db::migrations::CREATE_MODEL_CONFIGS).execute(&pool).await {
                    eprintln!("Model configs migration failed: {}", e);
                    return Err(Box::new(std::io::Error::new(
                        std::io::ErrorKind::Other,
                        format!("Model configs migration failed: {}", e),
                    )) as Box<dyn std::error::Error>);
                }

                Ok(pool)
            }).map_err(|e: Box<dyn std::error::Error>| e)?;

            app.manage(pool);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
