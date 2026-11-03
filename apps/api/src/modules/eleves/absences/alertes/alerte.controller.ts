import { Request, Response } from "express";
import { alerteQuerySchema } from "./alerte.schema.js";
import { AlerteError, AlerteService } from "./alerte.service.js";
import { ZodError } from "zod";

/** /GET /api/eleves/absences/alertes */
export const getAlertes = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    const query = alerteQuerySchema.parse(req.query); // Valide et parse les paramètres de la requête selon le schéma défini
    const result = await AlerteService.lister(query, {
      id: req.user.id,
      role: req.user.role,
      schoolId: req.user.schoolId ?? null,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    if (error instanceof AlerteError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error("Erreur lors du calcul des alertes d'assiduité:", error);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
};
