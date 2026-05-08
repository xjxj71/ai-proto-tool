use serde::{Deserialize, Serialize};

fn escape_html(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#x27;")
}

fn escape_js_string(s: &str) -> String {
    s.replace('\\', "\\\\")
        .replace('\'', "\\'")
        .replace('"', "\\\"")
        .replace('\n', "\\n")
        .replace('\r', "\\r")
}

#[derive(Debug, Deserialize)]
pub struct ExportPageData {
    pub page_name: String,
    pub html_content: String,
    pub css_content: String,
    pub width: i64,
    pub height: i64,
    pub links: Vec<LinkData>,
}

#[derive(Debug, Deserialize)]
pub struct LinkData {
    pub element_selector: String,
    pub target_file: String,
}

#[derive(Debug, Serialize)]
pub struct ExportResult {
    pub content: String,
    pub file_name: String,
}

pub fn generate_single_page_html(data: &ExportPageData) -> String {
    let links_script = generate_links_script(&data.links);
    let safe_page_name = escape_html(&data.page_name);
    let safe_css = &data.css_content;
    let safe_html = &data.html_content;

    format!(
        r#"<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{page_name}</title>
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ width: {width}px; min-height: {height}px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }}
{css}
</style>
</head>
<body>
{html}
{links_script}
</body>
</html>"#,
        page_name = safe_page_name,
        width = data.width,
        height = data.height,
        css = safe_css,
        html = safe_html,
        links_script = links_script,
    )
}

pub fn generate_index_html(pages: &[(&str, &str)]) -> String {
    let page_links: Vec<String> = pages
        .iter()
        .map(|(name, file)| {
            let safe_name = escape_html(name);
            let safe_file = escape_html(file);
            format!(
                r#"<li><a href="{file}" style="display:block;padding:12px 16px;color:#7c6aef;text-decoration:none;border-bottom:1px solid #2a2a4a;">{name}</a></li>"#,
                file = safe_file,
                name = safe_name,
            )
        })
        .collect();

    format!(
        r#"<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>项目导航</title>
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ background: #1a1a2e; color: #e0e0e0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; }}
h1 {{ margin-bottom: 24px; font-size: 24px; }}
ul {{ list-style: none; background: #1e1e3a; border-radius: 8px; border: 1px solid #2a2a4a; overflow: hidden; }}
a:hover {{ background: #0f3460; }}
</style>
</head>
<body>
<h1>项目页面导航</h1>
<ul>{links}</ul>
</body>
</html>"#,
        links = page_links.join("\n"),
    )
}

fn generate_links_script(links: &[LinkData]) -> String {
    if links.is_empty() {
        return String::new();
    }

    let handlers: Vec<String> = links
        .iter()
        .map(|link| {
            let safe_selector = escape_js_string(&link.element_selector);
            let safe_target = escape_js_string(&link.target_file);
            format!(
                r#"{{
          selector: '{}',
          target: '{}'
        }}"#,
                safe_selector, safe_target,
            )
        })
        .collect();

    format!(
        r#"<script>
document.addEventListener('DOMContentLoaded', function() {{
  const links = [{handlers}];
  links.forEach(function(link) {{
    const el = document.querySelector(link.selector);
    if (el) {{
      el.style.cursor = 'pointer';
      el.addEventListener('click', function() {{ window.location.href = link.target; }});
    }}
  }});
}});
</script>"#,
        handlers = handlers.join(", "),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_single_page_html() {
        let data = ExportPageData {
            page_name: "首页".to_string(),
            html_content: "<div class='hero'>Hello</div>".to_string(),
            css_content: ".hero { color: red; }".to_string(),
            width: 1440,
            height: 900,
            links: vec![],
        };
        let html = generate_single_page_html(&data);
        assert!(html.contains("<title>首页</title>"));
        assert!(html.contains(".hero { color: red; }"));
        assert!(html.contains("<div class='hero'>Hello</div>"));
        assert!(html.contains("1440px"));
    }

    #[test]
    fn test_generate_page_with_links() {
        let data = ExportPageData {
            page_name: "首页".to_string(),
            html_content: "<button id='btn'>详情</button>".to_string(),
            css_content: "".to_string(),
            width: 1440,
            height: 900,
            links: vec![LinkData {
                element_selector: "#btn".to_string(),
                target_file: "page-详情.html".to_string(),
            }],
        };
        let html = generate_single_page_html(&data);
        assert!(html.contains("page-详情.html"));
        assert!(html.contains("querySelector"));
    }

    #[test]
    fn test_generate_index_html() {
        let pages = vec![("首页", "page-首页.html"), ("详情", "page-详情.html")];
        let html = generate_index_html(&pages);
        assert!(html.contains("项目页面导航"));
        assert!(html.contains("page-首页.html"));
        assert!(html.contains("page-详情.html"));
    }
}
