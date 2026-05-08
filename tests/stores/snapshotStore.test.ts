import { describe, it, expect, beforeEach } from "vitest";
import { useSnapshotStore } from "@/stores/snapshotStore";

describe("snapshotStore", () => {
  beforeEach(() => {
    useSnapshotStore.setState({ snapshots: [] });
  });

  it("should start with empty snapshots", () => {
    expect(useSnapshotStore.getState().snapshots).toEqual([]);
  });

  it("should add a snapshot", () => {
    useSnapshotStore.getState().addSnapshot({
      id: "snap-1",
      name: "版本1",
      createdAt: "2026-05-08",
      canvasData: "{}",
    });
    expect(useSnapshotStore.getState().snapshots).toHaveLength(1);
    expect(useSnapshotStore.getState().snapshots[0].name).toBe("版本1");
  });

  it("should remove a snapshot", () => {
    useSnapshotStore.getState().addSnapshot({
      id: "snap-1",
      name: "版本1",
      createdAt: "2026-05-08",
      canvasData: "{}",
    });
    useSnapshotStore.getState().removeSnapshot("snap-1");
    expect(useSnapshotStore.getState().snapshots).toHaveLength(0);
  });

  it("should set snapshots from loaded data", () => {
    useSnapshotStore.getState().setSnapshots([
      { id: "snap-1", name: "V1", createdAt: "2026-05-08", canvasData: "{}" },
      { id: "snap-2", name: "V2", createdAt: "2026-05-08", canvasData: "{}" },
    ]);
    expect(useSnapshotStore.getState().snapshots).toHaveLength(2);
  });
});
