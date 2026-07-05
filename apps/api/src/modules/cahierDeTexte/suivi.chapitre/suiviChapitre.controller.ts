import { ZodError } from "zod";
import { Response, Request } from "express";
import { AppError } from "../helpers/errors.js";
import * as suiviChapitreService from "./suiviChapitre.service.js";

// --- Gestion des erreurs --------------------------------
function handleError(err: unknown, res: Response, context: string) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.issues });
  }
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error(`Erreur ${context}:`, err);
  return res.status(500).json({ error: "Une erreur interne est survenue." });
}

// GET /api/classes/:classeId/suivi-chapitres
export const getChapitres = async (req: Request, res: Response) => {
  try {
    const { classeId } = req.params as { classeId: string };
    const { matiereId } = req.query as { matiereId: string };
    const user = req.user! as { id: string; role: string; schoolId: string };

    const chapitres = await suiviChapitreService.listChapitres(
      user,
      classeId,
      matiereId,
    );
    res.status(200).json(chapitres);
  } catch (err) {
    handleError(err, res, "getChapitres");
  }
};

// POST /api/classes/:classeId/suivi-chapitres
export const createChapitre = async (req: Request, res: Response) => {
  try {
    const { classeId } = req.params as { classeId: string };
    const user = req.user! as { id: string; role: string; schoolId: string };

    const chapitre = await suiviChapitreService.createChapitre(
      user,
      classeId,
      req.body,
    );
    res.status(201).json(chapitre);
  } catch (err) {
    handleError(err, res, "createChapitre");
  }
};

// PUT /api/classes/:classeId/suivi-chapitres/:id
export const updateChapitre = async (req: Request, res: Response) => {
  try {
    const { classeId, id } = req.params as { classeId: string; id: string };
    const user = req.user! as { id: string; role: string; schoolId: string };

    const chapitre = await suiviChapitreService.udpateChapitre(
      user,
      classeId,
      id,
      req.body,
    );
    res.status(200).json(chapitre);
  } catch (err) {
    handleError(err, res, "updateChapitre");
  }
};

// PATCH /api/classes/:classeId/suivi-chapitres/:id/statut
export const updateStatutChapitre = async (req: Request, res: Response) => {
  try {
    const { classeId, id } = req.params as { classeId: string; id: string };
    const user = req.user! as { id: string; role: string; schoolId: string };

    const chapitre = await suiviChapitreService.updateChapitreStatut(
      user,
      classeId,
      id,
      req.body,
    );

    res.status(200).json(chapitre);
  } catch (err) {
    handleError(err, res, "updateChapitreStatut");
  }
};

// PATCH /api/classes/:classeId/suivi-chapitres/:chapitreId/sous-chapitres/:sousChapitreId/statut
export const updateStatutSousChapitre = async (req: Request, res: Response) => {
  try {
    const { classeId, chapitreId, sousChapitreId } = req.params as {
      classeId: string;
      chapitreId: string;
      sousChapitreId: string;
    };
    const user = req.user! as { id: string; role: string; schoolId: string };

    const sousChapitre =
      await suiviChapitreService.updateStatutSousChapitreStatut(
        user,
        classeId,
        chapitreId,
        sousChapitreId,
        req.body,
      );

    res.status(200).json(sousChapitre);
  } catch (err) {
    handleError(err, res, "updateStatutSousChapitre");
  }
};

// DELETE /api/classes/:classeId/suivi-chapitres/:id
export const deleteChapitre = async (req: Request, res: Response) => {
  try {
    const { classeId, id } = req.params as { classeId: string; id: string };
    const user = req.user! as { id: string; role: string; schoolId: string };

    await suiviChapitreService.deleteChapitre(user, classeId, id);
    res.status(204).send();
  } catch (err) {
    handleError(err, res, "deleteChapitre");
  }
};
