import { useState } from "react";
import { BellRing, Eye, Plus, X } from "lucide-react";
import {
  useAnnulerRelance,
  useRelances,
  type Relance,
  type StatutRelance,
} from "../hooks/useRelances";
import { NouvelleRelanceModal } from "./NouvelleRelanceModal";
import { RelanceDetailModal } from "./RelanceDetailModal";

const STATUT_LABELS: Record<StatutRelance, string> = {
  EN_ATTENTE: "Programmée",
  EN_COURS: "En cours",
  ENVOYE: "Envoyée",
  ECHOUE: "Échec",
  ANNULEE: "Annulée",
};

const STATUT_BADGE: Record<StatutRelance, string> = {
  EN_ATTENTE: "badge-warning",
  EN_COURS: "badge-info",
  ENVOYE: "badge-success",
  ECHOUE: "badge-error",
  ANNULEE: "badge-ghost",
};

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString("fr-FR") : "—";
}

function libelleType(r: Relance): string {
  if (r.type === "MANUELLE") return "Manuelle";
  return r.recurrent
    ? `Auto — le ${r.jourMois} de chaque mois`
    : "Auto — date unique";
}

// Tableau de bord : historique des campagnes et création d'une nouvelle relance.
export function RelanceEcolageSection() {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [detail, setDetail] = useState<Relance | null>(null);
  const { data, isLoading, isError } = useRelances(page);
  const annuler = useAnnulerRelance();

  const relances = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BellRing size={20} className="text-primary" />
          <div>
            <h2 className="text-lg font-bold">Relances de paiement</h2>
            <p className="text-sm text-base-content/60">
              Rappels envoyés aux responsables d'élèves en retard de paiement.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm gap-2"
          onClick={() => setModalOpen(true)}
        >
          <Plus size={16} />
          Nouvelle relance
        </button>
      </div>

      <div className="card border border-base-200 bg-base-100 shadow-sm">
        <div className="card-body p-0">
          {isLoading && (
            <div className="p-8 text-center">
              <span className="loading loading-spinner" />
            </div>
          )}
          {isError && (
            <p className="p-6 text-error">
              Impossible de charger les relances.
            </p>
          )}

          {!isLoading && !isError && (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Destinataires</th>
                    <th>Date</th>
                    <th>Statut</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {relances.map((r) => (
                    <tr key={r.id}>
                      <td>{libelleType(r)}</td>
                      <td>
                        {r.nbDestinataires}
                        {r.nbEchecs > 0 && (
                          <span className="ml-1 text-xs text-error">
                            ({r.nbEchecs} échec{r.nbEchecs > 1 ? "s" : ""})
                          </span>
                        )}
                      </td>
                      <td>
                        {r.statut === "EN_ATTENTE"
                          ? `Prévue le ${formatDate(r.dateProgrammee)}`
                          : formatDate(r.dateExecution)}
                      </td>
                      <td>
                        <span className={`badge ${STATUT_BADGE[r.statut]}`}>
                          {STATUT_LABELS[r.statut]}
                        </span>
                      </td>
                      <td className="flex items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs gap-1"
                          onClick={() => setDetail(r)}
                        >
                          <Eye size={14} />
                          Détails
                        </button>
                        {r.type !== "MANUELLE" && r.statut === "EN_ATTENTE" && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs gap-1 text-error"
                            disabled={annuler.isPending}
                            onClick={() => annuler.mutate(r.id)}
                          >
                            <X size={14} />
                            Annuler
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {relances.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center">
                        Aucune relance pour le moment.
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
                  className="btn join-item btn-sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  «
                </button>
                <button
                  type="button"
                  className="btn join-item btn-sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <NouvelleRelanceModal onClose={() => setModalOpen(false)} />
      )}
      {detail && (
        <RelanceDetailModal relance={detail} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}
