import { Router } from "express";
import {
  authenticate,
  authorizeRoles,
} from "../../../../middlewares/authMiddleware.js";
import { Role } from "../../../../generated/prisma/browser.js";
import {
  accepterAjournement,
  annulerAjournement,
  contreProposerAjournement,
  creerAjournement,
  getAjournementDetail,
  getMonAjournement,
  listerAjournements,
  listerMesAjournements,
  refuserAjournement,
  repondreContreProposition,
} from "./ajournement.controller.js";

const router = Router();

router.use(authenticate);

// Parent
router.post(
  "/",
  authorizeRoles(Role.PARENT, Role.SUDO_ADMIN),
  creerAjournement,
);
router.get(
  "/me",
  authorizeRoles(Role.PARENT, Role.SUDO_ADMIN),
  listerMesAjournements,
);
router.get(
  "/me/:ajournementId",
  authorizeRoles(Role.PARENT, Role.SUDO_ADMIN),
  getMonAjournement,
);
router.patch(
  "/me/:ajournementId/annuler",
  authorizeRoles(Role.PARENT, Role.SUDO_ADMIN),
  annulerAjournement,
);
router.patch(
  "/me/:ajournementId/reponse",
  authorizeRoles(Role.PARENT, Role.SUDO_ADMIN),
  repondreContreProposition,
);

// ADMIN
router.get(
  "/",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  listerAjournements,
);
router.get(
  "/:ajournementId",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  getAjournementDetail,
);
router.patch(
  "/:ajournementId/accepter",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  accepterAjournement,
);
router.patch(
  "/:ajournementId/refuser",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  refuserAjournement,
);
router.patch(
  "/:ajournementId/contre-proposition",
  authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN),
  contreProposerAjournement,
);

export default router;
