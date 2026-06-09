import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

// GET /api/notifications
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const notification = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.status(200).json(notification);
  } catch (err) {
    console.error("Erreur getNotifications", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// PATCH /api/notifications/:id/read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const userId = req.user!.id;

    const notif = await prisma.notification.findUnique({
      where: { id },
    });
    if (!notif || notif.userId !== userId) {
      return res.status(404).json({
        error: "Notification introuvable ou vous n'avez pas de notification",
      });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { lu: true },
    });

    res.status(200).json(updatedNotification);
  } catch (err) {
    console.error("Erreur markAsRead", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// PATCH /api/notifications/read-all
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    await prisma.notification.updateMany({
      where: { userId, lu: false },
      data: { lu: true },
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Erreur markAllAsRead:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
};
