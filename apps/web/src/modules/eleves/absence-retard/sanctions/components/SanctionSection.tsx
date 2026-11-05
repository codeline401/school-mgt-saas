import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
} from "lucide-react";
import type { FicheEleveComplete } from "@school-mgt/types";
import { useAuthStore } from "../../../../../store/authStore";
import { StudentSearchSelect } from "../../../informations/emergencyContact/components/StudentSearchSelect";
import {
  useChangerStatutSanction,
  useCreerSanction,
  useModifierSanction,
  useSanctions,
  type Sanction,
  type SanctionFiltres,
  type StatutSanction,
  type TypeSanction,
} from "../hooks/useSanctions";
import {
  SanctionFormModal,
  type SanctionFormValues,
} from "./SanctionFormModal";

import ConfirmModal from "../../../../../components/ConfirmModal";

type Props = { initialEleveId?: string };
type FiltreType = TypeSanction | "";
type FiltreStatut = StatutSanction | "";

const LIBELLES_TYPE: Record<TypeSanction, string> = {
  AVERTISSEMENT: "Avertissement",
  BLAME: "Blâme",
  RETENUE: "Retenue",
  EXCLUSION_TEMPORAIRE: "Exclusion temporaire",
  CONVOCATION_PARENT: "Convocation du parent",
  AUTRE: "Autre",
};

const LIBELLES_STATUT: Record<StatutSanction, string> = {
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  ANNULEE: "Annulée",
};

function afficherDate(date: string) {
  return date.slice(0, 10).split("-").reverse().join("/");
}

export function SanctionsSection({ initialEleveId }: Props) {
  const user = useAuthStore((state) => state.user);
  const admin = user?.role === "ADMIN" || user?.role === "SUDO_ADMIN";

  const [eleve, setEleve] = useState<FicheEleveComplete | null>(null);
  const [eleveIdInitial, setEleveIdInitial] = useState(initialEleveId);
  const [type, setType] = useState<FiltreType>("");
  const [statut, setStatut] = useState<FiltreStatut>("");
  const [page, setPage] = useState(1);
  const [sanctionEdition, setSanctionEdition] = useState<Sanction | null>(null);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);

  const [statutEnAttente, setStatutEnAttente] = useState<{
    sanction: Sanction;
    statut: "TERMINEE" | "ANNULEE";
  } | null>(null);

  const eleveId = eleve?.id ?? eleveIdInitial;

  const filtres: SanctionFiltres = {
    eleveId,
    type: type || undefined,
    statut: statut || undefined,
    page,
    limit: 10,
  };

  const query = useSanctions(filtres);
  const creer = useCreerSanction();
  const modifier = useModifierSanction();
  const changerStatut = useChangerStatutSanction();

  async function enregistrer(values: SanctionFormValues) {
    if (sanctionEdition) {
      await modifier.mutateAsync({
        sanctionId: sanctionEdition.id,
        input: values,
      });
    } else if (eleveId) {
      await creer.mutateAsync({ ...values, eleveId });
    }

    setFormulaireOuvert(false);
    setSanctionEdition(null);
  }

  function selectionnerEleve(student: FicheEleveComplete) {
    setEleve(student);
    setEleveIdInitial(undefined);
    setPage(1);
  }

  function ouvrirEdition(sanction: Sanction) {
    setSanctionEdition(sanction);
    setFormulaireOuvert(true);
  }

  function ouvrirCreation() {
    setSanctionEdition(null);
    setFormulaireOuvert(true);
  }

  function confirmerStatut() {
    if (!statutEnAttente) return;

    changerStatut.mutate(
      {
        sanctionId: statutEnAttente.sanction.id,
        statut: statutEnAttente.statut,
      },
      { onSettled: () => setStatutEnAttente(null) },
    );
  }

  if (!admin) {
    return (
      <p role="alert" className="alert alert-warning">
        Cette section est réservée aux administrateurs.
      </p>
    );
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-primary" size={22} />
          <div>
            <h2 className="text-lg font-bold">Sanctions & discipline</h2>
            <p className="text-sm text-base-content/60">
              Enregistrement et suivi des sanctions des élèves.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={!eleveId}
          onClick={ouvrirCreation}
        >
          <Plus size={16} />
          Nouvelle sanction
        </button>
      </header>

      <StudentSearchSelect
        selectedStudentId={eleveId}
        onSelect={selectionnerEleve}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="fieldset">
          <span className="label">Type de sanction</span>
          <select
            className="select select-bordered"
            value={type}
            onChange={(event) => {
              setType(event.target.value as FiltreType);
              setPage(1);
            }}
          >
            <option value="">Tous les types</option>
            {Object.entries(LIBELLES_TYPE).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="fieldset">
          <span className="label">Statut</span>
          <select
            className="select select-bordered"
            value={statut}
            onChange={(event) => {
              setStatut(event.target.value as FiltreStatut);
              setPage(1);
            }}
          >
            <option value="">Tous les statuts</option>
            {Object.entries(LIBELLES_STATUT).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!eleveId && (
        <div className="rounded border border-dashed border-base-300 p-8 text-center">
          <Search size={24} className="mx-auto text-base-content/40" />
          <p className="mt-2 font-medium">Aucun élève sélectionné</p>
          <p className="text-sm text-base-content/60">
            Sélectionne un élève pour consulter ou enregistrer une sanction.
          </p>
        </div>
      )}

      {eleveId && query.isLoading && (
        <div className="p-8 text-center">
          <span className="loading loading-spinner" />
        </div>
      )}

      {eleveId && query.isError && (
        <p role="alert" className="text-error">
          Impossible de charger les sanctions.
        </p>
      )}

      {query.data && (
        <>
          <div className="overflow-x-auto rounded border border-base-200">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Motif</th>
                  <th>Statut</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {query.data.data.map((sanction) => (
                  <tr key={sanction.id}>
                    <td>
                      {afficherDate(sanction.dateSanction)}
                      {sanction.dateFin && (
                        <div className="text-xs text-base-content/60">
                          Fin : {afficherDate(sanction.dateFin)}
                        </div>
                      )}
                    </td>
                    <td>{LIBELLES_TYPE[sanction.type]}</td>
                    <td className="max-w-sm">
                      <p className="whitespace-pre-wrap">{sanction.motif}</p>
                      {sanction.details && (
                        <p className="mt-1 whitespace-pre-wrap text-xs text-base-content/60">
                          {sanction.details}
                        </p>
                      )}
                      {!eleveId && (
                        <p className="mt-1 text-xs text-base-content/60">
                          {sanction.eleve.prenom} {sanction.eleve.nom}
                        </p>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          sanction.statut === "EN_COURS"
                            ? "badge-warning"
                            : sanction.statut === "TERMINEE"
                              ? "badge-success"
                              : "badge-ghost"
                        }`}
                      >
                        {LIBELLES_STATUT[sanction.statut]}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        {sanction.statut === "EN_COURS" && (
                          <>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm btn-square"
                              aria-label="Modifier la sanction"
                              title="Modifier"
                              onClick={() => ouvrirEdition(sanction)}
                            >
                              <Pencil size={16} />
                            </button>
                            <select
                              className="select select-bordered select-sm w-32"
                              aria-label="Clôturer la sanction"
                              value=""
                              disabled={changerStatut.isPending}
                              onChange={(event) => {
                                const value = event.target.value;
                                if (
                                  value === "TERMINEE" ||
                                  value === "ANNULEE"
                                ) {
                                  setStatutEnAttente({
                                    sanction,
                                    statut: value,
                                  });
                                }
                              }}
                            >
                              <option value="" disabled>
                                Clôturer…
                              </option>
                              <option value="TERMINEE">Terminée</option>
                              <option value="ANNULEE">Annuler</option>
                            </select>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {query.data.data.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center">
                      Aucune sanction pour ces filtres.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {query.data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-square"
                aria-label="Page précédente"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm">
                {page} / {query.data.pagination.totalPages}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-square"
                aria-label="Page suivante"
                disabled={page >= query.data.pagination.totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {formulaireOuvert && (
        <SanctionFormModal
          sanction={sanctionEdition ?? undefined}
          pending={creer.isPending || modifier.isPending}
          onClose={() => {
            setFormulaireOuvert(false);
            setSanctionEdition(null);
          }}
          onSave={enregistrer}
        />
      )}

      <ConfirmModal
        isOpen={!!statutEnAttente}
        title={
          statutEnAttente?.statut === "ANNULEE"
            ? "Annuler la sanction ?"
            : "Terminer la sanction ?"
        }
        icon={statutEnAttente?.statut === "ANNULEE" ? "danger" : "success"}
        message={
          statutEnAttente
            ? `${statutEnAttente.sanction.eleve.prenom} ${statutEnAttente.sanction.eleve.nom} : ce statut est définitif et la sanction ne pourra plus être modifiée.`
            : ""
        }
        confirmLabel={
          statutEnAttente?.statut === "ANNULEE"
            ? "Annuler la sanction"
            : "Terminer"
        }
        cancelLabel="Retour"
        isLoading={changerStatut.isPending}
        onConfirm={confirmerStatut}
        onCancel={() => setStatutEnAttente(null)}
      />
    </section>
  );
}
