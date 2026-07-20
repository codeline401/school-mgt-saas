import { prisma } from "../../../lib/prisma.js";
import {
  CreateBatimentInput,
  UpdateBatimentInput,
  CreateSalleInput,
  UpdateSalleInput,
} from "./locaux.schema.js";

interface UserContext {
  schoolId: string | null;
  role: string;
}

export class LocauxService {
  // ==========================================
  // GESTION DES BÂTIMENTS
  // ==========================================

  /**
   * Récupérer tous les bâtiments de l'école avec leurs salles
   */
  async getBatiments(schoolId: string) {
    return await prisma.batiment.findMany({
      where: { schoolId },
      include: {
        salles: {
          include: {
            classe: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
          orderBy: [{ etage: "asc" }, { nom: "asc" }],
        },
      },
      orderBy: { nom: "asc" },
    });
  }

  /**
   * Récupérer un bâtiment par son ID
   */
  async getBatimentById(batimentId: string, schoolId: string) {
    const batiment = await prisma.batiment.findFirst({
      where: { id: batimentId, schoolId },
      include: {
        salles: {
          include: {
            classe: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
          orderBy: [{ etage: "asc" }, { nom: "asc" }],
        },
      },
    });

    if (!batiment) {
      throw new Error("Bâtiment introuvable.");
    }

    return batiment;
  }

  /**
   * Créer un nouveau bâtiment
   */
  async createBatiment(data: CreateBatimentInput, schoolId: string) {
    return await prisma.batiment.create({
      data: {
        ...data,
        schoolId,
      },
      include: {
        salles: {
          include: {
            classe: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Mettre à jour un bâtiment
   */
  async updateBatiment(
    batimentId: string,
    data: UpdateBatimentInput,
    schoolId: string,
  ) {
    // Vérifier que le bâtiment existe et appartient à l'école
    const batiment = await this.getBatimentById(batimentId, schoolId);

    if (data.nbEtages !== undefined) {
      const salleHorsBornes = batiment.salles.some(
        (s) => s.etage > data.nbEtages! - 1,
      );
      if (salleHorsBornes) {
        throw new Error(
          `Impossible de réduire le nombre d'étages : des salles existent à des étages supérieurs à ${data.nbEtages - 1}.`,
        );
      }
    }

    return await prisma.batiment.update({
      where: { id: batimentId },
      data,
      include: {
        salles: {
          include: {
            classe: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Supprimer un bâtiment (et toutes ses salles en cascade)
   */
  async deleteBatiment(batimentId: string, schoolId: string) {
    // Vérifier que le bâtiment existe et appartient à l'école
    await this.getBatimentById(batimentId, schoolId);

    await prisma.batiment.delete({
      where: { id: batimentId },
    });

    return { message: "Bâtiment supprimé avec succès." };
  }

  // ==========================================
  // GESTION DES SALLES
  // ==========================================

  /**
   * Récupérer toutes les salles de l'école
   */
  async getSalles(
    schoolId: string,
    filters?: { batimentId?: string; type?: string; statut?: string },
  ) {
    const where: any = { schoolId };

    if (filters?.batimentId) {
      where.batimentId = filters.batimentId;
    }
    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.statut) {
      where.statut = filters.statut;
    }

    return await prisma.salle.findMany({
      where,
      include: {
        batiment: {
          select: {
            id: true,
            nom: true,
            code: true,
          },
        },
        classe: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
      orderBy: [{ batiment: { nom: "asc" } }, { etage: "asc" }, { nom: "asc" }],
    });
  }

  /**
   * Récupérer une salle par son ID
   */
  async getSalleById(salleId: string, schoolId: string) {
    const salle = await prisma.salle.findUnique({
      where: { id: salleId },
      include: {
        batiment: true,
        classe: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
    });

    if (!salle) {
      throw new Error("Salle introuvable.");
    }

    // Vérification de sécurité : la salle appartient bien à l'école
    if (salle.schoolId !== schoolId) {
      throw new Error("Accès non autorisé à cette salle.");
    }

    return salle;
  }

  /**
   * Créer une nouvelle salle
   */
  async createSalle(data: CreateSalleInput, schoolId: string) {
    // Vérifier que le bâtiment existe et appartient à l'école
    const batiment = await prisma.batiment.findUnique({
      where: { id: data.batimentId },
    });

    if (!batiment) {
      throw new Error("Bâtiment introuvable.");
    }

    if (batiment.schoolId !== schoolId) {
      throw new Error("Le bâtiment spécifié n'appartient pas à votre école.");
    }

    // Vérifier que l'étage ne dépasse pas le nombre d'étages du bâtiment
    if (data.etage > batiment.nbEtages - 1) {
      throw new Error(
        `L'étage ${data.etage} n'existe pas dans le bâtiment "${batiment.nom}" (${batiment.nbEtages} étage(s) disponible(s), numérotés de 0 à ${batiment.nbEtages - 1}).`,
      );
    }

    // vérifier que la classe existe et appartient à l'école si classeId est fourni
    if (data.classeId) {
      const classe = await prisma.classe.findUnique({
        where: { id: data.classeId },
      });

      if (!classe) {
        throw new Error("Classe introuvable.");
      }

      if (classe.schoolId !== schoolId) {
        throw new Error("La classe spécifiée n'appartient pas à votre école.");
      }
    }

    return await prisma.salle.create({
      data: {
        ...data,
        schoolId,
        equipements: data.equipements ? data.equipements : {},
      },
      include: {
        batiment: true,
        classe: true,
      },
    });
  }

  /**
   * Mettre à jour une salle
   */
  async updateSalle(salleId: string, data: UpdateSalleInput, schoolId: string) {
    // Vérifier que la salle existe et appartient à l'école
    const salle = await this.getSalleById(salleId, schoolId);

    // Si on change de bâtiment, vérifier qu'il appartient à l'école
    if (data.batimentId && data.batimentId !== salle.batimentId) {
      const batiment = await prisma.batiment.findUnique({
        where: { id: data.batimentId },
      });

      if (!batiment) {
        throw new Error("Bâtiment introuvable.");
      }

      if (batiment.schoolId !== schoolId) {
        throw new Error("Le bâtiment spécifié n'appartient pas à votre école.");
      }
    }

    // Vérifier que l'étage ne dépasse pas le nombre d'étages du bâtiment
    if (data.etage !== undefined) {
      const batimentId = data.batimentId || salle.batimentId;
      const batiment = await prisma.batiment.findUnique({
        where: { id: batimentId },
      });

      if (batiment && data.etage > batiment.nbEtages - 1) {
        throw new Error(
          `L'étage ${data.etage} n'existe pas dans le bâtiment "${batiment.nom}" (${batiment.nbEtages} étage(s) disponible(s), numérotés de 0 à ${batiment.nbEtages - 1}).`,
        );
      }
    }

    // Si on change de classe, vérifier qu'elle existe et appartient à l'école
    // (data.classeId === null signifie qu'on veut désassocier la salle)
    if (
      data.classeId !== undefined &&
      data.classeId !== null &&
      data.classeId !== salle.classeId
    ) {
      const classe = await prisma.classe.findUnique({
        where: { id: data.classeId },
      });

      if (!classe) {
        throw new Error("Classe introuvable.");
      }

      if (classe.schoolId !== schoolId) {
        throw new Error("La classe spécifiée n'appartient pas à votre école.");
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = { ...data };

    // Si batimentId est fourni, il faut utiliser la syntaxe de connexion
    if (data.batimentId) {
      updateData.batiment = {
        connect: { id: data.batimentId },
      };
      delete updateData.batimentId;
    }

    // gestion de classeId : connect si une valuer est fournie, disconnect si null.
    if (data.classeId !== undefined) {
      updateData.classe = data.classeId
        ? { connect: { id: data.classeId } }
        : { disconnect: true };
      delete updateData.classeId;
    }

    return await prisma.salle.update({
      where: { id: salleId },
      data: updateData,
      include: {
        batiment: true,
        classe: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
    });
  }

  /**
   * Supprimer une salle
   */
  async deleteSalle(salleId: string, schoolId: string) {
    // Vérifier que la salle existe et appartient à l'école
    await this.getSalleById(salleId, schoolId);

    await prisma.salle.delete({
      where: { id: salleId },
    });

    return { message: "Salle supprimée avec succès." };
  }

  // ==========================================
  // STATISTIQUES ET RAPPORTS
  // ==========================================

  /**
   * Obtenir des statistiques sur les locaux de l'école
   */
  async getStatistiques(schoolId: string) {
    const [batiments, salles, sallesParType, sallesParStatut] =
      await Promise.all([
        prisma.batiment.count({ where: { schoolId } }),
        prisma.salle.count({ where: { schoolId } }),
        prisma.salle.groupBy({
          by: ["type"],
          where: { schoolId },
          _count: true,
        }),
        prisma.salle.groupBy({
          by: ["statut"],
          where: { schoolId },
          _count: true,
        }),
      ]);

    const capaciteTotale = await prisma.salle.aggregate({
      where: { schoolId },
      _sum: { capacite: true },
    });

    return {
      nombreBatiments: batiments,
      nombreSalles: salles,
      capaciteTotale: capaciteTotale._sum.capacite || 0,
      sallesParType: sallesParType.map((s) => ({
        type: s.type,
        nombre: s._count,
      })),
      sallesParStatut: sallesParStatut.map((s) => ({
        statut: s.statut,
        nombre: s._count,
      })),
    };
  }
}
