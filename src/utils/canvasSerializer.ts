import { Canvas } from "fabric";

export interface CanvasJSON {
  version: string;
  objects: unknown[];
  [key: string]: unknown;
}

export function createEmptyCanvasJSON(): CanvasJSON {
  return {
    version: "6",
    objects: [],
  };
}

export function isCanvasJSONEmpty(json: CanvasJSON): boolean {
  return json.objects.length === 0;
}

export function serializeCanvas(json: CanvasJSON): string {
  return JSON.stringify(json);
}

export function deserializeCanvas(str: string): CanvasJSON {
  return JSON.parse(str) as CanvasJSON;
}

export function getCanvasJSON(canvas: Canvas): CanvasJSON {
  const json = canvas.toJSON() as CanvasJSON;
  // Include custom elementId property on each serialized object
  if (json.objects) {
    const canvasObjects = canvas.getObjects();
    json.objects = json.objects.map((obj: unknown, index: number) => {
      const fabricObj = canvasObjects[index];
      const record = obj as Record<string, unknown>;
      if (fabricObj && "elementId" in fabricObj) {
        return { ...record, elementId: (fabricObj as Record<string, unknown>).elementId };
      }
      return record;
    });
  }
  return json;
}

export async function loadCanvasJSON(canvas: Canvas, json: CanvasJSON): Promise<void> {
  await canvas.loadFromJSON(json);
}
