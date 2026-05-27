import { Wrench } from "lucide-react";

/**
 * Composant de remplacement affiché dans chaque onglet en cours de développement.
 *
 * @param titre       - Nom de la fonctionnalité à venir.
 * @param description - Description courte de ce que fera le module une fois terminé.
 */
interface MaintenancePlaceholderProps {
  titre: string;
  description?: string;
}

export default function MaintenancePlaceholder({
  titre,
  description,
}: MaintenancePlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      {/* Icône */}
      <div className="bg-warning/10 text-warning rounded-full p-5">
        <Wrench size={36} />
      </div>

      {/* Badge statut */}
      <span className="badge badge-warning badge-lg font-semibold tracking-wide">
        En maintenance
      </span>

      {/* Titre */}
      <h2 className="text-xl font-bold">{titre}</h2>

      {/* Description */}
      {description && (
        <p className="text-base-content/50 max-w-md text-sm">{description}</p>
      )}

      {/* Message générique */}
      <p className="text-base-content/40 text-xs mt-2">
        Cette fonctionnalité sera disponible prochainement. Merci de votre patience.
      </p>
    </div>
  );
}
