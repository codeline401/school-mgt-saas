import { prisma } from "../../../lib/prisma.js";

export const getDocumentsService = async (
  schoolId: string,
  classeId?: string,
  matiereId?: string,
  type?: any,
) => {
  return await prisma.document.findMany({
    where: {
      schoolId,
      ...(classeId && { classeId }),
      ...(matiereId && { matiereId }),
      ...(type && { type }),
    },
    include: {
      classe: { select: { nom: true } },
      matiere: { select: { nom: true } },
      uploadedBy: { select: { nom: true, prenom: true } },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};
