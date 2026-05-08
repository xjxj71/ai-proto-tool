import { describe, it, expect, beforeEach } from "vitest";
import { useExportStore } from "@/stores/exportStore";

describe("exportStore", () => {
  beforeEach(() => {
    useExportStore.setState({ isExporting: false, progress: 0, total: 0 });
  });

  it("should start not exporting", () => {
    expect(useExportStore.getState().isExporting).toBe(false);
  });

  it("should set exporting state", () => {
    useExportStore.getState().startExport(5);
    expect(useExportStore.getState().isExporting).toBe(true);
    expect(useExportStore.getState().total).toBe(5);
  });

  it("should update progress", () => {
    useExportStore.getState().startExport(3);
    useExportStore.getState().updateProgress();
    expect(useExportStore.getState().progress).toBe(1);
  });

  it("should finish export", () => {
    useExportStore.getState().startExport(2);
    useExportStore.getState().finishExport();
    expect(useExportStore.getState().isExporting).toBe(false);
    expect(useExportStore.getState().progress).toBe(0);
  });
});
