import { useRef, useCallback } from "react";
import { Canvas } from "fabric";
import { useCanvasStore } from "@/stores/canvasStore";
import { getCanvasJSON } from "@/utils/canvasSerializer";
import type { CanvasJSON } from "@/utils/canvasSerializer";

export function useCanvas() {
  const canvasRef = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const setObjectCount = useCanvasStore((s) => s.setObjectCount);

  const initCanvas = useCallback((container: HTMLDivElement, width: number, height: number): Canvas => {
    if (canvasRef.current) {
      canvasRef.current.dispose();
    }

    const canvas = new Canvas(document.createElement("canvas"), {
      width,
      height,
      backgroundColor: "#ffffff",
      selection: true,
    });

    container.innerHTML = "";
    const wrapper = document.createElement("div");
    wrapper.style.overflow = "hidden";
    wrapper.style.width = "100%";
    wrapper.style.height = "100%";
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.justifyContent = "center";
    container.appendChild(wrapper);
    wrapper.appendChild(canvas.getElement().parentElement ?? canvas.getElement());

    canvasRef.current = canvas;
    containerRef.current = container;

    return canvas;
  }, []);

  const getCanvas = useCallback((): Canvas | null => {
    return canvasRef.current;
  }, []);

  const resizeCanvas = useCallback((width: number, height: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setDimensions({ width, height });
    canvas.renderAll();
  }, []);

  const loadJSON = useCallback((json: CanvasJSON): Promise<void> => {
    const canvas = canvasRef.current;
    if (!canvas) return Promise.resolve();
    return canvas.loadFromJSON(json).then(() => {
      canvas.renderAll();
      setObjectCount(canvas.getObjects().length);
    });
  }, [setObjectCount]);

  const getJSON = useCallback((): CanvasJSON | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return getCanvasJSON(canvas);
  }, []);

  const destroyCanvas = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.dispose();
      canvasRef.current = null;
    }
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }
  }, []);

  return {
    initCanvas,
    getCanvas,
    resizeCanvas,
    loadJSON,
    getJSON,
    destroyCanvas,
  };
}
