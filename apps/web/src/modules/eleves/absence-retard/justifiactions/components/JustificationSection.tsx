import { useState } from "react";
import { FileCheck2, FileText, Plus, Search, Ticket } from "lucide-react";
import type { FicheEleveComplete } from "@school-mgt/types";
import { StudentSearchSelect } from "../../../informations/emergencyContact/components/StudentSearchSelect";
import {
  ouvrirFichierProtege,
  urlBilletPdf,
  urlFichier,
  useJustifications,
} from "../hooks/useJustifications";
import { BilletModal } from "./BilletModal";
import { NouvelleJustificationModal } from "./NouvelleJustificationModal";

type Props = { initialEleveId?: string };

const formaterDate = (d: string) => d.split("-").reverse().join("/");

// Onglet « Justifications » : justificatifs d'un élève et billets d'entrée associés.
export function JustificationSection({ initialEleveId }: Props) {
  const [selectedEleve, setSelectedEleve] = useState<FicheEleveComplete | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [nouvelleOuverte, setNouvelleOuverte] = useState(false);
  const [billetPour, setBilletPour] = useState<string | null>(null);

  const eleveId = selectedEleve?.id ?? initialEleveId;
  const { data, isLoading, isError } = useJustifications(eleveId, page);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileCheck2 size={20} className="text-primary" />
          <div>
            <h2 className="text-lg font-bold">Justifications d'absence</h2>
            <p className="text-sm text-base-content/60">
              Enregistrez le justificatif d'un élève et délivrez son billet
              d'entrée.
            </p>
          </div>
        </div>
        {eleveId && (
          <button
            type="button"
            className="btn btn-primary btn-sm gap-2"
            onClick={() => setNouvelleOuverte(true)}
          >
            <Plus size={16} />
            Nouvelle justification
          </button>
        )}
      </div>

      <StudentSearchSelect
        selectedStudentId={eleveId}
        onSelect={(student) => {
          setSelectedEleve(student);
          setPage(1);
        }}
      />

      {!eleveId && (
        <div className="rounded-lg border border-dashed border-base-300 p-8 text-center">
          <Search size={24} className="mx-auto text-base-content/40" />
          <p className="mt-2 font-medium">Aucun élève sélectionné</p>
        </div>
      )}

      {eleveId && isLoading && <span className="loading loading-spinner" />}
      {eleveId && isError && (
        <p className="text-error">Impossible de charger les justifications.</p>
      )}
      {data && data.data.length === 0 && (
        <p className="rounded-lg border border-dashed border-base-300 p-8 text-center text-sm">
          Aucune justification pour cet élève.
        </p>
      )}

      <div className="space-y-3">
        {data?.data.map((j) => (
          <article
            key={j.id}
            className="card border border-base-200 bg-base-100 shadow-sm"
          >
            <div className="card-body gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-base-content/60">
                    {new Date(j.createdAt).toLocaleDateString("fr-FR")} ·{" "}
                    {j._count.presences} absence(s) justifiée(s)
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{j.motif}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm gap-1"
                    onClick={() => ouvrirFichierProtege(urlFichier(j.id))}
                  >
                    <FileText size={14} />
                    Justificatif
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-primary btn-sm gap-1"
                    onClick={() => setBilletPour(j.id)}
                  >
                    <Ticket size={14} />
                    Billet d'entrée
                  </button>
                </div>
              </div>

              {j.billets.length > 0 && (
                <ul className="space-y-1 border-t border-base-200 pt-3 text-sm">
                  {j.billets.map((b) => (
                    <li
                      key={b.id}
                      className="flex items-center justify-between"
                    >
                      <span>
                        {b.numero} · {formaterDate(b.dateValidite)} ·{" "}
                        {b.creneau.heureDebut}–{b.creneau.heureFin}
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={() => ouvrirFichierProtege(urlBilletPdf(b.id))}
                      >
                        Réimprimer
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        ))}
      </div>

      {data && data.pagination.totalPages > 1 && (
        <div className="join">
          <button
            type="button"
            className="btn join-item btn-sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            «
          </button>
          <span className="btn join-item btn-sm no-animation">
            {page} / {data.pagination.totalPages}
          </span>
          <button
            type="button"
            className="btn join-item btn-sm"
            disabled={page >= data.pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            »
          </button>
        </div>
      )}

      {nouvelleOuverte && eleveId && (
        <NouvelleJustificationModal
          eleveId={eleveId}
          onClose={() => setNouvelleOuverte(false)}
        />
      )}
      {billetPour && (
        <BilletModal
          justificationId={billetPour}
          onClose={() => setBilletPour(null)}
        />
      )}
    </div>
  );
}
