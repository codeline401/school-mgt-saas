import { useState } from "react";
import { X } from "lucide-react";
import {
  useAbsencesAJustifier,
  useCreerJustification,
} from "../hooks/useJustifications";

type Props = { eleveId: string; onClose: () => void };

const FORMATS = ".pdf,.jpg,.jpeg,.png";
const TAILLE_MAX = 2 * 1024 * 1024;

const formaterDate = (d: string) => d.split("-").reverse().join("/");

// Saisie d'une justification : absences concernées, motif et pièce jointe.
export function NouvelleJustificationModal({ eleveId, onClose }: Props) {
  const {
    data: absences = [],
    isLoading,
    isError,
  } = useAbsencesAJustifier(eleveId);
  const creer = useCreerJustification(eleveId);

  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [motif, setMotif] = useState("");
  const [fichier, setFichier] = useState<File | null>(null);
  const [erreurFichier, setErreurFichier] = useState<string | null>(null);

  const peutValider =
    selection.size > 0 && motif.trim().length >= 5 && !!fichier;

  function basculer(id: string) {
    setSelection((prev) => {
      const suivant = new Set(prev);
      if (suivant.has(id)) suivant.delete(id);
      else suivant.add(id);
      return suivant;
    });
  }

  function choisirFichier(f: File | null) {
    setErreurFichier(
      f && f.size > TAILLE_MAX
        ? "Fichier trop volumineux (2 Mo maximum)."
        : null,
    );
    setFichier(f && f.size <= TAILLE_MAX ? f : null);
  }

  async function soumettre() {
    if (!fichier) return;
    try {
      await creer.mutateAsync({
        motif: motif.trim(),
        presenceIds: [...selection],
        fichier,
      });
      onClose();
    } catch {
      // Erreur déjà notifiée par le hook
    }
  }

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Nouvelle justification</h3>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Fermer"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">
            Absences et retards à justifier
          </p>
          <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-base-200 p-2">
            {isError && (
              <p role="alert" className="p-2 text-sm text-error">
                Impossible de charger les absences à justifier.
              </p>
            )}
            {isLoading && (
              <span className="loading loading-spinner loading-sm" />
            )}
            {!isLoading && absences.length === 0 && (
              <p className="p-2 text-sm text-base-content/60">
                Aucune absence à justifier.
              </p>
            )}
            {absences.map((a) => (
              <label
                key={a.id}
                className="flex cursor-pointer items-center gap-3 rounded p-2 hover:bg-base-200"
              >
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={selection.has(a.id)}
                  onChange={() => basculer(a.id)}
                />
                <span className="text-sm">
                  {formaterDate(a.date)} · {a.heureDebut}–{a.heureFin} ·{" "}
                  {a.matiere ?? "Cours"}
                </span>
                <span
                  className={`badge badge-sm ${a.statut === "ABSENT" ? "badge-error" : "badge-warning"}`}
                >
                  {a.statut === "ABSENT" ? "Absence" : "Retard"}
                </span>
              </label>
            ))}
          </div>
        </div>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Motif / excuse</legend>
          <textarea
            className="textarea textarea-bordered h-24 w-full"
            maxLength={1000}
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">
            Justificatif (PDF, JPEG ou PNG)
          </legend>
          <input
            type="file"
            accept={FORMATS}
            className="file-input file-input-bordered w-full"
            onChange={(e) => choisirFichier(e.target.files?.[0] ?? null)}
          />
          {erreurFichier && (
            <span className="text-sm text-error">{erreurFichier}</span>
          )}
        </fieldset>

        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!peutValider || creer.isPending}
            onClick={soumettre}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </dialog>
  );
}
