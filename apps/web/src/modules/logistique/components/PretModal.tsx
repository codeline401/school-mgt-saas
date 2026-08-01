import { useState } from "react";
import { X, Calendar, AlertCircle, Loader2 } from "lucide-react";
import {
  useCreatePret,
  type Equipement,
  type CreatePretInput,
} from "../hooks/useEquipements";

/**
 * COMPOSANT MODAL PRÊT
 *
 * Modal pour créer un prêt d'équipement
 */

interface PretModalProps {
  equipement: Equipement;
  onClose: () => void;
}

const TYPES_EMPRUNTEUR = [
  { value: "PROFESSEUR", label: "Professeur" },
  { value: "ELEVE", label: "Élève" },
  { value: "PERSONNEL", label: "Personnel" },
  { value: "EXTERNE", label: "Externe" },
];

export default function PretModal({ equipement, onClose }: PretModalProps) {
  // ─── État du formulaire ──────────────────────────────────
  const [formData, setFormData] = useState<CreatePretInput>({
    equipementId: equipement.id,
    emprunteurType: "PROFESSEUR",
    emprunteurNom: "",
    emprunteurId: undefined,
    datePret: new Date().toISOString().split("T")[0],
    dateRetourPrevue: "",
    motif: "",
    observations: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Mutation ─────────────────────────────────────────────
  const createPretMutation = useCreatePret();

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

    if (!formData.emprunteurNom.trim()) {
      newErrors.emprunteurNom = "Le nom de l'emprunteur est requis";
    }

    if (!formData.datePret) {
      newErrors.datePret = "La date de prêt est requise";
    }

    if (!formData.dateRetourPrevue) {
      newErrors.dateRetourPrevue = "La date de retour prévue est requise";
    }

    if (formData.datePret && formData.dateRetourPrevue) {
      const datePret = new Date(formData.datePret);
      const dateRetour = new Date(formData.dateRetourPrevue);

      if (dateRetour <= datePret) {
        newErrors.dateRetourPrevue =
          "La date de retour doit être après la date de prêt";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const dataToSubmit: CreatePretInput = {
        equipementId: equipement.id,
        emprunteurType: formData.emprunteurType,
        emprunteurNom: formData.emprunteurNom,
        datePret: new Date(formData.datePret).toISOString(),
        dateRetourPrevue: new Date(formData.dateRetourPrevue).toISOString(),
      };

      if (formData.emprunteurId?.trim()) {
        dataToSubmit.emprunteurId = formData.emprunteurId;
      }
      if (formData.motif?.trim()) {
        dataToSubmit.motif = formData.motif;
      }
      if (formData.observations?.trim()) {
        dataToSubmit.observations = formData.observations;
      }

      await createPretMutation.mutateAsync(dataToSubmit);
      onClose();
    } catch (error) {
      console.error("Erreur lors de la création du prêt:", error);
    }
  };

  const isLoading = createPretMutation.isPending;

  // ─── Rendu ────────────────────────────────────────────────
  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar size={24} className="text-success" />
            <h3 className="font-bold text-lg">Nouveau prêt</h3>
          </div>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost"
            disabled={isLoading}
          >
            <X size={18} />
          </button>
        </div>

        {/* Info équipement */}
        <div className="alert alert-info mb-4">
          <AlertCircle size={20} />
          <div>
            <div className="font-semibold">{equipement.nom}</div>
            <div className="text-sm">
              {equipement.reference && `Réf: ${equipement.reference}`}
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Type d'emprunteur */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  Type d'emprunteur <span className="text-error">*</span>
                </span>
              </label>
              <select
                name="emprunteurType"
                value={formData.emprunteurType}
                onChange={handleChange}
                className="select select-bordered"
                disabled={isLoading}
              >
                {TYPES_EMPRUNTEUR.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Nom de l'emprunteur */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  Nom de l'emprunteur <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                name="emprunteurNom"
                value={formData.emprunteurNom}
                onChange={handleChange}
                className={`input input-bordered ${errors.emprunteurNom ? "input-error" : ""}`}
                placeholder="Ex: Jean Dupont"
                disabled={isLoading}
              />
              {errors.emprunteurNom && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.emprunteurNom}
                  </span>
                </label>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">
                    Date de prêt <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="date"
                  name="datePret"
                  value={formData.datePret}
                  onChange={handleChange}
                  className={`input input-bordered ${errors.datePret ? "input-error" : ""}`}
                  disabled={isLoading}
                />
                {errors.datePret && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.datePret}
                    </span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">
                    Retour prévu <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="date"
                  name="dateRetourPrevue"
                  value={formData.dateRetourPrevue}
                  onChange={handleChange}
                  className={`input input-bordered ${errors.dateRetourPrevue ? "input-error" : ""}`}
                  disabled={isLoading}
                />
                {errors.dateRetourPrevue && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.dateRetourPrevue}
                    </span>
                  </label>
                )}
              </div>
            </div>

            {/* Motif */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Motif</span>
              </label>
              <input
                type="text"
                name="motif"
                value={formData.motif}
                onChange={handleChange}
                className="input input-bordered"
                placeholder="Ex: Cours de sciences"
                disabled={isLoading}
              />
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
                className="textarea textarea-bordered h-20"
                placeholder="Remarques éventuelles..."
                disabled={isLoading}
              />
            </div>

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
                "Enregistrer le prêt"
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
