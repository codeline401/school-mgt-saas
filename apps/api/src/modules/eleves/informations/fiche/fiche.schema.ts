// ------------------------------------
// ENUMS
// ------------------------------------

import z from "zod";

export const GenreEnum = z.enum(["MASCULIN", "FEMININ"]);
export type GenreEnumType = z.infer<typeof GenreEnum>;

export const StatutEleveEnum = z.enum([
  "ACTIF",
  "INACTIF",
  "INSCRIT",
  "SUSPENDU",
  "DIPLOME",
  "ABANDON",
]);
export type StatutEleveEnumType = z.infer<typeof StatutEleveEnum>;

export const StatutFinAnneeEnum = z.enum([
  "EN_COURS",
  "ADMIS",
  "REDOUBLE",
  "RENVOYE",
  "REORIENTE",
  "QUITTE",
]);
export type StatutFinAnneeEnumType = z.infer<typeof StatutFinAnneeEnum>;

export const SituationFamilialeEnum = z.enum([
  "CELIBATAIRE",
  "MARIE",
  "DIVORCE",
  "AUTRE",
]);
export type SituationFamilialeEnumType = z.infer<typeof SituationFamilialeEnum>;

// ------------------------------------
// Schéma de base
// ------------------------------------
export const adresseSchema = z.object({
  id: z.string().uuid().optional(),
  fokontany: z.string().trim().max(150).nullish(),
  logement: z.string().trim().max(150).nullish(),
  ville: z.string().trim().max(100).nullish(),
  region: z.string().trim().max(100).nullish(),
  pays: z.string().trim().max(100).nullish(),
  eleveId: z.string().uuid().nullish(),
  parentId: z.string().uuid().nullish(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const createAdresseSchema = adresseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const professionEleveSchema = z.object({
  id: z.string().uuid().optional(),
  titre: z.string().trim().max(150).nullish(),
  lieu: z.string().trim().max(150).nullish(),
  secteur: z.string().trim().max(150).nullish(),
  eleveId: z.string().uuid(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const createProfessionEleveSchema = professionEleveSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const historiqueClasseSchema = z.object({
  id: z.string().uuid().optional(),
  eleveId: z.string().uuid(),
  classeId: z.string().uuid().nullish(),
  anneeScolaire: z.string().regex(/^\d{4}-\d{4}$/, {
    message:
      "L'année scolaire doit être au format : AAAA-AAAA (exemple : 2026-2027)",
  }),
  statutFinAnnee: StatutFinAnneeEnum.default("EN_COURS").optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

// utiles si tu valides ces entrées côté API (création de frais).
export const droitInscriptionSchema = z.object({
  id: z.string().uuid().optional(),
  anneeScolaire: z.string().regex(/^\d{4}-\d{4}$/, {
    message: "L'année scolaire doit être au format : AAAA-AAAA",
  }),
  montant: z.coerce.number().positive("Le montant doit être positif"),
  eleveId: z.string().uuid(),
  classeId: z.string().uuid().nullish(),
  schoolId: z.string().uuid(),
});

export const createDroitInscriptionSchema = droitInscriptionSchema.omit({
  id: true,
});

export const ecolageSchema = z.object({
  id: z.string().uuid().optional(),
  anneeScolaire: z.string().regex(/^\d{4}-\d{4}$/, {
    message: "L'année scolaire doit être au format : AAAA-AAAA",
  }),
  montant: z.coerce.number().positive("Le montant doit être positif"),
  eleveId: z.string().uuid(),
  classeId: z.string().uuid().nullish(),
  schoolId: z.string().uuid(),
});

export const createEcolageSchema = ecolageSchema.omit({
  id: true,
});

// ------------------------------------
// ELEVE (Objet brut sans .refine)
// ------------------------------------
export const baseEleveShape = z.object({
  id: z.string().uuid().optional(),
  matricule: z.number().int().positive().optional(),
  nom: z.string().min(1, "Le nom est requis").trim().max(100),
  prenom: z.string().min(1, "Le prénom est requis").trim().max(100),
  genre: GenreEnum.nullish(),

  situationFamiliale: SituationFamilialeEnum.nullish(),
  situationFinAnnee: StatutFinAnneeEnum.default("EN_COURS").optional(),
  nationalite: z.string().trim().max(100).nullish(),

  dateInscription: z.coerce
    .date()
    .refine((value) => value <= new Date(), {
      message: "La date d'inscription ne peut pas être future",
    })
    .optional(),
  ecoleOrigine: z.string().trim().max(200).nullish(),

  responsableId: z.string().uuid().nullish(),
  schoolId: z.string().uuid("ID école invalide"),
  classeId: z.string().uuid("ID classe invalide").nullish(),
  parentId: z.string().uuid("ID parent invalide").nullish(),

  statut: StatutEleveEnum.default("ACTIF").optional(),

  isRelationContact: z.boolean().default(false),
  relationName: z.string().trim().max(150).nullish(),
  relationTelephone: z.string().trim().max(30).nullish(),

  remarque: z.string().trim().max(2000).nullish(),
  photoUrl: z.string().trim().min(1).nullish(),

  dateNaissance: z.coerce
    .date()
    .refine((value) => value <= new Date(), {
      message: "La date de naissance ne peut pas être future",
    })
    .nullish(),
  lieuNaissance: z.string().trim().max(150).nullish(),
  telephone: z.string().trim().max(30).nullish(),

  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().nullish(),
  deletedById: z.string().uuid().nullish(),

  adresse: createAdresseSchema.optional(),
  professionEleve: createProfessionEleveSchema.optional(),
});

// Schéma contact partagé pour éviter la répétition du .refine()
const validateContactRelation = (data: {
  isRelationContact?: boolean;
  relationName?: string | null;
  relationTelephone?: string | null;
}) =>
  !data.isRelationContact || (!!data.relationName && !!data.relationTelephone);

const contactRefineOptions = {
  message:
    "Le nom et le téléphone du contact sont requis si 'isRelationContact' est activé",
  path: ["relationName"],
};

// Schéma Élève principal avec validation
export const eleveSchema = baseEleveShape.refine(
  validateContactRelation,
  contactRefineOptions,
);

// ------------------------------------
// Schéma de création d'un élève
// ------------------------------------
const baseCreateShape = baseEleveShape
  .omit({
    id: true,
    matricule: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    deletedById: true,
  })
  .extend({
    adresse: createAdresseSchema.omit({ eleveId: true }).optional(),
    professionEleve: createProfessionEleveSchema
      .omit({ eleveId: true })
      .optional(),
  });

export const createEleveSchema = baseCreateShape.refine(
  validateContactRelation,
  contactRefineOptions,
);

// ------------------------------------
// Reponse Fiche & Update
// ------------------------------------
export const ficheEleveResponseSchema = baseEleveShape.extend({
  age: z.number().nullable(),
  fullName: z.string(),
  classe: z
    .object({
      id: z.string(),
      nom: z.string(),
      schoolId: z.string(),
    })
    .nullable(),
  parent: z
    .object({
      id: z.string(),
      nom: z.string(),
      prenom: z.string(),
      email: z.string().nullable(),
      telephone: z.string().nullable(),
    })
    .nullable(),
  school: z
    .object({
      id: z.string(),
      nom: z.string(),
      email: z.string().nullable(),
      telephone: z.string().nullable(),
      adresse: z.string().nullable(),
    })
    .optional(),
});

export type FicheEleveResponse = z.infer<typeof ficheEleveResponseSchema>;

// .partial() s'applique maintenant correctement sur l'objet brut avant le .refine()
export const updateEleveSchema = baseCreateShape.partial().refine(
  (data) => {
    if (!data.isRelationContact) return true;
    return !!(data.relationName || data.relationTelephone);
  },
  {
    message:
      "Le nom et le téléphone du contact sont requis si 'isRelationContact' est activé",
    path: ["relationName"],
  },
);

// ------------------------------------
// TYPE inférés pour TS
// ------------------------------------
export type EleveInput = z.infer<typeof eleveSchema>;
export type CreateEleveInput = z.infer<typeof createEleveSchema>;
export type UpdateEleveInput = z.infer<typeof updateEleveSchema>;
export type AdresseInput = z.infer<typeof adresseSchema>;
export type ProfessionEleveInput = z.infer<typeof professionEleveSchema>;
export type HistoriqueClasseInput = z.infer<typeof historiqueClasseSchema>;
export type DroitInscriptionInput = z.infer<typeof droitInscriptionSchema>;
export type EcolageInput = z.infer<typeof ecolageSchema>;
