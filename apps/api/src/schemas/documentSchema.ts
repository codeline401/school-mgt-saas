import { z } from "zod";

export const createDocumentSchema = z.object({
  titre: z.string().min(1, "Le titre est requis.").max(200),
  description: z.string().max(500).optional(),
  type: z.enum(["COURS", "DEVOIR", "EVALUATION", "NOTE_SERVICE", "CIRCULAIRE", "AUTRE"]),
  matiereId: z.string().uuid().optional(),
});