import { Router } from "express";
import {
  authenticate,
  authorizeRoles,
} from "../../../../middlewares/authMiddleware.js";
import { Role } from "../../../../generated/prisma/enums.js";
import { listerNotes } from "./note.controller.js";

const router = Router();
router.use(authenticate, authorizeRoles(Role.SUDO_ADMIN, Role.ADMIN));

router.get("/", listerNotes);

export default router;
