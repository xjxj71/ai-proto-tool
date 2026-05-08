import { useRef, useCallback, useEffect, useState } from "react";
import { useCanvasStore } from "@/stores/canvasStore";

interface UseAutoSaveOptions {
  projectId: string;
  pageId: string;
  enabled: boolean;
  debounceMs?: number;
}

export function useAutoSave({
  projectId,
  pageId,
  enabled,
  debounceMs = 2000,
}: UseAutoSaveOptions) {
  const [isPending, setIsPending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setSaveStatus = useCanvasStore((s) => s.setSaveStatus);

  const flushSave = useCallback(async (json: string) => {
    if (!enabled || !pageId || !projectId) return;

    setSaveStatus("saving");
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("save_canvas_json", { projectId, pageId, json });
      setSaveStatus("saved");
    } catch (error) {
      console.error("Auto-save failed:", error);
      setSaveStatus("unsaved");
    }
    setIsPending(false);
  }, [enabled, pageId, projectId, setSaveStatus]);

  const triggerSave = useCallback((json: string) => {
    if (!enabled || !pageId) return;

    setSaveStatus("unsaved");
    setIsPending(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      flushSave(json);
    }, debounceMs);
  }, [enabled, pageId, debounceMs, flushSave, setSaveStatus]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { triggerSave, isPending, flushSave };
}
