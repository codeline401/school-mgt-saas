import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api, getApiError } from "../../../../lib/api";

export type StudentAttachmentType =
  | "CERTIFICAT_NAISSANCE"
  | "CERTIFICAT_RESIDENCE"
  | "CERTIFICAT_MEDICAL"
  | "PIECE_IDENTITE_TUTEUR"
  | "AUTRE";

export type StudentAttachment = {
  id: string;
  type: StudentAttachmentType;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  archivedAt: string | null;
  createdBy: {
    id: string;
    nom: string;
    prenom: string;
  };
};

type UploadUrlResponse = {
  attachmentId: string;
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
};

const BASE_URL = "/api/eleves/dossiers/pieces-jointes";

export const studentAttachmentKeys = {
  all: ["student-attachments"] as const,
  list: (eleveId: string | undefined, archived: boolean) =>
    [...studentAttachmentKeys.all, eleveId ?? "", archived] as const,
};

export function useStudentAttachments(
  eleveId: string | undefined,
  archived: boolean,
) {
  return useQuery({
    queryKey: studentAttachmentKeys.list(eleveId, archived),
    queryFn: async () => {
      const { data } = await api.get<StudentAttachment[]>(
        `${BASE_URL}/${eleveId}/attachments`,
        { params: { archived } },
      );
      return data;
    },
    enabled: !!eleveId,
  });
}

export function useUploadStudentAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eleveId,
      type,
      file,
    }: {
      eleveId: string;
      type: StudentAttachmentType;
      file: File;
    }) => {
      const { data: upload } = await api.post<UploadUrlResponse>(
        `${BASE_URL}/${eleveId}/attachments/upload-url`,
        {
          type,
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        },
      );

      const response = await fetch(upload.uploadUrl, {
        method: upload.method,
        headers: upload.headers,
        body: file,
      });

      if (!response.ok) {
        throw new Error("Échec de l'envoi du fichier vers le stockage.");
      }

      const { data: attachment } = await api.post<StudentAttachment>(
        `${BASE_URL}/${eleveId}/attachments/${upload.attachmentId}/confirm`,
      );

      return attachment;
    },
    onSuccess: async (_attachment, variables) => {
      await queryClient.invalidateQueries({
        queryKey: studentAttachmentKeys.all,
      });
      toast.success("Pièce jointe ajoutée.");
      void variables;
    },
    onError: (error) =>
      toast.error(getApiError(error, "Impossible d'ajouter la pièce jointe.")),
  });
}

export function useArchiveStudentAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eleveId,
      attachmentId,
    }: {
      eleveId: string;
      attachmentId: string;
    }) => {
      await api.patch(
        `${BASE_URL}/${eleveId}/attachments/${attachmentId}/archive`,
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: studentAttachmentKeys.all,
      });
      toast.success("Pièce jointe archivée.");
    },
    onError: (error) =>
      toast.error(getApiError(error, "Impossible d'archiver la pièce jointe.")),
  });
}

export function useRestoreStudentAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eleveId,
      attachmentId,
    }: {
      eleveId: string;
      attachmentId: string;
    }) => {
      await api.patch(
        `${BASE_URL}/${eleveId}/attachments/${attachmentId}/restore`,
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: studentAttachmentKeys.all,
      });
      toast.success("Pièce jointe restaurée.");
    },
    onError: (error) =>
      toast.error(
        getApiError(error, "Impossible de restaurer la pièce jointe."),
      ),
  });
}

export async function ouvrirStudentAttachment(
  eleveId: string,
  attachmentId: string,
): Promise<void> {
  const fenetre = window.open("about:blank", "_blank");

  try {
    const { data } = await api.get<{ url: string }>(
      `${BASE_URL}/${eleveId}/attachments/${attachmentId}/download`,
    );

    if (fenetre) {
      fenetre.location.href = data.url;
    } else {
      window.location.assign(data.url);
    }
  } catch (error) {
    fenetre?.close();
    toast.error(
      getApiError(error, "Impossible de télécharger la pièce jointe."),
    );
  }
}
