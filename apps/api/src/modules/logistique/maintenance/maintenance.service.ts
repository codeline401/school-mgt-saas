import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../lib/prisma.js";
import {
  CreateInterventionInput,
  CreateTicketMaintenanceInput,
  TicketMaintenanceFilters,
  UpdateInterventionInput,
  UpdateTicketMaintenanceInput,
} from "./maintenance.schema.js";

interface UserContext {
  schoolId: string;
  userId: string;
  role: string;
}

export class MaintenanceService {
  /**
   * Récupère tous les tickets de maintenance d'une école, avec filtres optionnels.
   * @param schoolId - ID de l'école
   * @param filters - Filtres (statut, priorité, type)
   * @returns Liste des tickets
   */
  async getTickets(schoolId: string, filters?: TicketMaintenanceFilters) {
    const where: any = { schoolId };

    if (filters?.statut) {
      where.statut = filters.statut;
    }

    if (filters?.priorite) {
      where.priorite = filters.priorite;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.assigneAId) {
      where.assigneAId = filters.assigneAId;
    }

    if (filters?.search) {
      where.OR = [
        { titre: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { localisationNom: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return await prisma.ticketMaintenance.findMany({
      where,
      include: {
        creePar: {
          select: { nom: true, prenom: true, email: true },
        },
        assigneA: {
          select: { nom: true, prenom: true, email: true },
        },
        interventions: {
          select: {
            id: true,
            statut: true,
            dateDebut: true,
            dateFin: true,
          },
        },
      },
      orderBy: [{ priorite: "desc" }, { dateOuverture: "desc" }],
    });
  }

  /**
   * Récupérer un ticket par ID
   */
  async getTicketById(ticketId: string, schoolId: string) {
    const ticket = await prisma.ticketMaintenance.findFirst({
      where: { id: ticketId, schoolId },
      include: {
        creePar: {
          select: { nom: true, prenom: true, email: true },
        },
        assigneA: {
          select: { nom: true, prenom: true, email: true },
        },
        interventions: {
          include: {
            technicien: {
              select: { nom: true, prenom: true, email: true },
            },
          },
          orderBy: { dateDebut: "desc" },
        },
      },
    });

    if (!ticket) {
      throw new Error("Ticket non trouvé");
    }

    return ticket;
  }

  /**
   * Créer un nouveau ticket de panne/maintenance
   * @param data - Données du ticket (titre, description, priorité, type, localId ou equipementId)
   * @param user - user connecté
   */
  async createTicket(data: CreateTicketMaintenanceInput, user: UserContext) {
    return await prisma.ticketMaintenance.create({
      data: {
        ...data,
        creeParId: user.userId,
        schoolId: user.schoolId,
      },
      include: {
        creePar: {
          select: { nom: true, prenom: true, email: true },
        },
        assigneA: {
          select: { nom: true, prenom: true, email: true },
        },
      },
    });
  }

  /**
   * Mettre à jour un ticket (changement de statut, ajout de commentaires, etc.)
   * @param ticketId - ID du ticket
   * @param data - Nouvelles données
   * @param user - user connecté
   */
  async updateTicket(
    ticketId: string,
    data: UpdateTicketMaintenanceInput,
    user: UserContext,
  ) {
    const ticket = await prisma.ticketMaintenance.findFirst({
      where: { id: ticketId, schoolId: user.schoolId },
    });

    if (!ticket) {
      throw new Error("Ticket non trouvé");
    }

    // Si le statut passe à "RESOLU" ou "FERME" et qu'il n'y a pas de date de résolution
    const updateData: any = { ...data };
    if (
      data.statut &&
      (data.statut === "RESOLU" || data.statut === "FERME") &&
      !ticket.dateResolution
    ) {
      updateData.dateResolution = new Date();
    }

    return await prisma.ticketMaintenance.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        creePar: {
          select: { nom: true, prenom: true, email: true },
        },
        assigneA: {
          select: { nom: true, prenom: true, email: true },
        },
      },
    });
  }

  /**
   * Supprimer un ticket de maintenance
   */
  async deleteTicket(ticketId: string, user: UserContext) {
    const ticket = await prisma.ticketMaintenance.findFirst({
      where: { id: ticketId, schoolId: user.schoolId },
    });

    if (!ticket) {
      throw new Error("Ticket introuvable");
    }

    await prisma.ticketMaintenance.delete({
      where: { id: ticketId },
    });
  }

  /**
   * Créer une intervention
   */
  async createIntervention(data: CreateInterventionInput, user: UserContext) {
    // vérifier que le ticket existe
    const ticket = await prisma.ticketMaintenance.findFirst({
      where: { id: data.ticketId, schoolId: user.schoolId },
    });

    if (!ticket) {
      throw new Error("Ticket introuvable");
    }

    // Convertir les dates string en Date
    const interventionData = {
      ...data,
      dateDebut: new Date(data.dateDebut),
      dateFin: data.dateFin ? new Date(data.dateFin) : undefined,
      schoolId: user.schoolId,
    };

    const intervention = await prisma.interventionMaintenance.create({
      data: interventionData,
      include: {
        technicien: {
          select: { nom: true, prenom: true, email: true },
        },
        ticket: {
          select: { titre: true, type: true },
        },
      },
    });

    // Mettre à jour le statut du ticket si nécessaire
    if (ticket.statut === "OUVERT") {
      await prisma.ticketMaintenance.update({
        where: { id: data.ticketId },
        data: { statut: "EN_COURS" },
      });
    }

    return intervention;
  }

  /**
   * Récupérer toutes les interventions
   */
  async getInterventions(schoolId: string, ticketId?: string) {
    const where: Prisma.InterventionMaintenanceWhereInput = { schoolId };

    if (ticketId) {
      where.ticketId = ticketId;
    }

    return await prisma.interventionMaintenance.findMany({
      where,
      include: {
        technicien: {
          select: { nom: true, prenom: true, email: true },
        },
        ticket: {
          select: { titre: true, type: true, priorite: true },
        },
      },
      orderBy: { dateDebut: "desc" },
    });
  }

  /**
   * Mettre à jour une intervention
   */
  async updateIntervention(
    interventionId: string,
    data: UpdateInterventionInput,
    user: UserContext,
  ) {
    const intervention = await prisma.interventionMaintenance.findFirst({
      where: { id: interventionId, schoolId: user.schoolId },
    });

    if (!intervention) {
      throw new Error("Intervention non trouvé");
    }

    const updateData: any = { ...data };
    if (data.dateDebut) {
      updateData.dateDebut = new Date(data.dateDebut);
    }
    if (data.dateFin) {
      updateData.dateFin = new Date(data.dateFin);
    }

    return await prisma.interventionMaintenance.update({
      where: { id: interventionId },
      data: updateData,
      include: {
        technicien: {
          select: { nom: true, prenom: true, email: true },
        },
        ticket: {
          select: { titre: true, type: true },
        },
      },
    });
  }

  /**
   * Supprimer une intervention
   */
  async deleteIntervention(interventionId: string, user: UserContext) {
    const intervention = await prisma.interventionMaintenance.findFirst({
      where: { id: interventionId, schoolId: user.schoolId },
    });

    if (!intervention) {
      throw new Error("Intervention non trouvé");
    }

    await prisma.interventionMaintenance.delete({
      where: { id: interventionId },
    });
  }

  /**
   * Assigner un ticket à un intervenant
   * @param ticketId - ID du ticket
   * @param intervenantId - ID de l'intervenant
   */
  async assignerTicket(
    ticketId: string,
    intervenantId: string,
    currentUser: UserContext,
  ) {
    const ticket = await prisma.ticketMaintenance.findFirst({
      where: { id: ticketId, schoolId: currentUser.schoolId },
    });

    if (!ticket) {
      throw new Error("Ticket introuvable");
    }

    const technicien = await prisma.user.findFirst({
      where: {
        id: intervenantId,
        schoolId: currentUser.schoolId,
      },
    });

    if (!technicien) {
      throw new Error("Intervenant introuvable pour cette école");
    }

    return await prisma.ticketMaintenance.update({
      where: { id: ticketId },
      data: {
        assigneAId: intervenantId,
        statut: ticket.statut === "OUVERT" ? "EN_COURS" : ticket.statut,
      },
      include: {
        creePar: {
          select: { nom: true, prenom: true, email: true },
        },
        assigneA: {
          select: { nom: true, prenom: true, email: true },
        },
      },
    });
  }

  /**
   * Clôturer un ticket
   * @param ticketId - ID du ticket
   * @param data - Données de clôture
   */
  async cloturerTicket(ticketId: string, data: any, currentUser: UserContext) {
    const ticket = await prisma.ticketMaintenance.findFirst({
      where: { id: ticketId, schoolId: currentUser.schoolId },
    });

    if (!ticket) {
      throw new Error("Ticket introuvable");
    }

    if (ticket.statut !== "RESOLU" && ticket.statut !== "FERME") {
      throw new Error(
        "Le ticket doit d'abord être marqué comme résolu avant d'être clôturé.",
      );
    }

    return await prisma.ticketMaintenance.update({
      where: { id: ticketId },
      data: {
        statut: "FERME",
        dateResolution: ticket.dateResolution ?? new Date(),
        description: data?.description ?? ticket.description,
      },
      include: {
        creePar: {
          select: { nom: true, prenom: true, email: true },
        },
        assigneA: {
          select: { nom: true, prenom: true, email: true },
        },
      },
    });
  }

  /**
   * Récupérer les statistiques de maintenance
   * @param schoolId - ID de l'école
   */
  async getStatistiques(schoolId: string) {
    const [
      totalTickets,
      ticketsOuverts,
      ticketsEnCours,
      ticketsResolus,
      interventionsEnCours,
      interventionsTerminees,
      coutTotal,
    ] = await Promise.all([
      prisma.ticketMaintenance.count({ where: { schoolId } }),
      prisma.ticketMaintenance.count({ where: { schoolId, statut: "OUVERT" } }),
      prisma.ticketMaintenance.count({
        where: { schoolId, statut: "EN_COURS" },
      }),
      prisma.ticketMaintenance.count({ where: { schoolId, statut: "RESOLU" } }),
      prisma.interventionMaintenance.count({
        where: { schoolId, statut: "EN_COURS" },
      }),
      prisma.interventionMaintenance.count({
        where: { schoolId, statut: "TERMINEE" },
      }),
      prisma.interventionMaintenance.aggregate({
        where: { schoolId },
        _sum: { cout: true },
      }),
    ]);

    // Tickets par priorité
    const ticketsParPriorite = await prisma.ticketMaintenance.groupBy({
      by: ["priorite"],
      where: { schoolId },
      _count: { id: true },
    });

    // Tickets par type
    const ticketsParType = await prisma.ticketMaintenance.groupBy({
      by: ["type"],
      where: { schoolId },
      _count: { id: true },
    });

    // Temps moyen de résolution (en jours)
    const ticketsResolusAvecDates = await prisma.ticketMaintenance.findMany({
      where: {
        schoolId,
        statut: "RESOLU",
        dateResolution: { not: null },
      },
      select: {
        dateOuverture: true,
        dateResolution: true,
      },
    });

    let tempsMoyenResolution = 0;
    if (ticketsResolusAvecDates.length > 0) {
      const totalJours = ticketsResolusAvecDates.reduce((acc, ticket) => {
        if (!ticket.dateResolution) return acc;
        const diff =
          new Date(ticket.dateResolution).getTime() -
          new Date(ticket.dateOuverture).getTime();
        return acc + diff / (1000 * 60 * 60 * 24); // Convertir en jours
      }, 0);
      tempsMoyenResolution = totalJours / ticketsResolusAvecDates.length;
    }

    return {
      totalTickets,
      ticketsOuverts,
      ticketsEnCours,
      ticketsResolus,
      interventionsEnCours,
      interventionsTerminees,
      coutTotal: Number(coutTotal._sum.cout ?? 0),
      tempsMoyenResolution: Math.round(tempsMoyenResolution * 10) / 10, // Arrondi à 1 décimale
      ticketsParPriorite: ticketsParPriorite.map((t) => ({
        priorite: t.priorite,
        count: t._count.id,
      })),
      ticketsParType: ticketsParType.map((t) => ({
        type: t.type,
        count: t._count.id,
      })),
    };
  }
}

export const maintenanceService = new MaintenanceService();
