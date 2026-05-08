import { create } from "zustand";

export interface Snapshot {
  id: string;
  name: string;
  createdAt: string;
  canvasData: string;
}

interface SnapshotState {
  snapshots: Snapshot[];
  addSnapshot: (snapshot: Snapshot) => void;
  removeSnapshot: (id: string) => void;
  setSnapshots: (snapshots: Snapshot[]) => void;
}

export const useSnapshotStore = create<SnapshotState>((set) => ({
  snapshots: [],
  addSnapshot: (snapshot) =>
    set((state) => ({ snapshots: [snapshot, ...state.snapshots] })),
  removeSnapshot: (id) =>
    set((state) => ({ snapshots: state.snapshots.filter((s) => s.id !== id) })),
  setSnapshots: (snapshots) => set({ snapshots }),
}));
