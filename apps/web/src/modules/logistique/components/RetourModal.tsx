import { useState } from "react";
import { X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import {
  useRetournerEquipement,
  type PretEquipement,
  type RetourEquipementInput,
} from "../hooks/useEquipements";

/**
 * COMPOSANT MODAL RETOUR
 *
 * Modal pour enregistrer le retour d'un équipement
 */

interface RetourModalProps {
  pret: PretEquipement;
  onClose: () => void;
}

const ETATS = [
  { value: "NEUF", label: "Neuf" },
  { value: "BON", label: "Bon état" },
  { value: "MOYEN", label: "État moyen" },
  { value: "MAUVAIS", label: "Mauvais état" },
  { value: "HORS_SERVICE", label: "Hors service" },
];

export default function RetourModal({ pret, onClose }: RetourModalProps) {
  // ─── État du formulaire ──────────────────────────────────
  const [formData, setFormData] = useState<RetourEquipementInput>({
    dateRetourEffective: new Date().toISOString().split("T")[0],
    etatRetour: pret.equipement?.etat || "BON",
    observations: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Mutation ─────────────────────────────────────────────
  const retourMutation = useRetournerEquipement();

  // ─── Handlers ─────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.dateRetourEffective) {
      newErrors.dateRetourEffective = "La date de retour est requise";
    }

    const dateRetour = new Date(formData.dateRetourEffective);
    const datePret = new Date(pret.datePret);

    if (dateRetour < datePret) {
      newErrors.dateRetourEffective =
        "La date de retour ne peut pas être avant la date de prêt";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const dataToSubmit: RetourEquipementInput = {
        dateRetourEffective: new Date(
          formData.dateRetourEffective,
        ).toISOString(),
        etatRetour: formData.etatRetour,
      };

      if (formData.observations?.trim()) {
        dataToSubmit.observations = formData.observations;
      }

      await retourMutation.mutateAsync({
        pretId: pret.id,
        input: dataToSubmit,
      });

      onClose();
    } catch (error) {
      console.error("Erreur lors du retour:", error);
    }
  };

  const isLoading = retourMutation.isPending;

  // Calculer si le retour est en retard
  const dateRetourPrevue = new Date(pret.dateRetourPrevue);
  const aujourdhui = new Date();
  const isEnRetard = aujourdhui > dateRetourPrevue;

  // ─── Rendu ────────────────────────────────────────────────
  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CheckCircle size={24} className="text-success" />
            <h3 className="font-bold text-lg">Retour d'équipement</h3>
          </div>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost"
            disabled={isLoading}
          >
            <X size={18} />
          </button>
        </div>

        {/* Info prêt */}
        <div
          className={`alert ${isEnRetard ? "alert-warning" : "alert-info"} mb-4`}
        >
          <AlertCircle size={20} />
          <div>
            <div className="font-semibold">
              {pret.equipement?.nom || "Équipement"}
            </div>
            <div className="text-sm">Emprunté par: {pret.emprunteurNom}</div>
            <div className="text-sm">
              Retour prévu:{" "}
              {new Date(pret.dateRetourPrevue).toLocaleDateString("fr-FR")}
            </div>
            {isEnRetard && (
              <div className="text-sm font-semibold text-warning">
                ⚠️ Retour en retard
              </div>
            )}
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Date de retour effective */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  Date de retour effective <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="date"
                name="dateRetourEffective"
                value={formData.dateRetourEffective}
                onChange={handleChange}
                className={`input input-bordered ${errors.dateRetourEffective ? "input-error" : ""}`}
                disabled={isLoading}
              />
              {errors.dateRetourEffective && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.dateRetourEffective}
                  </span>
                </label>
              )}
            </div>

            {/* État de l'équipement au retour */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  État de l'équipement <span className="text-error">*</span>
                </span>
              </label>
              <select
                name="etatRetour"
                value={formData.etatRetour}
                onChange={handleChange}
                className="select select-bordered"
                disabled={isLoading}
              >
                {ETATS.map((etat) => (
                  <option key={etat.value} value={etat.value}>
                    {etat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Observations */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Observations</span>
              </label>
              <textarea
                name="observations"
                value={formData.observations}
                onChange={handleChange}
                className="textarea textarea-bordered h-24"
                placeholder="Remarques sur l'état de l'équipement, dommages éventuels..."
                disabled={isLoading}
              />
            </div>

            {/* Avertissement si changement d'état */}
            {formData.etatRetour !== pret.equipement?.etat && (
              <div className="alert alert-warning">
                <AlertCircle size={16} />
                <span className="text-sm">
                  L'état de l'équipement sera mis à jour de "
                  {pret.equipement?.etat}" à "{formData.etatRetour}"
                </span>
              </div>
            )}

            {/* Erreur globale */}
            {errors.submit && (
              <div className="alert alert-error">
                <AlertCircle size={20} />
                <span>{errors.submit}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="modal-action">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-success"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Confirmer le retour"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
