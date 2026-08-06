import { useState, useEffect } from "react";
import { X, Wrench, Loader2 } from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import {
  useCreateIntervention,
  useUpdateIntervention,
  type InterventionMaintenance,
  type CreateInterventionInput,
  type StatutIntervention,
} from "../hooks/useMaintenance";

interface InterventionModalProps {
  intervention: InterventionMaintenance | null;
  ticketId?: string;
  onClose: () => void;
}

const STATUTS: Array<{ value: StatutIntervention; label: string }> = [
  { value: "PLANIFIEE", label: "Planifiée" },
  { value: "EN_COURS", label: "En cours" },
  { value: "TERMINEE", label: "Terminée" },
  { value: "ANNULEE", label: "Annulée" },
];

export default function InterventionModal({
  intervention,
  ticketId,
  onClose,
}: InterventionModalProps) {
  const isEdit = !!intervention;
  const user = useAuthStore((s) => s.user);

  const [formData, setFormData] = useState<CreateInterventionInput>({
    ticketId: ticketId || intervention?.ticketId || "",
    dateDebut: "",
    dateFin: "",
    technicienId: user?.id || "", // Utiliser l'utilisateur connecté
    description: "",
    observations: "",
    statut: "PLANIFIEE",
    cout: undefined,
    piecesUtilisees: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateIntervention();
  const updateMutation = useUpdateIntervention(intervention?.id || "");

  useEffect(() => {
    if (intervention) {
      setFormData({
        ticketId: intervention.ticketId,
        dateDebut: intervention.dateDebut
          ? new Date(intervention.dateDebut).toISOString().slice(0, 16)
          : "",
        dateFin: intervention.dateFin
          ? new Date(intervention.dateFin).toISOString().slice(0, 16)
          : "",
        technicienId: intervention.technicienId,
        description: intervention.description || "",
        observations: intervention.observations || "",
        statut: intervention.statut,
        cout: intervention.cout || undefined,
        piecesUtilisees: intervention.piecesUtilisees || "",
      });
    } else if (ticketId && user?.id) {
      // Pré-remplir avec l'utilisateur connecté pour une nouvelle intervention
      setFormData((prev) => ({
        ...prev,
        ticketId,
        technicienId: user.id,
      }));
    }
  }, [intervention, ticketId, user]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    const processedValue =
      name === "cout" ? (value === "" ? undefined : Number(value)) : value;

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

    if (!formData.ticketId) {
      newErrors.ticketId = "Le ticket est requis";
    }

    if (!formData.dateDebut) {
      newErrors.dateDebut = "La date de début est requise";
    }

    if (!formData.technicienId) {
      newErrors.technicienId = "Le technicien est requis";
    }

    if (formData.dateFin && formData.dateDebut) {
      if (new Date(formData.dateFin) < new Date(formData.dateDebut)) {
        newErrors.dateFin =
          "La date de fin doit être postérieure à la date de début";
      }
    }

    if (formData.cout !== undefined && formData.cout < 0) {
      newErrors.cout = "Le coût ne peut pas être négatif";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const dataToSubmit: CreateInterventionInput = {
        ticketId: formData.ticketId,
        dateDebut: new Date(formData.dateDebut).toISOString(),
        technicienId: formData.technicienId,
        statut: formData.statut,
      };

      if (formData.dateFin) {
        dataToSubmit.dateFin = new Date(formData.dateFin).toISOString();
      }

      if (formData.description?.trim()) {
        dataToSubmit.description = formData.description.trim();
      }

      if (formData.observations?.trim()) {
        dataToSubmit.observations = formData.observations.trim();
      }

      if (formData.cout !== undefined) {
        dataToSubmit.cout = formData.cout;
      }

      if (formData.piecesUtilisees?.trim()) {
        dataToSubmit.piecesUtilisees = formData.piecesUtilisees.trim();
      }

      if (isEdit) {
        await updateMutation.mutateAsync(dataToSubmit);
      } else {
        await createMutation.mutateAsync(dataToSubmit);
      }

      onClose();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Wrench size={24} className="text-primary" />
            <h3 className="font-bold text-lg">
              {isEdit ? "Modifier l'intervention" : "Nouvelle intervention"}
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
            {/* Info technicien (lecture seule) */}
            <div className="alert alert-info">
              <div>
                <p className="font-medium">Technicien intervenant</p>
                <p className="text-sm">
                  {user?.nom} {user?.prenom} ({user?.email})
                </p>
              </div>
            </div>
            {/* Dates et Statut */}
            <div className="grid grid-cols-3 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend required">Date début</legend>
                <input
                  type="datetime-local"
                  name="dateDebut"
                  value={formData.dateDebut}
                  onChange={handleChange}
                  className={`input input-bordered ${errors.dateDebut ? "input-error" : ""}`}
                  disabled={isLoading}
                />
                {errors.dateDebut && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.dateDebut}
                    </span>
                  </label>
                )}
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend required">Date Fin</legend>
                <input
                  type="datetime-local"
                  name="dateFin"
                  value={formData.dateFin}
                  onChange={handleChange}
                  className={`input input-bordered ${errors.dateFin ? "input-error" : ""}`}
                  disabled={isLoading}
                />
                {errors.dateFin && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.dateFin}
                    </span>
                  </label>
                )}
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend required">Statut</legend>
                <select
                  name="statut"
                  value={formData.statut}
                  onChange={handleChange}
                  className="select select-bordered"
                  disabled={isLoading}
                >
                  {STATUTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </fieldset>
            </div>
            {/* Description */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend required">
                Description du travail
              </legend>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="textarea textarea-bordered h-20 w-full"
                placeholder="Décrivez les travaux effectués..."
                disabled={isLoading}
              />
            </fieldset>
            {/* Coût et pièces */}
            <div className="grid grid-cols-2 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend required">Coût (MGA)</legend>
                <input
                  type="number"
                  name="cout"
                  value={formData.cout || ""}
                  onChange={handleChange}
                  className={`input input-bordered ${errors.cout ? "input-error" : ""}`}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  disabled={isLoading}
                />
                {errors.cout && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.cout}
                    </span>
                  </label>
                )}
              </fieldset>

              <fieldset className="form-control">
                <legend className="fieldset-legend required">
                  Pièces utilisées
                </legend>
                <input
                  type="text"
                  name="piecesUtilisees"
                  value={formData.piecesUtilisees}
                  onChange={handleChange}
                  className="input input-bordered"
                  placeholder="Ex: Lampe, câble HDMI..."
                  disabled={isLoading}
                />
              </fieldset>
            </div>
            {/* Observations */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Observation</legend>
              <textarea
                name="observations"
                value={formData.observations}
                onChange={handleChange}
                className="textarea textarea-bordered h-20 w-full"
                placeholder="Notes supplémentaires..."
                disabled={isLoading}
              />
            </fieldset>
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
                "Créer l'intervention"
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
