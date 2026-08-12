import { prisma } from "../../../lib/prisma.js";
import {
  CreateSortieInput,
  UpdateSortieInput,
  CreateParticipantInput,
  UpdateParticipantInput,
  CreateAutorisationInput,
  UpdateAutorisationInput,
} from "./sortie.schema.js";

interface UserContext {
  schoolId: string | null;
  role: string;
  userId: string;
}

export class SortieService {
  // ========================================
  // GESTION DES SORTIES SCOLAIRES
  // ========================================

  /**
   * Récupérer toutes les sorties avec filtres
   */
  async getSorties(
    schoolId: string,
    filters?: {
      statut?: string;
      type?: string;
      classeId?: string;
      dateDebut?: string;
      dateFin?: string;
    },
  ) {
    const where: any = { schoolId };

    if (filters?.statut) where.statut = filters.statut;
    if (filters?.type) where.type = filters.type;
    if (filters?.classeId) where.classeId = filters.classeId;

    // Filtrer par dates
    if (filters?.dateDebut || filters?.dateFin) {
      where.AND = [];
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

    return await prisma.sortieScolaire.findMany({
      where,
      include: {
        classe: {
          select: {
            id: true,
            nom: true,
          },
        },
        organisateur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        _count: {
          select: {
            participants: true,
            autorisations: true,
          },
        },
      },
      orderBy: { dateDebut: "desc" },
    });
  }

  /**
   * Récupérer une sortie par ID
   */
  async getSortieById(sortieId: string, schoolId: string) {
    const sortie = await prisma.sortieScolaire.findFirst({
      where: { id: sortieId, schoolId },
      include: {
        classe: {
          select: {
            id: true,
            nom: true,
          },
        },
        organisateur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
          },
        },
        participants: {
          include: {
            eleve: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                classe: {
                  select: {
                    nom: true,
                  },
                },
              },
            },
            accompagnateur: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
                telephone: true,
              },
            },
          },
        },
        autorisations: {
          include: {
            eleve: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
            parent: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                telephone: true,
              },
            },
          },
        },
      },
    });

    if (!sortie) {
      throw new Error("Sortie scolaire introuvable.");
    }

    return sortie;
  }

  /**
   * Créer une nouvelle sortie scolaire
   */
  async createSortie(data: CreateSortieInput, user: UserContext) {
    if (!user.schoolId) {
      throw new Error("École non spécifiée.");
    }

    // Vérifier que la classe existe (si spécifiée)
    if (data.classeId) {
      const classe = await prisma.classe.findFirst({
        where: { id: data.classeId, schoolId: user.schoolId },
      });

      if (!classe) {
        throw new Error("Classe introuvable.");
      }
    }

    // Vérifier la cohérence des dates
    const dateDebut = new Date(data.dateDebut);
    const dateFin = new Date(data.dateFin);

    if (dateFin < dateDebut) {
      throw new Error("La date de fin doit être après la date de début.");
    }

    return await prisma.sortieScolaire.create({
      data: {
        ...data,
        dateDebut,
        dateFin,
        dateLimiteInscription: data.dateLimiteInscription
          ? new Date(data.dateLimiteInscription)
          : undefined,
        dateLimiteAutorisation: data.dateLimiteAutorisation
          ? new Date(data.dateLimiteAutorisation)
          : undefined,
        organisateurId: user.userId,
        schoolId: user.schoolId,
      },
      include: {
        classe: {
          select: {
            id: true,
            nom: true,
          },
        },
        organisateur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });
  }

  /**
   * Mettre à jour une sortie scolaire
   */
  async updateSortie(
    sortieId: string,
    data: UpdateSortieInput,
    user: UserContext,
  ) {
    if (!user.schoolId) {
      throw new Error("École non spécifiée.");
    }

    const sortie = await prisma.sortieScolaire.findFirst({
      where: { id: sortieId, schoolId: user.schoolId },
    });

    if (!sortie) {
      throw new Error("Sortie scolaire introuvable.");
    }

    // Vérifier les permissions (organisateur ou admin)
    const canUpdate =
      sortie.organisateurId === user.userId ||
      user.role === "ADMIN" ||
      user.role === "SUDO_ADMIN";

    if (!canUpdate) {
      throw new Error("Vous n'êtes pas autorisé à modifier cette sortie.");
    }

    // Vérifier la classe si modifiée
    if (data.classeId) {
      const classe = await prisma.classe.findFirst({
        where: { id: data.classeId, schoolId: user.schoolId },
      });

      if (!classe) {
        throw new Error("Classe introuvable.");
      }
    }

    // Vérifier la cohérence des dates
    if (data.dateDebut && data.dateFin) {
      const dateDebut = new Date(data.dateDebut);
      const dateFin = new Date(data.dateFin);

      if (dateFin < dateDebut) {
        throw new Error("La date de fin doit être après la date de début.");
      }
    }

    return await prisma.sortieScolaire.update({
      where: { id: sortieId },
      data: {
        ...data,
        dateDebut: data.dateDebut ? new Date(data.dateDebut) : undefined,
        dateFin: data.dateFin ? new Date(data.dateFin) : undefined,
        dateLimiteInscription: data.dateLimiteInscription
          ? new Date(data.dateLimiteInscription)
          : undefined,
        dateLimiteAutorisation: data.dateLimiteAutorisation
          ? new Date(data.dateLimiteAutorisation)
          : undefined,
      },
      include: {
        classe: {
          select: {
            id: true,
            nom: true,
          },
        },
        organisateur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });
  }

  /**
   * Supprimer une sortie scolaire
   */
  async deleteSortie(sortieId: string, user: UserContext) {
    if (!user.schoolId) {
      throw new Error("École non spécifiée.");
    }

    const sortie = await prisma.sortieScolaire.findFirst({
      where: { id: sortieId, schoolId: user.schoolId },
      include: {
        participants: true,
      },
    });

    if (!sortie) {
      throw new Error("Sortie scolaire introuvable.");
    }

    // Vérifier les permissions
    const canDelete =
      sortie.organisateurId === user.userId ||
      user.role === "ADMIN" ||
      user.role === "SUDO_ADMIN";

    if (!canDelete) {
      throw new Error("Vous n'êtes pas autorisé à supprimer cette sortie.");
    }

    // Empêcher la suppression si la sortie a déjà commencé ou est terminée
    if (sortie.statut === "EN_COURS" || sortie.statut === "TERMINEE") {
      throw new Error(
        "Impossible de supprimer une sortie en cours ou terminée.",
      );
    }

    await prisma.sortieScolaire.delete({ where: { id: sortieId } });

    return { message: "Sortie scolaire supprimée avec succès." };
  }

  // ========================================
  // GESTION DES PARTICIPANTS
  // ========================================

  /**
   * Récupérer les participants d'une sortie
   */
  async getParticipants(sortieId: string, schoolId: string) {
    // Vérifier que la sortie existe
    const sortie = await prisma.sortieScolaire.findFirst({
      where: { id: sortieId, schoolId },
    });

    if (!sortie) {
      throw new Error("Sortie scolaire introuvable.");
    }

    return await prisma.participantSortie.findMany({
      where: { sortieId, schoolId },
      include: {
        eleve: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            classe: {
              select: {
                nom: true,
              },
            },
          },
        },
        accompagnateur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Ajouter un participant à une sortie
   */
  async createParticipant(data: CreateParticipantInput, user: UserContext) {
    if (!user.schoolId) {
      throw new Error("École non spécifiée.");
    }

    // Vérifier que la sortie existe
    const sortie = await prisma.sortieScolaire.findFirst({
      where: { id: data.sortieId, schoolId: user.schoolId },
    });

    if (!sortie) {
      throw new Error("Sortie scolaire introuvable.");
    }

    // Vérifier que la sortie n'est pas annulée ou terminée
    if (sortie.statut === "ANNULEE" || sortie.statut === "TERMINEE") {
      throw new Error("Impossible d'ajouter un participant à cette sortie.");
    }

    // Vérifier la date limite d'inscription
    if (
      sortie.dateLimiteInscription &&
      new Date() > sortie.dateLimiteInscription
    ) {
      throw new Error("La date limite d'inscription est dépassée.");
    }

    // Validation selon le type de participant
    if (data.typeParticipant === "ELEVE") {
      if (!data.eleveId) {
        throw new Error("L'ID de l'élève est requis.");
      }

      // Vérifier que l'élève existe
      const eleve = await prisma.eleve.findFirst({
        where: { id: data.eleveId, schoolId: user.schoolId },
      });

      if (!eleve) {
        throw new Error("Élève introuvable.");
      }

      // Vérifier que l'élève n'est pas déjà inscrit
      const existing = await prisma.participantSortie.findFirst({
        where: {
          sortieId: data.sortieId,
          eleveId: data.eleveId,
        },
      });

      if (existing) {
        throw new Error("Cet élève est déjà inscrit à cette sortie.");
      }

      // Si la sortie est pour une classe spécifique, vérifier que l'élève en fait partie
      if (sortie.classeId && eleve.classeId !== sortie.classeId) {
        throw new Error(
          "Cet élève n'appartient pas à la classe concernée par cette sortie.",
        );
      }
    } else if (data.typeParticipant === "ACCOMPAGNATEUR") {
      if (!data.accompagnateurId) {
        throw new Error("L'ID de l'accompagnateur est requis.");
      }

      // Vérifier que l'accompagnateur existe
      const accompagnateur = await prisma.user.findFirst({
        where: { id: data.accompagnateurId, schoolId: user.schoolId },
      });

      if (!accompagnateur) {
        throw new Error("Accompagnateur introuvable.");
      }

      // Vérifier que l'accompagnateur n'est pas déjà inscrit
      const existing = await prisma.participantSortie.findFirst({
        where: {
          sortieId: data.sortieId,
          accompagnateurId: data.accompagnateurId,
        },
      });

      if (existing) {
        throw new Error("Cet accompagnateur est déjà inscrit à cette sortie.");
      }
    }

    return await prisma.participantSortie.create({
      data: {
        ...data,
        schoolId: user.schoolId,
      },
      include: {
        eleve: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
        accompagnateur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });
  }

  /**
   * Mettre à jour un participant
   */
  async updateParticipant(
    participantId: string,
    data: UpdateParticipantInput,
    user: UserContext,
  ) {
    if (!user.schoolId) {
      throw new Error("École non spécifiée.");
    }

    const participant = await prisma.participantSortie.findFirst({
      where: { id: participantId, schoolId: user.schoolId },
    });

    if (!participant) {
      throw new Error("Participant introuvable.");
    }

    return await prisma.participantSortie.update({
      where: { id: participantId },
      data: {
        ...data,
        datePaiement: data.datePaiement
          ? new Date(data.datePaiement)
          : undefined,
      },
      include: {
        eleve: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
        accompagnateur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });
  }

  /**
   * Supprimer un participant
   */
  async deleteParticipant(participantId: string, user: UserContext) {
    if (!user.schoolId) {
      throw new Error("École non spécifiée.");
    }

    const participant = await prisma.participantSortie.findFirst({
      where: { id: participantId, schoolId: user.schoolId },
      include: {
        sortie: true,
      },
    });

    if (!participant) {
      throw new Error("Participant introuvable.");
    }

    // Empêcher la suppression si la sortie est en cours ou terminée
    if (
      participant.sortie.statut === "EN_COURS" ||
      participant.sortie.statut === "TERMINEE"
    ) {
      throw new Error(
        "Impossible de supprimer un participant d'une sortie en cours ou terminée.",
      );
    }

    await prisma.participantSortie.delete({ where: { id: participantId } });

    return { message: "Participant supprimé avec succès." };
  }

  // ========================================
  // GESTION DES AUTORISATIONS PARENTALES
  // ========================================

  /**
   * Récupérer les autorisations d'une sortie
   */
  async getAutorisations(sortieId: string, schoolId: string) {
    // Vérifier que la sortie existe
    const sortie = await prisma.sortieScolaire.findFirst({
      where: { id: sortieId, schoolId },
    });

    if (!sortie) {
      throw new Error("Sortie scolaire introuvable.");
    }

    return await prisma.autorisationParent.findMany({
      where: { sortieId, schoolId },
      include: {
        eleve: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            classe: {
              select: {
                nom: true,
              },
            },
          },
        },
        parent: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            telephone: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Créer une autorisation parentale
   */
  async createAutorisation(data: CreateAutorisationInput, user: UserContext) {
    if (!user.schoolId) {
      throw new Error("École non spécifiée.");
    }

    // Vérifier que la sortie existe
    const sortie = await prisma.sortieScolaire.findFirst({
      where: { id: data.sortieId, schoolId: user.schoolId },
    });

    if (!sortie) {
      throw new Error("Sortie scolaire introuvable.");
    }

    // Vérifier la date limite d'autorisation
    if (
      sortie.dateLimiteAutorisationParents &&
      new Date() > sortie.dateLimiteAutorisationParents
    ) {
      throw new Error("La date limite d'autorisation est dépassée.");
    }

    // Vérifier que l'élève existe
    const eleve = await prisma.eleve.findFirst({
      where: { id: data.eleveId, schoolId: user.schoolId },
    });

    if (!eleve) {
      throw new Error("Élève introuvable.");
    }

    // Vérifier que le parent existe
    const parent = await prisma.parent.findFirst({
      where: { id: data.parentId, schoolId: user.schoolId },
    });

    if (!parent) {
      throw new Error("Parent introuvable.");
    }

    // Vérifier qu'il n'existe pas déjà une autorisation
    const existing = await prisma.autorisationParent.findFirst({
      where: {
        sortieId: data.sortieId,
        eleveId: data.eleveId,
        parentId: data.parentId,
      },
    });

    if (existing) {
      throw new Error("Une autorisation existe déjà pour cet élève.");
    }

    return await prisma.autorisationParent.create({
      data: {
        ...data,
        schoolId: user.schoolId,
      },
      include: {
        eleve: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
        parent: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });
  }

  /**
   * Mettre à jour une autorisation parentale
   */
  async updateAutorisation(
    autorisationId: string,
    data: UpdateAutorisationInput,
    user: UserContext,
  ) {
    if (!user.schoolId) {
      throw new Error("École non spécifiée.");
    }

    const autorisation = await prisma.autorisationParent.findFirst({
      where: { id: autorisationId, schoolId: user.schoolId },
      include: {
        sortie: true,
      },
    });

    if (!autorisation) {
      throw new Error("Autorisation introuvable.");
    }

    // Empêcher la modification si la sortie a déjà commencé
    if (
      autorisation.sortie.statut === "EN_COURS" ||
      autorisation.sortie.statut === "TERMINEE"
    ) {
      throw new Error(
        "Impossible de modifier l'autorisation pour une sortie en cours ou terminée.",
      );
    }

    return await prisma.autorisationParent.update({
      where: { id: autorisationId },
      data,
      include: {
        eleve: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
        parent: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });
  }

  /**
   * Supprimer une autorisation parentale
   */
  async deleteAutorisation(autorisationId: string, user: UserContext) {
    if (!user.schoolId) {
      throw new Error("École non spécifiée.");
    }

    const autorisation = await prisma.autorisationParent.findFirst({
      where: { id: autorisationId, schoolId: user.schoolId },
      include: {
        sortie: true,
      },
    });

    if (!autorisation) {
      throw new Error("Autorisation introuvable.");
    }

    // Empêcher la suppression si la sortie a déjà commencé
    if (
      autorisation.sortie.statut === "EN_COURS" ||
      autorisation.sortie.statut === "TERMINEE"
    ) {
      throw new Error(
        "Impossible de supprimer l'autorisation pour une sortie en cours ou terminée.",
      );
    }

    await prisma.autorisationParent.delete({ where: { id: autorisationId } });

    return { message: "Autorisation supprimée avec succès." };
  }

  /**
   * Obtenir les statistiques d'une sortie
   */
  async getStatistiquesSortie(sortieId: string, schoolId: string) {
    const sortie = await prisma.sortieScolaire.findFirst({
      where: { id: sortieId, schoolId },
      include: {
        participants: {
          include: {
            eleve: true,
          },
        },
        autorisations: true,
      },
    });

    if (!sortie) {
      throw new Error("Sortie scolaire introuvable.");
    }

    const eleves = sortie.participants.filter(
      (p) => p.typeParticipant === "ELEVE",
    );
    const accompagnateurs = sortie.participants.filter(
      (p) => p.typeParticipant === "ACCOMPAGNATEUR",
    );

    const autorisationsAccordees = sortie.autorisations.filter(
      (a) => a.autorise,
    ).length;
    const autorisationsRefusees = sortie.autorisations.filter(
      (a) => !a.autorise,
    ).length;
    const autorisationsEnAttente = eleves.length - sortie.autorisations.length;

    const montantTotal = eleves.reduce(
      (sum, p) => sum + (Number(p.montantPaye) || 0),
      0,
    );
    const montantAttendu = eleves.length * (Number(sortie.coutParEleve) || 0);

    return {
      totalParticipants: sortie.participants.length,
      totalEleves: eleves.length,
      totalAccompagnateurs: accompagnateurs.length,
      autorisations: {
        accordees: autorisationsAccordees,
        refusees: autorisationsRefusees,
        enAttente: autorisationsEnAttente,
      },
      paiements: {
        montantTotal,
        montantAttendu,
        montantRestant: montantAttendu - montantTotal,
      },
      participantsParStatut: {
        inscrits: sortie.participants.filter((p) => p.statut === "INSCRIT")
          .length,
        confirmes: sortie.participants.filter((p) => p.statut === "CONFIRME")
          .length,
        annules: sortie.participants.filter((p) => p.statut === "ANNULE")
          .length,
        presents: sortie.participants.filter((p) => p.statut === "PRESENT")
          .length,
        absents: sortie.participants.filter((p) => p.statut === "ABSENT")
          .length,
      },
    };
  }
}
