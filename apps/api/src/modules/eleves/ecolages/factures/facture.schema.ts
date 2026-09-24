import z from "zod";

export const eleveFacturesParamsSchema = z.object({
  eleveId: z.string().uuid("ID élève invalide"),
});

export const factureParamsSchema = z.object({
  factureId: z.string().uuid("ID facture invalide"),
});

export const TypeFraisFactureEnum = z.enum([
  "ECOLAGE",
  "DROIT_INSCRIPTION",
  "FRAIS_EXAMEN",
]);

export const listeFactureQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    anneeScolaire: z
      .string()
      .regex(/^\d{4}-\d{4}$/, "Format attendu : AAAA-AAAA")
      .optional(),
    typeFrais: TypeFraisFactureEnum.optional(),
    dateDebut: z.coerce.date().optional(),
    dateFin: z.coerce.date().optional(),
  })
  .refine(
    (data) =>
      !data.dateDebut || !data.dateFin || data.dateDebut <= data.dateFin,
    {
      message: "La date de début doit précéder la date de fin",
      path: ["dateFin"], // fix review
    },
  );

export const FormatImpressionEnum = z.enum(["A5", "THERMAL"]);

export const printFactureQuerySchema = z
  .object({
    format: FormatImpressionEnum.default("A5"),
  })
  .passthrough(); // Allow additional query parameters beyond the defined schema

export type ListeFactureQuery = z.infer<typeof listeFactureQuerySchema>;
export type PrintFactureQuery = z.infer<typeof printFactureQuerySchema>;
export type FormatImpression = z.infer<typeof FormatImpressionEnum>;

export type FactureResume = {
  id: string;
  numeroRecu: string;
  // Seul "écolage" est persistant tant que PaiementEcolageService ne gère pas les autres types de frais.
  typeFrais: z.infer<typeof TypeFraisFactureEnum>;
  montant: string;
  modePaiement: string;
  datePaiement: string;
  anneeScolaire: string | null;
  mois: number | null;
};

export type FactureListResponse = {
  data: FactureResume[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type FactureDetail = FactureResume & {
  referencePaiement: string | null;
  remarque: string | null;
  createdAt: string;
  montantDu: string;
  ecole: {
    id: string;
    nom: string;
    adresse: string | null;
    telephone: string | null;
    email: string | null;
    logoUrl: string | null;
    numAutorisation: string | null;
  };
  eleve: {
    id: string;
    matricule: number;
    nom: string;
    prenom: string;
    classe: { id: string; nom: string } | null;
  };
  agent: { id: string; nom: string; prenom: string };
};
