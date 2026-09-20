import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../../../../../lib/api";

export type ModePaiement = "ESPECES" | "VIREMENT" | "CHEQUE" | "MOBILE_MONEY";
export type TypeFrais = "ECOLAGE" | "DROIT_INSCRIPTION" | "FRAIS_EXAMEN";
export type StatutPaiementEcolage = "IMPAYE" | "PARTIEL" | "PAYE" | "EN_RETARD";

/** Ligne d'écolage due par l'élève, telle que renvoyée par GET /api/eleves/ecolages/:eleveId */
export type EcolageLigne = {
  id: string;
  anneeScolaire: string;
  mois: number;
  montant: string;
  montantPaye: string;
  statutPaiement: StatutPaiementEcolage;
};

/** Payload envoyé à l'API pour encaisser un paiement d'écolage */
export type EnregistrerPaiementInput = {
  anneeScolaire: string;
  typeFrais: TypeFrais;
  mois?: number | null;
  montantSaisi: number;
  modePaiement: ModePaiement;
  referencePaiement?: string | null;
  datePaiement?: string;
  remarque?: string | null;
};

export type PaiementResponse = {
  id: string;
  numeroRecu: string;
  montant: string;
  modePaiement: ModePaiement;
  referencePaiement: string | null;
  datePaiement: string | null;
  remarque: string | null;
  statutEcolage: StatutPaiementEcolage;
  agentId: string;
  createdAt: string;
};

export const ecolagesEleveKeys = {
  all: ["ecolages-eleve"] as const,
  detail: (eleveId: string) =>
    [...ecolagesEleveKeys.all, "detail", eleveId] as const,
};

/**
 * Charge les lignes d'écolage (dues/payées) d'un élève pour construire
 * le récapitulatif financier (mois payés, en retard, reste à payer).
 */
export function useEcolagesEleve(eleveId?: string) {
  return useQuery({
    queryKey: ecolagesEleveKeys.detail(eleveId ?? ""),
    queryFn: async () => {
      const { data } = await api.get<EcolageLigne[]>(
        `/api/eleves/ecolages/${eleveId}`,
      );
      return data;
    },
    enabled: !!eleveId,
  });
}

/**
 * Calcule le récapitulatif financier d'un élève à partir de ses lignes d'écolage.
 *
 * @param ecolages Lignes d'écolage de l'élève (dues sur l'année en cours)
 * @returns Nombre de mois payés, en retard, et reste à payer global
 */
export function calculerStatutFinancier(ecolages: EcolageLigne[]) {
  const moisPayes = ecolages.filter((e) => e.statutPaiement === "PAYE").length;
  const moisEnRetard = ecolages.filter(
    (e) => e.statutPaiement === "EN_RETARD" || e.statutPaiement === "IMPAYE",
  ).length;
  const moisPartiels = ecolages.filter(
    (e) => e.statutPaiement === "PARTIEL",
  ).length;

  const resteAPayer = ecolages.reduce((total, e) => {
    return total + (Number(e.montant) - Number(e.montantPaye));
  }, 0);

  return { moisPayes, moisEnRetard, moisPartiels, resteAPayer };
}

/**
 * Mutation d'encaissement d'un paiement d'écolage.
 * Invalide le cache des écolages et de l'historique de l'élève après succès.
 */
export function useEnregistrerPaiement(eleveId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EnregistrerPaiementInput) => {
      if (!eleveId) {
        throw new Error("L'identifiant de l'élève est requis");
      }

      const { data } = await api.post<PaiementResponse>(
        `/api/eleves/ecolages/paiement/${eleveId}`,
        input,
      );
      return data;
    },
    onSuccess: (paiement) => {
      if (eleveId) {
        queryClient.invalidateQueries({
          queryKey: ecolagesEleveKeys.detail(eleveId),
        });
        queryClient.invalidateQueries({
          queryKey: ["historique-eleve", "detail", eleveId],
        });
      }
      toast.success(`Paiement encaissé — Reçu n° ${paiement.numeroRecu}`);
    },
    onError: (error) => {
      const message =
        error?.message ?? "Erreur lors de l'encaissement du paiement";
      toast.error(message);
    },
  });
}
