import { Router } from "express";
import {
  authenticate,
  authorizeRoles,
} from "../../../../middlewares/authMiddleware.js";
import { Role } from "../../../../generated/prisma/enums.js";
import {
  listerPiecesJointes,
  creerUrUploadPieceJointe,
  confirmerUploadPieceJointe,
  obtenirUrlTelechargementPieceJointe,
  archiverPieceJointe,
  restaurerPieceJointe,
  supprimerPieceJointe,
} from "./pj.controller.js";

const router = Router();

router.use(authenticate, authorizeRoles(Role.ADMIN, Role.SUDO_ADMIN));

router.get("/:eleveId/attachments", listerPiecesJointes);
router.post("/:eleveId/attachments/upload-url", creerUrUploadPieceJointe);
router.post(
  "/:eleveId/attachments/:attachementId/confirm",
  confirmerUploadPieceJointe,
);
router.get(
  "/:eleveId/attachments/:attachementId/download",
  obtenirUrlTelechargementPieceJointe,
);
router.patch(
  "/:eleveId/attachments/:attachementId/archive",
  archiverPieceJointe,
);
router.patch(
  "/:eleveId/attachments/:attachementId/restore",
  restaurerPieceJointe,
);
router.delete("/:eleveId/attachments/:attachementId", supprimerPieceJointe);

export default router;
