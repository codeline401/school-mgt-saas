import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api, getApiError } from "../../../../../lib/api";

export type TypeRegleAlerte =
  | "ABSENCES"
  | "ABSENCES_NON_JUSTIFIEES"
  | "RETARDS"
  | "TAUX_PRESENCE";

export type DestinataireAlerte = "ADMIN" | "PARENT" | "PROFESSEUR_PRINCIPAL";

export type NiveauAlerte = "ATTENTION" | "CRITIQUE";

export type Alerte = {
  eleve: {
    id: string;
    nom: string;
    prenom: string;
    classe: { id: string; nom: string } | null;
  };
  niveau: NiveauAlerte;
  types: string[];
  stats: {
    totalAppels: number;
    absent: number;
    absentNonJustifie: number;
    retard: number;
    tauxPresence: number;
  };
};

export type AlertesFiltres = {
  from: string;
  to: string;
  seuilAbsences: number;
  seuilRetards: number;
  seuilTauxPresence: number;
  page: number;
  limit: number;
};

export type AlertesResponse = {
  periode: { from: string; to: string };
  resume: { total: number; attention: number; critique: number };
  data: Alerte[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type PalierAlerte = {
  id: string;
  seuil: number;
  destinataire: DestinataireAlerte[];
  message: string | null;
};

export type RegleAlerte = {
  id: string;
  nom: string;
  type: TypeRegleAlerte;
  periodeJours: number;
  classeId: string | null;
  actif: boolean;
  paliers: PalierAlerte[];
  createdAt: string;
};

export type PalierAlerteInput = {
  seuil: number;
  // Le schéma API actuel attend exactement cette casse.
  destinataires: DestinataireAlerte[];
  message?: string;
};

export type RegleAlerteInput = {
  nom: string;
  type: TypeRegleAlerte;
  periodeJours: number;
  classeId?: string | null;
  actif: boolean;
  paliers: PalierAlerteInput[];
};

export type HistoriqueAlerte = {
  id: string;
  cycle: string;
  valeur: number;
  nbNotification: number;
  createdAt: string;
  eleve: { id: string; nom: string; prenom: string };
  regle: { id: string; nom: string; type: TypeRegleAlerte };
  palier: { seuil: number };
};

type ListeHistoriqueResponse = {
  data: HistoriqueAlerte[];
  pagination: AlertesResponse["pagination"];
};

const ALERTES_URL = "/api/eleves/absences/alertes";
const REGLES_URL = `${ALERTES_URL}/regles`;

export const alerteKeys = {
  all: ["alertes-assiduite"] as const,
  liste: (filtres: AlertesFiltres) =>
    [...alerteKeys.all, "liste", filtres] as const,
  regles: () => [...alerteKeys.all, "regles"] as const,
  historique: (page: number) =>
    [...alerteKeys.all, "historique", page] as const,
  apercu: (regleId: string) => [...alerteKeys.all, "apercu", regleId] as const,
};

function notifierErreur(error: unknown, fallback: string) {
  toast.error(getApiError(error, fallback));
}

export function useAlertes(filtres: AlertesFiltres, enabled = true) {
  return useQuery({
    queryKey: alerteKeys.liste(filtres),
    queryFn: async () => {
      const { data } = await api.get<AlertesResponse>(ALERTES_URL, {
        params: filtres,
      });
      return data;
    },
    enabled: enabled && filtres.from <= filtres.to,
    placeholderData: (previous) => previous,
  });
}

export function useReglesAlerte(enabled = true) {
  return useQuery({
    queryKey: alerteKeys.regles(),
    queryFn: async () => {
      const { data } = await api.get<RegleAlerte[]>(REGLES_URL);
      return data;
    },
    enabled,
  });
}

export function useHistoriqueAlertes(page: number, enabled = true) {
  return useQuery({
    queryKey: alerteKeys.historique(page),
    queryFn: async () => {
      const { data } = await api.get<ListeHistoriqueResponse>(
        `${REGLES_URL}/historique`,
        { params: { page, limit: 10 } },
      );
      return data;
    },
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useApercuRegle(regleId: string | null) {
  return useQuery({
    queryKey: alerteKeys.apercu(regleId ?? ""),
    queryFn: async () => {
      const { data } = await api.get<{
        total: number;
        data: Array<{ eleveId: string; valeur: number; palier: PalierAlerte }>;
      }>(`${REGLES_URL}/${regleId}/apercu`);
      return data;
    },
    enabled: !!regleId,
  });
}

export function useCreerRegleAlerte() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (input: RegleAlerteInput) => {
      await api.post(REGLES_URL, input);
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: alerteKeys.all });
      toast.success("Règle d’alerte créée");
    },
    onError: (error) =>
      notifierErreur(error, "Impossible de créer la règle d’alerte"),
  });
}

export function useModifierRegleAlerte() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: RegleAlerteInput;
    }) => {
      await api.put(`${REGLES_URL}/${id}`, input);
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: alerteKeys.all });
      toast.success("Règle d’alerte modifiée");
    },
    onError: (error) =>
      notifierErreur(error, "Impossible de modifier la règle d’alerte"),
  });
}

export function useSupprimerRegleAlerte() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${REGLES_URL}/${id}`);
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: alerteKeys.all });
      toast.success("Règle d’alerte supprimée");
    },
    onError: (error) =>
      notifierErreur(error, "Impossible de supprimer la règle d’alerte"),
  });
}
