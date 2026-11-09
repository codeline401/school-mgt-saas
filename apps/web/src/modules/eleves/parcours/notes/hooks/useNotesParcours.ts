import { useQuery } from "@tanstack/react-query";
import { api } from "../../../../../lib/api";

export type TypeNote = "INTERROGATION" | "DS" | "EXAMEN" | "AUTRE";

export type NotesFiltres = {
  eleveId?: string;
  classeId?: string;
  matiereId?: string;
  periodeId?: string;
  typeNote?: TypeNote;
  from?: string;
  to?: string;
  page: number;
  limit: number;
};

export type NoteParcours = {
  id: string;
  titre: string;
  typeNote: TypeNote;
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

export type NotesParcoursResponse = {
  resume: { nbNotes: number; moyenne: number | null };
  data: NoteParcours[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const BASE_URL = "/api/eleves/parcours/notes";

export const notesParcoursKeys = {
  all: ["notes-parcours"] as const,
  liste: (filtres: NotesFiltres) =>
    [...notesParcoursKeys.all, "liste", filtres] as const,
};

/**
 *Récupère les notes filtrées et paginées
 * @param filtres Fitlres actifs (les champs vides sont ignorés)
 * @returns Les notes filtrées et paginées sous forme de `NotesParcoursResponse`
 */
export function useNotesParcours(filtres: NotesFiltres) {
  return useQuery({
    queryKey: notesParcoursKeys.liste(filtres),
    queryFn: async () => {
      const { data } = await api.get<NotesParcoursResponse>(BASE_URL, {
        params: filtres,
      });
      return data;
    },
    enabled:
      !!filtres.eleveId &&
      !!filtres.classeId &&
      (!filtres.from || !filtres.to || filtres.from <= filtres.to),
  });
}
