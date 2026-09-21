import z from "zod";

export const paiementParamsSchema = z.object({
  eleveId: z.string().uuid("ID élève invalide"),
});

export const ModePaiementEnum = z.enum([
  "ESPECES",
  "VIREMENT",
  "CHEQUE",
  "MOBILE_MONEY",
]);

export const TypeFraisEnum = z.enum([
  "ECOLAGE",
  "DROIT_INSCRIPTION",
  "FRAIS_EXAMEN",
]);

export const enregistrementPaiementSchema = z
  .object({
    anneeScolaire: z.string().regex(/^\d{4}-\d{4}$/, {
      message: "L'année scolaire doit être au formet : AAAA-AAAA",
    }),
    typeFrais: TypeFraisEnum,
    mois: z.number().int().min(1).max(12).nullish(), // requis uniquement pour ECOLAGE
    montantSaisi: z.coerce.number().positive("Le montant doit être positif"),
    modePaiement: ModePaiementEnum,
    referencePaiement: z.string().trim().max(100).nullish(),
    datePaiement: z.coerce.date().default(() => new Date()),
    remarque: z.string().trim().max(1000).nullish(),
    // Fournie par le client pour éviter un double encaissement en cas de ré-essai réseau.
    idempotencyKey: z.string().trim().min(1).max(200).nullish(),
  })
  .refine((data) => data.typeFrais !== "ECOLAGE" || data.mois != null, {
    message: "Le mois est requis pour un paiement d'écolage",
    path: ["mois"],
  })
  .refine(
    (data) => data.modePaiement === "ESPECES" || !!data.referencePaiement,
    {
      message: "La référence est requise pour ce mode de paiement",
      path: ["referencePaiement"],
    },
  );

export const paiementResponseSchema = z.object({
  id: z.string().uuid(),
  numeroRecu: z.string(),
  montant: z.string(),
  modePaiement: ModePaiementEnum,
  referencePaiement: z.string().nullable(),
  datePaiement: z.string().nullable(),
  remarque: z.string().nullable(),
  statutEcolage: z.enum(["IMPAYE", "PARTIEL", "PAYE", "EN_RETARD"]),
  agentId: z.string().uuid(),
  createdAt: z.string().datetime(),
  // Rempli uniquement quand l'excédent du mois courant a été reporté sur le mois suivant.
  excedentAppliqueMoisSuivant: z.string().nullable(),
});

export const saisiePaiementSchema = z
  .object({
    typeFrais: z.enum(["ECOLAGE", "DROIT_INSCRIPTION", "FRAIS_EXAMEN"]),
    mois: z.coerce.number().int().min(1).max(12).nullish(),
    montantSaisi: z.coerce.number().positive("Le montant doit être positif"),
    modePaiement: z.enum(["ESPECES", "VIREMENT", "CHEQUE", "MOBILE_MONEY"]),
    referencePaiement: z.string().trim().max(100).optional().or(z.literal("")),
    remarque: z.string().trim().max(1000).optional().or(z.literal("")),
  })
  .refine((data) => data.typeFrais !== "ECOLAGE" || data.mois != null, {
    message: "Sélectionnez le mois concerné",
    path: ["mois"],
  })
  .refine(
    (data) => data.modePaiement === "ESPECES" || !!data.referencePaiement,
    {
      message: "La référence est requise pour ce mode de paiement",
      path: ["referencePaiement"],
    },
  );

export type SaisiePaiementFormValues = z.infer<typeof saisiePaiementSchema>;

export type EnregistrerPaiementInput = z.infer<
  typeof enregistrementPaiementSchema
>;
export type PaiementResponse = z.infer<typeof paiementResponseSchema>;
