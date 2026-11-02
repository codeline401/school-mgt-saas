import z from "zod";

export const TypeRegleENum = z.enum([
  "ABSENCES",
  "ABSENCES_NON_JUSTIFIEES",
  "RETARDS",
  "TAUX_PRESENCE",
]);

export const DestinataireENum = z.enum([
  "ADMIN",
  "PARENT",
  "PROFESSEUR_PRINCIPAL",
]);

const palierSchema = z.object({
  seuil: z.number().min(0),
  destinataires: z
    .array(DestinataireENum)
    .min(1, "Au moins un destinataire")
    .max(3),
  message: z.string().trim().min(5).max(500).optional(),
});

export const regleSchema = z
  .object({
    nom: z.string().trim().min(3).max(100),
    type: TypeRegleENum,
    periodeJours: z.number().int().min(1).max(365).default(30),
    classeId: z.string().uuid("ID classe invalide").nullable().optional(),
    actif: z.boolean().default(true),
    paliers: z.array(palierSchema).min(1).max(5),
  })
  .superRefine((r, ctx) => {
    const seuils = r.paliers.map((p) => p.seuil); // Récupère tous les seuils des paliers
    if (new Set(seuils).size !== seuils.length) {
      ctx.addIssue({
        code: "custom",
        path: ["paliers"],
        message: "Les seuils doivent être distincts",
      });
    }

    // Un taux est un pourcentage ; les autres types comptent des événements
    const taux = r.type === "TAUX_PRESENCE"; // Si le type est un taux, les seuils doivent être compris entre 0 et 100
    if (seuils.some((s) => (taux ? s > 100 : !Number.isInteger(s) || s < 1))) {
      ctx.addIssue({
        code: "custom",
        path: ["paliers"],
        message: taux
          ? "Le seuil d'un taux doit être compris entre 0 et 100"
          : "Le seuil doit être un entier supérieur ou égal à 1",
      });
    }
  });

export const regleParamsSchema = z.object({
  regleId: z.string().uuid("ID règle invalide"),
});

export const historiqueQuerySchema = z.object({
  eleveId: z.string().uuid().optional(),
  regleId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type RegleInput = z.infer<typeof regleSchema>;
export type HistoriqueQuery = z.infer<typeof historiqueQuerySchema>;
