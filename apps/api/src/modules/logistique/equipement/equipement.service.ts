import { prisma } from "../../../lib/prisma.js";
import {
  CreateEquipementInput,
  CreatePretInput,
  EquipementFilters,
  RetourEquipementInput,
  UpdateEquipementInput,
} from "./equipement.schema.js";

interface UserContext {
  schoolId: string;
  userId: string;
  role: string;
}

export class EquipementService {
  /**
   * Récupérer tous les équipements de l'école
   * @param schoolId - ID de l'école
   * @param filters -
   * @returns Liste des équipements
   */
  async getEquipements(schoolId: string, filters?: EquipementFilters) {
    const where: any = { schoolId };

    if (filters?.categorie) {
      where.categorie = filters.categorie;
    }

    if (filters?.etat) {
      where.etat = filters.etat;
    }

    if (filters?.search) {
      where.OR = [
        { nom: { contains: filters.search, mode: "insensitive" } },
        { reference: { contains: filters.search, mode: "insensitive" } },
        { numeroSerie: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const equipements = await prisma.equipement.findMany({
      where,
      include: {
        prets: {
          where: {
            statut: "EN_COURS",
          },
          take: 1,
          orderBy: {
            datePret: "desc",
          },
        },
      },
      orderBy: {
        nom: "asc",
      },
    });

    // Calculer la dispo
    return equipements.map((equ) => ({
      ...equ,
      disponible: equ.prets.length === 0,
      pretEnCours: equ.prets[0] || null,
    }));
  }

  /**
   * Récupère un équipement par ID
   */
  async getEquipementsById(equipementId: string, schoolId: string) {
    const equipement = await prisma.equipement.findFirst({
      where: { id: equipementId, schoolId },
      include: {
        prets: {
          include: {
            pretPar: {
              select: { nom: true, prenom: true },
            },
            retourPar: {
              select: { nom: true, prenom: true },
            },
          },
          orderBy: { datePret: "desc" },
        },
      },
    });

    if (!equipement) {
      throw new Error("Equipement non trouvé");
    }

    return equipement;
  }

  /**
   * Créer un nouvel équipement
   * @param data - Données de l'équipement (nom, catégorie, numéro de série, état, valeur)
   */
  async createEquipement(data: CreateEquipementInput, user: UserContext) {
    if (data.numeroSerie) {
      const existing = await prisma.equipement.findFirst({
        where: {
          numeroSerie: data.numeroSerie,
          schoolId: user.schoolId,
        },
      });

      if (existing) {
        throw new Error("Un équipement avec ce numéro de série existe déjà");
      }
    }

    return await prisma.equipement.create({
      data: {
        ...data,
        schoolId: user.schoolId,
      },
    });
  }

  /**
   * Mettre à jour un équipement (état, localisation, etc.)
   * @param equipementId - ID de l'équipement
   * @param data - Nouvelles données
   * @param user - user connecté
   */
  async updateEquipement(
    equipementId: string,
    data: UpdateEquipementInput,
    user: UserContext,
  ) {
    const equipement = await prisma.equipement.findFirst({
      where: {
        id: equipementId,
        schoolId: user.schoolId,
      },
    });

    if (!equipement) {
      throw new Error("Equipement non trouvé");
    }

    return await prisma.equipement.update({
      where: { id: equipementId },
      data,
    });
  }

  /**
   * Supprimer un équipement de l'inventaire
   * @param equipementId - ID de l'équipement
   * @param user - user connecté
   */
  async deleteEquipement(equipementId: string, user: UserContext) {
    const equipement = await prisma.equipement.findFirst({
      where: { id: equipementId, schoolId: user.schoolId },
      include: {
        prets: {
          where: { statut: "EN_COURS" },
        },
      },
    });

    if (!equipement) {
      throw new Error("Equipement non trouvé");
    }

    if (equipement.prets.length > 0) {
      throw new Error(
        "Impossible de supprimer un équipement actuellement prêté",
      );
    }

    await prisma.equipement.delete({
      where: { id: equipementId },
    });
  }

  /**
   * Créer un nouveau prêt d'équipement
   * @param data - Données du prêt (equipementId, emprunteur, dateDebut, dateFinPrevue)
   * @param user - user connecté
   */
  async createPret(data: CreatePretInput, user: UserContext) {
    // Vérifier que l'équipement existe et est disponible
    const equipement = await prisma.equipement.findFirst({
      where: {
        id: data.equipementId,
        schoolId: user.schoolId,
      },
      include: {
        prets: {
          where: { statut: "EN_COURS" },
        },
      },
    });

    if (!equipement) {
      throw new Error("Equipement non trouvé");
    }

    if (equipement.prets.length > 0) {
      throw new Error("Cet équipement est déjà prêté");
    }

    if (equipement.etat === "HORS_SERVICE") {
      throw new Error("Cet équipement est hors service");
    }

    return await prisma.pretEquipement.create({
      data: {
        ...data,
        emprunteurType: data.emprunteurType,
        emprunteurNom: data.emprunteurNom,
        pretParId: user.userId,
        schoolId: user.schoolId,
        statut: "EN_COURS",
      },
      include: {
        equipement: true,
        pretPar: {
          select: {
            nom: true,
            prenom: true,
          },
        },
      },
    });
  }

  /**
   * Retourner un équipement prêté
   * @param pretId - ID du prêt
   * @param data - Données du retour (dateRetour, état de l'équipement)
   * @param user - user connecté
   */
  async retournerPret(
    pretId: string,
    data: RetourEquipementInput,
    user: UserContext,
  ) {
    const pret = await prisma.pretEquipement.findFirst({
      where: {
        id: pretId,
        schoolId: user.schoolId,
        statut: "EN_COURS",
      },
    });

    if (!pret) {
      throw new Error("Prêt non trouvé ou déjà retourné");
    }

    // Mettre à jour le prêt
    const pretRetourne = await prisma.pretEquipement.update({
      where: { id: pretId },
      data: {
        ...data,
        statut: "RETOURNE",
        retourParId: user.userId,
      },
      include: {
        equipement: true,
      },
    });

    // Mettre à jour l'état de l'équipement si nécessaire
    if (data.etatRetour && data.etatRetour !== pretRetourne.equipement.etat) {
      await prisma.equipement.update({
        where: { id: pret.equipementId },
        data: { etat: data.etatRetour },
      });
    }

    return pretRetourne;
  }

  /**
   * Récupère les statistiques
   */
  async getStatistiques(schoolId: string) {
    const [
      totalEquipement,
      pretsEnCours,
      equipementsDisponibles,
      equipementHS,
    ] = await Promise.all([
      prisma.equipement.count({ where: { schoolId } }),
      prisma.pretEquipement.count({
        where: { schoolId, statut: "EN_COURS" },
      }),
      prisma.equipement.count({
        where: {
          schoolId,
          NOT: {
            prets: {
              some: { statut: "EN_COURS" },
            },
          },
          etat: { not: "HORS_SERVICE" },
        },
      }),
      prisma.equipement.count({
        where: { schoolId, etat: "HORS_SERVICE" },
      }),
    ]);

    return {
      totalEquipement,
      pretsEnCours,
      equipementsDisponibles,
      equipementHS,
    };
  }

  /**
   * Récupérer les prêts en cours ou l'historique des prêts
   * @param schoolId - ID de l'école
   * @param statut - Statut du prêt (optionnel)
   */
  async getPrets(schoolId: string, statut?: string) {
    const where: any = { schoolId };

    if (statut === "EN_RETARD") {
      where.statut = "EN_COURS";
      where.dateRetourPrevue = {
        lt: new Date(),
      };
    } else if (statut) {
      where.statut = statut;
    }

    return await prisma.pretEquipement.findMany({
      where,
      include: {
        equipement: {
          select: {
            nom: true,
            reference: true,
            categorie: true,
            etat: true,
          },
        },
        pretPar: {
          select: {
            nom: true,
            prenom: true,
          },
        },
        retourPar: {
          select: {
            nom: true,
            prenom: true,
          },
        },
      },
      orderBy: {
        datePret: "desc",
      },
    });
  }

  /**
   * Récupérer les équipements en retard de retour
   * @param schoolId - ID de l'école
   */
  async getEquipementsEnRetard(schoolId: string) {
    return await prisma.pretEquipement.findMany({
      where: {
        schoolId,
        statut: "EN_COURS",
        dateRetourPrevue: {
          lt: new Date(),
        },
      },
      include: {
        equipement: {
          select: {
            nom: true,
            reference: true,
            categorie: true,
          },
        },
        pretPar: {
          select: {
            nom: true,
            prenom: true,
          },
        },
      },
      orderBy: {
        dateRetourPrevue: "asc",
      },
    });
  }
}

export const equipementService = new EquipementService();
