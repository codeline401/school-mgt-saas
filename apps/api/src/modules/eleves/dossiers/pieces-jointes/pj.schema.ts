import z from "zod";

export const eleveAttachementTypeSchema = z.enum([
  "CERTIFICAT_NAISSANCE",
  "CERTIFICAT_RESIDENCE",
  "CERTIFICAT_MEDICAL",
  "PIECE_IDENTITE_TUTEUR",
  "AUTRE",
]);

export const eleveAttachementParamsSchema = z.object({
  eleveId: z.string().uuid("Identifiant de l'élève invalide"),
});

export const attachementParamsSchema = z.object({
  attachementId: z.string().uuid("Identifiant de la pièce jointe invalide"),
});

export const creerUploadAttachementUrlSchema = z.object({
  type: eleveAttachementTypeSchema,
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(2 * 1024 * 1024), // Maximum file size 2MB
});

export const listerPiecesJointesQuerySchema = z.object({
  archived: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
});

export type CreerUploadAttachementUrlInput = z.infer<
  typeof creerUploadAttachementUrlSchema
>;
