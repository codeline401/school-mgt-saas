import { useState, type FormEvent } from "react";
import type {
  CreerSuiviSanteInput,
  GraviteSante,
  ModifierSuiviSanteInput,
  SuiviSante,
  TypeSuiviSante,
} from "../hooks/useSante";
import { LIBELLES_GRAVITE, LIBELLES_TYPE_SANTE } from "./SanteFilters";

type Props = {
  eleveId: string;
  suivi?: SuiviSante;
  pending: boolean;
  onClose: () => void;
  onSave: (
    input: CreerSuiviSanteInput | ModifierSuiviSanteInput,
  ) => Promise<void>;
};

function datePourInput(value?: string | null): string {
  return value ? value.slice(0, 10) : "";
}

function aujourdHuiLocal(): string {
  const date = new Date();
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `${annee}-${mois}-${jour}`;
}

export function SanteFormModal({
  eleveId,
  suivi,
  pending,
  onClose,
  onSave,
}: Props) {
  const [type, setType] = useState<TypeSuiviSante>(suivi?.type ?? "ALLERGIE");
  const [titre, setTitre] = useState(suivi?.titre ?? "");
  const [description, setDescription] = useState(suivi?.description ?? "");
  const [gravite, setGravite] = useState<GraviteSante | "">(
    suivi?.gravite ?? "",
  );
  const [dateEvenement, setDateEvenement] = useState(
    datePourInput(suivi?.dateEvenement) || aujourdHuiLocal(),
  );
  const [dateFin, setDateFin] = useState(datePourInput(suivi?.dateFin));
  const [notifierParents, setNotifierParents] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function soumettre(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur(null);

    try {
      if (suivi) {
        await onSave({
          titre: titre.trim(),
          description: description.trim() || null,
          gravite: gravite || null,
          dateEvenement,
          dateFin: dateFin || null,
        });
        return;
      }

      await onSave({
        eleveId,
        type,
        titre: titre.trim(),
        description: description.trim() || null,
        gravite: gravite || null,
        dateEvenement,
        dateFin: dateFin || null,
        notifierParents: type === "ACCIDENT" && notifierParents,
      });
    } catch (error) {
      setErreur(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer l’information.",
      );
    }
  }

  return (
    <div className="modal modal-open" role="dialog" aria-modal="true">
      <div className="modal-box max-w-xl">
        <h3 className="text-lg font-bold">
          {suivi
            ? "Modifier le suivi de santé"
            : "Nouvelle information de santé"}
        </h3>

        <form className="mt-4 space-y-3" onSubmit={soumettre}>
          {!suivi && (
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Type</legend>
              <select
                className="select select-bordered w-full"
                value={type}
                onChange={(event) =>
                  setType(event.target.value as TypeSuiviSante)
                }
              >
                {Object.entries(LIBELLES_TYPE_SANTE).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </fieldset>
          )}

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Titre</legend>
            <input
              className="input input-bordered w-full"
              value={titre}
              minLength={2}
              maxLength={150}
              required
              onChange={(event) => setTitre(event.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Description</legend>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={4}
              maxLength={4000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Gravité</legend>
              <select
                className="select select-bordered w-full"
                value={gravite}
                onChange={(event) =>
                  setGravite(event.target.value as GraviteSante | "")
                }
              >
                <option value="">Non précisée</option>
                {Object.entries(LIBELLES_GRAVITE).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Date</legend>
              <input
                className="input input-bordered w-full"
                type="date"
                required
                value={dateEvenement}
                max={dateFin || undefined}
                onChange={(event) => setDateEvenement(event.target.value)}
              />
            </fieldset>

            <fieldset className="fieldset sm:col-span-2">
              <legend className="fieldset-legend">Date de fin</legend>
              <input
                className="input input-bordered w-full"
                type="date"
                min={dateEvenement}
                value={dateFin}
                onChange={(event) => setDateFin(event.target.value)}
              />
            </fieldset>
          </div>

          {!suivi && type === "MALADIE" && (
            <div className="alert alert-info text-sm">
              Les parents disposant d’un compte seront notifiés automatiquement.
            </div>
          )}

          {!suivi && type === "ACCIDENT" && (
            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={notifierParents}
                onChange={(event) => setNotifierParents(event.target.checked)}
              />
              <span>Notifier les parents ayant un compte</span>
            </label>
          )}

          {erreur && (
            <p role="alert" className="text-sm text-error">
              {erreur}
            </p>
          )}

          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={pending}
            >
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
