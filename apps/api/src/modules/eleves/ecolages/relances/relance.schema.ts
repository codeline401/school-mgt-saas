import z from "zod";

export const TypeRelanceEnum = z.enum(["MANUELLE", "AUTOMATIQUE"]);
export const CanalRelanceEnum = z.enum([
  "NOTIFICATION",
  "EMAIL",
  "SMS",
  "WHATSAPP",
]);
export const CiblageRelanceEnum = z.enum(["ELEVES", "CLASSE", "TOUS_RETARDS"]);

export const relanceParamsSchema = z.object({
  relanceId: z.string().uuid("ID relance invalide"),
});

// Filtrage des destinataires (aperçu du nombre concernés)
export const filtreDestinatairesSchema = z
  .object({
    ciblage: CiblageRelanceEnum,
    cibleIds: z.array(z.string().uuid()).default([]), // IDs des cibles selon le type de ciblage
  })
  .refine(
    (data) => data.ciblage === "TOUS_RETARDS" || data.cibleIds.length > 0,
    {
      message: "Séléctionnez au moins un élève ou une classe",
      path: ["cibleIds"],
    },
  );

export const creerRelanceSchema = z
  .object({
    type: TypeRelanceEnum,
    canal: CanalRelanceEnum,
    ciblage: CiblageRelanceEnum,
    cibleIds: z.array(z.string().uuid()).default([]), // IDs des cibles selon le type de ciblage
    message: z.string().trim().min(10, "Message trop court").max(1000),
    dateProgrammee: z.coerce.date().optional(),
    recurrent: z.boolean().default(false),
    jourMois: z.number().int().min(1).max(28).optional(), //
  })
  .superRefine((data, ctx) => {
    if (data.ciblage !== "TOUS_RETARDS" && data.cibleIds.length === 0) {
      // Vérifie que si le ciblage n'est pas "TOUS_RETARDS", au moins une cible est sélectionnée
      ctx.addIssue({
        code: "custom",
        path: ["cibleIds"],
        message: "Sélectionner au moins un élève ou une classe",
      });
    }
    if (data.type === "MANUELLE") {
      if (data.dateProgrammee || data.recurrent) {
        // Vérifie que si le type est "MANUELLE", il ne doit pas y avoir de date programmée ni de récurrence
        ctx.addIssue({
          code: "custom",
          path: ["type"],
          message:
            "Une relance manuelle ne peut pas avoir de date programmée ou être récurrente",
        });
      }
      return; // Les règles ci-dessous ne concernent que les relances automatiques
    }

    // AUTOMATIQUE : tous les retards du mois, soit récurrents, soit à date unique
    if (data.ciblage !== "TOUS_RETARDS") {
      // Vérifie que pour les relances automatiques, le ciblage doit être "TOUS_RETARDS"
      ctx.addIssue({
        code: "custom",
        path: ["ciblage"],
        message:
          "Pour les relances automatiques, le ciblage doit être 'TOUS_RETARDS'",
      });
    }
    if (data.recurrent && !data.jourMois) {
      // Vérifie que pour une relance récurrente, le jour du mois est spécifié
      ctx.addIssue({
        code: "custom",
        path: ["jourMois"],
        message:
          "Pour une relance récurrente, le jour du mois doit être spécifié",
      });
    }
    if (
      !data.recurrent &&
      (!data.dateProgrammee || data.dateProgrammee <= new Date())
    ) {
      // Une relance à date unique doit avoir une date programmée dans le futur
      ctx.addIssue({
        code: "custom",
        path: ["dateProgrammee"],
        message: "Une date programmée dans le futur est requise",
      });
    }
  });

export const listeRelancesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreerRelanceInput = z.infer<typeof creerRelanceSchema>;
export type FiltreDestinataireInput = z.infer<typeof filtreDestinatairesSchema>;
export type ListeRelancesQuery = z.infer<typeof listeRelancesQuerySchema>;
