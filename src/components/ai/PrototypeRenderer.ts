export function wrapPrototypeHTML(html: string, css: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  [data-modal] { display: none; position: fixed; inset: 0; z-index: 1000; align-items: center; justify-content: center; background: rgba(0,0,0,0.4); }
  [data-modal].open { display: flex; }
  [data-dropdown-menu] { display: none; }
  [data-dropdown-menu].open { display: block; }
  [data-tab-panel] { display: none; }
  [data-tab-panel].active { display: block; }
  [data-accordion-content] { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
  [data-accordion-content].open { max-height: 500px; }
  .proto-toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #333; color: #fff; padding: 8px 20px; border-radius: 6px; font-size: 14px; z-index: 2000; animation: proto-fade 2s forwards; }
  @keyframes proto-fade { 0% { opacity: 0; transform: translateX(-50%) translateY(10px); } 15% { opacity: 1; transform: translateX(-50%) translateY(0); } 85% { opacity: 1; } 100% { opacity: 0; } }
  ${css}
</style>
</head>
<body>
${html}
<script>
${INTERACTION_RUNTIME}
</script>
</body>
</html>`;
}

const INTERACTION_RUNTIME = `(function() {
  function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }
  function qs(sel) { return document.querySelector(sel); }
  function closest(el, sel) { return el && el.closest ? el.closest(sel) : null; }

  document.addEventListener('click', function(e) {
    var t = e.target;

    // Navigate: data-navigate="page-name"
    var nav = closest(t, '[data-navigate]');
    if (nav) {
      e.preventDefault();
      window.parent.postMessage({ type: 'proto-navigate', target: nav.dataset.navigate }, '*');
      return;
    }

    // Toggle: data-toggle="#selector"
    var tog = closest(t, '[data-toggle]');
    if (tog) {
      e.preventDefault();
      var tel = qs(tog.dataset.toggle);
      if (tel) tel.style.display = tel.style.display === 'none' ? '' : 'none';
      return;
    }

    // Tab: data-tab="tabId" inside [data-tab-group]
    var tab = closest(t, '[data-tab]');
    if (tab) {
      e.preventDefault();
      var group = closest(tab, '[data-tab-group]');
      if (group) {
        group.querySelectorAll('[data-tab]').forEach(function(b) { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        group.querySelectorAll('[data-tab-panel]').forEach(function(p) { p.classList.remove('active'); p.style.display = 'none'; });
        var panel = group.querySelector('[data-tab-panel="' + tab.dataset.tab + '"]');
        if (panel) { panel.classList.add('active'); panel.style.display = ''; }
      }
      return;
    }

    // Modal open: data-modal-open="#modal-id"
    var mOpen = closest(t, '[data-modal-open]');
    if (mOpen) {
      e.preventDefault();
      var modal = qs(mOpen.dataset.modalOpen);
      if (modal) modal.classList.add('open');
      return;
    }

    // Modal close: data-modal-close or click backdrop
    var mClose = closest(t, '[data-modal-close]');
    if (mClose) {
      e.preventDefault();
      var m = closest(mClose, '[data-modal]') || qs(mClose.dataset.modalClose);
      if (m) m.classList.remove('open');
      return;
    }

    // Click on backdrop to close modal
    if (t.matches('[data-modal]')) {
      t.classList.remove('open');
      return;
    }

    // Dropdown: data-dropdown-toggle
    var dd = closest(t, '[data-dropdown-toggle]');
    if (dd) {
      e.preventDefault();
      var wrap = closest(dd, '[data-dropdown]');
      var menu = wrap ? wrap.querySelector('[data-dropdown-menu]') : null;
      if (menu) {
        document.querySelectorAll('[data-dropdown-menu].open').forEach(function(m) { if (m !== menu) m.classList.remove('open'); });
        menu.classList.toggle('open');
      }
      return;
    }

    // Close dropdowns on outside click
    if (!closest(t, '[data-dropdown]')) {
      document.querySelectorAll('[data-dropdown-menu].open').forEach(function(m) { m.classList.remove('open'); });
      return;
    }

    // Accordion: data-accordion-toggle
    var acc = closest(t, '[data-accordion-toggle]');
    if (acc) {
      e.preventDefault();
      var content = acc.nextElementSibling;
      if (content && content.hasAttribute('data-accordion-content')) {
        var isOpen = content.classList.contains('open');
        content.classList.toggle('open', !isOpen);
        acc.classList.toggle('active', !isOpen);
      }
      return;
    }
  });

  // Expose utility API for AI-generated inline scripts
  window.proto = {
    show: function(s) { var e = qs(s); if (e) e.style.display = ''; },
    hide: function(s) { var e = qs(s); if (e) e.style.display = 'none'; },
    toggle: function(s) { var e = qs(s); if (e) e.style.display = e.style.display === 'none' ? '' : 'none'; },
    navigate: function(t) { window.parent.postMessage({ type: 'proto-navigate', target: t }, '*'); },
    setText: function(s, t) { var e = qs(s); if (e) e.textContent = t; },
    setHtml: function(s, h) { var e = qs(s); if (e) e.innerHTML = h; },
    addClass: function(s, c) { var e = qs(s); if (e) e.classList.add(c); },
    removeClass: function(s, c) { var e = qs(s); if (e) e.classList.remove(c); },
    toggleClass: function(s, c) { var e = qs(s); if (e) e.classList.toggle(c); },
    openModal: function(s) { var e = qs(s); if (e) e.classList.add('open'); },
    closeModal: function(s) { var e = qs(s); if (e) e.classList.remove('open'); },
    toast: function(msg) {
      var t = document.createElement('div');
      t.className = 'proto-toast';
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(function() { t.remove(); }, 2000);
    }
  };
})();`;

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

function normalizeContent(str: string): string {
  return str
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r");
}

function stripStyleWrappers(css: string): string {
  return css.replace(/<\/?style[^>]*>/gi, "").trim();
}

function escapeStyleContent(css: string): string {
  return css.replace(/<\/style/gi, "<\\/style");
}

export function buildPrototypeSrcDoc(html: string, css: string): string {
  const normalizedHtml = normalizeContent(html);
  const normalizedCss = normalizeContent(css);

  const { css: inlineCss, cleanHtml } = extractInlineCSS(normalizedHtml);
  const mergedCss = stripStyleWrappers([normalizedCss, inlineCss].filter(Boolean).join("\n"));

  return wrapPrototypeHTML(cleanHtml, escapeStyleContent(mergedCss));
}
