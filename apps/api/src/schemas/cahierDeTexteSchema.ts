import { z } from "zod"; // Import de Zod pour la validation des données

// Schéma de validation pour la création d'une entrée dans le cahier de texte
export const createCahierTexteSchema = z.object({
  titre: z
    .string()
    .min(1, "Le titre est requis.")
    .max(255, "Le titre ne peut pas dépasser 255 caractères."), // Le titre doit être une chaîne non vide
  detail: z
    .string()
    .max(1000, "Le détail ne peut pas dépasser 1000 caractères.")
    .optional(), // Le détail est une chaîne optionnelle
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La date doit être au format YYYY-MM-DD."), // La date doit être au format YYYY-MM-DD
  matiereId: z.string().uuid().optional(), // L'ID de la matière est une chaîne optionnelle qui doit être un UUID
  devoirs: z
    .array(
      z.object({
        titre: z
          .string()
          .min(1, "Le titre du devoir est requis.")
          .max(255, "Le titre du devoir ne peut pas dépasser 255 caractères."),
        description: z
          .string()
          .max(
            1000,
            "La description du devoir ne peut pas dépasser 1000 caractères.",
          )
          .optional(), // La description du devoir est une chaîne optionnelle
        dateRendu: z
          .string()
          .regex(
            /^\d{4}-\d{2}-\d{2}$/,
            "La date de rendu doit être au format YYYY-MM-DD.",
          ), // La date de rendu doit être au format YYYY-MM-DD
      }),
    )
    .optional(), // Les devoirs sont un tableau optionnel d'objets avec titre, description et date de rendu
});
