import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useProjectStore } from "@/stores/projectStore";
import { useUiStore } from "@/stores/uiStore";
import { ProjectList } from "./ProjectList";
import { CreateProjectDialog } from "./CreateProjectDialog";
import type { Project } from "@/types";

interface CreateProjectFormData {
  name: string;
  description: string;
  canvasPreset: string;
}

export function WelcomeScreen() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const projects = useProjectStore((s) => s.projects);
  const setProjects = useProjectStore((s) => s.setProjects);
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);
  const setView = useUiStore((s) => s.setView);

  const handleCreateProject = async (data: CreateProjectFormData) => {
    try {
      const project = await invoke("create_project", {
        input: {
          name: data.name,
          description: data.description,
          canvas_preset: data.canvasPreset,
        },
      }) as Project;
      const updated = await invoke("list_projects") as Project[];
      setProjects(updated);
      setCurrentProject(project);
      setView("editor");
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const handleOpenProject = (project: Project) => {
    setCurrentProject(project);
    setView("editor");
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await invoke("delete_project", { id });
      const updated = await invoke("list_projects") as Project[];
      setProjects(updated);
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  return (
    <div className="h-screen bg-bg-primary flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          {t("welcome.title")}
        </h1>
        <p className="text-text-secondary mb-8">
          {t("welcome.subtitle")}
        </p>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-text-primary">
            {t("welcome.recentProjects")}
          </h2>
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
          >
            <Plus size={16} />
            {t("welcome.newProject")}
          </button>
        </div>
        <ProjectList
          projects={projects}
          onOpen={handleOpenProject}
          onDelete={handleDeleteProject}
        />
      </div>
      <CreateProjectDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}
