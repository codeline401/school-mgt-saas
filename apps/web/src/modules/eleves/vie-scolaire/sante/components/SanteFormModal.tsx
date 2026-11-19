import { useEffect, useId, useRef, useState, type FormEvent } from "react";
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
  const baseId = useId();
  const headingId = `${baseId}-heading`;
  const typeId = `${baseId}-type`;
  const titreId = `${baseId}-titre`;
  const descriptionId = `${baseId}-description`;
  const graviteId = `${baseId}-gravite`;
  const dateEvenementId = `${baseId}-date-evenement`;
  const dateFinId = `${baseId}-date-fin`;

  const dialogRef = useRef<HTMLDialogElement>(null);
  const initialFocusRef = useRef<HTMLSelectElement | HTMLInputElement | null>(
    null,
  );

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

  useEffect(() => {
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const dialog = dialogRef.current;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }

    requestAnimationFrame(() => {
      initialFocusRef.current?.focus();
    });

    return () => {
      if (dialog?.open) {
        dialog.close();
      }
      opener?.focus();
    };
  }, []);

  function effacerErreur() {
    if (erreur !== null) {
      setErreur(null);
    }
  }

  async function soumettre(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur(null);

    try {
      if (suivi) {
        const payload: ModifierSuiviSanteInput = {};

        const initialTitre = suivi.titre.trim();
        const nextTitre = titre.trim();
        if (nextTitre !== initialTitre) {
          payload.titre = nextTitre;
        }

        const initialDescription = suivi.description?.trim() || null;
        const nextDescription = description.trim() || null;
        if (nextDescription !== initialDescription) {
          payload.description = nextDescription;
        }

        const initialGravite = suivi.gravite || null;
        const nextGravite = gravite || null;
        if (nextGravite !== initialGravite) {
          payload.gravite = nextGravite;
        }

        const initialDateEvenement = datePourInput(suivi.dateEvenement);
        if (dateEvenement !== initialDateEvenement) {
          payload.dateEvenement = dateEvenement;
        }

        const initialDateFin = datePourInput(suivi.dateFin) || null;
        const nextDateFin = dateFin || null;
        if (nextDateFin !== initialDateFin) {
          payload.dateFin = nextDateFin;
        }

        await onSave(payload);
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
    <dialog
      ref={dialogRef}
      className="modal modal-open"
      aria-labelledby={headingId}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) {
          onClose();
        }
      }}
    >
      <div className="modal-box max-w-xl">
        <h3 id={headingId} className="text-lg font-bold">
          {suivi
            ? "Modifier le suivi de santé"
            : "Nouvelle information de santé"}
        </h3>

        <form className="mt-4 space-y-3" onSubmit={soumettre}>
          {!suivi && (
            <fieldset className="fieldset">
              <label htmlFor={typeId} className="fieldset-legend">
                Type
              </label>
              <select
                id={typeId}
                ref={(el) => {
                  if (!suivi) {
                    initialFocusRef.current = el;
                  }
                }}
                className="select select-bordered w-full"
                value={type}
                onChange={(event) => {
                  effacerErreur();
                  setType(event.target.value as TypeSuiviSante);
                }}
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
            <label htmlFor={titreId} className="fieldset-legend">
              Titre
            </label>
            <input
              id={titreId}
              ref={(el) => {
                if (suivi) {
                  initialFocusRef.current = el;
                }
              }}
              className="input input-bordered w-full"
              value={titre}
              minLength={2}
              maxLength={150}
              required
              onChange={(event) => {
                effacerErreur();
                setTitre(event.target.value);
              }}
            />
          </fieldset>

          <fieldset className="fieldset">
            <label htmlFor={descriptionId} className="fieldset-legend">
              Description
            </label>
            <textarea
              id={descriptionId}
              className="textarea textarea-bordered w-full"
              rows={4}
              maxLength={4000}
              value={description}
              onChange={(event) => {
                effacerErreur();
                setDescription(event.target.value);
              }}
            />
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            <fieldset className="fieldset">
              <label htmlFor={graviteId} className="fieldset-legend">
                Gravité
              </label>
              <select
                id={graviteId}
                className="select select-bordered w-full"
                value={gravite}
                onChange={(event) => {
                  effacerErreur();
                  setGravite(event.target.value as GraviteSante | "");
                }}
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
              <label htmlFor={dateEvenementId} className="fieldset-legend">
                Date
              </label>
              <input
                id={dateEvenementId}
                className="input input-bordered w-full"
                type="date"
                required
                value={dateEvenement}
                max={dateFin || undefined}
                onChange={(event) => {
                  effacerErreur();
                  setDateEvenement(event.target.value);
                }}
              />
            </fieldset>

            <fieldset className="fieldset sm:col-span-2">
              <label htmlFor={dateFinId} className="fieldset-legend">
                Date de fin
              </label>
              <input
                id={dateFinId}
                className="input input-bordered w-full"
                type="date"
                min={dateEvenement}
                value={dateFin}
                onChange={(event) => {
                  effacerErreur();
                  setDateFin(event.target.value);
                }}
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
                onChange={(event) => {
                  effacerErreur();
                  setNotifierParents(event.target.checked);
                }}
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
        onClick={() => {
          if (!pending) {
            onClose();
          }
        }}
      />
    </dialog>
  );
}
