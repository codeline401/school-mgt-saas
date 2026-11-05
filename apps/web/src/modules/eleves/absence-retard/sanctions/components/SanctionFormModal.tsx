import { useState, type FormEvent } from "react";
import type {
  ModifierSanctionInput,
  Sanction,
  TypeSanction,
} from "../hooks/useSanctions";

const TYPES_SANCTION: Array<{ value: TypeSanction; label: string }> = [
  { value: "AVERTISSEMENT", label: "Avertissement" },
  { value: "BLAME", label: "Blâme" },
  { value: "RETENUE", label: "Retenue" },
  { value: "EXCLUSION_TEMPORAIRE", label: "Exclusion temporaire" },
  { value: "CONVOCATION_PARENT", label: "Convocation du parent" },
  { value: "AUTRE", label: "Autre" },
];

export type SanctionFormValues = ModifierSanctionInput;

type Props = {
  sanction?: Sanction;
  pending: boolean;
  onClose: () => void;
  onSave: (values: SanctionFormValues) => Promise<void>;
};

function datePourInput(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

export function SanctionFormModal({
  sanction,
  pending,
  onClose,
  onSave,
}: Props) {
  const [type, setType] = useState<TypeSanction>(
    sanction?.type ?? "AVERTISSEMENT",
  );
  const [motif, setMotif] = useState(sanction?.motif ?? "");
  const [details, setDetails] = useState(sanction?.details ?? "");
  const [dateSanction, setDateSanction] = useState(
    datePourInput(sanction?.dateSanction) ||
      new Date().toISOString().slice(0, 10),
  );
  const [dateFin, setDateFin] = useState(datePourInput(sanction?.dateFin));

  async function soumettre(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await onSave({
        type,
        motif: motif.trim(),
        details: details.trim() || null,
        dateSanction,
        dateFin: dateFin || null,
      });
    } catch {
      return;
    }
  }

  return (
    <div className="modal modal-open" role="dialog" aria-modal="true">
      <div className="modal-box max-w-xl">
        <h3 className="text-lg font-bold">
          {sanction ? "Modifier la sanction" : "Nouvelle sanction"}
        </h3>

        <form className="mt-4 space-y-4" onSubmit={soumettre}>
          <fieldset className="fieldset">
            <label className="label" htmlFor="sanction-type">
              Type
            </label>
            <select
              id="sanction-type"
              className="select select-bordered w-full"
              value={type}
              onChange={(event) => setType(event.target.value as TypeSanction)}
            >
              {TYPES_SANCTION.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </fieldset>

          <fieldset className="fieldset">
            <label className="label" htmlFor="sanction-motif">
              Motif
            </label>
            <textarea
              id="sanction-motif"
              className="textarea textarea-bordered w-full"
              minLength={5}
              maxLength={2000}
              required
              rows={3}
              value={motif}
              onChange={(event) => setMotif(event.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset">
            <label className="label" htmlFor="sanction-details">
              Détails complémentaires
            </label>
            <textarea
              id="sanction-details"
              className="textarea textarea-bordered w-full"
              maxLength={2000}
              rows={3}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
            />
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset className="fieldset">
              <label className="label" htmlFor="sanction-date">
                Date
              </label>
              <input
                id="sanction-date"
                type="date"
                className="input input-bordered w-full"
                required
                value={dateSanction}
                onChange={(event) => setDateSanction(event.target.value)}
              />
            </fieldset>

            <fieldset className="fieldset">
              <label className="label" htmlFor="sanction-date-fin">
                Date de fin
              </label>
              <input
                id="sanction-date-fin"
                type="date"
                className="input input-bordered w-full"
                min={dateSanction}
                value={dateFin}
                onChange={(event) => setDateFin(event.target.value)}
              />
            </fieldset>
          </div>

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
