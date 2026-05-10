// apps/api/src/schemas/noteSchema.ts

import { z } from "zod"; // Importation de Zod pour la validation des données

/**
 * Schéma de validation pour la création d'une note
 *
 * Champs :
 * - titre : libellé de l'évaluation (ex: "DS1", "Examen final", etc.)
 * - note : valeur décimale >= 0
 * - noteMax : dénominateur (défaut 20, min 1)
 * - coefficient : entier >= 1 (défaut 1)
 * - eleveId: UUID de l'élève (obligatoire)
 * - matiereId: UUID de la matière (obligatoire)
 * - commentaire: texte libre optionnel du prof (max 500 caractères)
 */
export const createNoteSchema = z.object({
  titre: z
    .string()
    .trim()
    .min(2, "Le titre doit contenir au moins 2 caractères")
    .max(100, "Le titre doit contenir au maximum 100 caractères"),
  note: z.coerce.number().min(0, "La note doit être supérieure ou égale à 0"),
  noteMax: z.coerce
    .number()
    .min(1, "La note maximale doit être supérieure ou égale à 1")
    .default(20),
  coefficient: z.coerce
    .number()
    .int()
    .min(1, "Le coefficient doit être un entier supérieur ou égal à 1")
    .default(1),
  eleveId: z.string().uuid("L'ID de l'élève doit être un UUID valide"),
  matiereId: z.string().uuid("L'ID de la matière doit être un UUID valide"),
  commentaire: z
    .string()
    .max(500, "Le commentaire doit contenir au maximum 500 caractères")
    .optional(),
});

/**
 * Schéma de validation pour la mise à jour d'une note
 * Tous les champs sont optionnels - seuls les champs evnoyés sont modifiés.
 * Le titre ne peut pas être modifié (fait parti de la clé unique)
 */
export const updateNoteSchema = z.object({
  note: z.coerce
    .number()
    .min(0, "La note doit être supérieure ou égale à 0")
    .optional(),
  noteMax: z.coerce.number().min(1).optional(),
  coefficient: z.coerce.number().int().min(1).optional(),
  commentaire: z
    .string()
    .trim()
    .max(500, "Le commentaire doit contenir au maximum 500 caractères")
    .nullable()
    .optional(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>; // Type TypeScript pour la création d'une note
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
