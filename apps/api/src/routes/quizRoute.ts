import { Router } from "express";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";
import {
  addQuestionToQuiz,
  createQuiz,
  deleteQuestionFromQuiz,
  deleteQuiz,
  getQuizById,
  getQuizResults,
  getQuizzes,
  submitQuiz,
  updateQuizStatut,
} from "../controllers/quizController.js";
import { Role } from "../generated/prisma/enums.js";

const router = Router({ mergeParams: true }); // mergeParams pour accéder à :classeId depuis app.ts

router.get("/", authenticate, getQuizzes); // Lecture : tous les utilisateurs de l'école (ELEVE, PARENT inclus)
router.get("/:quizId", authenticate, getQuizById); // Lecture d'un quiz spécifique : tous les utilisateurs de l'école (ELEVE, PARENT inclus)
router.post(
  "/",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.PROF),
  createQuiz,
); // Création : PROF, ADMIN, SUDO_ADMIN
router.patch(
  "/:quizId/statut",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.PROF),
  updateQuizStatut,
); // Mise à jour du statut : PROF, ADMIN, SUDO_ADMIN

router.delete(
  "/:quizId",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.PROF),
  deleteQuiz,
); // Suppression : PROF, ADMIN, SUDO_ADMIN

router.post(
  "/:quizId/questions",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.PROF),
  addQuestionToQuiz,
); // Ajout d'une question à un quiz : PROF, ADMIN, SUDO_ADMIN

router.delete(
  "/:quizId/questions/:questionId",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN, Role.PROF),
  deleteQuestionFromQuiz,
); // Suppression d'une question d'un quiz : PROF, ADMIN, SUDO_ADMIN

router.post(
  "/:quizId/submit",
  authenticate,
  authorizeRoles(Role.ELEVE),
  submitQuiz,
); // Soumission des réponses à un quiz : ELEVE
router.get("/:quizId/results", authenticate, getQuizResults);

export default router;
