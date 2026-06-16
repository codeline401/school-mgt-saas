import { z } from "zod";

const exportOptionsSchema = z
  .object({
    format: z.enum(["A4", "A3", "Letter"]).optional(),
    orientation: z.enum(["portrait", "landscape"]).optional(),
    watermark: z.string().optional(),
    includeGraphs: z.boolean().optional(),
    primaryColor: z.string().optional(),
  })
  .optional();

export const bulletinExportSchema = z.object({
  eleveId: z.string().uuid("L'identifiant de l'élève est invalide"),
  periodeId: z.string().uuid("L'identifiant de la période est invalide"),
  options: exportOptionsSchema,
});

export type BulletinExportInput = z.infer<typeof bulletinExportSchema>;
