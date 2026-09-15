import { create } from "node:domain";
import z from "zod";

export const historiqueStudentParamsSchema = z.object({
  eleveId: z.string().uuid("ID élève invalide"),
});

const nullableString = z.string().nullable();

export const historiqueEleveResponseSchema = z.object({
  eleve: z.object({
    id: z.string().uuid(),
    matricule: z.number().int(),
    nom: z.string(),
    prenom: z.string(),
    statut: z.string(),
    situationFinAnnee: nullableString,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),

  academicHistory: z.array(
    z.object({
      id: z.string().uuid(),
      anneeScolaire: z.string(),
      classe: z
        .object({
          id: z.string().uuid(),
          nom: z.string(),
          niveau: z.string().nullable(),
          section: z.string().nullable(),
          option: z.string().nullable(),
        })
        .nullable(),
      statut: z.string().nullable(),
      dateInscription: z.string().datetime(),
      source: z.enum(["INSCRIPTION", "HISTORIQUE_CLASSE"]),
    }),
  ),

  classChanges: z.array(
    z.object({
      id: z.string().uuid(),
      anneeScolaire: z.string(),
      type: z.string(),
      motif: z.string().nullable(),
      ancienneClasse: z
        .object({
          id: z.string().uuid(),
          nom: z.string(),
        })
        .nullable(),
      nouvelleClasse: z
        .object({
          id: z.string().uuid(),
          nom: z.string(),
        })
        .nullable(),
      changedAt: z.string().datetime(),
    }),
  ),

  administrativeEvents: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["ADMISSION", "STATUT_ELEVE", "FIN_ANNEE"]),
      status: z.string().nullable(),
      description: z.string(),
      date: z.string().datetime(),
    }),
  ),

  paymentHistory: z.array(
    z.object({
      id: z.string().uuid(),
      anneeScolaire: z.string(),
      mois: z.number().int(),
      montant: z.string(),
      classe: z
        .object({
          id: z.string().uuid(),
          nom: z.string(),
        })
        .nullable(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
    }),
  ),

  keyDates: z.object({
    firstCreatedAt: z.string().datetime(),
    lastUpdatedAt: z.string().datetime(),
  }),
});

export type HistoriqueEleveParams = z.infer<
  typeof historiqueStudentParamsSchema
>;

export type HistoriqueEleveResponse = z.infer<
  typeof historiqueEleveResponseSchema
>;
