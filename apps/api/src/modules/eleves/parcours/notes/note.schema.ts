import z from "zod";

export const typeNoteSchema = z.enum([
  "INTERROGATION",
  "DS",
  "EXAMEN",
  "AUTRE",
]);

const dateISO = z.iso.date("Date attendu au format AAAA-MM-JJ");

export const listeNotesQuerySchema = z
  .object({
    eleveId: z.string().uuid().optional(),
    classeId: z.string().uuid().optional(),
    matiereId: z.string().uuid().optional(),
    periodeId: z.string().uuid().optional(),
    typeNote: typeNoteSchema.optional(),
    from: dateISO.optional(),
    to: dateISO.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(10).default(1),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: "La date de début doit précéder la date de fin",
    path: ["to"],
  });

export type ListeNotesQuery = z.infer<typeof listeNotesQuerySchema>;

export type NoteParcours = {
  id: string;
  titre: string;
  typeNote: z.infer<typeof typeNoteSchema>;
  note: number;
  noteMax: number;
  coefficient: number;
  dateEval: string;
  commentaire: string | null;
  eleve: { id: string; nom: string; prenom: string; matricule: number };
  classe: { id: string; nom: string };
  matiere: { id: string; nom: string };
  periode: { id: string; nom: string } | null;
};

export type ListeNotesResponse = {
  resume: {
    nbNotes: number;
    moyenne: number | null; // pondérée, sur 20
  };
  data: NoteParcours[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
