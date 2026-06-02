/**
 * @file CanevasBulletinModal.tsx
 * @description Modal de configuration du canevas de bulletin.
 *
 * Permets à un ADMIN ou SUDO_ADMIN de personnaliser le modèle imprimé:
 *  - Texte d'en-tête (ex: nom de l'école, année scolaire)
 *  - Pied de page (ligne de singature)
 *  - Colonnes affichés (rang, coefficient, nb évaluations, etc.)
 *  - Seuil de couleur (Bien / Assez-Bien / Passable)
 *
 * La configuration est sauvagardée via PUT /api/bulletin-template.
 * Lecture initiale vie GET /api/bulletin-template (appelée dans BulletinTab)
 */

import {
  DEFAULT_BULLETIN_CONFIG,
  type BulletinTemplateConfig,
} from "@school-mgt/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { api, getApiError } from "../../lib/api";
import { Settings } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  // Config actuelle (chargée depuis la DB ou les défauts)
  config: BulletinTemplateConfig;
}

export default function CanevasBulletinModal({ config }: Props) {
  const queryClient = useQueryClient(); // Pour rafraîchir les données après mise à jour
  const modalRef = useRef<HTMLDialogElement>(null); // Référence au modal pour le fermer après sauvegarde

  // Copie locale du formulaire, initialisée depuis la prop `config`
  const [form, setForm] = useState<BulletinTemplateConfig>({
    ...DEFAULT_BULLETIN_CONFIG, // On part des valeurs par défaut pour garantir que tous les champs sont présents
    ...config, // La prop `config` contient déjà les valeurs de la DB ou les défauts, on peut l'utiliser directement pour initialiser le formulaire
  });

  // (suppression du useEffect setState synchrone — le formulaire est réinitialisé
  //  à l'ouverture du modal via le handler du bouton)

  // --- Mutation upsert --------------------------------------------------
  const mutation = useMutation({
    mutationFn: async (values: BulletinTemplateConfig) => {
      const { data } = await api.put("/api/bulletin-template", values); // on suppose que le serveur renvoie la config mise à jour (avec ID, timestamps, etc.)
      return data; // on suppose que le serveur renvoie la config mise à jour (avec ID, timestamps, etc.)
    },

    onSuccess: () => {
      // Invalide la cache pour que le BulletinTab recharge la config à jour
      queryClient.invalidateQueries({ queryKey: ["bulletin-template"] });
      toast.success("Canevas de bulletin mis à jour !");
      modalRef.current?.close(); // Ferme le modal après sauvegarde
    },

    onError: (err) => {
      toast.error(getApiError(err, "Erreur lors de la suavagerde"));
    },
  });

  // --- Handlers ---------------------------------------------

  /** Met à jour un champ texte ou némrique dans le formulaire. */
  function handleText(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target; // name doit correspondre à une clé de BulletinTemplateConfig
    setForm((prev) => ({ ...prev, [name]: value })); // Mise à jour générique pour les champs texte
  }

  /** Met à jour un champ numérique (seuils). */
  function handleNumber(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: Number(value) })); // Convertit la valeur en nombre
  }

  /** Met à jour un champ boolean (cases à cocher). */
  function handleCheck(e: ChangeEvent<HTMLInputElement>) {
    const { name, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: checked })); // Mise à jour pour les cases à cocher
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault(); // Empêche le rechargement de la page
    mutation.mutate(form); // Envoie la config au serveur
  }

  return (
    <>
      {/* Bouton déclencheur */}
      <button
        className="btn btn-ghost btn-sm gap-1"
        onClick={() => {
          // Réinitialise le formulaire avec la config courante avant d'ouvrir
          setForm({ ...DEFAULT_BULLETIN_CONFIG, ...config });
          modalRef.current?.showModal();
        }}
        aria-label="Configurer le canevas du bulletin"
        title="Configurer le canevas"
      >
        <Settings size={14} />
        Canevas
      </button>

      {/* Dialog */}
      <dialog ref={modalRef} className="modal">
        <div className="modal-box max-w-lg">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Settings size={18} className="text-primary" />
            Canevas du bulletin
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ── Textes ─────────────────────────────────────────── */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Texte d'en-tête</legend>
              <input
                type="text"
                name="enteteTexte"
                className="input w-full"
                placeholder="ex : Lycée Victor Hugo — Année 2025-2026"
                value={form.enteteTexte}
                onChange={handleText}
                maxLength={200}
              />
              <span className="fieldset-label">
                Affiché en haut de chaque bulletin imprimé.
              </span>
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Année scolaire</legend>
              <input
                type="text"
                name="anneeTexte"
                className="input w-full"
                placeholder="ex : 2025-2026"
                value={form.anneeTexte}
                onChange={handleText}
                maxLength={20}
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Pied de page</legend>
              <input
                type="text"
                name="piedTexte"
                className="input w-full"
                placeholder="ex : Le Directeur : ___________"
                value={form.piedTexte}
                onChange={handleText}
                maxLength={200}
              />
              <span className="fieldset-label">
                Ligne de signature ou mention légale.
              </span>
            </fieldset>

            {/* ── Colonnes ───────────────────────────────────────── */}
            <div>
              <p className="text-sm font-medium mb-2">Colonnes affichées</p>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="showRang"
                    className="checkbox checkbox-sm"
                    checked={form.showRang}
                    onChange={handleCheck}
                  />
                  <span className="text-sm">Rang dans la classe</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="showCoef"
                    className="checkbox checkbox-sm"
                    checked={form.showCoef}
                    onChange={handleCheck}
                  />
                  <span className="text-sm">
                    Coefficient (somme par matière)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="showNbEval"
                    className="checkbox checkbox-sm"
                    checked={form.showNbEval}
                    onChange={handleCheck}
                  />
                  <span className="text-sm">
                    Nombre d'évaluations par matière
                  </span>
                </label>
              </div>
            </div>

            {/* ── Seuils de couleur ──────────────────────────────── */}
            <div>
              <p className="text-sm font-medium mb-2">
                Seuils de couleur (sur 20)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend text-success">
                    Bien (/20) ≥
                  </legend>
                  <input
                    type="number"
                    name="seuilBien"
                    className="input w-full"
                    min={0}
                    max={20}
                    step={0.5}
                    value={form.seuilBien}
                    onChange={handleNumber}
                  />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend text-warning">
                    Passable (/20) ≥
                  </legend>
                  <input
                    type="number"
                    name="seuilPassable"
                    className="input w-full"
                    min={0}
                    max={20}
                    step={0.5}
                    value={form.seuilPassable}
                    onChange={handleNumber}
                  />
                </fieldset>
              </div>
            </div>

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => modalRef.current?.close()}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={mutation.isPending}
              >
                {mutation.isPending && (
                  <span className="loading loading-spinner loading-sm" />
                )}
                Enregistrer
              </button>
            </div>
          </form>
        </div>

        {/* Fermeture hors modal */}
        <form method="dialog" className="modal-backdrop">
          <button type="submit">Fermer</button>
        </form>
      </dialog>
    </>
  );
}
