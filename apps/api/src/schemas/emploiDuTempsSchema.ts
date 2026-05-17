import { z } from "zod";

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
  // ✅ Regex stricte 24h (était ^\d{2}:\d{2}$ — acceptait 29:99)
  heureDebut: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure invalide (HH:MM, 00:00–23:59)."),
  heureFin: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure invalide (HH:MM, 00:00–23:59)."),
  intitule: z.string().max(100).optional(), // ✅ typo corrigée (était intutile)
  matiereId: z.string().uuid("ID de matière invalide").optional(),
  // ✅ professeurId retiré — absent du modèle Prisma et non utilisé par le contrôleur
  couleur: z
    .string()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Format couleur hex invalide.")
    .optional(),
});
