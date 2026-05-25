import { z } from "zod"; // Import de Zod pour la validation des données

// Schéma de validation pour la création d'une entrée dans le cahier de texte
export const createQuizSchema = z.object({
  titre: z
    .string()
    .min(1, "Le titre est requis.")
    .max(255, "Le titre ne peut pas dépasser 255 caractères."), // Le titre doit être une chaîne non vide
  matiereId: z.string().uuid().optional(), // L'ID de la matière est une chaîne optionnelle qui doit être un UUID
});

export const questionSchema = z.object({
  enonce: z.string().min(1),
  type: z.enum(["QCM", "VRAI_FAUX", "REPONSE_COURTE"]),
  options: z.array(z.string()).default([]), // Les options sont un tableau de chaînes, par défaut vide
  bonneReponse: z.string().min(1), // La bonne réponse doit être une chaîne non vide
  ordre: z.number().int().min(0), // L'ordre doit être un entier positif ou nul
});

export const submitQuizSchema = z.object({
  reponses: z.array(
    z.object({
      questionId: z.string().uuid(), // L'ID de la question doit être un UUID
      valeur: z.string(), // La valeur de la réponse doit être une chaîne non vide
    }),
  ),
});
