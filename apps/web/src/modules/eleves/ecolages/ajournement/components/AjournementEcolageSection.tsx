import { useState } from "react";
import {
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Search,
  Send,
  X,
} from "lucide-react";
import type { FicheEleveComplete } from "@school-mgt/types";
import { StudentSearchSelect } from "../../../informations/emergencyContact/components/StudentSearchSelect";
import {
  useAccepterAjournement,
  useAjournements,
  useContreProposerAjournement,
  useRefuserAjournement,
  type Ajournement,
  type AjournementFilters,
  type StatutAjournement,
} from "../hooks/useAjournements";

type Props = {
  initialEleveId?: string;
};

type ActionForm = {
  ajournementId: string;
  type: "REFUSER" | "CONTRE_PROPOSITION";
  commentaire: string;
  dates: Record<string, string>;
};

const STATUTS: Array<{ value: StatutAjournement; label: string }> = [
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "ACCEPTE", label: "Acceptées" },
  { value: "REFUSE", label: "Refusées" },
  { value: "CONTRE_PROPOSITION", label: "Contre-proposition" },
  { value: "CONTRE_PROPOSITION_ACCEPTE", label: "Contre-proposition acceptée" },
  { value: "CONTRE_PROPOSITION_REFUSE", label: "Contre-proposition refusée" },
  { value: "ANNULE", label: "Annulées" },
];

const MOIS = [
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

const STATUT_LABELS: Record<StatutAjournement, string> = Object.fromEntries(
  STATUTS.map(({ value, label }) => [value, label]),
) as Record<StatutAjournement, string>;

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR");
}

function formatMontant(value: string): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "MGA",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function dateMinimale(value: string): string {
  const date = new Date(value);
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function statutBadgeClass(statut: StatutAjournement): string {
  if (statut === "ACCEPTE" || statut === "CONTRE_PROPOSITION_ACCEPTE") {
    return "badge-success";
  }
  if (statut === "REFUSE" || statut === "CONTRE_PROPOSITION_REFUSE") {
    return "badge-error";
  }
  if (statut === "EN_ATTENTE" || statut === "CONTRE_PROPOSITION") {
    return "badge-warning";
  }
  return "badge-ghost";
}

function AjournementCard({
  ajournement,
  actionForm,
  setActionForm,
  onAccepter,
  onRefuser,
  onContreProposer,
  isPending,
}: {
  ajournement: Ajournement;
  actionForm: ActionForm | null;
  setActionForm: (form: ActionForm | null) => void;
  onAccepter: (id: string) => void;
  onRefuser: (id: string, commentaire: string) => void;
  onContreProposer: (
    id: string,
    commentaire: string,
    dates: Record<string, string>,
  ) => void;
  isPending: boolean;
}) {
  const formIsOpen = actionForm?.ajournementId === ajournement.id;

  function ouvrirFormulaire(type: ActionForm["type"]) {
    setActionForm({
      ajournementId: ajournement.id,
      type,
      commentaire: "",
      dates: Object.fromEntries(
        ajournement.lignes.map((ligne) => [
          ligne.id,
          ligne.dateDemandee.slice(0, 10),
        ]),
      ),
    });
  }

  return (
    <article className="card border border-base-200 bg-base-100 shadow-sm">
      <div className="card-body gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold">
              {ajournement.parent.nom} {ajournement.parent.prenom}
            </p>
            <p className="mt-1 text-sm text-base-content/60">
              Demande du {formatDate(ajournement.createdAt)}
            </p>
          </div>
          <span className={`badge ${statutBadgeClass(ajournement.statut)}`}>
            {STATUT_LABELS[ajournement.statut]}
          </span>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Motif</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-base-content/70">
            {ajournement.motif}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Élève</th>
                <th>Écolage</th>
                <th>Échéance actuelle</th>
                <th>Date demandée</th>
                <th>Proposition</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              {ajournement.lignes.map((ligne) => (
                <tr key={ligne.id}>
                  <td>
                    {ligne.eleve.nom} {ligne.eleve.prenom}
                  </td>
                  <td>
                    {MOIS[ligne.ecolage.mois - 1]} {ligne.ecolage.anneeScolaire}
                  </td>
                  <td>{formatDate(ligne.dateEcheanceOrigine)}</td>
                  <td>{formatDate(ligne.dateDemandee)}</td>
                  <td>
                    {ligne.dateProposee ? formatDate(ligne.dateProposee) : "—"}
                  </td>
                  <td>{formatMontant(ligne.ecolage.montant)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {ajournement.commentaireAdmin && (
          <p className="text-sm text-base-content/70">
            <span className="font-semibold">Commentaire admin : </span>
            {ajournement.commentaireAdmin}
          </p>
        )}

        {ajournement.statut === "EN_ATTENTE" && (
          <div className="flex flex-wrap gap-2 border-t border-base-200 pt-4">
            <button
              type="button"
              className="btn btn-success btn-sm gap-2"
              disabled={isPending}
              onClick={() => onAccepter(ajournement.id)}
            >
              <Check size={16} />
              Accepter
            </button>
            <button
              type="button"
              className="btn btn-outline btn-error btn-sm gap-2"
              disabled={isPending}
              onClick={() => ouvrirFormulaire("REFUSER")}
            >
              <X size={16} />
              Refuser
            </button>
            <button
              type="button"
              className="btn btn-outline btn-primary btn-sm gap-2"
              disabled={isPending}
              onClick={() => ouvrirFormulaire("CONTRE_PROPOSITION")}
            >
              <CalendarClock size={16} />
              Contre-proposer
            </button>
          </div>
        )}

        {formIsOpen && actionForm && (
          <form
            className="space-y-4 border-t border-base-200 pt-4"
            onSubmit={(event) => {
              event.preventDefault();

              if (actionForm.type === "REFUSER") {
                onRefuser(ajournement.id, actionForm.commentaire.trim());
                return;
              }

              onContreProposer(
                ajournement.id,
                actionForm.commentaire.trim(),
                actionForm.dates,
              );
            }}
          >
            <label className="form-control">
              <span className="label-text mb-1 font-medium">
                Commentaire obligatoire
              </span>
              <textarea
                className="textarea textarea-bordered"
                maxLength={1000}
                required
                value={actionForm.commentaire}
                onChange={(event) =>
                  setActionForm({
                    ...actionForm,
                    commentaire: event.target.value,
                  })
                }
              />
            </label>

            {actionForm.type === "CONTRE_PROPOSITION" &&
              ajournement.lignes.map((ligne) => (
                <label key={ligne.id} className="form-control">
                  <span className="label-text mb-1 font-medium">
                    Nouvelle date : {ligne.eleve.nom} {ligne.eleve.prenom},{" "}
                    {MOIS[ligne.ecolage.mois - 1]}
                  </span>
                  <input
                    type="date"
                    className="input input-bordered"
                    min={dateMinimale(ligne.dateEcheanceOrigine)}
                    required
                    value={actionForm.dates[ligne.id] ?? ""}
                    onChange={(event) =>
                      setActionForm({
                        ...actionForm,
                        dates: {
                          ...actionForm.dates,
                          [ligne.id]: event.target.value,
                        },
                      })
                    }
                  />
                </label>
              ))}

            <div className="flex gap-2">
              <button
                type="submit"
                className="btn btn-primary btn-sm gap-2"
                disabled={isPending || !actionForm.commentaire.trim()}
              >
                <Send size={16} />
                Envoyer
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setActionForm(null)}
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </article>
  );
}

export function AjournementEcolageSection({ initialEleveId }: Props) {
  const [selectedEleve, setSelectedEleve] = useState<FicheEleveComplete | null>(
    null,
  );
  const [actionForm, setActionForm] = useState<ActionForm | null>(null);
  const [filters, setFilters] = useState<AjournementFilters>({
    page: 1,
    limit: 10,
  });

  const eleveId = selectedEleve?.id ?? initialEleveId;
  const queryFilters: AjournementFilters = {
    ...filters,
    ...(eleveId ? { eleveId } : {}),
  };

  const listQuery = useAjournements(queryFilters);
  const accepter = useAccepterAjournement();
  const refuser = useRefuserAjournement();
  const contreProposer = useContreProposerAjournement();

  const demandes = listQuery.data?.data ?? [];
  const pagination = listQuery.data?.pagination;
  const mutationPending =
    accepter.isPending || refuser.isPending || contreProposer.isPending;

  function mettreAJourFiltre(
    key: keyof AjournementFilters,
    value: string | number | undefined,
  ) {
    setFilters((previous) => ({
      ...previous,
      [key]: value || undefined,
      page: 1,
    }));
  }

  function accepterDemande(id: string) {
    accepter.mutate({ id });
  }

  function refuserDemande(id: string, commentaire: string) {
    if (!commentaire) return;
    refuser.mutate(
      { id, commentaire },
      { onSuccess: () => setActionForm(null) },
    );
  }

  function envoyerContreProposition(
    id: string,
    commentaire: string,
    dates: Record<string, string>,
  ) {
    const demande = demandes.find((item) => item.id === id);
    if (!demande || !commentaire) return;

    // Le backend attend une date ISO et une proposition pour chaque ligne.
    const lignes = demande.lignes.map((ligne) => ({
      ligneId: ligne.id,
      dateProposee: new Date(`${dates[ligne.id]}T00:00:00`).toISOString(),
    }));

    contreProposer.mutate(
      { id, commentaire, lignes },
      { onSuccess: () => setActionForm(null) },
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <CalendarClock size={20} className="text-primary" />
        <div>
          <h2 className="text-lg font-bold">Demandes d’ajournement</h2>
          <p className="text-sm text-base-content/60">
            Consultez les demandes et traitez celles en attente.
          </p>
        </div>
      </header>

      <StudentSearchSelect
        selectedStudentId={eleveId}
        onSelect={(student) => {
          setSelectedEleve(student);
          setFilters((previous) => ({ ...previous, page: 1 }));
        }}
      />

      <section className="card border border-base-200 bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="form-control">
              <span className="label-text mb-1 font-medium">Statut</span>
              <select
                className="select select-bordered"
                value={filters.statut ?? ""}
                onChange={(event) =>
                  mettreAJourFiltre(
                    "statut",
                    event.target.value as StatutAjournement | "",
                  )
                }
              >
                <option value="">Tous les statuts</option>
                {STATUTS.map((statut) => (
                  <option key={statut.value} value={statut.value}>
                    {statut.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-control">
              <span className="label-text mb-1 font-medium">ID du parent</span>
              <input
                className="input input-bordered"
                value={filters.parentId ?? ""}
                placeholder="UUID du parent"
                onChange={(event) =>
                  mettreAJourFiltre("parentId", event.target.value)
                }
              />
            </label>

            <label className="form-control">
              <span className="label-text mb-1 font-medium">Créée après</span>
              <input
                type="date"
                className="input input-bordered"
                value={filters.dateDebut ?? ""}
                onChange={(event) =>
                  mettreAJourFiltre("dateDebut", event.target.value)
                }
              />
            </label>

            <label className="form-control">
              <span className="label-text mb-1 font-medium">Créée avant</span>
              <input
                type="date"
                className="input input-bordered"
                value={filters.dateFin ?? ""}
                onChange={(event) =>
                  mettreAJourFiltre("dateFin", event.target.value)
                }
              />
            </label>
          </div>
        </div>
      </section>

      {listQuery.isLoading && (
        <div className="py-10 text-center">
          <span className="loading loading-spinner" />
        </div>
      )}

      {listQuery.isError && (
        <div role="alert" className="alert alert-error">
          <span>Impossible de charger les demandes d’ajournement.</span>
        </div>
      )}

      {!listQuery.isLoading && !listQuery.isError && demandes.length === 0 && (
        <div className="rounded-lg border border-dashed border-base-300 p-8 text-center">
          <Search size={24} className="mx-auto text-base-content/40" />
          <p className="mt-2 font-medium">Aucune demande trouvée</p>
        </div>
      )}

      <div className="space-y-4">
        {demandes.map((demande) => (
          <AjournementCard
            key={demande.id}
            ajournement={demande}
            actionForm={actionForm}
            setActionForm={setActionForm}
            onAccepter={accepterDemande}
            onRefuser={refuserDemande}
            onContreProposer={envoyerContreProposition}
            isPending={mutationPending}
          />
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <footer className="flex items-center justify-between border-t border-base-200 pt-4">
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
              aria-label="Page précédente"
            >
              <ChevronLeft size={16} />
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
              aria-label="Page suivante"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
