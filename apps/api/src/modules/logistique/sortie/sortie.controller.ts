import { Request, Response } from "express";
import { SortieService } from "./sortie.service.js";
import {
  CreateSortieSchema,
  UpdateSortieSchema,
  SortieFiltersSchema,
  CreateParticipantSchema,
  UpdateParticipantSchema,
  CreateAutorisationSchema,
  UpdateAutorisationSchema,
} from "./sortie.schema.js";

const sortieService = new SortieService();

// ==========================================
// SORTIES SCOLAIRES
// ==========================================

/**
 * Récupérer toutes les sorties scolaires
 */
export const getSorties = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user.schoolId) {
      return res.status(403).json({ message: "École non spécifiée." });
    }

    const filters = SortieFiltersSchema.parse(req.query);
    const sorties = await sortieService.getSorties(user.schoolId, filters);

    res.json(sorties);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Récupérer une sortie par ID
 */
export const getSortieById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user.schoolId) {
      return res.status(403).json({ message: "École non spécifiée." });
    }

    const sortie = await sortieService.getSortieById(
      req.params.id as string,
      user.schoolId,
    );

    res.json(sortie);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Créer une nouvelle sortie scolaire
 */
export const createSortie = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const data = CreateSortieSchema.parse(req.body);

    const sortie = await sortieService.createSortie(data, user);

    res.status(201).json(sortie);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Mettre à jour une sortie scolaire
 */
export const updateSortie = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const data = UpdateSortieSchema.parse(req.body);

    const sortie = await sortieService.updateSortie(
      req.params.id as string,
      data,
      user,
    );

    res.json(sortie);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Supprimer une sortie scolaire
 */
export const deleteSortie = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await sortieService.deleteSortie(
      req.params.id as string,
      user,
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Obtenir les statistiques d'une sortie
 */
export const getStatistiquesSortie = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user.schoolId) {
      return res.status(403).json({ message: "École non spécifiée." });
    }

    const stats = await sortieService.getStatistiquesSortie(
      req.params.id as string,
      user.schoolId,
    );

    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ==========================================
// PARTICIPANTS
// ==========================================

/**
 * Récupérer les participants d'une sortie
 */
export const getParticipants = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user.schoolId) {
      return res.status(403).json({ message: "École non spécifiée." });
    }

    const participants = await sortieService.getParticipants(
      req.params.sortieId as string,
      user.schoolId,
    );

    res.json(participants);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Ajouter un participant à une sortie
 */
export const createParticipant = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const data = CreateParticipantSchema.parse(req.body);

    const participant = await sortieService.createParticipant(data, user);

    res.status(201).json(participant);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Mettre à jour un participant
 */
export const updateParticipant = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const data = UpdateParticipantSchema.parse(req.body);

    const participant = await sortieService.updateParticipant(
      req.params.id as string,
      data,
      user,
    );

    res.json(participant);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Supprimer un participant
 */
export const deleteParticipant = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await sortieService.deleteParticipant(
      req.params.id as string,
      user,
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ==========================================
// AUTORISATIONS PARENTALES
// ==========================================

/**
 * Récupérer les autorisations d'une sortie
 */
export const getAutorisations = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user.schoolId) {
      return res.status(403).json({ message: "École non spécifiée." });
    }

    const autorisations = await sortieService.getAutorisations(
      req.params.sortieId as string,
      user.schoolId,
    );

    res.json(autorisations);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Créer une autorisation parentale
 */
export const createAutorisation = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const data = CreateAutorisationSchema.parse(req.body);

    const autorisation = await sortieService.createAutorisation(data, user);

    res.status(201).json(autorisation);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Mettre à jour une autorisation parentale
 */
export const updateAutorisation = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const data = UpdateAutorisationSchema.parse(req.body);

    const autorisation = await sortieService.updateAutorisation(
      req.params.id as string,
      data,
      user,
    );

    res.json(autorisation);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Supprimer une autorisation parentale
 */
export const deleteAutorisation = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await sortieService.deleteAutorisation(
      req.params.id as string,
      user,
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
