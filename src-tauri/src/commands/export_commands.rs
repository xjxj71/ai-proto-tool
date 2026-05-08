use crate::export::html_generator::{self, ExportPageData};

#[tauri::command]
pub async fn export_single_page(data: ExportPageData) -> Result<String, String> {
    let html = html_generator::generate_single_page_html(&data);
    Ok(html)
}

#[tauri::command]
pub async fn export_batch_pages(
    pages: Vec<ExportPageData>,
    project_name: String,
) -> Result<Vec<html_generator::ExportResult>, String> {
    let mut results = Vec::new();

    for page in &pages {
        let html = html_generator::generate_single_page_html(page);
        let file_name = format!("page-{}.html", page.page_name);
        results.push(html_generator::ExportResult {
            content: html,
            file_name,
        });
    }

    let index_html = html_generator::generate_index_html(
        &pages
            .iter()
            .zip(results.iter())
            .map(|(p, r)| (p.page_name.as_str(), r.file_name.as_str()))
            .collect::<Vec<_>>(),
    );

    let _ = project_name; // Used for logging/directory naming in caller

    results.push(html_generator::ExportResult {
        content: index_html,
        file_name: "index.html".to_string(),
    });

    Ok(results)
}
