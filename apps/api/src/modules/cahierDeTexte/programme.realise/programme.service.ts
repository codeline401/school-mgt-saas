import { prisma } from "../../../lib/prisma.js";
import type { ProgrammeGroup } from "@school-mgt/types";

export const getProgrammeRealiseService = async (
  classeId?: string,
  matiereId?: string,
) => {
  // 1. Récupération brute des cahiers de texte avec les relations nécessaires
  const cahiers = await prisma.cahierTexte.findMany({
    where: {
      classeId: classeId || undefined,
      matiereId: matiereId || undefined,
    },
    include: {
      classe: { select: { nom: true } },
      matiere: { select: { nom: true } },
      professeur: { select: { nom: true, prenom: true } },
    },
    orderBy: {
      date: "desc", // Du plus récent au plus ancien
    },
  });

  // 2. Algorithme de fusion par Titre
  const mapUnique = new Map<string, ProgrammeGroup>();

  for (const c of cahiers) {
    // La clé unique combine le titre et l'ID de la classe pour éviter des fusions inter-classes erronées
    const uniqueKey = `${c.classeId}-${c.titre.trim().toLowerCase()}`;
    const profNomComplet = c.professeur
      ? `${c.professeur.prenom} ${c.professeur.nom}`
      : "Professeur non assigné";

    if (!mapUnique.has(uniqueKey)) {
      mapUnique.set(uniqueKey, {
        titre: c.titre,
        matiereNom: c.matiere?.nom || "Général",
        classeNom: c.classe.nom,
        professeurNom: profNomComplet,
        sessions: [],
      });
    }

    // On ajoute la session (le détail de ce jour-là) à la liste des détails fusionnés
    mapUnique.get(uniqueKey)!.sessions.push({
      id: c.id,
      date: c.date,
      detail: c.detail,
    });
  }

  // Renvoie un tableau plat des programmes consolidés
  return Array.from(mapUnique.values());
};
