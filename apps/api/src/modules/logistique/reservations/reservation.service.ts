import { prisma } from "../../../lib/prisma.js";
import {
  ApprouverReservationInput,
  CreateReservationInput,
  UpdateReservationInput,
} from "./reservation.schema.js";

interface UserContext {
  schoolId: string | null;
  role: string;
  userId: string;
}

export class ReservationService {
  /**
   * Récupérer toutes les réservation avec filtres
   */
  async getReservations(
    schoolId: string,
    filters?: {
      salleId?: string;
      userId?: string;
      statut?: string;
      dateDebut?: string;
      dateFin?: string;
    },
  ) {
    const where: any = { schoolId }; // Filtrer par schoolId

    if (filters?.salleId) where.salleId = filters.salleId; //
    if (filters?.userId) where.userId = filters.userId; //
    if (filters?.statut) where.statut = filters.statut; //

    if (filters?.dateDebut || filters?.dateFin) {
      where.AND = []; // Filtrer par dateDebut et dateFin
      if (filters.dateDebut) {
        where.AND.push({
          dateFin: { gte: new Date(filters.dateDebut) },
        });
      }
      if (filters.dateFin) {
        where.AND.push({
          dateDebut: { lte: new Date(filters.dateFin) },
        });
      }
    }

    return await prisma.reservationSalle.findMany({
      where,
      include: {
        salle: {
          select: {
            id: true,
            nom: true,
            code: true,
            type: true,
            capacite: true,
            batiment: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },

        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { dateDebut: "asc" },
    });
  }

  /**
   * Récupère une réservation par ID
   */

  async getReservationById(reservationId: string, schoolId: string) {
    const reservation = await prisma.reservationSalle.findFirst({
      where: { id: reservationId, schoolId },
      include: {
        salle: {
          select: {
            id: true,
            nom: true,
            code: true,
            type: true,
            capacite: true,
            batiment: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!reservation) {
      throw new Error("Reservation introuvable.");
    }

    return reservation;
  }

  /**
   * Vérifier la disponibilité d'une salle
   */
  async checkDisponibilite(
    salleId: string,
    dateDebut: Date,
    dateFin: Date,
    schoolId: string,
    excludeReservationId?: string,
  ) {
    const where: any = {
      salleId,
      schoolId,
      statut: { in: ["EN_ATTENTE", "APPROUVEE"] },
      OR: [
        {
          // Réservation qui commence pendant la période
          dateDebut: { gte: dateDebut, lt: dateFin },
        },
        {
          // Réservation qui finit pendant la période
          dateFin: { gt: dateDebut, lte: dateFin },
        },
        {
          // Réservation qui englobe toute la période
          AND: [
            { dateDebut: { lte: dateDebut } },
            { dateFin: { gte: dateFin } },
          ],
        },
      ],
    };

    if (excludeReservationId) {
      where.id = { not: excludeReservationId }; //
    }

    const conflits = await prisma.reservationSalle.findMany({
      where,
    });

    return conflits.length === 0; // Retourne true si aucune réservation conflictuelle n'est trouvée
  }

  /**
   * Créer une nouvelle réservation
   */
  async createReservation(data: CreateReservationInput, user: UserContext) {
    if (!user.schoolId || !user.userId) {
      throw new Error("Utilisateur non autorisé ou école non spécifiée.");
    }

    // Vérifier que la salle existe et appartient à l'école
    const salle = await prisma.salle.findFirst({
      where: { id: data.salleId, schoolId: user.schoolId },
    });

    if (!salle) {
      throw new Error("Salle introuvable ou non autorisée pour cette école.");
    }

    // Vérifier la disponibilité de la salle
    const disponible = await this.checkDisponibilite(
      data.salleId,
      new Date(data.dateDebut),
      new Date(data.dateFin),
      user.schoolId,
    );

    if (!disponible) {
      throw new Error(
        "La salle n'est pas disponible pour la période demandée.",
      );
    }

    // Les admins et sudo_admin peuvent créer des réservation directement approuvées
    const statut =
      user.role === "ADMIN" || user.role === "SUDO_ADMIN"
        ? "APPROUVEE"
        : "EN_ATTENTE";

    return await prisma.reservationSalle.create({
      data: {
        ...data,
        dateDebut: new Date(data.dateDebut),
        dateFin: new Date(data.dateFin),
        userId: user.userId,
        schoolId: user.schoolId,
        statut,
      },
      include: {
        salle: {
          select: {
            id: true,
            nom: true,
            code: true,
            type: true,
            capacite: true,
            batiment: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Mettre à jour une réservation
   */
  async updateReservation(
    reservationId: string,
    data: UpdateReservationInput,
    user: UserContext,
  ) {
    if (!user.schoolId) {
      throw new Error("Utilisateur non autorisé ou école non spécifiée.");
    }

    const reservation = await prisma.reservationSalle.findFirst({
      where: { id: reservationId, schoolId: user.schoolId },
    });

    if (!reservation) {
      throw new Error(
        "Réservation introuvable ou non autorisée pour cette école.",
      );
    }

    // Seul le créateur ou admin peut modifier
    const canUpdate =
      reservation.userId === user.userId ||
      user.role === "ADMIN" ||
      user.role === "SUDO_ADMIN";
    if (!canUpdate) {
      throw new Error("Vous n'êtes pas autorisé à modifier cette réservation.");
    }

    // Vérifier la disponibilité si les dates ou la salle changent
    if (data.dateDebut || data.dateFin || data.salleId) {
      const disponible = await this.checkDisponibilite(
        data.salleId || reservation.salleId,
        new Date(data.dateDebut || reservation.dateDebut),
        new Date(data.dateFin || reservation.dateFin),
        user.schoolId,
        reservationId, // Exclure la réservation actuelle
      );

      if (!disponible) {
        throw new Error(
          "La salle est déjà réservée pour cette période. Veuillez choisir une autre période ou salle",
        );
      }
    }

    return await prisma.reservationSalle.update({
      where: { id: reservationId },
      data: {
        ...data,
        dateDebut: data.dateDebut ? new Date(data.dateDebut) : undefined,
        dateFin: data.dateFin ? new Date(data.dateFin) : undefined,
      },
      include: {
        salle: {
          select: {
            id: true,
            nom: true,
            code: true,
            type: true,
            capacite: true,
            batiment: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Approuver ou réfuser une réservation (admin uniquement)
   */
  async approuverReservation(
    reservationId: string,
    data: ApprouverReservationInput,
    user: UserContext,
  ) {
    if (!user.schoolId) {
      throw new Error("Utilisateur non autorisé ou école non spécifiée.");
    }

    // Vérifier les persmissions
    if (user.role !== "ADMIN" && user.role !== "SUDO_ADMIN") {
      throw new Error(
        "Vous n'êtes pas autorisé à approuver ou refuser cette réservation.",
      );
    }

    const reservation = await prisma.reservationSalle.findFirst({
      where: { id: reservationId, schoolId: user.schoolId },
    });

    if (!reservation) {
      throw new Error(
        "Réservation introuvable ou non autorisée pour cette école.",
      );
    }

    if (reservation.statut !== "EN_ATTENTE") {
      throw new Error(
        "Seules les réservations en attente peuvent être approuvées ou refusées.",
      );
    }

    // Si refusée, le motif est obligatoire
    if (data.statut === "REFUSEE" && !data.motifRefus) {
      throw new Error(
        "Le motif de refus est obligatoire pour refuser une réservation.",
      );
    }

    return await prisma.reservationSalle.update({
      where: { id: reservationId },
      data: {
        statut: data.statut,
        motifRefus: data.motifRefus,
      },
      include: {
        salle: {
          select: {
            id: true,
            nom: true,
            code: true,
            type: true,
            capacite: true,
            batiment: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Annuler une réservation
   */
  async annulerReservation(reservationId: string, user: UserContext) {
    if (!user.schoolId) {
      throw new Error("Utilisateur non autorisé ou école non spécifiée.");
    }

    const reservation = await prisma.reservationSalle.findFirst({
      where: { id: reservationId, schoolId: user.schoolId },
    });

    if (!reservation) {
      throw new Error(
        "Réservation introuvable ou non autorisée pour cette école.",
      );
    }

    // Seul le créateur ou un admin peut annuler
    const canCancel =
      reservation.userId === user.userId ||
      user.role === "ADMIN" ||
      user.role === "SUDO_ADMIN";

    if (!canCancel) {
      throw new Error("Vous n'êtes pas autorisé à annuler cette réservation.");
    }

    return await prisma.reservationSalle.update({
      where: { id: reservationId },
      data: { statut: "ANNULEE" },
      include: {
        salle: {
          select: {
            id: true,
            nom: true,
            code: true,
            type: true,
            capacite: true,
            batiment: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Supprimer une réservation
   */
  async deleteReservation(reservationId: string, user: UserContext) {
    if (!user.schoolId) {
      throw new Error("Utilisateur non autorisé ou école non spécifiée.");
    }

    const reservation = await prisma.reservationSalle.findFirst({
      where: { id: reservationId, schoolId: user.schoolId },
    });

    if (!reservation) {
      throw new Error(
        "Réservation introuvable ou non autorisée pour cette école.",
      );
    }

    // Seul le créateur ou un admin peut supprimer
    const canDelete =
      reservation.userId === user.userId ||
      user.role === "ADMIN" ||
      user.role === "SUDO_ADMIN";
    if (!canDelete) {
      throw new Error(
        "Vous n'êtes pas autorisé à supprimer cette réservation.",
      );
    }

    await prisma.reservationSalle.delete({
      where: { id: reservationId },
    });

    return { message: "Réservation supprimée avec succès." };
  }
}
