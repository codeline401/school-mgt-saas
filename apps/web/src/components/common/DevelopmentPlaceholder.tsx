import type { LucideIcon } from "lucide-react";

interface DevelopmentPlaceholderProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Composant réutilisable pour afficher un message "en développement"
 */
function DevelopmentPlaceholder({
  icon: Icon,
  title,
  description,
}: DevelopmentPlaceholderProps) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body">
        <div className="text-center py-12">
          <Icon size={48} className="mx-auto mb-4 text-base-content/30" />
          <p className="text-base-content/50 font-medium mb-2">{title}</p>
          <p className="text-sm text-base-content/40">{description}</p>
          <div className="mt-6">
            <span className="badge badge-warning gap-2">
              🚧 En cours de développement
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DevelopmentPlaceholder;
