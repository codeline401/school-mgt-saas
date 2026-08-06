import { useState, useEffect } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import {
  useCreateTicket,
  useUpdateTicket,
  type TicketMaintenance,
  type CreateTicketMaintenanceInput,
  type TypeTicket,
  type PrioriteTicket,
  type StatutTicket,
} from "../hooks/useMaintenance";

interface TicketMaintenanceModalProps {
  ticket: TicketMaintenance | null;
  onClose: () => void;
}

const TYPES: Array<{ value: TypeTicket; label: string }> = [
  { value: "EQUIPEMENT", label: "Équipement" },
  { value: "BATIMENT", label: "Bâtiment" },
  { value: "SALLE", label: "Salle" },
  { value: "RESEAU", label: "Réseau" },
  { value: "PLOMBERIE", label: "Plomberie" },
  { value: "ELECTRICITE", label: "Électricité" },
  { value: "MOBILIER", label: "Mobilier" },
  { value: "AUTRE", label: "Autre" },
];

const STATUTS: Array<{ value: StatutTicket; label: string }> = [
  { value: "OUVERT", label: "Ouvert" },
  { value: "EN_COURS", label: "En cours" },
  { value: "RESOLU", label: "Résolu" },
  { value: "FERME", label: "Fermé" },
  { value: "ANNULE", label: "Annulé" },
];

const PRIORITES: Array<{
  value: PrioriteTicket;
  label: string;
  color: string;
}> = [
  { value: "BASSE", label: "Basse", color: "text-info" },
  { value: "NORMALE", label: "Normale", color: "text-success" },
  { value: "HAUTE", label: "Haute", color: "text-warning" },
  { value: "URGENTE", label: "Urgente", color: "text-error" },
];

export default function TicketMaintenanceModal({
  ticket,
  onClose,
}: TicketMaintenanceModalProps) {
  const isEdit = !!ticket;

  const [formData, setFormData] = useState<CreateTicketMaintenanceInput>({
    titre: "",
    description: "",
    type: "AUTRE",
    statut: "OUVERT",
    priorite: "NORMALE",
    localisationNom: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateTicket();
  const updateMutation = useUpdateTicket(ticket?.id || "");

  useEffect(() => {
    if (ticket) {
      setFormData({
        titre: ticket.titre,
        description: ticket.description || "",
        type: ticket.type,
        statut: ticket.statut,
        priorite: ticket.priorite,
        localisationNom: ticket.localisationNom || "",
      });
    }
  }, [ticket]);

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

    if (!formData.titre.trim()) {
      newErrors.titre = "Le titre est requis";
    } else if (formData.titre.trim().length < 3) {
      newErrors.titre = "Le titre doit contenir au moins 3 caractères";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const dataToSubmit: CreateTicketMaintenanceInput = {
        titre: formData.titre.trim(),
        type: formData.type,
        priorite: formData.priorite,
        statut: formData.statut,
      };

      if (formData.description?.trim()) {
        dataToSubmit.description = formData.description.trim();
      }

      if (formData.localisationNom?.trim()) {
        dataToSubmit.localisationNom = formData.localisationNom.trim();
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
            <AlertTriangle size={24} className="text-warning" />
            <h3 className="font-bold text-lg">
              {isEdit ? "Modifier le ticket" : "Nouveau ticket de maintenance"}
            </h3>
          </div>
          <button
            type="button"
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
            {/* Titre */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend required">Titre</legend>
              <input
                type="text"
                name="titre"
                value={formData.titre}
                onChange={handleChange}
                className={`input input-bordered w-full ${
                  errors.titre ? "input-error" : ""
                }`}
                placeholder="Ex: Vidéoprojecteur en panne - Salle 204"
                disabled={isLoading}
              />
              {errors.titre && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.titre}
                  </span>
                </label>
              )}
            </fieldset>

            {/* Type, Statut et Priorité */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Type */}
              <fieldset className="fieldset">
                <legend className="fieldset-legend required">Type</legend>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="select select-bordered w-full"
                  disabled={isLoading}
                >
                  {TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </fieldset>

              {/* Statut (Corrigé: name="statut") */}
              <fieldset className="fieldset">
                <legend className="fieldset-legend required">Statut</legend>
                <select
                  name="statut"
                  value={formData.statut}
                  onChange={handleChange}
                  className="select select-bordered w-full"
                  disabled={isLoading}
                >
                  {STATUTS.map((statut) => (
                    <option key={statut.value} value={statut.value}>
                      {statut.label}
                    </option>
                  ))}
                </select>
              </fieldset>

              {/* Priorité */}
              <fieldset className="fieldset">
                <legend className="fieldset-legend required">Priorité</legend>
                <select
                  name="priorite"
                  value={formData.priorite}
                  onChange={handleChange}
                  className="select select-bordered w-full"
                  disabled={isLoading}
                >
                  {PRIORITES.map((prio) => (
                    <option key={prio.value} value={prio.value}>
                      {prio.label}
                    </option>
                  ))}
                </select>
              </fieldset>
            </div>

            {/* Localisation */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Localisation</legend>
              <input
                type="text"
                name="localisationNom"
                value={formData.localisationNom}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="Ex: Salle 204, Bâtiment A, etc."
                disabled={isLoading}
              />
            </fieldset>

            {/* Description */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Description</legend>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="textarea textarea-bordered h-24 w-full"
                placeholder="Décrivez le problème en détail..."
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
                "Créer le ticket"
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
