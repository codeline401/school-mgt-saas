import z from "zod";

const uuid = (msg: string) => z.string().uuid(msg); //
const dateISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected AAAA-MM-JJ")
  .refine((s) => {
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(y!, m! - 1, d!);
    return (
      dt.getFullYear() === y && dt.getMonth() === m! - 1 && dt.getDate() === d
    );
  }, "Date invalide");

// En multipart, la liste arrive sous forme de chaine JSON
const listeIds = z.preprocess(
  (v) => {
    if (typeof v !== "string") return v;
    try {
      return JSON.parse(v); //
    } catch {
      return v;
    }
  },
  z
    .array(uuid("ID absence invalide"))
    .min(1, "Sélectionner au moins une absence")
    .max(100),
);

export const eleveParamsSchema = z.object({
  eleveId: uuid("ID élève invalide"),
}); // Schéma pour les paramètres d'un élève
export const justificationParamsSchema = z.object({
  justificationId: uuid("ID justification invalide"),
}); // Schéma pour les paramètres d'une justification
export const billetParamsSchema = z.object({
  billetId: uuid("ID billet invalide"),
}); // Schéma pour les paramètres d'un billet

export const creerJustificationSchema = z.object({
  eleveId: uuid("ID élève invalide"),
  motif: z.string().trim().min(5, "Motif trop court").max(1000),
  presenceIds: listeIds,
}); // Schéma de création d'une justification

export const creerBilletSchema = z.object({
  creneauId: uuid("ID créneau invalide"),
  date: dateISO,
}); // Schéma de création d'un billet

export const listeJustificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
}); // Schéma pour la liste des justifications

export type CreerJustificationInput = z.infer<typeof creerJustificationSchema>;
export type CreerBilletInput = z.infer<typeof creerBilletSchema>;
export type ListeJustificationsQuery = z.infer<
  typeof listeJustificationsQuerySchema
>;
