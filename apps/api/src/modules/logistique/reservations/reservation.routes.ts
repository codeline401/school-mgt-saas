import { Router } from "express";
import { ReservationsController } from "./reservation.controller.js";
import { authenticate } from "../../../middlewares/authMiddleware.js";

const router = Router();
const controller = new ReservationsController();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes CRUD
router.get("/", controller.getReservations);
router.get("/:id", controller.getReservationById);
router.post("/", controller.createReservation);
router.patch("/:id", controller.updateReservation);
router.delete("/:id", controller.deleteReservation);

// Routes spécifiques
router.patch("/:id/approuver", controller.approuverReservation);
router.patch("/:id/annuler", controller.annulerReservation);

export default router;
