import { useState } from "react";
import { Printer, X } from "lucide-react";
import {
  ouvrirFichierProtege,
  urlBilletPdf,
  useGenererBillet,
  usePropositionsCreneau,
} from "../hooks/useJustifications";

type Props = { justificationId: string; onClose: () => void };

const formaterDate = (d: string) => d.split("-").reverse().join("/");

// Choix du créneau (cours actuel ou prochain cours) puis génération et impression du billet.
export function BilletModal({ justificationId, onClose }: Props) {
  const {
    data: propositions = [],
    isLoading,
    isError,
  } = usePropositionsCreneau(justificationId);
  const generer = useGenererBillet();
  const [choix, setChoix] = useState<string | null>(null);

  const selection =
    propositions.find((p) => p.creneauId === choix) ?? propositions[0];

  async function genererEtImprimer() {
    if (!selection) return;

    // 1. Ouvrir la fenêtre immédiatement de manière synchrone (conserve l'activation utilisateur)
    const newWindow = window.open("", "_blank");

    try {
      const billet = await generer.mutateAsync({
        justificationId,
        creneauId: selection.creneauId,
        date: selection.date,
      });

      // 2. Passer la fenêtre pré-ouverte au helper pour qu'il y injecte l'URL du PDF
      await ouvrirFichierProtege(urlBilletPdf(billet.id));

      onClose();
    } catch {
      // 3. En cas d'erreur, fermer la fenêtre vide qui a été ouverte pour rien
      if (newWindow) {
        newWindow.close();
      }
      // Erreur déjà notifiée par le hook
    }
  }

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Billet d'entrée</h3>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Fermer"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-base-content/60">
          Choisissez le cours pour lequel l'élève est autorisé à entrer.
        </p>

        {isLoading && <span className="loading loading-spinner" />}
        {isError && (
          <p className="text-error">
            Impossible de charger les créneaux (élève sans classe ?).
          </p>
        )}
        {!isLoading && !isError && propositions.length === 0 && (
          <p className="text-sm">
            Aucun cours dans l'emploi du temps de la classe.
          </p>
        )}

        <div className="space-y-2">
          {propositions.map((p) => (
            <label
              key={`${p.type}-${p.creneauId}`}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                selection?.creneauId === p.creneauId
                  ? "border-primary bg-primary/5"
                  : "border-base-200"
              }`}
            >
              <input
                type="radio"
                name="creneau"
                className="radio radio-primary radio-sm"
                checked={selection?.creneauId === p.creneauId}
                onChange={() => setChoix(p.creneauId)}
              />
              <div className="text-sm">
                <p className="font-medium">
                  {p.type === "ACTUEL" ? "Cours actuel" : "Prochain cours"}
                </p>
                <p className="text-base-content/70">
                  {p.libelle} · {formaterDate(p.date)} · {p.heureDebut}–
                  {p.heureFin}
                </p>
              </div>
            </label>
          ))}
        </div>

        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="btn btn-primary gap-2"
            disabled={!selection || generer.isPending}
            onClick={genererEtImprimer}
          >
            <Printer size={16} />
            Générer et imprimer
          </button>
        </div>
      </div>
    </dialog>
  );
}
