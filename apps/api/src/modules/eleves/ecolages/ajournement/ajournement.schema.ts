import z from "zod";

export const StatutAjournementEnum = z.enum([
  "EN_ATTENTE",
  "ACCEPTE",
  "REFUSE",
  "CONTRE_PROPOSITION",
  "CONTRE_PROPOSITION_ACCEPTE",
  "CONTRE_PROPOSITION_REFUSE",
  "ANNULE",
]);

export const ajournementParamsSchema = z.object({
  ajournementId: z.string().uuid("ID ajournement invalide"),
});

// Schéma de validation pour la création d'un ajournement
export const creerAjournementSchema = z
  .object({
    motif: z
      .string()
      .trim()
      .min(3, "Le motif doit contenir au moins 3 caractères")
      .max(1000),
    lignes: z
      .array(
        z.object({
          ecolageId: z.string().uuid("ID écolage invalide"),
          dateDemandee: z.coerce.date(),
        }),
      )
      .min(1, "Sélectionnez au moins un écolage")
      .max(20),
  })
  .refine(
    (data) =>
      new Set(data.lignes.map((ligne) => ligne.ecolageId)).size ===
      data.lignes.length,
    {
      message: "Un même écolage ne peut apparaître qu'une seule fois",
      path: ["lignes"],
    },
  );

// Schéma de validation pour les requêtes de liste d'ajournements
export const listesAjournementQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1), // Numéro de page pour la pagination
    limit: z.coerce.number().int().min(1).max(100).default(10), // Nombre d'éléments par page
    statut: StatutAjournementEnum.optional(),
    eleveId: z.string().uuid("ID élève invalide").optional(),
    parentId: z.string().uuid("ID parent invalide").optional(),
    dateDebut: z.coerce.date().optional(),
    dateFin: z.coerce.date().optional(),
  })
  .refine(
    (data) =>
      !data.dateDebut || !data.dateFin || data.dateDebut <= data.dateFin, // La date de début doit être antérieure ou égale à la date de fin
    {
      message:
        "La date de début doit être antérieure ou égale à la date de fin",
      path: ["dateDebut", "dateFin"],
    },
  );

// Schéma de validation pour l'acceptation d'un ajournement
export const accepterAjournementSchema = z.object({
  commentaire: z.string().trim().max(1000).nullish(),
});

// Schéma de validation pour le refus d'un ajournement
export const refuserAjournementSchema = z.object({
  commentaire: z.string().trim().min(1, "Le commentaire est requis").max(1000),
});

// Schéma de validation pour la contre-proposition d'un ajournement
export const contrePropositionSchema = z
  .object({
    commentaire: z.string().trim().min(1, "Le commentaire es requis").max(1000),
    lignes: z
      .array(
        z.object({
          ligneId: z.string().uuid("ID ligne invalide"),
          dateProposee: z.coerce.date(),
        }),
      )
      .min(1, "Sélectionnez au moins une ligne"),
  })
  .refine(
    (data) =>
      new Set(data.lignes.map((ligne) => ligne.ligneId)).size ===
      data.lignes.length, //
    {
      message: "Une même ligne ne peut apparaître qu'une seule fois",
      path: ["lignes"],
    },
  );

// Schéma de validation pour la réponse à une contre-proposition d'un ajournement
export const reponseContrePropositionSchema = z.object({
  decision: z.enum(["ACCEPTER", "REFUSER"]),
});

export type CreerAjournementInput = z.infer<typeof creerAjournementSchema>;
export type ListeAjournemntQuery = z.infer<typeof listesAjournementQuerySchema>;
export type AccepterAjournementInput = z.infer<
  typeof accepterAjournementSchema
>;
export type RefuserAjournementInput = z.infer<typeof refuserAjournementSchema>;
export type ContrePropositionInput = z.infer<typeof contrePropositionSchema>;
export type ReponseContrePropositionInput = z.infer<
  typeof reponseContrePropositionSchema
>;

// Schéma de réponse pour une ligne d'ajournement
export type AjournementLigneResponse = {
  id: string;
  eleve: { id: string; matricule: string; nom: string; prenom: string };
  ecolage: {
    id: string;
    anneeScolaire: string;
    mois: number;
    montant: string;
    statutPaiement: string;
  };
  dateEcheanceOrigine: string;
  dateDemandee: string;
  dateProposee: string | null;
  dateAppliquee: string | null;
  estActive: boolean;
};

// Schéma de réponse pour un ajournement
export type AjournementResponse = {
  id: string;
  statut: z.infer<typeof StatutAjournementEnum>;
  motif: string;
  commentaireAdmin: string | null;
  dateDecision: string | null;
  dateResponseParent: string | null;
  parent: {
    id: string;
    nom: string;
    prenom: string;
  };
  traitePar: { id: string; nom: string; prenom: string } | null;
  lignes: AjournementLigneResponse[];
  createdAt: string;
  updatedAt: string;
};

// Schéma de réponse pour la liste des ajournements
export type AjournementListResponse = {
  data: AjournementResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
