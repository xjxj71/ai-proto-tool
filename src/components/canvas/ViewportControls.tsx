import { useTranslation } from "react-i18next";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { Point } from "fabric";
import type { Canvas } from "fabric";

interface ViewportControlsProps {
  getCanvas: () => Canvas | null;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.1;

export function ViewportControls({ getCanvas }: ViewportControlsProps) {
  const { t } = useTranslation();

  const handleZoomIn = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    const currentZoom = canvas.getZoom();
    const newZoom = Math.min(currentZoom + ZOOM_STEP, MAX_ZOOM);
    canvas.zoomToPoint(new Point(canvas.getWidth() / 2, canvas.getHeight() / 2), newZoom);
    canvas.renderAll();
  };

  const handleZoomOut = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    const currentZoom = canvas.getZoom();
    const newZoom = Math.max(currentZoom - ZOOM_STEP, MIN_ZOOM);
    canvas.zoomToPoint(new Point(canvas.getWidth() / 2, canvas.getHeight() / 2), newZoom);
    canvas.renderAll();
  };

  const handleFitToScreen = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.renderAll();
  };

  return (
    <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-bg-secondary/90 border border-border rounded px-1 py-0.5">
      <button
        onClick={handleZoomOut}
        className="p-1 text-text-secondary hover:text-text-primary transition-colors"
        title={t("canvas.viewport.zoomOut")}
      >
        <ZoomOut size={14} />
      </button>
      <button
        onClick={handleFitToScreen}
        className="p-1 text-text-secondary hover:text-text-primary transition-colors"
        title={t("canvas.viewport.fitToScreen")}
      >
        <Maximize size={14} />
      </button>
      <button
        onClick={handleZoomIn}
        className="p-1 text-text-secondary hover:text-text-primary transition-colors"
        title={t("canvas.viewport.zoomIn")}
      >
        <ZoomIn size={14} />
      </button>
    </div>
  );
}
