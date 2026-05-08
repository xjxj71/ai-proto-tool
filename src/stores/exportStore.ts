import { create } from "zustand";

type ExportFormat = "html" | "png" | "both";
type ExportResolution = 1 | 2 | 3;

interface ExportState {
  isExporting: boolean;
  progress: number;
  total: number;
  format: ExportFormat;
  resolution: ExportResolution;
  setFormat: (format: ExportFormat) => void;
  setResolution: (resolution: ExportResolution) => void;
  startExport: (total: number) => void;
  updateProgress: () => void;
  finishExport: () => void;
}

export const useExportStore = create<ExportState>((set) => ({
  isExporting: false,
  progress: 0,
  total: 0,
  format: "html",
  resolution: 2,
  setFormat: (format) => set({ format }),
  setResolution: (resolution) => set({ resolution }),
  startExport: (total) => set({ isExporting: true, progress: 0, total }),
  updateProgress: () => set((s) => ({ progress: s.progress + 1 })),
  finishExport: () => set({ isExporting: false, progress: 0, total: 0 }),
}));
