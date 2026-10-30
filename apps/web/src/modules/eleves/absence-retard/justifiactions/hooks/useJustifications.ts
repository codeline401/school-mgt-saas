import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api, getApiError } from "../../../../../lib/api";

export type AbsenceAJustifier = {
  id: string;
  statut: "ABSENT" | "RETARD";
  date: string;
  heureDebut: string;
  heureFin: string;
  matiere: string | null;
};

export type BilletResume = {
  id: string;
  numero: string;
  dateValidite: string;
  creneau: { heureDebut: string; heureFin: string };
};

export type Justification = {
  id: string;
  motif: string;
  fichierNom: string;
  createdAt: string;
  _count: { presences: number };
  billets: BilletResume[];
};

export type JustificationsResponse = {
  data: Justification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type PropositionCreneau = {
  type: "ACTUEL" | "PROCHAIN";
  creneauId: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  libelle: string;
};

const BASE = "/api/eleves/absences/justifications";

export const justificationKeys = {
  all: ["justifications-absence"] as const,
  list: (eleveId: string, page: number) =>
    [...justificationKeys.all, "list", eleveId, page] as const,
  absences: (eleveId: string) =>
    [...justificationKeys.all, "absences", eleveId] as const,
  creneaux: (id: string) => [...justificationKeys.all, "creneaux", id] as const,
};

/**
 * Récupère la liste des justifications pour un élève donné, paginée.
 * @param eleveId L'ID de l'élève.
 * @param page Le numéro de la page à récupérer.
 * @returns Une requête React Query contenant les justifications.
 */
export function useJustifications(eleveId: string | undefined, page: number) {
  return useQuery({
    queryKey: justificationKeys.list(eleveId ?? "", page),
    queryFn: async () => {
      const { data } = await api.get<JustificationsResponse>(
        `${BASE}/eleve/${eleveId}`,
        {
          params: { page, limit: 10 },
        },
      );
      return data;
    },
    enabled: !!eleveId,
  });
}

/**
 * Récupère la liste des absences à justifier pour un élève donné.
 * @param eleveId L'ID de l'élève.
 * @returns Une requête React Query contenant les absences à justifier.
 */
export function useAbsencesAJustifier(eleveId: string | undefined) {
  return useQuery({
    queryKey: justificationKeys.absences(eleveId ?? ""),
    queryFn: async () => {
      const { data } = await api.get<AbsenceAJustifier[]>(
        `${BASE}/eleve/${eleveId}/absences`,
      );
      return data;
    },
    enabled: !!eleveId,
  });
}

/**
 * Récupère les propositions de créneaux pour une justification donnée.
 * @param justificationId L'ID de la justification.
 * @returns Une requête React Query contenant les propositions de créneaux.
 */
export function usePropositionsCreneau(justificationId: string) {
  return useQuery({
    queryKey: justificationKeys.creneaux(justificationId),
    queryFn: async () => {
      const { data } = await api.get<PropositionCreneau[]>(
        `${BASE}/${justificationId}/creneaux`,
      );
      return data;
    },
  });
}

/**
 * Crée une nouvelle justification pour un élève donné.
 * @param eleveId L'ID de l'élève pour lequel créer la justification.
 * @returns Une mutation React Query pour créer la justification.
 */
export function useCreerJustification(eleveId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      motif: string;
      presenceIds: string[];
      fichier: File;
    }) => {
      const form = new FormData();
      form.append("eleveId", eleveId);
      form.append("motif", input.motif);
      form.append("presenceIds", JSON.stringify(input.presenceIds));
      form.append("fichier", input.fichier);
      const { data } = await api.post(BASE, form);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: justificationKeys.all });
      queryClient.invalidateQueries({ queryKey: ["suivi-absences"] });
      toast.success("Justification enregistrée");
    },
    onError: (error) =>
      toast.error(getApiError(error, "Erreur lors de l'enregistrement")),
  });
}

/**
 * Génère un billet pour une justification donnée.
 * @param justificationId L'ID de la justification.
 * @param creneauId L'ID du créneau choisi.
 * @param date La date du billet.
 * @returns Une mutation React Query pour générer le billet.
 */
export function useGenererBillet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      justificationId: string;
      creneauId: string;
      date: string;
    }) => {
      const { data } = await api.post<BilletResume>(
        `${BASE}/${input.justificationId}/billets`,
        {
          creneauId: input.creneauId,
          date: input.date,
        },
      );
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: justificationKeys.all }),
    onError: (error) =>
      toast.error(getApiError(error, "Erreur lors de la génération du billet")),
  });
}

// Ouvre un fichier protégé (JWT) dans un nouvel onglet ; la fenêtre est ouverte avant l'appel pour éviter le blocage de popup.
/**
 * Ouvre un fichier protégé (JWT) dans un nouvel onglet.
 * La fenêtre est ouverte avant l'appel pour éviter le blocage de popup.
 * @param url L'URL du fichier protégé à ouvrir.
 */
export async function ouvrirFichierProtege(
  url: string,
  fenetrePreOuverte?: Window | null,
): Promise<void> {
  const fenetre = fenetrePreOuverte ?? window.open("", "_blank");
  try {
    const { data } = await api.get<Blob>(url, {
      responseType: "blob",
      timeout: 60_000,
    });
    const objectUrl = URL.createObjectURL(data);
    if (fenetre) fenetre.location.href = objectUrl;
    else window.open(objectUrl, "_blank");
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } catch (error) {
    fenetre?.close();
    toast.error(getApiError(error, "Impossible d'ouvrir le document"));
  }
}

export const urlFichier = (justificationId: string) =>
  `${BASE}/${justificationId}/fichier`;
export const urlBilletPdf = (billetId: string) =>
  `${BASE}/billets/${billetId}/pdf`;
