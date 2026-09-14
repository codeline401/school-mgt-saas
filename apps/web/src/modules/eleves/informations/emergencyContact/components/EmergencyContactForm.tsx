import { useMemo } from "react";
import { updateEmergencyContactSchema } from "../../../../../../../api/src/modules/eleves/informations/emergencyContact/emergencyContact.schema";

type EmergencyContactFormProps = {
  value: {
    isRelationContact: boolean;
    relationName: string | null;
    relationTelephone: string | null;
  };
  onChange: (next: {
    isRelationContact: boolean;
    relationName: string | null;
    relationTelephone: string | null;
  }) => void;
  onSubmit: () => void;
  isSaving?: boolean;
};

/**
 * Formulaire de contact d'urgence
 *
 * Règles :
 *  - Le switch active/désactive le contact
 *  - Les champs nom/téléphone ne sont visibles que si isRelationContact === true
 *  - validation Zod en temps réél
 */
export function EmergencyContactForm({
  value,
  onChange,
  onSubmit,
  isSaving = false,
}: EmergencyContactFormProps) {
  const validation = useMemo(
    () => updateEmergencyContactSchema.safeParse(value),
    [value],
  ); // validation result for the emergency contact form

  const issues = validation.success
    ? {}
    : validation.error.flatten().fieldErrors;

  const updateField = <K extends keyof typeof value>(
    field: K,
    nextValue: (typeof value)[K],
  ) => {
    onChange({
      ...value,
      [field]: nextValue,
    });
  };

  const formHasError =
    !validation.success &&
    value.isRelationContact &&
    (issues.relationName?.length || issues.relationTelephone?.length);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-xl border border-base-200 bg-base-50 p-3">
        <div>
          <p className="font-medium">Définir un contact d'urgence</p>
          <p className="text-sm text-base-content/60">
            Activer ce champ pour indiquer une personne à prévenir
          </p>
        </div>

        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={value.isRelationContact}
          onChange={(e) => updateField("isRelationContact", e.target.checked)}
        />
      </div>

      {value.isRelationContact && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <fieldset>
            <label className="label">
              <span className="label-text">Nom du contact</span>
            </label>
            <input
              type="text"
              value={value.relationName ?? ""}
              onChange={(e) =>
                updateField("relationName", e.target.value || null)
              }
              className={`input input-bordered w-full ${issues.relationName ? "input-error" : ""}`}
              placeholder="Ex. Patrick Rakoto"
            />
            {issues.relationName?.[0] && (
              <span className="mt-1 text-xs text-error">
                {issues.relationName?.[0]}
              </span>
            )}
          </fieldset>

          <fieldset>
            <label className="label">
              <span className="label-text">Téléphone du contact</span>
            </label>
            <input
              type="tel"
              value={value.relationTelephone ?? ""}
              onChange={(e) =>
                updateField("relationTelephone", e.target.value || null)
              }
              className={`input input-bordered w-full ${issues.relationTelephone ? "input-error" : ""}`}
              placeholder="Ex. 0341234567"
            />
            {issues.relationTelephone?.[0] && (
              <span className="mt-1 text-xs text-error">
                {issues.relationTelephone?.[0]}
              </span>
            )}
          </fieldset>
        </div>
      )}

      {formHasError && (
        <div className="alert alert-error">
          <span>
            Complétez le nom et le téléphone du contact avant de sauvegarder.
          </span>
        </div>
      )}

      <div className="flex justify-end">
        <button
          className="btn btn-primary"
          type="button"
          onClick={onSubmit}
          disabled={isSaving}
        >
          {isSaving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
