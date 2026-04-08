import { Router } from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = Router();

// Route d'inscription (accessible seulement pour les ADMIN et SUDO_ADMIN)
router.post(
  "/register",
  authenticate,
  authorizeRoles("SUDO_ADMIN", "ADMIN"),
  registerUser,
);

// Route de connexion (accessible à tous)
router.post("/login", loginUser);

export default router;
