import { Router } from "express";
import { authenticate } from "../../../middlewares/authMiddleware.js";
import * as sortieController from "./sortie.controller.js";

const router = Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

// ==========================================
// ROUTES SORTIES SCOLAIRES
// ==========================================
router.get("/", sortieController.getSorties);
router.get("/:id", sortieController.getSortieById);
router.post("/", sortieController.createSortie);
router.patch("/:id", sortieController.updateSortie);
router.delete("/:id", sortieController.deleteSortie);
router.get("/:id/statistiques", sortieController.getStatistiquesSortie);

// ==========================================
// ROUTES PARTICIPANTS
// ==========================================
router.get("/:sortieId/participants", sortieController.getParticipants);
router.post("/participants", sortieController.createParticipant);
router.patch("/participants/:id", sortieController.updateParticipant);
router.delete("/participants/:id", sortieController.deleteParticipant);

// ==========================================
// ROUTES AUTORISATIONS PARENTALES
// ==========================================
router.get("/:sortieId/autorisations", sortieController.getAutorisations);
router.post("/autorisations", sortieController.createAutorisation);
router.patch("/autorisations/:id", sortieController.updateAutorisation);
router.delete("/autorisations/:id", sortieController.deleteAutorisation);

export default router;
