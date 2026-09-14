import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../../../lib/api";
import { updateEmergencyContactSchema } from "../../../../../../../api/src/modules/eleves/informations/emergencyContact/emergencyContact.schema";
import toast from "react-hot-toast";

type EmergencyContact = {
  eleveId: string;
  isRelationContact: boolean;
  relationName: string | null;
  relationTelephone?: string | null;
};

type UpdateEmergencyContactInput = {
  isRelationContact?: boolean;
  relationName?: string | null;
  relationTelephone?: string | null;
};

export const emergencyContactKeys = {
  all: ["emergency-contact"] as const,
  details: (eleveId: string) =>
    [...emergencyContactKeys.all, "détails", eleveId] as const,
};

/**
 * Hook: charge le contact d'urgence d'un élève.
 */
export function useEmergencyContact(eleveId?: string) {
  return useQuery({
    queryKey: emergencyContactKeys.details(eleveId ?? ""),
    queryFn: async () => {
      // ⚠️ Ajuste le chemin si ton client `api` inclut déjà '/api' dans sa baseURL
      const { data } = await api.get<EmergencyContact>(
        `/api/eleves/informations/contact-urgence/${eleveId}`,
      );
      return data;
    },
    // ✅ CRUCIAL : Bloque la requête HTTP si eleveId n'est pas défini
    enabled: !!eleveId,
  });
}

/**
 * Hook: met à jour le contact d'urgence d'un élève.
 */
export function useUpdateEmergencyContact(studentId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateEmergencyContactInput) => {
      if (!studentId) {
        throw new Error(
          "L'identifiant de l'élève est requis pour la mise à jour",
        );
      }

      const validation = updateEmergencyContactSchema.safeParse(input);

      if (!validation.success) {
        throw new Error(
          validation.error.issues[0]?.message ?? "Données invalides",
        );
      }

      const { data } = await api.put<EmergencyContact>(
        `/api/eleves/informations/contact-urgence/${studentId}`,
        validation.data,
      );

      return data;
    },
    onSuccess: (updated) => {
      if (studentId) {
        queryClient.setQueryData(
          emergencyContactKeys.details(studentId),
          updated,
        );
      }
      queryClient.invalidateQueries({
        queryKey: emergencyContactKeys.all,
      });
      toast.success("Contact d'urgence mis à jour avec succès");
    },
    onError: (error) => {
      const message =
        error?.message ?? "Erreur lors de la mise à jour du contact d'urgence";
      toast.error(message);
    },
  });
}
