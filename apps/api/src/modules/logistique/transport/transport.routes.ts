import { Router } from "express";
import { authenticate } from "../../../middlewares/authMiddleware.js";
import * as transportController from "./transport.controller.js";

const router = Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

// ==========================================
// ROUTES VEHICULES
// ==========================================
router.get("/vehicules", transportController.getVehicules);
router.get("/vehicules/:id", transportController.getVehiculeById);
router.post("/vehicules", transportController.createVehicule);
router.patch("/vehicules/:id", transportController.updateVehicule);
router.delete("/vehicules/:id", transportController.deleteVehicule);

// ==========================================
// ROUTES CHAUFFEURS
// ==========================================
router.get("/chauffeurs", transportController.getChauffeurs);
router.get("/chauffeurs/:id", transportController.getChauffeurById);
router.post("/chauffeurs", transportController.createChauffeur);
router.patch("/chauffeurs/:id", transportController.updateChauffeur);
router.delete("/chauffeurs/:id", transportController.deleteChauffeur);

// ==========================================
// ROUTES ROUTES (trajets)
// ==========================================
router.get("/routes", transportController.getRoutes);
router.get("/routes/:id", transportController.getRouteById);
router.post("/routes", transportController.createRoute);
router.patch("/routes/:id", transportController.updateRoute);
router.delete("/routes/:id", transportController.deleteRoute);

// ==========================================
// ROUTES AFFECTATIONS
// ==========================================
router.get("/affectations", transportController.getAffectations);
router.post("/affectations", transportController.createAffectation);
router.patch("/affectations/:id", transportController.updateAffectation);
router.delete("/affectations/:id", transportController.deleteAffectation);

export default router;
