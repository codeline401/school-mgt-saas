import { STATUT_CONFIG } from "../suivi.constants";
import type { SuiviResponse } from "../hooks/useSuiviAbsences";
import { formaterDate } from "../utils/periode";

type Props = {
  lignes: SuiviResponse["data"];
  pagination: SuiviResponse["pagination"];
  onPageChange: (page: number) => void;
};

// Historique détaillé, un appel par ligne.
export function SuiviHistorique({ lignes, pagination, onPageChange }: Props) {
  return (
    <div className="card border border-base-200 bg-base-100 shadow-sm">
      <div className="card-body p-0">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Horaire</th>
                <th>Matière</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => {
                const statut = STATUT_CONFIG[l.statut];
                return (
                  <tr key={l.id}>
                    <td>{formaterDate(l.date)}</td>
                    <td>
                      {l.heureDebut} – {l.heureFin}
                    </td>
                    <td>{l.matiere ?? l.intitule ?? "—"}</td>
                    <td>
                      <span className={`badge ${statut.badge}`}>
                        {statut.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {lignes.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center">
                    Aucun appel enregistré sur cette période.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-base-200 p-4">
            <span className="text-sm text-base-content/60">
              Page {pagination.page} / {pagination.totalPages}
            </span>
            <div className="join">
              <button
                type="button"
                className="btn join-item btn-sm"
                disabled={pagination.page <= 1}
                onClick={() => onPageChange(pagination.page - 1)}
              >
                «
              </button>
              <button
                type="button"
                className="btn join-item btn-sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => onPageChange(pagination.page + 1)}
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
