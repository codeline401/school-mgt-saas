import { Request, Response } from "express";
import { ReservationService } from "./reservation.service.js";
import {
  createReservationSchema,
  updateReservationSchema,
  approuverReservationSchema,
} from "./reservation.schema.js";

const reservationsService = new ReservationService();

export class ReservationsController {
  /**
   * GET /api/logistique/reservations
   */
  async getReservations(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(403).json({ message: "École non identifiée" });
      }

      const { salleId, userId, statut, dateDebut, dateFin } = req.query;

      const reservations = await reservationsService.getReservations(schoolId, {
        salleId: salleId as string,
        userId: userId as string,
        statut: statut as string,
        dateDebut: dateDebut as string,
        dateFin: dateFin as string,
      });

      res.json(reservations);
    } catch (error: any) {
      console.error("Erreur lors de la récupération des réservations:", error);
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * GET /api/logistique/reservations/:id
   */
  async getReservationById(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(403).json({ message: "École non identifiée" });
      }

      const { id } = req.params as { id: string };
      const reservation = await reservationsService.getReservationById(
        id,
        schoolId,
      );

      res.json(reservation);
    } catch (error: any) {
      console.error("Erreur lors de la récupération de la réservation:", error);

      // Review, interception du cas "introuvable" pour renvoyer un statut HTTP 404
      if (
        error.message === "Reservation introuvable." ||
        error.name === "NotFoundError" ||
        error.status === 404
      ) {
        return res.status(404).json({ message: error.message });
      }

      res.status(500).json({ message: error.message });
    }
  }

  /**
   * POST /api/logistique/reservations
   */
  async createReservation(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const userId = req.user?.id;
      const role = req.user?.role;

      if (!schoolId || !userId) {
        return res
          .status(403)
          .json({ message: "Contexte utilisateur invalide" });
      }

      const data = createReservationSchema.parse(req.body);
      const reservation = await reservationsService.createReservation(data, {
        schoolId,
        userId,
        role: role || "USER",
      });

      res.status(201).json(reservation);
    } catch (error: any) {
      console.error("Erreur lors de la création de la réservation:", error);
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * PATCH /api/logistique/reservations/:id
   */
  async updateReservation(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const userId = req.user?.id;
      const role = req.user?.role;

      if (!schoolId || !userId) {
        return res
          .status(403)
          .json({ message: "Contexte utilisateur invalide" });
      }

      const { id } = req.params as { id: string };
      const data = updateReservationSchema.parse(req.body);

      const reservation = await reservationsService.updateReservation(
        id,
        data,
        {
          schoolId,
          userId,
          role: role || "USER",
        },
      );

      res.json(reservation);
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour de la réservation:", error);
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * PATCH /api/logistique/reservations/:id/approuver
   */
  async approuverReservation(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const userId = req.user?.id;
      const role = req.user?.role;

      if (!schoolId || !userId) {
        return res
          .status(403)
          .json({ message: "Contexte utilisateur invalide" });
      }

      const { id } = req.params as { id: string };
      const data = approuverReservationSchema.parse(req.body);

      const reservation = await reservationsService.approuverReservation(
        id,
        data,
        { schoolId, userId, role: role || "USER" },
      );

      res.json(reservation);
    } catch (error: any) {
      console.error("Erreur lors de l'approbation de la réservation:", error);
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * PATCH /api/logistique/reservations/:id/annuler
   */
  async annulerReservation(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const userId = req.user?.id;
      const role = req.user?.role;

      if (!schoolId || !userId) {
        return res
          .status(403)
          .json({ message: "Contexte utilisateur invalide" });
      }

      const { id } = req.params as { id: string };

      const reservation = await reservationsService.annulerReservation(id, {
        schoolId,
        userId,
        role: role || "USER",
      });

      res.json(reservation);
    } catch (error: any) {
      console.error("Erreur lors de l'annulation de la réservation:", error);
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * DELETE /api/logistique/reservations/:id
   */
  async deleteReservation(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const userId = req.user?.id;
      const role = req.user?.role;

      if (!schoolId || !userId) {
        return res
          .status(403)
          .json({ message: "Contexte utilisateur invalide" });
      }

      const { id } = req.params as { id: string };

      const result = await reservationsService.deleteReservation(id, {
        schoolId,
        userId,
        role: role || "USER",
      });

      res.json(result);
    } catch (error: any) {
      console.error("Erreur lors de la suppression de la réservation:", error);
      res.status(400).json({ message: error.message });
    }
  }
}
