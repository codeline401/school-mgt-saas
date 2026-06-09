import z from "zod";
import {
  DecisionPassage,
  MentionDeliberation,
  AvertissementDeliberation,
} from "../generated/prisma/enums";

export const createSessionsSchema = z.object({
  periodeLabel: z.string().min(1, "Le label de la période est requis"),
  anneeScolaire: z.string().trim().min(4, "L'année scolaire est obligatoire"),
  compteRendu: z.string().trim().optional(),
});

export const updateSessionsSchema = z.object({
  periodeLabel: z
    .string()
    .min(1, "Le label de la période est requis")
    .optional(),
  anneeScolaire: z
    .string()
    .trim()
    .min(4, "L'année scolaire est obligatoire")
    .optional(),
  compteRendu: z.string().trim().optional(),
});

export const upsertDecisionSchema = z.object({
  decisions: z
    .array(
      z.object({
        eleveId: z.string().uuid(),
        decision: z.nativeEnum(DecisionPassage),
        mention: z
          .nativeEnum(MentionDeliberation)
          .optional()
          .default(MentionDeliberation.AUCUNE),
        avertissement: z
          .nativeEnum(AvertissementDeliberation)
          .optional()
          .default(AvertissementDeliberation.AUCUN),
        commentaire: z.string().trim().optional(),
      }),
    )
    .min(1, "Au moins une décision doit être fournie"),
});

export type createSessionsInput = z.infer<typeof createSessionsSchema>;
export type updateSessionsInput = z.infer<typeof updateSessionsSchema>;
export type upsertDecisionInput = z.infer<typeof upsertDecisionSchema>;
