import { useId } from "react";
import type { GraviteSante, TypeSuiviSante } from "../hooks/useSante";

type TypeFiltre = TypeSuiviSante | "";

type Props = {
  type: TypeFiltre;
  from: string;
  to: string;
  onTypeChange: (value: TypeFiltre) => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
};

const TYPES: Array<{ value: TypeSuiviSante; label: string }> = [
  { value: "ALLERGIE", label: "Allergie" },
  { value: "VISITE_MEDICALE", label: "Visite médicale" },
  { value: "SOIN", label: "Soin" },
  { value: "MALADIE", label: "Maladie" },
  { value: "ACCIDENT", label: "Accident" },
];

// These shared constants are intentionally exported from this module.
// eslint-disable-next-line react-refresh/only-export-components
export const LIBELLES_GRAVITE: Record<GraviteSante, string> = {
  FAIBLE: "Faible",
  MODEREE: "Modérée",
  ELEVEE: "Élevée",
  URGENTE: "Urgente",
};

// eslint-disable-next-line react-refresh/only-export-components
export const LIBELLES_TYPE_SANTE: Record<TypeSuiviSante, string> = {
  ALLERGIE: "Allergie",
  VISITE_MEDICALE: "Visite médicale",
  SOIN: "Soin",
  MALADIE: "Maladie",
  ACCIDENT: "Accident",
};

export function SanteFilters({
  type,
  from,
  to,
  onTypeChange,
  onFromChange,
  onToChange,
}: Props) {
  const baseId = useId();
  const typeId = `${baseId}-type`;
  const fromId = `${baseId}-from`;
  const toId = `${baseId}-to`;

  const isInValidRange = Boolean(from && to && from > to);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <fieldset className="fieldset">
        <label htmlFor={typeId} className="fieldset-legend">
          Type
        </label>
        <select
          id={typeId}
          className="select select-sm select-bordered w-full"
          value={type}
          onChange={(event) => onTypeChange(event.target.value as TypeFiltre)}
        >
          <option value="">Tous les types</option>
          {TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset className="fieldset">
        <label htmlFor={fromId} className="fieldset-legend">
          Du
        </label>
        <input
          id={fromId}
          className="input input-sm input-bordered w-full"
          type="date"
          value={from}
          max={to || undefined}
          onChange={(event) => onFromChange(event.target.value)}
        />
      </fieldset>

      <fieldset className="fieldset">
        <label htmlFor={toId} className="fieldset-legend">
          Au
        </label>
        <input
          id={toId}
          className="input input-sm input-bordered w-full"
          type="date"
          value={to}
          min={from || undefined}
          onChange={(event) => onToChange(event.target.value)}
        />
      </fieldset>

      {isInValidRange && (
        <p className="text-sm text-red-500 col-span-3">
          La date de début doit être antérieure à la date de fin.
        </p>
      )}
    </div>
  );
}
