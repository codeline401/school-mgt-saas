import { Router } from "express";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";
import { Role } from "../generated/prisma/enums.js";
import { getAllClasses, createClasse } from "../controllers/classesController.js";

const router = Router();

// GET /api/classes — accessible à tous les utilisateurs authentifiés
// (ADMIN voit ses classes, SUDO_ADMIN peut filtrer via ?schoolId=)
router.get("/", authenticate, getAllClasses);

// POST /api/classes — créer une classe (ADMIN uniquement)
router.post("/", authenticate, authorizeRoles(Role.ADMIN), createClasse);

export default router;
