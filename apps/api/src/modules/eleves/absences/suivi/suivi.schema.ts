import z from "zod";

const dateISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format date attendu : AAAA-MM-JJ");

export const suiviParamsSchema = z.object({
  eleveId: z.string().uuid("ID élève invalide"),
});

export const StatutPresenceEnum = z.enum(["PRESENT", "ABSENT", "RETARD"]);

export const suiviQuerySchema = z
  .object({
    from: dateISO.optional(),
    to: dateISO.optional(),
    statut: StatutPresenceEnum.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: "La date de début doit être antérieure ou égale à la date de fin",
    path: ["to"],
  });

export type SuiviQuery = z.infer<typeof suiviQuerySchema>;

export type SuiviResponse = {
  eleve: {
    id: string;
    nom: string;
    prenom: string;
    classe: {
      id: string;
      nom: string;
    } | null;
  };
  periode: { from: string; to: string };
  resume: {
    totalAppels: number;
    present: number;
    absent: number;
    retard: number;
    tauxPresence: number; // 0-100, une décimale ; 100 si aucun appel
  };
  data: Array<{
    id: string;
    date: string;
    statut: "PRESENT" | "ABSENT" | "RETARD";
    heureDebut: string;
    heureFin: string;
    matiere: string | null;
    intitule: string | null;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
