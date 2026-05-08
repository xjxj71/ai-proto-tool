import { useTranslation } from "react-i18next";
import { FolderOpen, Trash2 } from "lucide-react";
import type { Project } from "@/types";

interface ProjectListProps {
  projects: Project[];
  onOpen: (project: Project) => void;
  onDelete: (id: string) => void;
}

export function ProjectList({ projects, onOpen, onDelete }: ProjectListProps) {
  const { t } = useTranslation();

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        {t("welcome.noProjects")}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <div
          key={project.id}
          className="group bg-bg-surface border border-border rounded-lg p-4 hover:border-accent transition-colors cursor-pointer"
          onClick={() => onOpen(project)}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-medium text-text-primary truncate">
              {project.name}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-danger transition-all"
              aria-label={t("welcome.delete")}
            >
              <Trash2 size={14} />
            </button>
          </div>
          {project.description && (
            <p className="text-xs text-text-muted line-clamp-2 mb-3">
              {project.description}
            </p>
          )}
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <FolderOpen size={12} />
            <span>{project.canvasPreset}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
