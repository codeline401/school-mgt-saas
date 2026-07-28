import z from "zod";
/**
 * SCHEMAS DE VALIDATION POUR LA GESTION DES ARTICLES EN STOCK
 */

//--- Enumérations --------------------------------------------
export const CategorieArticleEnum = z.enum([
  "FOURNITURES_SCOLAIRES",
  "MATERIEL_PEDAGOGIQUE",
  "MATERIEL_INFORMATIQUE",
  "EQUIPEMENT_SPORTIF",
  "CONSOMMABLES",
  "IMMOBILIERS",
  "AUTRE",
]);

export const TypeMouvementEnum = z.enum([
  "ENTREE",
  "SORTIE",
  "AJUSTEMENT",
  "TRANSFERT",
]);

// --- Schéma de création d'article -----------------------------
export const CreateArticleStockSchema = z.object({
  nom: z.string().min(1, "Le nom est requis").max(100),
  reference: z.string().max(100).optional(),
  description: z.string().max(100).optional(),
  categorie: CategorieArticleEnum.default("FOURNITURES_SCOLAIRES"),
  quantite: z.number().int().min(0, "La quantité ne peut pas être négative"),
  unite: z.string().min(1).max(50).default("unité"),
  seuilMinimal: z.number().int().min(0),
  seuilOptimal: z.number().int().min(0).optional(),
  prixUnitaire: z.number().min(0).optional(),
  emplacement: z.string().max(200).optional(),
});

export type CreateArticleStockInput = z.infer<typeof CreateArticleStockSchema>;

// --- Schéma de maj d'article ----------------------------------
export const UpdateArticleStockSchema = CreateArticleStockSchema.partial();

export type UpdateArticleStockInput = z.infer<typeof UpdateArticleStockSchema>;

// --- Schéma de mouvement de Stock -----------------------------
export const CreateMouvementStockSchema = z.object({
  articleId: z.string().uuid(),
  type: TypeMouvementEnum,
  quantite: z.number().int(),
  motif: z.string().max(500).optional(),
  reference: z.string().max(100).optional(),
  cout: z.number().min(0).optional(),
});

export type CreateMouvementStockInput = z.infer<
  typeof CreateMouvementStockSchema
>;

// --- Schéma de fitre de recherche ----------------------------
export const ArticleStockFiltersSchema = z.object({
  categorie: CategorieArticleEnum.optional(),
  enAlerte: z.boolean().optional(), // Article sous le seuil minimal
  search: z.string().optional(), // Recherche par nom ou reference
});

export type ArticleStockFilters = z.infer<typeof ArticleStockFiltersSchema>;
