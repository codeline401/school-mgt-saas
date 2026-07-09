import { Router } from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";
import { Role } from "../generated/prisma/enums.js";

const router = Router();

// Route d'inscription (accessible seulement pour les ADMIN et SUDO_ADMIN)
router.post("/register", registerUser);

// Route de connexion (accessible à tous)
router.post("/login", loginUser);

export default router;
