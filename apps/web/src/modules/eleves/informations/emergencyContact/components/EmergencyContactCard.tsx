import { useState } from "react";
import {
  useEmergencyContact,
  useUpdateEmergencyContact,
} from "../hooks/useEmergencyContact";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { EmergencyContactForm } from "./EmergencyContactForm";
import { EmergencyContactSkeleton } from "./EmergencyContactSkeleton";

type EmergencyContactCardProps = {
  eleveId?: string;
  canEdit?: boolean;
};

/**
 * Carte d'affichage du contact d'urgence
 *
 * Mode lecture :
 *  - résumé clair
 *  - message neutre si aucun contact renseigné
 *
 * Mode édition :
 *  - bouton d'activation du formulaire
 *  - validation Zod en temps réél
 */
export function EmergencyContactCard({
  eleveId,
  canEdit = false,
}: EmergencyContactCardProps) {
  const { data, isLoading, isError } = useEmergencyContact(eleveId); // Fetch emergency contact data for the given student ID
  const updateMutation = useUpdateEmergencyContact(eleveId); // Hook to handle updating the emergency contact data
  const [isEditing, setIsEditing] = useState(false); // State to track if the card is in editing mode

  const [form, setForm] = useState({
    isRelationContact: false,
    relationName: null as string | null,
    relationTelephone: null as string | null,
  });

  const handleEdit = () => {
    if (!data) return;

    setForm({
      isRelationContact: data.isRelationContact ?? false,
      relationName: data.relationName ?? null,
      relationTelephone: data.relationTelephone ?? null,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!eleveId) return;

    try {
      await updateMutation.mutateAsync(form);
      setIsEditing(false);
    } catch {
      // Erreur déjà géréé par le hook
    }
  };

  if (isLoading) {
    return <EmergencyContactSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="card border border-error/30 bg-base-100 shadow-sm">
        <div className="card-body">
          <p className="text-error">
            Impossible de charger le contact d'urgence.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card border border-base-200 bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h2 className="card-title text-base flex items-center gap-2">
            {data.isRelationContact ? (
              <ShieldCheck size={18} className="text-success" />
            ) : (
              <ShieldAlert size={18} className="text-base-content/60" />
            )}
            Contact d'urgence
          </h2>

          {canEdit && !isLoading && (
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={handleEdit}
            >
              Modifier
            </button>
          )}
        </div>

        {!isEditing && (
          <div className="space-y-3 pt-4">
            {data.isRelationContact ? (
              <>
                <div>
                  <p className="text-sm text-base-content/60">Nom du contact</p>
                  <p className="font-medium">{data.relationName}</p>
                </div>

                <div>
                  <p className="text-sm text-base-content/60">Téléphone</p>
                  <p className="font-medium">{data.relationTelephone}</p>
                </div>

                <span className="badge badge-success">Contact activé</span>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-base-300 p-4 text-sm text-base-content/60">
                Aucun contact d'urgence renseigné.
              </div>
            )}
          </div>
        )}

        {isEditing && (
          <div className="pt-4">
            <EmergencyContactForm
              value={form}
              onChange={setForm}
              onSubmit={handleSave}
              isSaving={updateMutation.isPending}
            />
          </div>
        )}
      </div>
    </div>
  );
}
