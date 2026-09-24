import { useState } from "react";
import { FileText, Search } from "lucide-react";
import type { FicheEleveComplete } from "@school-mgt/types";
import { StudentSearchSelect } from "../../../informations/emergencyContact/components/StudentSearchSelect";
import {
  useFacturesEleve,
  type FacturesFilters,
} from "../hooks/useFacturesEleve";
import { FactureDetailModal } from "./FactureDetailModal";

type Props = {
  initialEleveId?: string;
};

const MOIS_LABELS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

function formatMontant(value: string): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "MGA",
    minimumFractionDigits: 0,
  }).format(Number(value));
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR");
}

export function FacturesEcolageSection({ initialEleveId }: Props) {
  const [selectedEleve, setSelectedEleve] = useState<FicheEleveComplete | null>(
    null,
  );
  const [selectedFactureId, setSelectedFactureId] = useState<string | null>(
    null,
  );

  const [filters, setFilters] = useState<FacturesFilters>({
    page: 1,
    limit: 10,
  });

  const eleveId = selectedEleve?.id ?? initialEleveId;

  const facturesQuery = useFacturesEleve(eleveId, filters);
  const factures = facturesQuery.data?.data ?? [];
  const pagination = facturesQuery.data?.pagination;

  function updateFilter(
    key: keyof FacturesFilters,
    value: string | number | undefined,
  ) {
    setFilters((previous) => ({
      ...previous,
      [key]: value || undefined,
      page: 1,
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText size={20} className="text-primary" />
        <div>
          <h2 className="text-lg font-bold">Factures et reçus</h2>
          <p className="text-sm text-base-content/60">
            Consultez et imprimez les paiements enregistrés.
          </p>
        </div>
      </div>

      <StudentSearchSelect
        selectedStudentId={eleveId}
        onSelect={(student) => {
          setSelectedEleve(student);
          setFilters((previous) => ({ ...previous, page: 1 }));
        }}
      />

      {!eleveId && (
        <div className="rounded-lg border border-dashed border-base-300 p-8 text-center">
          <Search size={24} className="mx-auto text-base-content/40" />
          <p className="mt-2 font-medium">Aucun élève sélectionné</p>
        </div>
      )}

      {eleveId && (
        <>
          <div className="card border border-base-200 bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <fieldset className="fieldset">
                  <label className="label" htmlFor="facture-annee">
                    Année scolaire
                  </label>
                  <input
                    id="facture-annee"
                    className="input input-bordered"
                    placeholder="2026-2027"
                    value={filters.anneeScolaire ?? ""}
                    onChange={(event) =>
                      updateFilter("anneeScolaire", event.target.value)
                    }
                  />
                </fieldset>

                <fieldset className="fieldset">
                  <label className="label" htmlFor="facture-type">
                    Type de frais
                  </label>
                  <select
                    id="facture-type"
                    className="select select-bordered"
                    value={filters.typeFrais ?? ""}
                    onChange={(event) =>
                      updateFilter("typeFrais", event.target.value)
                    }
                  >
                    <option value="">Tous les types</option>
                    <option value="ECOLAGE">Écolage</option>
                    <option value="DROIT_INSCRIPTION">
                      Droit d'inscription
                    </option>
                    <option value="FRAIS_EXAMEN">Frais d'examen</option>
                  </select>
                </fieldset>

                <fieldset className="fieldset">
                  <label className="label" htmlFor="facture-debut">
                    Du
                  </label>
                  <input
                    id="facture-debut"
                    type="date"
                    className="input input-bordered"
                    value={filters.dateDebut ?? ""}
                    onChange={(event) =>
                      updateFilter("dateDebut", event.target.value)
                    }
                  />
                </fieldset>

                <fieldset className="fieldset">
                  <label className="label" htmlFor="facture-fin">
                    Au
                  </label>
                  <input
                    id="facture-fin"
                    type="date"
                    className="input input-bordered"
                    value={filters.dateFin ?? ""}
                    onChange={(event) =>
                      updateFilter("dateFin", event.target.value)
                    }
                  />
                </fieldset>
              </div>
            </div>
          </div>

          <div className="card border border-base-200 bg-base-100 shadow-sm">
            <div className="card-body p-0">
              {facturesQuery.isLoading && (
                <div className="p-8 text-center">
                  <span className="loading loading-spinner" />
                </div>
              )}

              {facturesQuery.isError && (
                <p className="p-6 text-error">
                  Impossible de charger les factures.
                </p>
              )}

              {!facturesQuery.isLoading && !facturesQuery.isError && (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Reçu</th>
                        <th>Type</th>
                        <th>Période</th>
                        <th>Montant</th>
                        <th>Mode</th>
                        <th>Date</th>
                        <th />
                      </tr>
                    </thead>

                    <tbody>
                      {factures.map((facture) => (
                        <tr key={facture.id}>
                          <td className="font-medium">{facture.numeroRecu}</td>
                          <td>{facture.typeFrais}</td>
                          <td>
                            {facture.mois
                              ? `${MOIS_LABELS[facture.mois - 1]} ${
                                  facture.anneeScolaire ?? ""
                                }`
                              : (facture.anneeScolaire ?? "—")}
                          </td>
                          <td>{formatMontant(facture.montant)}</td>
                          <td>{facture.modePaiement}</td>
                          <td>{formatDate(facture.datePaiement)}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => setSelectedFactureId(facture.id)}
                            >
                              Voir
                            </button>
                          </td>
                        </tr>
                      ))}

                      {factures.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-10 text-center">
                            Aucun reçu trouvé.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-base-200 p-4">
                  <span className="text-sm text-base-content/60">
                    Page {pagination.page} / {pagination.totalPages}
                  </span>

                  <div className="join">
                    <button
                      type="button"
                      className="btn join-item"
                      disabled={pagination.page <= 1}
                      onClick={() =>
                        setFilters((previous) => ({
                          ...previous,
                          page: pagination.page - 1,
                        }))
                      }
                    >
                      Précédente
                    </button>

                    <button
                      type="button"
                      className="btn join-item"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() =>
                        setFilters((previous) => ({
                          ...previous,
                          page: pagination.page + 1,
                        }))
                      }
                    >
                      Suivante
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <FactureDetailModal
            factureId={selectedFactureId}
            onClose={() => setSelectedFactureId(null)}
          />
        </>
      )}
    </div>
  );
}
