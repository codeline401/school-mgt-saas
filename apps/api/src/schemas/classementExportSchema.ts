import { z } from "zod";

const exportOptionsSchema = z
  .object({
    format: z.enum(["A4", "A3", "Letter"]).optional(),
    orientation: z.enum(["portrait", "landscape"]).optional(),
    watermark: z.string().optional(),
    primaryColor: z.string().optional(),
    top: z.number().int().positive().optional(),
  })
  .optional();

export const classementExportSchema = z.object({
  classeId: z.string().uuid("L'identifiant de la classe est invalide"),
  periodeId: z.string().uuid("L'identifiant de la période est invalide"),
  options: exportOptionsSchema,
});

export type ClassementExportInput = z.infer<typeof classementExportSchema>;
