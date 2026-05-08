export function wrapPrototypeHTML(html: string, css: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  ${css}
</style>
</head>
<body>
${html}
</body>
</html>`;
}

export function extractInlineCSS(html: string): { css: string; cleanHtml: string } {
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const cssParts: string[] = [];

  const cleanHtml = html.replace(styleRegex, (_match, cssContent) => {
    cssParts.push(cssContent.trim());
    return "";
  });

  return {
    css: cssParts.join("\n"),
    cleanHtml: cleanHtml.trim(),
  };
}

export function buildPrototypeIframeSrc(html: string, css: string): string {
  const fullHTML = wrapPrototypeHTML(html, css);
  const blob = new Blob([fullHTML], { type: "text/html" });
  return URL.createObjectURL(blob);
}
