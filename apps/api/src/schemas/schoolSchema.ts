import { z } from "zod";

// Schéma pour la création d'une école
// Seul le nom est requis - l'inviteCode est généré automatiquement par Prisma
export const createSchoolSchema = z.object({
  nom: z
    .string()
    .trim()
    .min(3, "Le nom de l'école doit contenir au moins 3 caractères")
    .max(150, "Le nom de l'école ne peut pas dépasser 150 caractères"),
});

// Type Typescript inféré depuis le schéma Zod
export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
