import { z } from "zod";

// Schéma pour la crréation d'une école
// Seul le nom est raquis -l'ivitateCode est généré automatiquement par Prisma
export const createSchoolSchema = z.object({
  nom: z
    .string()
    .trim()
    .min(3, "Le nom de l'école doit contenir au moins 3 caractères"),
});

// Type Typescript inféré depuis le schéma Zod
export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
