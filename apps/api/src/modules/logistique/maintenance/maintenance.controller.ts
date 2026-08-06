import { Request, Response } from "express";
import { maintenanceService } from "./maintenance.service.js";
import {
  CreateTicketMaintenanceSchema,
  UpdateTicketMaintenanceSchema,
  TicketMaintenanceFiltersSchema,
  CreateInterventionSchema,
  UpdateInterventionSchema,
} from "./maintenance.schema.js";
import { ZodError } from "zod";

/**
 * TICKETS DE MAINTENANCE
 */

const requireUserContext = (req: Request) => {
  const schoolId = req.user?.schoolId;
  const userId = req.user?.id;
  if (!schoolId || !userId) return null;
  return { schoolId, userId, role: req.user?.role ?? "" };
};

export const getTickets = async (req: Request, res: Response) => {
  try {
    const schoolId = req.user?.schoolId;

    if (!schoolId) {
      return res.status(403).json({ error: "École non spécifiée" });
    }

    const filters = TicketMaintenanceFiltersSchema.parse(req.query);
    const tickets = await maintenanceService.getTickets(schoolId, filters);

    res.json(tickets);
  } catch (error: any) {
    console.error("Erreur getTickets:", error);
    return res
      .status(400)
      .json({ error: "Erreur lors de la récupération des tickets." });
  }
};

export const getTicketById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const schoolId = req.user?.schoolId;

    if (!schoolId) {
      return res.status(403).json({ error: "École non spécifiée" });
    }

    const ticket = await maintenanceService.getTicketById(id, schoolId);
    res.json(ticket);
  } catch (error: any) {
    console.error("Erreur getTicketById:", error);
    return res.status(400).json({
      error: error.message || "Erreur lors de la récupération du ticket",
    });
  }
};

export const createTicket = async (req: Request, res: Response) => {
  try {
    const data = CreateTicketMaintenanceSchema.parse(req.body);
    const user = requireUserContext(req);
    if (!user) {
      return res.status(403).json({ error: "École non spécifiée" });
    }

    const ticket = await maintenanceService.createTicket(data, user);
    res.status(201).json(ticket);
  } catch (error: any) {
    console.error("Erreur createTicket:", error);
    return res
      .status(400)
      .json({ error: error.message || "Erreur lors de la création du ticket" });
  }
};

export const updateTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    // Nettoyage : suppression des clés ayant pour valeur "" ou null
    const cleanBody = Object.fromEntries(
      Object.entries(req.body).filter(
        ([_, value]) => value !== "" && value !== null,
      ),
    );

    // Si type est présent, on s'assure qu'il est en majuscules
    if (typeof cleanBody.type === "string") {
      cleanBody.type = cleanBody.type.toUpperCase();
    }

    // Validation avec Zod avec les données nettoyées
    const data = UpdateTicketMaintenanceSchema.parse(cleanBody);
    const user = requireUserContext(req);
    if (!user) {
      return res.status(403).json({ error: "École non spécifiée" });
    }

    const ticket = await maintenanceService.updateTicket(id, data, user);
    res.json(ticket);
  } catch (error: any) {
    console.error("Erreur updateTicket:", error);

    if (error instanceof ZodError) {
      return res.status(400).json({
        error: "Données invalides ne correspondant pas au format attendu",
        details: error.issues,
      });
    }

    return res.status(400).json({
      error: error.message || "Erreur lors de la mise à jour du ticket",
    });
  }
};

export const deleteTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const user = requireUserContext(req);
    if (!user) {
      return res.status(403).json({ error: "École non spécifiée" });
    }

    await maintenanceService.deleteTicket(id, user);
    res.status(204).send();
  } catch (error: any) {
    console.error("Erreur deleteTicket:", error);
    return res.status(400).json({
      error: error.message || "Erreur lors de la suppression du ticket",
    });
  }
};

/**
 * INTERVENTIONS
 */

export const getInterventions = async (req: Request, res: Response) => {
  try {
    const schoolId = req.user?.schoolId;
    const { ticketId } = req.query;

    if (!schoolId) {
      return res.status(403).json({ error: "École non spécifiée" });
    }

    const interventions = await maintenanceService.getInterventions(
      schoolId,
      ticketId as string,
    );

    res.json(interventions);
  } catch (error: any) {
    console.error("Erreur getInterventions:", error);
    return res
      .status(400)
      .json({ error: "Erreur lors de la récupération des interventions." });
  }
};

export const createIntervention = async (req: Request, res: Response) => {
  try {
    const data = CreateInterventionSchema.parse(req.body);
    const user = requireUserContext(req);
    if (!user) {
      return res.status(403).json({ error: "École non spécifiée" });
    }

    const intervention = await maintenanceService.createIntervention(
      data,
      user,
    );
    res.status(201).json(intervention);
  } catch (error: any) {
    console.error("Erreur createIntervention:", error);
    return res.status(400).json({
      error: error.message || "Erreur lors de la création de l'intervention",
    });
  }
};

export const updateIntervention = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const data = UpdateInterventionSchema.parse(req.body);
    const user = requireUserContext(req);
    if (!user) {
      return res.status(403).json({ error: "École non spécifiée" });
    }

    const intervention = await maintenanceService.updateIntervention(
      id,
      data,
      user,
    );
    res.json(intervention);
  } catch (error: any) {
    console.error("Erreur updateIntervention:", error);
    return res.status(400).json({
      error: error.message || "Erreur lors de la mise à jour de l'intervention",
    });
  }
};

export const deleteIntervention = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const user = requireUserContext(req);
    if (!user) {
      return res.status(403).json({ error: "École non spécifiée" });
    }

    await maintenanceService.deleteIntervention(id, user);
    res.status(204).send();
  } catch (error: any) {
    console.error("Erreur deleteIntervention:", error);
    return res.status(400).json({
      error: error.message || "Erreur lors de la suppression de l'intervention",
    });
  }
};

/**
 * STATISTIQUES
 */

export const getStatistiques = async (req: Request, res: Response) => {
  try {
    const schoolId = req.user?.schoolId;

    if (!schoolId) {
      return res.status(403).json({ error: "École non spécifiée" });
    }

    const stats = await maintenanceService.getStatistiques(schoolId);
    res.json(stats);
  } catch (error: any) {
    console.error("Erreur getStatistiques:", error);
    return res
      .status(400)
      .json({ error: "Erreur lors de la récupération des statistiques." });
  }
};
