import { z } from "zod"; // Importation de Zod pour la validation des données

export const createCreneauSchema = z.object({
  jour: z.enum([
    "LUNDI",
    "MARDI",
    "MERCREDI",
    "JEUDI",
    "VENDREDI",
    "SAMEDI",
    "DIMANCHE",
  ]),
  heureDebut: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Format de l'heure invalide (HH:MM)"),
  heureFin: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Format de l'heure invalide (HH:MM)"),
  intutile: z.string().max(100).optional(),
  matiereId: z.string().uuid("ID de matière invalide").optional(),
  professeurId: z.string().uuid("ID de professeur invalide").optional(),
  couleur: z
    .string()
    .regex(
      /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/,
      "Format de couleur hexadécimal invalide",
    )
    .optional(),
});
