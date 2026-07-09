import { Router } from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";
import { Role } from "../generated/prisma/enums.js";

const router = Router();

// Route d'inscription :
// 1. On vérifie d'abord que l'utilisateur est connecté (authenticate)
// 2. On vérifie ensuite s'il a le droit (SUDO_ADMIN ou ADMIN)
router.post(
  "/register",
  authenticate,
  authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN),
  registerUser,
);

// Route de connexion (publique : aucun middleware)
router.post("/login", loginUser);

export default router;
