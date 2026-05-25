import { Router } from "express";
import {
  createCahierTexte,
  getDevoirs,
  updateCahierTexte,
  getCahierTextes,
  deleteCahierTexte,
} from "../controllers/cahierTexteController";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware";
import { Role } from "../generated/prisma/browser";

const router = Router({ mergeParams: true }); // mergeParams pour accéder à :classeId depuis app.ts

router.get("/devoirs", authenticate, getDevoirs); // Lecture : tous les utilisateurs de l'école (ELEVE, PARENT inclus)
router.get("/", authenticate, getCahierTextes); // Lecture du cahier de texte : tous les utilisateurs de l'école (ELEVE, PARENT inclus)
router.post(
  "/",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.PROF),
  createCahierTexte,
); // Création : PROF, ADMIN, SUDO_ADMIN
router.put(
  "/:id",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.PROF),
  updateCahierTexte,
); // Modification : PROF, ADMIN, SUDO_ADMIN
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN),
  deleteCahierTexte,
); // Suppression : ADMIN, SUDO_ADMIN

export default router;
