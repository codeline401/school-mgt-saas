import { useState, type FormEvent } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Eye,
  History,
  Pencil,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";
import { useAuthStore } from "../../../../../store/authStore";
import {
  useAlertes,
  useApercuRegle,
  useCreerRegleAlerte,
  useHistoriqueAlertes,
  useModifierRegleAlerte,
  useReglesAlerte,
  useSupprimerRegleAlerte,
  type DestinataireAlerte,
  type RegleAlerte,
  type RegleAlerteInput,
  type TypeRegleAlerte,
} from "../hooks/useAlertes";

type Vue = "alertes" | "regles" | "historique";

const TYPES_REGLE: Array<{ value: TypeRegleAlerte; label: string }> = [
  { value: "ABSENCES", label: "Absences répétées" },
  { value: "ABSENCES_NON_JUSTIFIEES", label: "Absences non justifiées" },
  { value: "RETARDS", label: "Retards répétés" },
  { value: "TAUX_PRESENCE", label: "Taux de présence faible" },
];

const DESTINATAIRES: Array<{
  value: DestinataireAlerte;
  label: string;
}> = [
  { value: "ADMIN", label: "Administrateurs" },
  { value: "PARENT", label: "Parent" },
  { value: "PROFESSEUR_PRINCIPAL", label: "Professeur principal" },
];

function dateLocaleISO(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function periodeInitiale() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: dateLocaleISO(from), to: dateLocaleISO(to) };
}

function libelleType(type: string) {
  return TYPES_REGLE.find((item) => item.value === type)?.label ?? type;
}

function regleVersForm(regle: RegleAlerte): RegleAlerteInput {
  return {
    nom: regle.nom,
    type: regle.type,
    periodeJours: regle.periodeJours,
    classeId: regle.classeId,
    actif: regle.actif,
    paliers: regle.paliers.map((palier) => ({
      seuil: palier.seuil,
      destinataires: palier.destinataire,
      message: palier.message ?? undefined,
    })),
  };
}

function FormulaireRegle({
  initial,
  onClose,
  onSave,
  pending,
}: {
  initial: RegleAlerteInput;
  onClose: () => void;
  onSave: (input: RegleAlerteInput) => void;
  pending: boolean;
}) {
  const [form, setForm] = useState(initial);

  function changerPalier(
    index: number,
    update: Partial<RegleAlerteInput["paliers"][number]>,
  ) {
    setForm((current) => ({
      ...current,
      paliers: current.paliers.map((palier, i) =>
        i === index ? { ...palier, ...update } : palier,
      ),
    }));
  }

  function basculerDestinataire(
    index: number,
    destinataire: DestinataireAlerte,
  ) {
    const current = form.paliers[index].destinataires;
    const next = current.includes(destinataire)
      ? current.filter((value) => value !== destinataire)
      : [...current, destinataire];

    changerPalier(index, { destinataires: next });
  }

  function soumettre(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(form);
  }

  return (
    <div className="modal modal-open" role="dialog" aria-modal="true">
      <div className="modal-box max-w-2xl">
        <h3 className="text-lg font-bold">
          {initial.nom ? "Modifier la règle" : "Nouvelle règle d’alerte"}
        </h3>

        <form className="mt-5 space-y-4" onSubmit={soumettre}>
          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset className="fieldset sm:col-span-2">
              <label className="label" htmlFor="alerte-nom">
                Nom
              </label>
              <input
                id="alerte-nom"
                className="input input-bordered w-full"
                required
                minLength={3}
                maxLength={100}
                value={form.nom}
                onChange={(event) =>
                  setForm({ ...form, nom: event.target.value })
                }
              />
            </fieldset>

            <fieldset className="fieldset">
              <label className="label" htmlFor="alerte-type">
                Déclencheur
              </label>
              <select
                id="alerte-type"
                className="select select-bordered w-full"
                value={form.type}
                onChange={(event) =>
                  setForm({
                    ...form,
                    type: event.target.value as TypeRegleAlerte,
                  })
                }
              >
                {TYPES_REGLE.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </fieldset>

            <fieldset className="fieldset">
              <label className="label" htmlFor="alerte-periode">
                Fenêtre d’évaluation (jours)
              </label>
              <input
                id="alerte-periode"
                type="number"
                className="input input-bordered w-full"
                min={1}
                max={365}
                required
                value={form.periodeJours}
                onChange={(event) =>
                  setForm({
                    ...form,
                    periodeJours: Number(event.target.value),
                  })
                }
              />
            </fieldset>
          </div>

          <label className="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={form.actif}
              onChange={(event) =>
                setForm({ ...form, actif: event.target.checked })
              }
            />
            <span>Règle active</span>
          </label>

          <div className="flex items-center justify-between border-t border-base-200 pt-4">
            <h4 className="font-semibold">Paliers de notification</h4>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={form.paliers.length >= 5}
              onClick={() =>
                setForm({
                  ...form,
                  paliers: [
                    ...form.paliers,
                    { seuil: 3, destinataires: ["ADMIN"] },
                  ],
                })
              }
            >
              <Plus size={16} />
              Ajouter un palier
            </button>
          </div>

          {form.paliers.map((palier, index) => (
            <fieldset
              key={index}
              className="space-y-3 rounded border border-base-300 p-4"
            >
              <div className="flex items-end gap-3">
                <fieldset className="fieldset flex-1">
                  <label className="label">
                    Seuil {form.type === "TAUX_PRESENCE" ? "(%)" : "(nombre)"}
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    min={form.type === "TAUX_PRESENCE" ? 0 : 1}
                    max={form.type === "TAUX_PRESENCE" ? 100 : undefined}
                    step={form.type === "TAUX_PRESENCE" ? 0.1 : 1}
                    required
                    value={palier.seuil}
                    onChange={(event) =>
                      changerPalier(index, {
                        seuil: Number(event.target.value),
                      })
                    }
                  />
                </fieldset>
                <button
                  type="button"
                  className="btn btn-ghost btn-square text-error"
                  aria-label="Supprimer le palier"
                  title="Supprimer le palier"
                  disabled={form.paliers.length <= 1}
                  onClick={() =>
                    setForm({
                      ...form,
                      paliers: form.paliers.filter((_, i) => i !== index),
                    })
                  }
                >
                  <Trash2 size={17} />
                </button>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {DESTINATAIRES.map((destinataire) => (
                  <label
                    key={destinataire.value}
                    className="label cursor-pointer gap-2"
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={palier.destinataires.includes(
                        destinataire.value,
                      )}
                      onChange={() =>
                        basculerDestinataire(index, destinataire.value)
                      }
                    />
                    {destinataire.label}
                  </label>
                ))}
              </div>

              <fieldset className="fieldset">
                <label className="label">
                  Message personnalisé (optionnel)
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  maxLength={500}
                  rows={2}
                  value={palier.message ?? ""}
                  onChange={(event) =>
                    changerPalier(index, {
                      message: event.target.value || undefined,
                    })
                  }
                />
              </fieldset>
            </fieldset>
          ))}

          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={pending}
            >
              {pending && (
                <span className="loading loading-spinner loading-sm" />
              )}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
      <button
        type="button"
        className="modal-backdrop"
        aria-label="Fermer"
        onClick={onClose}
      />
    </div>
  );
}

export function AlertesSection() {
  const user = useAuthStore((state) => state.user);
  const autorise = user?.role === "ADMIN" || user?.role === "SUDO_ADMIN";

  const [vue, setVue] = useState<Vue>("alertes");
  const [periode, setPeriode] = useState(periodeInitiale);
  const [seuilAbsences, setSeuilAbsences] = useState(3);
  const [seuilRetards, setSeuilRetards] = useState(5);
  const [seuilTauxPresence, setSeuilTauxPresence] = useState(80);
  const [page, setPage] = useState(1);
  const [pageHistorique, setPageHistorique] = useState(1);
  const [edition, setEdition] = useState<RegleAlerte | "nouvelle" | null>(null);
  const [regleApercu, setRegleApercu] = useState<string | null>(null);

  const filtres = {
    ...periode,
    seuilAbsences,
    seuilRetards,
    seuilTauxPresence,
    page,
    limit: 10,
  };

  const alertes = useAlertes(filtres, autorise && vue === "alertes");
  const regles = useReglesAlerte(autorise && vue === "regles");
  const historique = useHistoriqueAlertes(
    pageHistorique,
    autorise && vue === "historique",
  );
  const apercu = useApercuRegle(regleApercu);

  const creer = useCreerRegleAlerte();
  const modifier = useModifierRegleAlerte();
  const supprimer = useSupprimerRegleAlerte();

  async function enregistrer(input: RegleAlerteInput) {
    if (edition && edition !== "nouvelle") {
      await modifier.mutateAsync({ id: edition.id, input });
    } else {
      await creer.mutateAsync(input);
    }
    setEdition(null);
  }

  if (!autorise) {
    return (
      <p role="alert" className="alert alert-warning">
        Cette section est réservée aux administrateurs.
      </p>
    );
  }

  const formulaireInitial: RegleAlerteInput | null =
    edition === "nouvelle"
      ? {
          nom: "",
          type: "RETARDS",
          periodeJours: 30,
          classeId: null,
          actif: true,
          paliers: [{ seuil: 3, destinataires: ["ADMIN"] }],
        }
      : edition
        ? regleVersForm(edition)
        : null;

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Bell className="text-primary" size={22} />
          <div>
            <h2 className="text-lg font-bold">Alertes d’assiduité</h2>
            <p className="text-sm text-base-content/60">
              Suivi des seuils et notifications automatiques
            </p>
          </div>
        </div>

        {vue === "regles" && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setEdition("nouvelle")}
          >
            <Plus size={16} />
            Nouvelle règle
          </button>
        )}
      </header>

      <div role="tablist" className="tabs tabs-bordered">
        <button
          type="button"
          role="tab"
          className={`tab ${vue === "alertes" ? "tab-active" : ""}`}
          onClick={() => setVue("alertes")}
        >
          <Bell size={16} className="mr-2" />
          Alertes actuelles
        </button>
        <button
          type="button"
          role="tab"
          className={`tab ${vue === "regles" ? "tab-active" : ""}`}
          onClick={() => setVue("regles")}
        >
          <Settings2 size={16} className="mr-2" />
          Règles automatiques
        </button>
        <button
          type="button"
          role="tab"
          className={`tab ${vue === "historique" ? "tab-active" : ""}`}
          onClick={() => setVue("historique")}
        >
          <History size={16} className="mr-2" />
          Historique
        </button>
      </div>

      {vue === "alertes" && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="fieldset">
              <span className="label">Du</span>
              <input
                type="date"
                className="input input-bordered"
                value={periode.from}
                max={periode.to}
                onChange={(event) => {
                  setPeriode({ ...periode, from: event.target.value });
                  setPage(1);
                }}
              />
            </label>
            <label className="fieldset">
              <span className="label">Au</span>
              <input
                type="date"
                className="input input-bordered"
                value={periode.to}
                min={periode.from}
                onChange={(event) => {
                  setPeriode({ ...periode, to: event.target.value });
                  setPage(1);
                }}
              />
            </label>
            <label className="fieldset">
              <span className="label">Seuil absences</span>
              <input
                type="number"
                min={1}
                className="input input-bordered"
                value={seuilAbsences}
                onChange={(event) => {
                  setSeuilAbsences(Number(event.target.value));
                  setPage(1);
                }}
              />
            </label>
            <label className="fieldset">
              <span className="label">Seuil retards</span>
              <input
                type="number"
                min={1}
                className="input input-bordered"
                value={seuilRetards}
                onChange={(event) => {
                  setSeuilRetards(Number(event.target.value));
                  setPage(1);
                }}
              />
            </label>
            <label className="fieldset">
              <span className="label">Présence minimum (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                className="input input-bordered"
                value={seuilTauxPresence}
                onChange={(event) => {
                  setSeuilTauxPresence(Number(event.target.value));
                  setPage(1);
                }}
              />
            </label>
          </div>

          {alertes.isLoading && (
            <div className="p-8 text-center">
              <span className="loading loading-spinner" />
            </div>
          )}
          {alertes.isError && (
            <p role="alert" className="text-error">
              Impossible de charger les alertes.
            </p>
          )}

          {alertes.data && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="stat rounded border border-base-200">
                  <div className="stat-title">Élèves concernés</div>
                  <div className="stat-value text-primary">
                    {alertes.data.resume.total}
                  </div>
                </div>
                <div className="stat rounded border border-base-200">
                  <div className="stat-title">À surveiller</div>
                  <div className="stat-value text-warning">
                    {alertes.data.resume.attention}
                  </div>
                </div>
                <div className="stat rounded border border-base-200">
                  <div className="stat-title">Critiques</div>
                  <div className="stat-value text-error">
                    {alertes.data.resume.critique}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded border border-base-200">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Élève</th>
                      <th>Niveau</th>
                      <th>Absences</th>
                      <th>Non justifiées</th>
                      <th>Retards</th>
                      <th>Présence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertes.data.data.map((alerte) => (
                      <tr key={alerte.eleve.id}>
                        <td>
                          <div className="font-medium">
                            {alerte.eleve.prenom} {alerte.eleve.nom}
                          </div>
                          <div className="text-xs text-base-content/60">
                            {alerte.eleve.classe?.nom ?? "Sans classe"}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              alerte.niveau === "CRITIQUE"
                                ? "badge-error"
                                : "badge-warning"
                            }`}
                          >
                            {alerte.niveau}
                          </span>
                        </td>
                        <td>{alerte.stats.absent}</td>
                        <td>{alerte.stats.absentNonJustifie}</td>
                        <td>{alerte.stats.retard}</td>
                        <td>{alerte.stats.tauxPresence}%</td>
                      </tr>
                    ))}
                    {alertes.data.data.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center">
                          Aucune alerte sur cette période.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={page}
                totalPages={alertes.data.pagination.totalPages}
                onChange={setPage}
              />
            </>
          )}
        </>
      )}

      {vue === "regles" && (
        <>
          {regles.isLoading && (
            <div className="p-8 text-center">
              <span className="loading loading-spinner" />
            </div>
          )}
          {regles.isError && (
            <p role="alert" className="text-error">
              Impossible de charger les règles d’alerte.
            </p>
          )}

          <div className="divide-y divide-base-200">
            {regles.data?.map((regle) => (
              <article
                key={regle.id}
                className="flex flex-wrap items-center justify-between gap-4 py-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{regle.nom}</h3>
                    <span
                      className={`badge ${
                        regle.actif ? "badge-success" : "badge-ghost"
                      }`}
                    >
                      {regle.actif ? "Active" : "Désactivée"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-base-content/70">
                    {libelleType(regle.type)} · fenêtre de {regle.periodeJours}{" "}
                    jours · {regle.paliers.length} palier(s)
                  </p>
                  <p className="text-xs text-base-content/60">
                    {regle.paliers
                      .map(
                        (palier) =>
                          `${palier.seuil}: ${palier.destinataire.join(", ")}`,
                      )
                      .join(" | ")}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    title="Aperçu"
                    aria-label={`Aperçu de ${regle.nom}`}
                    onClick={() =>
                      setRegleApercu(regleApercu === regle.id ? null : regle.id)
                    }
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    title="Modifier"
                    aria-label={`Modifier ${regle.nom}`}
                    onClick={() => setEdition(regle)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-error"
                    title="Supprimer"
                    aria-label={`Supprimer ${regle.nom}`}
                    onClick={() => {
                      if (window.confirm(`Supprimer « ${regle.nom} » ?`)) {
                        supprimer.mutate(regle.id);
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
            {regles.data?.length === 0 && (
              <p className="py-8 text-center text-base-content/60">
                Aucune règle configurée.
              </p>
            )}
          </div>

          {regleApercu && (
            <div className="rounded border border-base-200 p-4">
              <h3 className="font-semibold">Aperçu de la règle</h3>
              {apercu.isLoading && (
                <span className="loading loading-spinner loading-sm mt-3" />
              )}
              {apercu.isError && (
                <p className="mt-2 text-sm text-error">
                  Impossible de calculer l’aperçu.
                </p>
              )}
              {apercu.data && (
                <p className="mt-2 text-sm">
                  {apercu.data.total} élève(s) déclencheraient cette règle.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {vue === "historique" && (
        <>
          {historique.isLoading && (
            <div className="p-8 text-center">
              <span className="loading loading-spinner" />
            </div>
          )}
          {historique.isError && (
            <p role="alert" className="text-error">
              Impossible de charger l’historique.
            </p>
          )}
          {historique.data && (
            <>
              <div className="overflow-x-auto rounded border border-base-200">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Élève</th>
                      <th>Règle</th>
                      <th>Valeur / seuil</th>
                      <th>Notifications</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historique.data.data.map((item) => (
                      <tr key={item.id}>
                        <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                        <td>
                          {item.eleve.prenom} {item.eleve.nom}
                        </td>
                        <td>{item.regle.nom}</td>
                        <td>
                          {item.valeur} / {item.palier.seuil}
                        </td>
                        <td>{item.nbNotification}</td>
                      </tr>
                    ))}
                    {historique.data.data.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center">
                          Aucun déclenchement enregistré.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={pageHistorique}
                totalPages={historique.data.pagination.totalPages}
                onChange={setPageHistorique}
              />
            </>
          )}
        </>
      )}

      {formulaireInitial && (
        <FormulaireRegle
          key={edition && edition !== "nouvelle" ? edition.id : "nouvelle"}
          initial={formulaireInitial}
          onClose={() => setEdition(null)}
          onSave={enregistrer}
          pending={creer.isPending || modifier.isPending}
        />
      )}
    </section>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        className="btn btn-ghost btn-sm btn-square"
        aria-label="Page précédente"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft size={18} />
      </button>
      <span className="text-sm">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        className="btn btn-ghost btn-sm btn-square"
        aria-label="Page suivante"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
