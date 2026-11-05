import { Router } from "express";
import {
  authenticate,
  authorizeRoles,
} from "../../../../middlewares/authMiddleware.js";
import { Role } from "../../../../generated/prisma/enums.js";
import {
  listerSanctions,
  creerSanction,
  modifierSanction,
  changerStatutSanction,
} from "./sanction.controller.js";

const router = Router();

router.use(authenticate, authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN));

router.get("/", listerSanctions);
router.post("/", creerSanction);
router.put("/:sanctionId", modifierSanction);
router.patch("/:sanctionId/statut", changerStatutSanction);

export default router;
