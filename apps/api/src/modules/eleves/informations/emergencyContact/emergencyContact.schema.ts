import z from "zod";

// 1. Définir la structure de base (ZodObject)
const baseEmergencyContactSchema = z.object({
  isRelationContact: z.boolean().default(false),
  relationName: z.string().trim().max(150).nullable().optional(),
  relationTelephone: z.string().trim().max(30).nullable().optional(),
});

// 2. Fonction réutilisable pour la validation conditionnelle
const validateEmergencyContact = (data: {
  isRelationContact?: boolean;
  relationName?: string | null;
  relationTelephone?: string | null;
}) => {
  if (!data.isRelationContact) return true;

  const nameOk = !!data.relationName?.trim();
  const phoneOk = !!data.relationTelephone?.trim();

  return nameOk && phoneOk;
};

// 3. Schéma complet pour la création
export const emergencyContactSchema = baseEmergencyContactSchema.refine(
  validateEmergencyContact,
  {
    message:
      "Le nom et le téléphone du contact d'urgence sont requis si le contact est activé",
    path: ["relationName"],
  },
);

// 4. Schéma partiel pour la mise à jour (partial avant refine)
export const updateEmergencyContactSchema = baseEmergencyContactSchema
  .partial()
  .refine(validateEmergencyContact, {
    message:
      "Le nom et le téléphone du contact d'urgence sont requis si le contact est activé",
    path: ["relationName"],
  });

// Types TypeScript
export type EmergencyContact = z.infer<typeof emergencyContactSchema>;
export type UpdateEmergencyContact = z.infer<
  typeof updateEmergencyContactSchema
>;
