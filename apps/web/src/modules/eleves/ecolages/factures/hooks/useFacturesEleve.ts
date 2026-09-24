import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../../../lib/api";

export type FactureResume = {
  id: string;
  numeroRecu: string;
  typeFrais: "ECOLAGE" | "DROIT_INSCRIPTION" | "FRAIS_EXAMEN";
  montant: string;
  modePaiement: string;
  datePaiement: string;
  anneeScolaire: string | null;
  mois: number | null;
};

export type FactureDetail = FactureResume & {
  referencePaiement: string | null;
  remarque: string | null;
  createdAt: string;
  montantDu: string;
  ecole: {
    id: string;
    nom: string;
    adresse: string | null;
    telephone: string | null;
    email: string | null;
    logourl: string | null;
    numAutorsation: string | null;
  };
  eleve: {
    id: string;
    matricule: number;
    nom: string;
    prenom: string;
    classe: { id: string; nom: string } | null;
  };
  agent: {
    id: string;
    nom: string;
    prenom: string;
  };
};

export type FacturesResponse = {
  data: FactureResume[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type FacturesFilters = {
  page: number;
  limit: number;
  anneeScolaire?: string;
  typeFrais?: string;
  dateDebut?: string;
  dateFin?: string;
};

export const factureKeys = {
  // Keys for student invoices
  all: ["factures-eleve"] as const, // Key for all student invoices
  list: (eleveId: string, filters: FacturesFilters) =>
    [...factureKeys.all, "list", eleveId, filters] as const,
  detail: (factureId: string) =>
    [...factureKeys.all, "detail", factureId] as const,
};

export function useFacturesEleve(
  eleveId?: string,
  filters: FacturesFilters = { page: 1, limit: 5 },
) {
  return useQuery({
    queryKey: factureKeys.list(eleveId ?? "", filters), // Key for the list of invoices for the specified student with the given filters
    queryFn: async () => {
      const { data } = await api.get<FacturesResponse>(
        `/api/eleves/ecolages/${eleveId}/factures`,
        { params: filters },
      );
      return data;
    },
    enabled: Boolean(eleveId), // Only enable the query if a student ID is provided
  });
}

export function useFactureDetail(factureId?: string) {
  return useQuery({
    queryKey: factureKeys.detail(factureId ?? ""),
    queryFn: async () => {
      const { data } = await api.get<FactureDetail>(
        `/api/eleves/ecolages/factures/${factureId}`,
      );
      return data;
    },
    enabled: Boolean(factureId), // Only enable the query if a facture ID is provided
  });
}

export function usePrintFacture() {
  const queryClient = useQueryClient();

  return async (factureId: string, format: "A5" | "THERMAL") => {
    const response = await api.get<Blob>(
      `/api/eleves/ecolages/factures/${factureId}/print`,
      { params: { format }, responseType: "blob" },
    );

    // Création d'une URL Blob pour ouverture/impression directe
    const fileUrl = window.URL.createObjectURL(
      new Blob([response.data], { type: "application/pdf" }),
    );
    window.open(fileUrl, "_blank");

    window.setTimeout(() => {
      URL.revokeObjectURL(fileUrl);
    }, 60_000); // Revoke the object URL after 60 seconds to free up memory

    await queryClient.invalidateQueries({
      queryKey: factureKeys.detail(factureId),
    }); // Invalidate the query for the invoice detail to ensure fresh data is fetched next time
  };
}
