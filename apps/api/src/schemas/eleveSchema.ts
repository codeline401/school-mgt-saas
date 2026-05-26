import { z } from "zod";

export const createEleveSchema = z.object({
  nom: z.string().min(2, "Tokony litera roa farafahakeliny ny anarana"),
  prenom: z
    .string()
    .min(2, "Tokony litera roa farafahakeliny ny fanampin'anarana"),
  classeId: z.string().uuid("ID de classe invalide"),
  schoolId: z.string().uuid("ID de l'école invalide"),
  // Champs optionnels (même ensemble que le formulaire de modification)
  dateNaissance: z.coerce.date().optional(),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  photoUrl: z
    .string()
    .max(2 * 1024 * 1024, "Photo trop volumineuse (max 2 Mo encodé)")
    .optional(),
  parentId: z.string().uuid("ID parent invalide").nullable().optional(),
});

// Type exporter pour Typescript
export type CreateEleveInput = z.infer<typeof createEleveSchema>;
