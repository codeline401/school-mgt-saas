import { Request, Response } from "express";
import { suiviParamsSchema, suiviQuerySchema } from "./suivi.schema.js";
import { SuiviAbsenceService, SuiviError } from "./suivi.service.js";
import { ZodError } from "zod";
export const getSuiviEleve = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { eleveId } = suiviParamsSchema.parse(req.params);
    const query = suiviQuerySchema.parse(req.query);

    const result = await SuiviAbsenceService.getSuivi(eleveId, query, {
      id: req.user.id,
      role: req.user.role,
      schoolId: req.user.schoolId ?? null,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    if (error instanceof SuiviError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error("Erreur lors du suivi des absences:", error);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
};
