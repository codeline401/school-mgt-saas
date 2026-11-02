import z from "zod";

// Date AAAA-MM-JJ valide (calendrier vérifié), comme Appel.date
const dateISO = z.iso.date("Format date attendu: AAAA-MM-JJ");

export const alerteQuerySchema = z
  .object({
    from: dateISO.optional(),
    to: dateISO.optional(),
    classeId: z.string().uuid("ID classe invvalide").optional(),
    // Requis uniquement pour SUDO_ADMIN (qui n'a pas d'école rattachée)
    schoolId: z.string().uuid("ID école invalide").optional(),
    // Seuil de déclenchement
    seuilAbsences: z.coerce.number().int().min(1).default(3),
    seuilRetards: z.coerce.number().int().min(1).default(5),
    seuilTauxPresence: z.coerce.number().int().min(0).max(100).default(80),
    niveau: z.enum(["ATTENTION", "CRITIQUE"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  })
  .refine((data) => !data.from || !data.to || data.from <= data.to, {
    message: "La date 'from' doit être antérieure ou égale à la date 'to'",
    path: ["to"],
  });

export type AlerteQuery = z.infer<typeof alerteQuerySchema>;

export type TypeAlerte =
  | "ABSENCES_REPETEES"
  | "ABSENCES_NON_JUSTIFIEES"
  | "RETARDS_REPETES"
  | "ASSIDUITE_FAIBLE";

export type AlerteEleve = {
  eleve: {
    id: string;
    nom: string;
    prenom: string;
    classe: { id: string; nom: string } | null;
  };
  niveau: "ATTENTION" | "CRITIQUE";
  types: TypeAlerte[];
  stats: {
    totalAppels: number;
    absent: number;
    absentNonJustifie: number;
    retard: number;
    tauxPresence: number; // 0-100, une décimale
  };
};

export type AlerteResponse = {
  periode: { from: string; to: string };
  seuils: {
    absences: number;
    retards: number;
    tauxPresence: number;
  };
  resume: { total: number; attention: number; critique: number };
  data: AlerteEleve[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
