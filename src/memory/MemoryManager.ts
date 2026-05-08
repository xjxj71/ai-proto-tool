import type { UserPreferences, SavedModule, ProjectContextData } from "@/stores/memoryStore";

export class MemoryManager {
  async loadUserPreferences(): Promise<UserPreferences> {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      return await invoke("read_json_file", {
        path: "memory/user_preferences.json",
      });
    } catch {
      return {};
    }
  }

  async saveUserPreferences(prefs: UserPreferences): Promise<void> {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("write_json_file", {
      path: "memory/user_preferences.json",
      data: prefs,
    });
  }

  async loadSavedModules(): Promise<SavedModule[]> {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      return await invoke("list_saved_modules");
    } catch {
      return [];
    }
  }

  async saveModule(module: SavedModule): Promise<void> {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("save_module", { module });
  }

  async deleteModule(id: string): Promise<void> {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("delete_module", { id });
  }

  async loadProjectContext(projectId: string): Promise<ProjectContextData | null> {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      return await invoke("read_json_file", {
        path: `memory/project_context/${projectId}/design_system.json`,
      });
    } catch {
      return null;
    }
  }

  async saveProjectContext(projectId: string, context: ProjectContextData): Promise<void> {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("write_json_file", {
      path: `memory/project_context/${projectId}/design_system.json`,
      data: context,
    });
  }

  extractMemoryUpdates(aiResponse: {
    memory_updates?: { preferences?: Record<string, string>; design_system?: Record<string, string> };
  }): { preferences: Partial<UserPreferences>; designSystem: Record<string, string> } {
    const updates = aiResponse.memory_updates ?? {};
    return {
      preferences: updates.preferences ?? {},
      designSystem: updates.design_system ?? {},
    };
  }
}
