import { Archive, BellRing, Pencil } from "lucide-react";
import type { SuiviSante } from "../hooks/useSante";
import { LIBELLES_GRAVITE, LIBELLES_TYPE_SANTE } from "./SanteFilters";

type Props = {
  suivis: SuiviSante[];
  onEdit: (suivi: SuiviSante) => void;
  onArchive: (suivi: SuiviSante) => void;
};

function formaterDate(value: string): string {
  const date = value.slice(0, 10);
  const [annee, mois, jour] = date.split("-");
  return `${jour}/${mois}/${annee}`;
}

function badgeGravite(gravite: SuiviSante["gravite"]): string {
  if (gravite === "URGENTE" || gravite === "ELEVEE") return "badge-error";
  if (gravite === "MODEREE") return "badge-warning";
  if (gravite === "FAIBLE") return "badge-info";
  return "badge-ghost";
}

export function SanteList({ suivis, onEdit, onArchive }: Props) {
  if (suivis.length === 0) {
    return (
      <div className="rounded border border-dashed border-base-300 p-8 text-center">
        <p className="font-medium">Aucune information de santé</p>
        <p className="text-sm text-base-content/60">
          Aucun élément ne correspond aux filtres sélectionnés.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-base-200">
      {suivis.map((suivi) => (
        <article
          key={suivi.id}
          className="flex flex-wrap items-start justify-between gap-4 py-4"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{suivi.titre}</h3>
              <span className="badge badge-ghost">
                {LIBELLES_TYPE_SANTE[suivi.type]}
              </span>
              {suivi.gravite && (
                <span className={`badge ${badgeGravite(suivi.gravite)}`}>
                  {LIBELLES_GRAVITE[suivi.gravite]}
                </span>
              )}
            </div>

            <p className="text-sm text-base-content/70">
              {formaterDate(suivi.dateEvenement)}
              {suivi.dateFin ? ` – ${formaterDate(suivi.dateFin)}` : ""}
            </p>

            {suivi.description && (
              <p className="whitespace-pre-wrap text-sm">{suivi.description}</p>
            )}

            <p className="text-xs text-base-content/60">
              Saisi par {suivi.createdBy.prenom} {suivi.createdBy.nom}
            </p>

            {suivi.parentNotifieAt && (
              <p className="flex items-center gap-1 text-xs text-success">
                <BellRing size={14} />
                Parent notifié le {formaterDate(suivi.parentNotifieAt)}
              </p>
            )}
          </div>

          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-square"
              title="Modifier"
              aria-label={`Modifier ${suivi.titre}`}
              onClick={() => onEdit(suivi)}
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-square text-error"
              title="Archiver"
              aria-label={`Archiver ${suivi.titre}`}
              onClick={() => onArchive(suivi)}
            >
              <Archive size={16} />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
