import { useMemo, useEffect, useCallback } from "react";
import { Pen, Trash2, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { buildPrototypeSrcDoc } from "@/components/ai/PrototypeRenderer";
import { useUiStore } from "@/stores/uiStore";

interface PrototypePreviewProps {
  pageId: string;
}

export function PrototypePreview({ pageId }: PrototypePreviewProps) {
  const { t } = useTranslation();
  const pagePrototype = useUiStore((s) => s.pagePrototypes[pageId]);
  const setPagePrototypeVisible = useUiStore((s) => s.setPagePrototypeVisible);
  const clearPagePrototype = useUiStore((s) => s.clearPagePrototype);

  const srcDoc = useMemo(() => {
    if (!pagePrototype) return undefined;
    return buildPrototypeSrcDoc(pagePrototype.html, pagePrototype.css);
  }, [pagePrototype]);

  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.data?.type === "proto-navigate") {
      const target = event.data.target;
      if (target) {
        const pages = useUiStore.getState().currentPageId;
        if (pages) {
          window.postMessage({ type: "proto-navigate-response", target }, "*");
        }
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  const handleBackToCanvas = () => {
    setPagePrototypeVisible(pageId, false);
  };

  const handleClearPrototype = () => {
    clearPagePrototype(pageId);
  };

  return (
    <div className="h-full bg-bg-primary flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5 bg-bg-secondary border-b border-border">
        <span className="text-xs text-text-secondary flex items-center gap-1">
          <Eye size={12} />
          AI 生成的原型预览
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleBackToCanvas}
            className="flex items-center gap-1 px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors"
            title={t("chat.backToCanvas")}
          >
            <Pen size={12} />
            {t("chat.backToCanvas")}
          </button>
          <button
            onClick={handleClearPrototype}
            className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-bg-tertiary rounded transition-colors"
            title={t("chat.clearPrototype")}
          >
            <Trash2 size={12} />
            {t("chat.clearPrototype")}
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        {srcDoc && (
          <iframe
            srcDoc={srcDoc}
            className="bg-white rounded shadow-lg"
            style={{
              width: "100%",
              maxWidth: 1440,
              height: "100%",
              border: "1px solid var(--color-border)",
            }}
            title="Prototype Preview"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        )}
      </div>
    </div>
  );
}
