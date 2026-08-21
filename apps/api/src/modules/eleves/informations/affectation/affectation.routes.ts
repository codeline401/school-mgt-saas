import { Router } from "express";
import {
  getAllNiveaux,
  getNiveauById,
  createNiveau,
  updateNiveau,
  deleteNiveau,
  getAllSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
  getAllOptions,
  createOption,
  updateOption,
  deleteOption,
  assignClasseStructure,
  getAffectationsByEleve,
  getAffectationsByClasse,
  creerAffectation,
} from "./affectation.controller.js";

const router = Router();

// ================================================================
// NIVEAU
// ================================================================
router.get("/niveaux", getAllNiveaux);
router.get("/niveaux/:id", getNiveauById);
router.post("/niveaux", createNiveau);
router.put("/niveaux/:id", updateNiveau);
router.delete("/niveaux/:id", deleteNiveau);

// ================================================================
// SECTION
// ================================================================
router.get("/sections", getAllSections);
router.get("/sections/:id", getSectionById);
router.post("/sections", createSection);
router.put("/sections/:id", updateSection);
router.delete("/sections/:id", deleteSection);

// ================================================================
// OPTION
// ================================================================
router.get("/options", getAllOptions);
router.post("/options", createOption);
router.put("/options/:id", updateOption);
router.delete("/options/:id", deleteOption);

// ================================================================
// STRUCTURE DE CLASSE (rattacher niveau / section / options à une classe)
// ================================================================
router.put("/classes/:id/structure", assignClasseStructure);

// ================================================================
// AFFECTATION CLASSE (inscription / transfert / promotion / etc.)
// ================================================================
router.get(
  "/eleves/:eleveId/informations/affectations",
  getAffectationsByEleve,
);
router.get(
  "/classes/:classeId/informations/affectations",
  getAffectationsByClasse,
);
router.post("/informations/affectations", creerAffectation);

export default router;
