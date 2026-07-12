import { Request, Response } from "express";
import { getProgrammeRealiseService } from "./programme.service.js";

export const getProgrammeRealise = async (req: Request, res: Response) => {
  try {
    const { classeId, matiereId } = req.query;

    // Conversion des filtres en chaînes de caractères si présents
    const filterClasse = classeId ? String(classeId) : undefined;
    const filterMatiere = matiereId ? String(matiereId) : undefined;

    // Appel du service de fusion
    const programme = await getProgrammeRealiseService(
      filterClasse,
      filterMatiere,
    );

    return res.status(200).json(programme);
  } catch (error) {
    console.error("Erreur dans getProgrammeRealise:", error);
    return res.status(500).json({
      message:
        "Une erreur interne est survenue lors de la génération du programme réalisé.",
    });
  }
};
