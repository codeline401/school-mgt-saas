import { z } from "zod"; // Importation de Zod pour la validation des données

export const createMatieresSchema = z.object({
  nom: z
    .string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom doit contenir au maximum 100 caractères"),
  description: z.string().trim().max(255).optional(),
});

export const updateMatieresSchema = z.object({
  nom: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).nullable().optional(),
});

// Types pour les entrées de création et de mise à jour des matières
export type CreateMatieresInput = z.infer<typeof createMatieresSchema>;
export type UpdateMatieresInput = z.infer<typeof updateMatieresSchema>;
