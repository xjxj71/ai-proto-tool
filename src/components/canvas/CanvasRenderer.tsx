import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Canvas } from "fabric";
import { useCanvas } from "@/hooks/useCanvas";
import type { CanvasJSON } from "@/utils/canvasSerializer";

interface CanvasRendererProps {
  width: number;
  height: number;
  onCanvasReady: (canvas: Canvas) => void;
}

export interface CanvasRendererHandle {
  getCanvas: () => Canvas | null;
  loadJSON: (json: CanvasJSON) => Promise<void>;
  getJSON: () => CanvasJSON | null;
  resizeCanvas: (width: number, height: number) => void;
}

export const CanvasRenderer = forwardRef<CanvasRendererHandle, CanvasRendererProps>(
  function CanvasRenderer({ width, height, onCanvasReady }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { initCanvas, getCanvas, resizeCanvas, loadJSON, getJSON, destroyCanvas } = useCanvas();
    const onCanvasReadyRef = useRef(onCanvasReady);
    onCanvasReadyRef.current = onCanvasReady;

    useImperativeHandle(ref, () => ({
      getCanvas,
      loadJSON,
      getJSON,
      resizeCanvas,
    }));

    useEffect(() => {
      if (!containerRef.current) return;
      const canvas = initCanvas(containerRef.current, width, height);
      onCanvasReadyRef.current(canvas);

      return () => {
        destroyCanvas();
      };
    }, []);

    useEffect(() => {
      const canvas = getCanvas();
      if (!canvas) return;
      resizeCanvas(width, height);
    }, [width, height]);

    return (
      <div
        ref={containerRef}
        className="w-full h-full bg-gray-800 flex items-center justify-center overflow-hidden"
      />
    );
  }
);
