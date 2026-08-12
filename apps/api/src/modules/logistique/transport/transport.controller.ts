import { Request, Response } from "express";
import { TransportService } from "./transport.service.js";
import {
  CreateVehiculeSchema,
  UpdateVehiculeSchema,
  VehiculeFiltersSchema,
  CreateChauffeurSchema,
  UpdateChauffeurSchema,
  ChauffeurFiltersSchema,
  CreateRouteSchema,
  UpdateRouteSchema,
  RouteFiltersSchema,
  CreateAffectationSchema,
  UpdateAffectationSchema,
  AffectationFiltersSchema,
} from "./transport.schema.js";
import { ZodError } from "zod";

const transportService = new TransportService();

// ==========================================
// VEHICULES
// ==========================================

/**
 * Récupérer tous les véhicules
 */
export const getVehicules = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user.schoolId) {
      return res.status(403).json({ message: "École non spécifiée." });
    }

    const filters = VehiculeFiltersSchema.parse(req.query);
    const vehicules = await transportService.getVehicules(
      user.schoolId,
      filters,
    );

    res.json(vehicules);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Récupérer un véhicule par ID
 */
export const getVehiculeById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user.schoolId) {
      return res.status(403).json({ message: "École non spécifiée." });
    }

    const vehicule = await transportService.getVehiculeById(
      req.params.id as string,
      user.schoolId,
    );

    res.json(vehicule);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Créer un nouveau véhicule
 */
export const createVehicule = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const data = CreateVehiculeSchema.parse(req.body);

    const vehicule = await transportService.createVehicule(data, user);

    res.status(201).json(vehicule);
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res
        .status(400)
        .json({ message: error.issues.map((e) => e.message).join(", ") });
    }
    res.status(400).json({ message: error.message });
  }
};

/**
 * Mettre à jour un véhicule
 */
export const updateVehicule = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const data = UpdateVehiculeSchema.parse(req.body);

    const vehicule = await transportService.updateVehicule(
      req.params.id as string,
      data,
      user,
    );

    res.json(vehicule);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Supprimer un véhicule
 */
export const deleteVehicule = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await transportService.deleteVehicule(
      req.params.id as string,
      user,
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ==========================================
// CHAUFFEURS
// ==========================================

export const getChauffeurs = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user.schoolId) {
      return res.status(403).json({ message: "École non spécifiée." });
    }

    const filters = ChauffeurFiltersSchema.parse(req.query);
    const chauffeurs = await transportService.getChauffeurs(
      user.schoolId,
      filters,
    );

    res.json(chauffeurs);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getChauffeurById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user.schoolId) {
      return res.status(403).json({ message: "École non spécifiée." });
    }

    const chauffeur = await transportService.getChauffeurById(
      req.params.id as string,
      user.schoolId,
    );

    res.json(chauffeur);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createChauffeur = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const data = CreateChauffeurSchema.parse(req.body);

    const chauffeur = await transportService.createChauffeur(data, user);

    res.status(201).json(chauffeur);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateChauffeur = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const data = UpdateChauffeurSchema.parse(req.body);

    const chauffeur = await transportService.updateChauffeur(
      req.params.id as string,
      data,
      user,
    );

    res.json(chauffeur);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteChauffeur = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await transportService.deleteChauffeur(
      req.params.id as string,
      user,
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ==========================================
// ROUTES
// ==========================================

export const getRoutes = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user.schoolId) {
      return res.status(403).json({ message: "École non spécifiée." });
    }

    const filters = RouteFiltersSchema.parse(req.query);
    const routes = await transportService.getRoutes(user.schoolId, filters);

    res.json(routes);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getRouteById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user.schoolId) {
      return res.status(403).json({ message: "École non spécifiée." });
    }

    const route = await transportService.getRouteById(
      req.params.id as string,
      user.schoolId,
    );

    res.json(route);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createRoute = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const data = CreateRouteSchema.parse(req.body);

    const route = await transportService.createRoute(data, user);

    res.status(201).json(route);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateRoute = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const data = UpdateRouteSchema.parse(req.body);

    const route = await transportService.updateRoute(
      req.params.id as string,
      data,
      user,
    );

    res.json(route);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteRoute = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await transportService.deleteRoute(
      req.params.id as string,
      user,
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ==========================================
// AFFECTATIONS
// ==========================================

export const getAffectations = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user.schoolId) {
      return res.status(403).json({ message: "École non spécifiée." });
    }

    const filters = AffectationFiltersSchema.parse(req.query);
    const affectations = await transportService.getAffectations(
      user.schoolId,
      filters,
    );

    res.json(affectations);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createAffectation = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const data = CreateAffectationSchema.parse(req.body);

    const affectation = await transportService.createAffectation(data, user);

    res.status(201).json(affectation);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateAffectation = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const data = UpdateAffectationSchema.parse(req.body);

    const affectation = await transportService.updateAffectation(
      req.params.id as string,
      data,
      user,
    );

    res.json(affectation);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteAffectation = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await transportService.deleteAffectation(
      req.params.id as string,
      user,
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
