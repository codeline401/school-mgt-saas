import { z } from "zod";

// Schéma pour la création d'une classe
// Seul le nom est requis — schoolId est déduit du token JWT
export const createClasseSchema = z.object({
  nom: z
    .string()
    .trim()
    .min(2, "Le nom de la classe doit contenir au moins 2 caractères")
    .max(50, "Le nom de la classe ne peut pas dépasser 50 caractères"),
});

export type CreateClasseInput = z.infer<typeof createClasseSchema>;
