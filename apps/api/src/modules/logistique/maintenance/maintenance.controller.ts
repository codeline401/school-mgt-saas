import { Request, Response } from "express";
import { MaintenanceService } from "./maintenance.service.js";

const service = new MaintenanceService();

/**
 * TODO: Récupérer tous les tickets de maintenance
 */
export const getTickets = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.user!;

    // TODO: Parser les filtres (statut, priorité, type)
    // TODO: Appel au service
    // const tickets = await service.getTickets(schoolId!, req.query);

    return res.status(200).json({ message: "Not implemented" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la récupération des tickets." });
  }
};

/**
 * TODO: Créer un nouveau ticket
 */
export const createTicket = async (req: Request, res: Response) => {
  try {
    const { schoolId, role } = req.user!;

    // TODO: Validation Zod (titre, description, priorité, type, localId ou equipementId)
    // TODO: Appel au service
    // const ticket = await service.createTicket(req.body, schoolId!, { schoolId, role });

    return res.status(201).json({ message: "Not implemented" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la création du ticket." });
  }
};

/**
 * TODO: Mettre à jour un ticket
 */
export const updateTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { schoolId, role } = req.user!;

    // TODO: Validation des données
    // TODO: Appel au service
    // const ticket = await service.updateTicket(id, req.body, { schoolId, role });

    return res.status(200).json({ message: "Not implemented" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour du ticket." });
  }
};

/**
 * TODO: Assigner un ticket à un intervenant
 */
export const assignerTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { intervenantId } = req.body;
    const { schoolId, role } = req.user!;

    // TODO: Validation de l'intervenantId
    // TODO: Appel au service
    // const ticket = await service.assignerTicket(id, intervenantId, { schoolId, role });

    return res.status(200).json({ message: "Not implemented" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de l'assignation du ticket." });
  }
};

/**
 * TODO: Clôturer un ticket
 */
export const cloturerTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { schoolId, role } = req.user!;

    // TODO: Validation des données de clôture
    // TODO: Appel au service
    // const ticket = await service.cloturerTicket(id, req.body, { schoolId, role });

    return res.status(200).json({ message: "Not implemented" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la clôture du ticket." });
  }
};

/**
 * TODO: Ajouter une intervention à un ticket
 */
export const ajouterIntervention = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { schoolId, role } = req.user!;

    // TODO: Validation des données (commentaire, durée, pièces)
    // TODO: Appel au service
    // const intervention = await service.ajouterIntervention(id, req.body, { schoolId, role });

    return res.status(201).json({ message: "Not implemented" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de l'ajout de l'intervention." });
  }
};

/**
 * TODO: Récupérer les statistiques de maintenance
 */
export const getStatistiques = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.user!;

    // TODO: Parser la période (query param)
    // TODO: Appel au service
    // const stats = await service.getStatistiques(schoolId!, req.query.periode);

    return res.status(200).json({ message: "Not implemented" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la récupération des statistiques." });
  }
};
