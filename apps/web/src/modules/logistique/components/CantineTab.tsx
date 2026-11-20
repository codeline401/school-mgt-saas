import { useState, type FormEvent } from "react";
import { Pencil, Plus, Utensils } from "lucide-react";
import {
  useCreerOffreCantine,
  useDesactiverOffreCantine,
  useModifierOffreCantine,
  useOffresCantine,
  type JourSemaine,
  type OffreCantine,
  type OffreCantineInput,
} from "../hooks/useCantine";

type FormState =
  | { mode: "creation" }
  | { mode: "edition"; offre: OffreCantine }
  | null;

type OffreFormProps = {
  offre?: OffreCantine;
  pending: boolean;
  onCancel: () => void;
  onSave: (input: OffreCantineInput) => Promise<void>;
};

function anneeScolaireCourante(): string {
  const now = new Date();
  const debut = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${debut}-${debut + 1}`;
}

function OffreForm({ offre, pending, onCancel, onSave }: OffreFormProps) {
  const [nom, setNom] = useState(offre?.nom ?? "");
  const [description, setDescription] = useState(offre?.description ?? "");
  const [anneeScolaire, setAnneeScolaire] = useState(
    offre?.anneeScolaire ?? anneeScolaireCourante(),
  );
  const [tarifMensuel, setTarifMensuel] = useState(
    offre ? String(offre.tarifMensuel) : "",
  );
  const [joursSemaine, setJoursSemaine] = useState<JourSemaine[]>(
    offre?.joursSemaine ?? ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI"],
  );
  const [erreur, setErreur] = useState<string | null>(null);

  function basculerJour(jour: JourSemaine) {
    setJoursSemaine((current) =>
      current.includes(jour)
        ? current.filter((value) => value !== jour)
        : [...current, jour],
    );
  }

  async function soumettre(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur(null);

    try {
      await onSave({
        nom: nom.trim(),
        description: description.trim() || null,
        anneeScolaire,
        tarifMensuel: Number(tarifMensuel),
        joursSemaine,
      });
    } catch (error) {
      setErreur(
        error instanceof Error ? error.message : "Impossible d’enregistrer.",
      );
    }
  }

  return (
    <div className="modal modal-open" role="dialog" aria-modal="true">
      <div className="modal-box max-w-xl">
        <h3 className="text-lg font-bold">
          {offre ? "Modifier le forfait" : "Nouveau forfait cantine"}
        </h3>

        <form className="mt-4 space-y-3" onSubmit={soumettre}>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Nom</legend>
            <input
              className="input input-bordered w-full"
              required
              minLength={2}
              maxLength={100}
              value={nom}
              onChange={(event) => setNom(event.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Description</legend>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Année scolaire</legend>
              <input
                className="input input-bordered w-full"
                required
                pattern="\d{4}-\d{4}"
                placeholder="2026-2027"
                value={anneeScolaire}
                onChange={(event) => setAnneeScolaire(event.target.value)}
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Tarif mensuel</legend>
              <input
                className="input input-bordered w-full"
                type="number"
                min="0"
                step="0.01"
                required
                value={tarifMensuel}
                onChange={(event) => setTarifMensuel(event.target.value)}
              />
            </fieldset>
          </div>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Jours servis</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {JOURS.map((jour) => (
                <label key={jour.value} className="label cursor-pointer gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={joursSemaine.includes(jour.value)}
                    onChange={() => basculerJour(jour.value)}
                  />
                  <span>{jour.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {erreur && (
            <p role="alert" className="text-sm text-error">
              {erreur}
            </p>
          )}

          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onCancel}
              disabled={pending}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={pending || joursSemaine.length === 0}
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
        onClick={onCancel}
      />
    </div>
  );
}

export function CantineOffresTab() {
  const [anneeScolaire, setAnneeScolaire] = useState("");
  const [formState, setFormState] = useState<FormState>(null);

  const offresQuery = useOffresCantine(
    anneeScolaire ? { anneeScolaire } : undefined,
  );
  const creer = useCreerOffreCantine();
  const modifier = useModifierOffreCantine();
  const desactiver = useDesactiverOffreCantine();

  async function enregistrer(input: OffreCantineInput) {
    if (formState?.mode === "edition") {
      await modifier.mutateAsync({
        offreId: formState.offre.id,
        input,
      });
    } else {
      await creer.mutateAsync(input);
    }

    setFormState(null);
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Utensils className="text-primary" size={22} />
          <div>
            <h2 className="text-lg font-bold">Forfaits de cantine</h2>
            <p className="text-sm text-base-content/60">
              Configurez les tarifs et les jours de service par année scolaire.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setFormState({ mode: "creation" })}
        >
          <Plus size={16} />
          Nouveau forfait
        </button>
      </header>

      <label className="fieldset max-w-xs">
        <span className="label">Année scolaire</span>
        <input
          className="input input-bordered"
          placeholder="Toutes les années"
          value={anneeScolaire}
          onChange={(event) => setAnneeScolaire(event.target.value)}
        />
      </label>

      {offresQuery.isLoading && (
        <div className="flex justify-center py-10" aria-busy="true">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}

      {offresQuery.isError && (
        <p role="alert" className="alert alert-error">
          Impossible de charger les forfaits cantine.
        </p>
      )}

      {offresQuery.data && offresQuery.data.length === 0 && (
        <div className="rounded border border-dashed border-base-300 p-8 text-center">
          <p className="font-medium">Aucun forfait cantine configuré</p>
        </div>
      )}

      {offresQuery.data && offresQuery.data.length > 0 && (
        <div className="overflow-x-auto rounded border border-base-200">
          <table className="table">
            <thead>
              <tr>
                <th>Forfait</th>
                <th>Année scolaire</th>
                <th>Jours servis</th>
                <th>Tarif mensuel</th>
                <th>Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {offresQuery.data.map((offre) => (
                <tr key={offre.id}>
                  <td>
                    <div className="font-medium">{offre.nom}</div>
                    {offre.description && (
                      <div className="text-xs text-base-content/60">
                        {offre.description}
                      </div>
                    )}
                  </td>
                  <td>{offre.anneeScolaire}</td>
                  <td>
                    {JOURS.filter((jour) =>
                      offre.joursSemaine.includes(jour.value),
                    )
                      .map((jour) => jour.label)
                      .join(", ")}
                  </td>
                  <td>{Number(offre.tarifMensuel).toLocaleString("fr-FR")}</td>
                  <td>
                    <span
                      className={`badge ${offre.actif ? "badge-success" : "badge-ghost"}`}
                    >
                      {offre.actif ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-square"
                        aria-label={`Modifier ${offre.nom}`}
                        title="Modifier"
                        onClick={() => setFormState({ mode: "edition", offre })}
                      >
                        <Pencil size={16} />
                      </button>
                      {offre.actif && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={desactiver.isPending}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Désactiver le forfait « ${offre.nom} » ?`,
                              )
                            ) {
                              desactiver.mutate(offre.id);
                            }
                          }}
                        >
                          Désactiver
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formState && (
        <OffreForm
          key={
            formState.mode === "edition" ? formState.offre.id : "nouvelle-offre"
          }
          offre={formState.mode === "edition" ? formState.offre : undefined}
          pending={creer.isPending || modifier.isPending}
          onCancel={() => setFormState(null)}
          onSave={enregistrer}
        />
      )}
    </section>
  );
}

const JOURS: Array<{ value: JourSemaine; label: string }> = [
  { value: "LUNDI", label: "Lun" },
  { value: "MARDI", label: "Mar" },
  { value: "MERCREDI", label: "Mer" },
  { value: "JEUDI", label: "Jeu" },
  { value: "VENDREDI", label: "Ven" },
  { value: "SAMEDI", label: "Sam" },
  { value: "DIMANCHE", label: "Dim" },
];
