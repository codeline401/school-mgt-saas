import { z } from "zod";

const exportOptionsSchema = z
  .object({
    format: z.enum(["A4", "A3", "Letter"]).optional(),
    orientation: z.enum(["portrait", "landscape"]).optional(),
    watermark: z.string().optional(),
    primaryColor: z.string().optional(),
  })
  .optional();

export const deliberationExportSchema = z.object({
  sessionId: z.string().uuid("L'identifiant de la session est invalide"),
  options: exportOptionsSchema,
});

export type DeliberationExportInput = z.infer<typeof deliberationExportSchema>;
