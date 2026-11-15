import type { Classe, Matiere } from "@school-mgt/types";
import type { ProgressionPeriodeOption } from "../hooks/useProgression";

type Props = {
  classes: Classe[];
  periodes: ProgressionPeriodeOption[];
  matieres: Matiere[];
  classeId: string;
  periodeId: string;
  matiereId: string;
  onClasseChange: (value: string) => void;
  onPeriodeChange: (value: string) => void;
  onMatiereChange: (value: string) => void;
};

export function ProgressionFilters({
  classes,
  periodes,
  matieres,
  classeId,
  periodeId,
  matiereId,
  onClasseChange,
  onPeriodeChange,
  onMatiereChange,
}: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Classe</legend>
        <select
          className="select select-sm select-bordered w-full"
          value={classeId}
          onChange={(event) => onClasseChange(event.target.value)}
        >
          <option value="">Toutes les classes</option>
          {classes.map((classe) => (
            <option key={classe.id} value={classe.id}>
              {classe.nom}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Période</legend>
        <select
          className="select select-sm select-bordered w-full"
          value={periodeId}
          disabled={!classeId}
          onChange={(event) => onPeriodeChange(event.target.value)}
        >
          <option value="">Toutes les périodes</option>
          {periodes.map((periode) => (
            <option key={periode.id} value={periode.id}>
              {periode.nom} — {periode.anneeScolaire}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Matière</legend>
        <select
          className="select select-sm select-bordered w-full"
          value={matiereId}
          disabled={!classeId}
          onChange={(event) => onMatiereChange(event.target.value)}
        >
          <option value="">Toutes les matières</option>
          {matieres.map((matiere) => (
            <option key={matiere.id} value={matiere.id}>
              {matiere.nom}
            </option>
          ))}
        </select>
      </fieldset>
    </div>
  );
}
