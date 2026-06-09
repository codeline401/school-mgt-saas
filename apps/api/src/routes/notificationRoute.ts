import { Router } from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import {
  getNotifications,
  markAllAsRead,
  markAsRead,
} from "../controllers/notificationController.js";

const router = Router();

router.use(authenticate);

router.get("/", getNotifications);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);

export default router;
