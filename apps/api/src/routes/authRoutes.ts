import { Router } from "express";
import rateLimit from "express-rate-limit";
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

// Route de connexion (publique) : 10 échecs / 15 min par IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives, réessayez plus tard" },
});
router.post("/login", loginLimiter, loginUser);

export default router;
