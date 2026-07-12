import { Request, Response } from "express";
import { LocauxService } from "./locaux.service.js";

const service = new LocauxService();

/**
 * TODO: Récupérer tous les locaux de l'école
 */
export const getLocaux = async (req: Request, res: Response) => {
  try {
    const { schoolId, role } = req.user!;

    // TODO: Validation des paramètres
    // TODO: Appel au service
    // const locaux = await service.getLocaux(schoolId!);

    return res.status(200).json({ message: "Not implemented" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la récupération des locaux." });
  }
};

/**
 * TODO: Créer un nouveau local
 */
export const createLocal = async (req: Request, res: Response) => {
  try {
    const { schoolId, role } = req.user!;

    // TODO: Validation Zod des données
    // TODO: Vérification des permissions
    // TODO: Appel au service
    // const local = await service.createLocal(req.body, schoolId!, { schoolId, role });

    return res.status(201).json({ message: "Not implemented" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la création du local." });
  }
};

/**
 * TODO: Mettre à jour un local
 */
export const updateLocal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { schoolId, role } = req.user!;

    // TODO: Validation des données
    // TODO: Appel au service
    // const local = await service.updateLocal(id, req.body, { schoolId, role });

    return res.status(200).json({ message: "Not implemented" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour du local." });
  }
};

/**
 * TODO: Supprimer un local
 */
export const deleteLocal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { schoolId, role } = req.user!;

    // TODO: Appel au service
    // await service.deleteLocal(id, { schoolId, role });

    return res.status(200).json({ message: "Not implemented" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la suppression du local." });
  }
};

/**
 * TODO: Créer une réservation
 */
export const createReservation = async (req: Request, res: Response) => {
  try {
    const { schoolId, role } = req.user!;

    // TODO: Validation des données (localId, dateDebut, dateFin, motif)
    // TODO: Appel au service
    // const reservation = await service.createReservation(req.body, { schoolId, role });

    return res.status(201).json({ message: "Not implemented" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la création de la réservation." });
  }
};

/**
 * TODO: Récupérer les réservations
 */
export const getReservations = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.user!;

    // TODO: Parser les filtres (query params: localId, dateDebut, dateFin)
    // TODO: Appel au service
    // const reservations = await service.getReservations(req.query, schoolId!);

    return res.status(200).json({ message: "Not implemented" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la récupération des réservations." });
  }
};
