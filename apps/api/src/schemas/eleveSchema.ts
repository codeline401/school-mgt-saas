import { z } from "zod";

export const createEleveSchema = z.object({
  nom: z.string().min(2, "Tokony litera roa farafahakeliny ny anarana"),
  prenom: z
    .string()
    .min(2, "Tokony litera roa farafahakeliny ny fanampin'anarana"),
  classeId: z.string().uuid("ID de classe invalide"),
  schoolId: z.string().uuid("ID de l'école invalide"),
});

// Type exporter pour Typescript
export type CreateEleveInput = z.infer<typeof createEleveSchema>;
