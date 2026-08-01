import { useState, useEffect } from "react";
import { X, Package, AlertCircle, Loader2 } from "lucide-react";
import {
  useCreateEquipement,
  useUpdateEquipement,
  type Equipement,
  type CreateEquipementInput,
  type UpdateEquipementInput,
} from "../hooks/useEquipements";

/**
 * COMPOSANT MODAL ÉQUIPEMENT
 *
 * Modal pour créer ou modifier un équipement
 */

interface EquipementModalProps {
  equipement: Equipement | null;
  onClose: () => void;
}

const CATEGORIES = [
  { value: "AUDIOVISUEL", label: "Audiovisuel" },
  { value: "INFORMATIQUE", label: "Informatique" },
  { value: "SPORT", label: "Sport" },
  { value: "LABORATOIRE", label: "Laboratoire" },
  { value: "MOBILIER", label: "Mobilier" },
  { value: "OUTILLAGE", label: "Outillage" },
  { value: "AUTRE", label: "Autre" },
];

const ETATS = [
  { value: "NEUF", label: "Neuf" },
  { value: "BON", label: "Bon état" },
  { value: "MOYEN", label: "État moyen" },
  { value: "MAUVAIS", label: "Mauvais état" },
  { value: "HORS_SERVICE", label: "Hors service" },
];

export default function EquipementModal({
  equipement,
  onClose,
}: EquipementModalProps) {
  const isEdit = !!equipement;

  // ─── État du formulaire ──────────────────────────────────
  const [formData, setFormData] = useState<CreateEquipementInput>({
    nom: "",
    reference: "",
    numeroSerie: "",
    categorie: "AUDIOVISUEL",
    etat: "BON",
    description: "",
    valeur: undefined,
    dateAcquisition: "",
    emplacement: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Mutations ────────────────────────────────────────────
  const createMutation = useCreateEquipement();
  const updateMutation = useUpdateEquipement(equipement?.id || "");

  // ─── Initialisation ───────────────────────────────────────
  useEffect(() => {
    if (equipement) {
      setFormData({
        nom: equipement.nom,
        reference: equipement.reference || "",
        numeroSerie: equipement.numeroSerie || "",
        categorie: equipement.categorie,
        etat: equipement.etat,
        description: equipement.description || "",
        valeur: equipement.valeur || undefined,
        dateAcquisition: equipement.dateAcquisition
          ? equipement.dateAcquisition.split("T")[0]
          : "",
        emplacement: equipement.emplacement || "",
      });
    }
  }, [equipement]);

  // ─── Handlers ─────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    const numericFields = ["valeur"];
    const processedValue = numericFields.includes(name)
      ? value === ""
        ? undefined
        : Number(value)
      : value;

    setFormData((prev) => ({ ...prev, [name]: processedValue }));

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

    if (!formData.nom.trim()) {
      newErrors.nom = "Le nom est requis";
    }

    if (formData.valeur !== undefined && formData.valeur < 0) {
      newErrors.valeur = "La valeur ne peut pas être négative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const dataToSubmit: Partial<CreateEquipementInput> = {
        nom: formData.nom,
        categorie: formData.categorie,
        etat: formData.etat,
      };

      if (formData.reference?.trim()) {
        dataToSubmit.reference = formData.reference;
      }
      if (formData.numeroSerie?.trim()) {
        dataToSubmit.numeroSerie = formData.numeroSerie;
      }
      if (formData.description?.trim()) {
        dataToSubmit.description = formData.description;
      }
      if (formData.valeur !== undefined) {
        dataToSubmit.valeur = formData.valeur;
      }
      if (formData.dateAcquisition?.trim()) {
        dataToSubmit.dateAcquisition = new Date(
          formData.dateAcquisition,
        ).toISOString();
      }
      if (formData.emplacement?.trim()) {
        dataToSubmit.emplacement = formData.emplacement;
      }

      if (isEdit) {
        await updateMutation.mutateAsync(dataToSubmit as UpdateEquipementInput);
      } else {
        await createMutation.mutateAsync(dataToSubmit as CreateEquipementInput);
      }

      onClose();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // ─── Rendu ────────────────────────────────────────────────
  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Package size={24} className="text-primary" />
            <h3 className="font-bold text-lg">
              {isEdit ? "Modifier l'équipement" : "Nouvel équipement"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost"
            disabled={isLoading}
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Nom */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend required">
                Nom de l'équipement
              </legend>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className={`input input-bordered ${errors.nom ? "input-error" : ""}`}
                placeholder="Ex: Vidéoprojecteur Epson"
                disabled={isLoading}
              />
              {errors.nom && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.nom}
                  </span>
                </label>
              )}
            </fieldset>

            {/* Référence & Numéro de série */}
            <div className="grid grid-cols-2 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend required">Référence</legend>
                <input
                  type="text"
                  name="reference"
                  value={formData.reference}
                  onChange={handleChange}
                  className="input input-bordered"
                  placeholder="Ex: VP-001"
                  disabled={isLoading}
                />
              </fieldset>

              <fieldset className="filedset">
                <legend className="fieldset-legend required">
                  Numéro de série
                </legend>
                <input
                  type="text"
                  name="numeroSerie"
                  value={formData.numeroSerie}
                  onChange={handleChange}
                  className="input input-bordered"
                  placeholder="Ex: SN123456789"
                  disabled={isLoading}
                />
              </fieldset>
            </div>

            {/* Catégorie & État */}
            <div className="grid grid-cols-2 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend required">Catégorie</legend>
                <select
                  name="categorie"
                  value={formData.categorie}
                  onChange={handleChange}
                  className="select select-bordered"
                  disabled={isLoading}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </fieldset>

              <fieldset className="filedset">
                <legend className="fieldset-legend required">Etat</legend>
                <select
                  name="etat"
                  value={formData.etat}
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
              </fieldset>
            </div>

            {/* Description */}
            <fieldset className="fieldset w-full">
              <legend className="fieldset-legend required">Description</legend>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="textarea textarea-bordered h-20"
                placeholder="Description de l'équipement..."
                disabled={isLoading}
              />
            </fieldset>

            {/* Valeur & Date d'acquisition */}
            <div className="grid grid-cols-2 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend required">
                  Valeur (MGA)
                </legend>
                <input
                  type="number"
                  name="valeur"
                  value={formData.valeur || ""}
                  onChange={handleChange}
                  className={`input input-bordered ${errors.valeur ? "input-error" : ""}`}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  disabled={isLoading}
                />
                {errors.valeur && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.valeur}
                    </span>
                  </label>
                )}
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend required">
                  Date d'acquisition
                </legend>
                <input
                  type="date"
                  name="dateAcquisition"
                  value={formData.dateAcquisition}
                  onChange={handleChange}
                  className="input input-bordered"
                  disabled={isLoading}
                />
              </fieldset>
            </div>

            {/* Emplacement */}
            <fieldset className="filedset">
              <legend className="fieldset-legend required">Emplacement</legend>
              <input
                type="text"
                name="emplacement"
                value={formData.emplacement}
                onChange={handleChange}
                className="input input-bordered"
                placeholder="Ex: Salle informatique - Bureau 3"
                disabled={isLoading}
              />
            </fieldset>

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
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Enregistrement...
                </>
              ) : isEdit ? (
                "Modifier"
              ) : (
                "Créer l'équipement"
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
