import { prisma } from "../../../lib/prisma.js";
import {
  CreateAffectationInput,
  CreateChauffeurInput,
  CreateRouteInput,
  CreateVehiculeInput,
  UpdateAffectationInput,
  UpdateChauffeurInput,
  UpdateRouteInput,
  UpdateVehiculeInput,
} from "./transport.schema.js";

interface UserContext {
  schoolId: string; // ID de l'école à laquelle l'utilisateur appartient
  role: string; // Rôle de l'utilisateur (ex: "ADMIN", "PROF", "PARENT", "ELEVE")
  userId: string; // ID de l'utilisateur connecté
}

export class TransportService {
  // ---------------------------------------
  // GESTION DES VEHICULES
  // ---------------------------------------

  /**
   * Récupérer tous les véhicules avec filtres
   */
  async getVehicules(
    schoolId: string,
    filters?: { statut?: string; typeVehicule?: string },
  ) {
    const where: any = { schoolId };

    if (filters?.statut) {
      where.statut = filters.statut;
    }
    if (filters?.typeVehicule) {
      where.typeVehicule = filters.typeVehicule;
    }

    return await prisma.vehicule.findMany({
      where,
      include: {
        routes: {
          select: {
            id: true,
            nom: true,
            statut: true,
          },
        },
        _count: {
          select: {
            routes: true,
          },
        },
      },
      orderBy: {
        nom: "asc",
      },
    });
  }

  /**
   * Récupérer un véhicule par ID
   */
  async getVehiculeById(vehiculeId: string, schoolId: string) {
    const vehicule = await prisma.vehicule.findFirst({
      where: { id: vehiculeId, schoolId },
      include: {
        routes: {
          include: {
            chauffeur: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
          },
        },
      },
    });

    if (!vehicule) {
      throw new Error(
        "Véhicule non trouvé ou vous n'avez pas la permission d'y accéder.",
      );
    }

    return vehicule;
  }

  /**
   * Créer un nouveau véhicule
   */
  async createVehicule(data: CreateVehiculeInput, user: UserContext) {
    if (!user.schoolId) {
      throw new Error("L'utilisateur n'est pas associé à une école.");
    }

    // Vérifier unicité de la plaque
    const existing = await prisma.vehicule.findFirst({
      where: { immatriculation: data.immatriculation, schoolId: user.schoolId },
    });
    if (existing) {
      throw new Error(
        "Un véhicule avec ce numéro de plaque existe déjà dans votre école.",
      );
    }

    return await prisma.vehicule.create({
      data: {
        ...data,
        derniereRevision: data.derniereRevision
          ? new Date(data.derniereRevision)
          : null,
        prochaineRevision: data.prochaineRevision
          ? new Date(data.prochaineRevision)
          : null,
        dateExpirationAssurance: data.dateExpirationAssurance
          ? new Date(data.dateExpirationAssurance)
          : null,
        schoolId: user.schoolId,
      },
    });
  }

  /**
   * Mettre à jour un véhicule existant
   */
  async updateVehicule(
    vehiculeId: string,
    data: UpdateVehiculeInput,
    user: UserContext,
  ) {
    if (!user.schoolId) {
      throw new Error("L'utilisateur n'est pas associé à une école.");
    }

    const vehicule = await prisma.vehicule.findFirst({
      where: { id: vehiculeId, schoolId: user.schoolId },
    });
    if (!vehicule) {
      throw new Error(
        "Véhicule non trouvé ou vous n'avez pas la permission de le modifier.",
      );
    }

    // Vérifier unicité de la plaque si modifiée
    if (
      data.immatriculation &&
      data.immatriculation !== vehicule.immatriculation
    ) {
      const existing = await prisma.vehicule.findFirst({
        where: {
          immatriculation: data.immatriculation,
          schoolId: user.schoolId,
        },
      });

      if (existing) {
        throw new Error(
          "Un véhicule avec ce numéro de plaque existe déjà dans votre école.",
        );
      }
    }

    return await prisma.vehicule.update({
      where: { id: vehiculeId },
      data: {
        ...data,
        derniereRevision: data.derniereRevision
          ? new Date(data.derniereRevision)
          : null,
        prochaineRevision: data.prochaineRevision
          ? new Date(data.prochaineRevision)
          : null,
        dateExpirationAssurance: data.dateExpirationAssurance
          ? new Date(data.dateExpirationAssurance)
          : null,
      },
    });
  }

  /**
   * Supprimer un véhicule
   */
  async deleteVehicule(vehiculeId: string, user: UserContext) {
    if (!user.schoolId) {
      throw new Error("L'utilisateur n'est pas associé à une école.");
    }

    const vehicule = await prisma.vehicule.findFirst({
      where: { id: vehiculeId, schoolId: user.schoolId },
      include: {
        routes: true,
      },
    });

    if (!vehicule) {
      throw new Error(
        "Véhicule non trouvé ou vous n'avez pas la permission de le supprimer.",
      );
    }

    // Vérifier qu'il n'a pas de routes actives
    const routesActives = vehicule.routes.filter(
      (route) => route.statut === "ACTIVE",
    );
    if (routesActives.length > 0) {
      throw new Error(
        "Impossible de supprimer ce véhicule car il est associé à des routes actives.",
      );
    }

    await prisma.vehicule.delete({
      where: { id: vehiculeId },
    });
    return { message: "Véhicule supprimé avec succès." };
  }

  // ---------------------------------------
  // GESTION DES CHAUFFEURS
  // ---------------------------------------

  /**
   * Récupérer tous les chauffeurs avec filtres
   */
  async getChauffeurs(schoolId: string, filters?: { statut?: string }) {
    const where: any = { schoolId };

    if (filters?.statut) where.statut = filters.statut;

    return await prisma.chauffeur.findMany({
      where,
      include: {
        routes: {
          select: {
            id: true,
            nom: true,
            statut: true,
          },
        },
        _count: {
          select: {
            routes: true,
          },
        },
      },
      orderBy: {
        nom: "asc",
      },
    });
  }

  /**
   * Récupérer un chauffeur par ID
   */
  async getChauffeurById(chauffeurId: string, schoolId: string) {
    const chauffeur = await prisma.chauffeur.findFirst({
      include: {
        routes: {
          include: {
            vehicule: {
              select: {
                id: true,
                nom: true,
                immatriculation: true,
              },
            },
          },
        },
      },
    });

    if (!chauffeur) {
      throw new Error(
        "Chauffeur non trouvé ou vous n'avez pas la permission d'y accéder.",
      );
    }

    return chauffeur;
  }

  /**
   * Créer un nouveau chauffeur
   */
  async createChauffeur(data: CreateChauffeurInput, user: UserContext) {
    if (!user.schoolId) {
      throw new Error("L'utilisateur n'est pas associé à une école.");
    }

    // Vérifier unicité du nméro de permis
    const existing = await prisma.chauffeur.findFirst({
      where: { numeroPermis: data.numeroPermis, schoolId: user.schoolId },
    });

    if (existing) {
      throw new Error(
        "Un chauffeur avec ce numéro de permis existe déjà dans votre école.",
      );
    }

    return await prisma.chauffeur.create({
      data: {
        ...data,
        dateExpirationPermis: data.dateExpirationPermis
          ? new Date(data.dateExpirationPermis)
          : undefined,
        dateNaissance: data.dateNaissance
          ? new Date(data.dateNaissance)
          : undefined,
        dateEmbauche: data.dateEmbauche
          ? new Date(data.dateEmbauche)
          : undefined,
        schoolId: user.schoolId,
      },
    });
  }

  /**
   * Mettre à jour un chauffeur existant
   */
  async updateChauffeur(
    chauffeurId: string,
    data: UpdateChauffeurInput,
    user: UserContext,
  ) {
    if (!user.schoolId) {
      throw new Error("L'utilisateur n'est pas associé à une école.");
    }

    const chauffeur = await prisma.chauffeur.findFirst({
      where: { id: chauffeurId, schoolId: user.schoolId },
    });
    if (!chauffeur) {
      throw new Error(
        "Chauffeur non trouvé ou vous n'avez pas la permission de le modifier.",
      );
    }

    // Vérifier unicité du numéro de permis si modifié
    if (data.numeroPermis && data.numeroPermis !== chauffeur.numeroPermis) {
      const existing = await prisma.chauffeur.findFirst({
        where: { numeroPermis: data.numeroPermis, schoolId: user.schoolId },
      });

      if (existing) {
        throw new Error(
          "Un chauffeur avec ce numéro de permis existe déjà dans votre école.",
        );
      }
    }

    return await prisma.chauffeur.update({
      where: { id: chauffeurId },
      data: {
        ...data,
        dateExpirationPermis: data.dateExpirationPermis
          ? new Date(data.dateExpirationPermis)
          : undefined,
        dateNaissance: data.dateNaissance
          ? new Date(data.dateNaissance)
          : undefined,
        dateEmbauche: data.dateEmbauche
          ? new Date(data.dateEmbauche)
          : undefined,
      },
    });
  }

  /**
   * Supprimer un chauffeur
   */
  async deleteChauffeur(chauffeurId: string, user: UserContext) {
    if (!user.schoolId) {
      throw new Error("L'utilisateur n'est pas associé à une école.");
    }

    const chauffeur = await prisma.chauffeur.findFirst({
      where: { id: chauffeurId, schoolId: user.schoolId },
      include: {
        routes: true,
      },
    });

    if (!chauffeur) {
      throw new Error(
        "Chauffeur non trouvé ou vous n'avez pas la permission de le supprimer.",
      );
    }

    // vérifier qu'il n'a pas de routes actives
    const routesActives = chauffeur.routes.filter(
      (route) => route.statut === "ACTIVE",
    );
    if (routesActives.length > 0) {
      throw new Error(
        "Impossible de supprimer ce chauffeur car il est associé à des routes actives.",
      );
    }

    await prisma.chauffeur.delete({
      where: { id: chauffeurId },
    });

    return { message: "Chauffeur supprimé avec succès." };
  }
  // ========================================
  // GESTION DES ROUTES
  // ========================================

  /**
   * Récupérer toutes les routes avec filtres
   */
  async getRoutes(
    schoolId: string,
    filters?: {
      statut?: string;
      typeRoute?: string;
      vehiculeId?: string;
      chauffeurId?: string;
    },
  ) {
    const where: any = { schoolId };

    if (filters?.statut) where.statut = filters.statut;
    if (filters?.typeRoute) where.typeRoute = filters.typeRoute;
    if (filters?.vehiculeId) where.vehiculeId = filters.vehiculeId;
    if (filters?.chauffeurId) where.chauffeurId = filters.chauffeurId;

    return await prisma.route.findMany({
      where,
      include: {
        vehicule: {
          select: {
            id: true,
            nom: true,
            immatriculation: true,
            capacite: true,
          },
        },
        chauffeur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            telephone: true,
          },
        },
        affectations: {
          where: { statut: "ACTIVE" },
          include: {
            eleve: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
          },
        },
        _count: {
          select: {
            affectations: true,
          },
        },
      },
      orderBy: { nom: "asc" },
    });
  }

  /**
   * Récupérer une route par ID
   */
  async getRouteById(routeId: string, schoolId: string) {
    const route = await prisma.route.findFirst({
      where: { id: routeId, schoolId },
      include: {
        vehicule: true,
        chauffeur: true,
        affectations: {
          include: {
            eleve: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                classeId: true,
                classe: {
                  select: {
                    nom: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!route) {
      throw new Error("Route introuvable.");
    }

    return route;
  }

  /**
   * Créer une nouvelle route
   */
  async createRoute(data: CreateRouteInput, user: UserContext) {
    if (!user.schoolId) {
      throw new Error("École non spécifiée.");
    }

    // Vérifier que le véhicule existe et est disponible
    const vehicule = await prisma.vehicule.findFirst({
      where: { id: data.vehiculeId, schoolId: user.schoolId },
    });

    if (!vehicule) {
      throw new Error("Véhicule introuvable.");
    }

    if (vehicule.statut !== "ACTIF") {
      throw new Error("Le véhicule n'est pas actif.");
    }

    // Vérifier que le chauffeur existe et est disponible
    const chauffeur = await prisma.chauffeur.findFirst({
      where: { id: data.chauffeurId, schoolId: user.schoolId },
    });

    if (!chauffeur) {
      throw new Error("Chauffeur introuvable.");
    }

    if (chauffeur.statut !== "ACTIF") {
      throw new Error("Le chauffeur n'est pas actif.");
    }

    return await prisma.route.create({
      data: {
        ...data,
        heureDepart: new Date(`1970-01-01T${data.heureDepart}:00Z`),
        heureArrivee: data.heureArrivee
          ? new Date(`1970-01-01T${data.heureArrivee}:00Z`)
          : undefined,
        schoolId: user.schoolId,
      },
      include: {
        vehicule: true,
        chauffeur: true,
      },
    });
  }

  /**
   * Mettre à jour une route
   */
  async updateRoute(
    routeId: string,
    data: UpdateRouteInput,
    user: UserContext,
  ) {
    if (!user.schoolId) {
      throw new Error("École non spécifiée.");
    }

    const route = await prisma.route.findFirst({
      where: { id: routeId, schoolId: user.schoolId },
    });

    if (!route) {
      throw new Error("Route introuvable.");
    }

    // Vérifier le véhicule si modifié
    if (data.vehiculeId) {
      const vehicule = await prisma.vehicule.findFirst({
        where: { id: data.vehiculeId, schoolId: user.schoolId },
      });

      if (!vehicule || vehicule.statut !== "ACTIF") {
        throw new Error("Véhicule introuvable ou non actif.");
      }
    }

    // Vérifier le chauffeur si modifié
    if (data.chauffeurId) {
      const chauffeur = await prisma.chauffeur.findFirst({
        where: { id: data.chauffeurId, schoolId: user.schoolId },
      });

      if (!chauffeur || chauffeur.statut !== "ACTIF") {
        throw new Error("Chauffeur introuvable ou non actif.");
      }
    }

    return await prisma.route.update({
      where: { id: routeId },
      data: {
        ...data,
        heureDepart: data.heureDepart
          ? new Date(`1970-01-01T${data.heureDepart}:00Z`)
          : undefined,
        heureArrivee: data.heureArrivee
          ? new Date(`1970-01-01T${data.heureArrivee}:00Z`)
          : undefined,
      },
      include: {
        vehicule: true,
        chauffeur: true,
      },
    });
  }

  /**
   * Supprimer une route
   */
  async deleteRoute(routeId: string, user: UserContext) {
    if (!user.schoolId) {
      throw new Error("École non spécifiée.");
    }

    const route = await prisma.route.findFirst({
      where: { id: routeId, schoolId: user.schoolId },
      include: {
        affectations: true,
      },
    });

    if (!route) {
      throw new Error("Route introuvable.");
    }

    // Vérifier qu'il n'y a pas d'affectations actives
    const affectationsActives = route.affectations.filter(
      (a) => a.statut === "ACTIVE",
    );
    if (affectationsActives.length > 0) {
      throw new Error(
        "Impossible de supprimer une route avec des affectations actives.",
      );
    }

    await prisma.route.delete({ where: { id: routeId } });

    return { message: "Route supprimée avec succès." };
  }

  // ========================================
  // GESTION DES AFFECTATIONS
  // ========================================

  /**
   * Récupérer toutes les affectations avec filtres
   */
  async getAffectations(
    schoolId: string,
    filters?: { eleveId?: string; routeId?: string; statut?: string },
  ) {
    const where: any = { schoolId };

    if (filters?.eleveId) where.eleveId = filters.eleveId;
    if (filters?.routeId) where.routeId = filters.routeId;
    if (filters?.statut) where.statut = filters.statut;

    return await prisma.affectationTransport.findMany({
      where,
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
        route: {
          select: {
            id: true,
            nom: true,
            typeRoute: true,
            heureDepart: true,
            vehicule: {
              select: {
                nom: true,
                immatriculation: true,
              },
            },
            chauffeur: {
              select: {
                nom: true,
                prenom: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Créer une nouvelle affectation
   */
  async createAffectation(data: CreateAffectationInput, user: UserContext) {
    if (!user.schoolId) {
      throw new Error("École non spécifiée.");
    }

    // Vérifier que l'élève existe
    const eleve = await prisma.eleve.findFirst({
      where: { id: data.eleveId, schoolId: user.schoolId },
    });

    if (!eleve) {
      throw new Error("Élève introuvable.");
    }

    // Vérifier que la route existe et est active
    const route = await prisma.route.findFirst({
      where: { id: data.routeId, schoolId: user.schoolId },
      include: {
        vehicule: true,
        affectations: {
          where: { statut: "ACTIVE" },
        },
      },
    });

    if (!route) {
      throw new Error("Route introuvable.");
    }

    if (route.statut !== "ACTIVE") {
      throw new Error("La route n'est pas active.");
    }

    // Vérifier la capacité du véhicule
    const placesOccupees = route.affectations.length;
    if (placesOccupees >= route.vehicule.capacite) {
      throw new Error("Le véhicule est complet.");
    }

    // Vérifier qu'il n'y a pas déjà une affectation active pour cet élève sur cette route
    const existingAffectation = await prisma.affectationTransport.findFirst({
      where: {
        eleveId: data.eleveId,
        routeId: data.routeId,
        statut: "ACTIVE",
      },
    });

    if (existingAffectation) {
      throw new Error("L'élève est déjà affecté à cette route.");
    }

    return await prisma.affectationTransport.create({
      data: {
        ...data,
        dateDebut: data.dateDebut ? new Date(data.dateDebut) : new Date(),
        dateFin: data.dateFin ? new Date(data.dateFin) : undefined,
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
        route: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
    });
  }

  /**
   * Mettre à jour une affectation
   */
  async updateAffectation(
    affectationId: string,
    data: UpdateAffectationInput,
    user: UserContext,
  ) {
    if (!user.schoolId) {
      throw new Error("École non spécifiée.");
    }

    const affectation = await prisma.affectationTransport.findFirst({
      where: { id: affectationId, schoolId: user.schoolId },
    });

    if (!affectation) {
      throw new Error("Affectation introuvable.");
    }

    // Vérifier la route si modifiée
    if (data.routeId) {
      const route = await prisma.route.findFirst({
        where: { id: data.routeId, schoolId: user.schoolId },
      });

      if (!route || route.statut !== "ACTIVE") {
        throw new Error("Route introuvable ou non active.");
      }
    }

    return await prisma.affectationTransport.update({
      where: { id: affectationId },
      data: {
        ...data,
        dateDebut: data.dateDebut ? new Date(data.dateDebut) : undefined,
        dateFin: data.dateFin ? new Date(data.dateFin) : undefined,
      },
      include: {
        eleve: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
        route: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
    });
  }

  /**
   * Supprimer une affectation
   */
  async deleteAffectation(affectationId: string, user: UserContext) {
    if (!user.schoolId) {
      throw new Error("École non spécifiée.");
    }

    const affectation = await prisma.affectationTransport.findFirst({
      where: { id: affectationId, schoolId: user.schoolId },
    });

    if (!affectation) {
      throw new Error("Affectation introuvable.");
    }

    await prisma.affectationTransport.delete({ where: { id: affectationId } });

    return { message: "Affectation supprimée avec succès." };
  }
}
