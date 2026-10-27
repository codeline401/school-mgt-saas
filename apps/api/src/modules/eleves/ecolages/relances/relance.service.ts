import {
  CanalRelance,
  CiblageRelance,
} from "../../../../generated/prisma/enums.js";
import { prisma } from "../../../../lib/prisma.js";
import {
  CreerRelanceInput,
  FiltreDestinataireInput,
  ListeRelancesQuery,
} from "./relance.schema.js";

type UserContext = {
  id: string;
  role: string;
  schoolId: string | null;
};

// Classe d'erreur personnalisée pour les relances, incluant un code de statut HTTP et un message d'erreur détaillé
export class RelanceError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message); // Appelle le constructeur de la classe Error avec le message
    this.status = status;
    this.name = "RelanceError"; // Définit le nom de l'erreur pour faciliter l'identification
  }
}

// Seuls les canaux réellement branchés sont acceptés (pas de fournisseur email/SMS/WhatsApp pour l'instant)
const CANAUX_DISPONIBLES = new Set<CanalRelance>(["NOTIFICATION"]);

const MOIS_LABEL = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export type Destinataire = {
  eleveId: string;
  eleveNom: string;
  parentId: string | null;
  parentUserId: string | null;
  parentNom: string;
  montantDu: number;
  mois: number[];
};

// Exige que l'utilisateur ait un identifiant d'école associé, sinon lance une erreur
function requireSchoolId(user: UserContext): string {
  if (!user.schoolId) {
    throw new RelanceError(403, "Aucune école associée à ce compte");
  }
  return user.schoolId;
}

// Formate un montant en devise locale (MGA) sans décimales
function formatMontant(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "MGA",
    maximumFractionDigits: 0,
  }).format(value);
}

// Rend un message en remplaçant les placeholders du modèle par les valeurs du destinataire
// Les placeholders doivent être au format {{ nom_du_placeholder }}
export function rendreMessage(
  modele: string,
  destinataire: Destinataire,
): string {
  const valeurs: Record<string, string> = {
    nom_parent: destinataire.parentNom,
    nom_eleve: destinataire.eleveNom,
    montant_du: formatMontant(destinataire.montantDu),
    mois: destinataire.mois.map((m) => MOIS_LABEL[m - 1]).join(", "),
  };

  // Remplace les placeholders dans le modèle par les valeurs correspondantes du destinataire
  return modele.replace(/\{\{\s*(\w+)\s+\}\}/g, (m, cle) => valeurs[cle] ?? m);
}

/**
 * Calcule la prochaine occurrence d'un jour spécifique du mois après une date donnée. *
 * @param jourMois Le jour du mois pour lequel calculer la prochaine occurrence
 * @param apres La date après laquelle chercher la prochaine occurrence
 * @returns La date de la prochaine occurrence du jour du mois spécifié après la date donnée
 */
function prochaineOccurrence(jourMois: number, apres: Date): Date {
  const date = new Date(
    apres.getFullYear(),
    apres.getMonth(),
    jourMois,
    8,
    0,
    0,
  );
  if (date <= apres) {
    date.setMonth(date.getMonth() + 1);
  }
  return date;
}

export class RelanceService {
  /**
   * Détecte les retards de paiement pour les élèves d'une école donnée en fonction du filtre fourni.   *
   * @param schoolId Identifiant de l'école pour laquelle détecter les retards de paiement
   * @param filtre Filtre pour sélectionner les destinataires en retard de paiement
   * @param now Date de référence pour la détection des retards (par défaut, la date actuelle)
   * @returns Liste des destinataires en retard de paiement correspondant au filtre donné
   */
  static async detecterRetards(
    schoolId: string,
    filtre: FiltreDestinataireInput,
    now = new Date(),
  ): Promise<Destinataire[]> {
    const ecolages = await prisma.ecolage.findMany({
      where: {
        schoolId: schoolId,
        statutPaiement: { not: "PAYE" },
        eleve: {
          deletedAt: null,
          ...(filtre.ciblage === "ELEVES"
            ? { id: { in: filtre.cibleIds } }
            : {}), // Si le ciblage n'est pas sur les élèves, ne filtre pas par ID d'élève
        },
        ...(filtre.ciblage === "CLASSE"
          ? { classeId: { in: filtre.cibleIds } }
          : {}), // Si le ciblage n'est pas sur les classes, ne filtre pas par ID de classe
      },
      // Sélectionne uniquement les champs nécessaires pour la détection des retards
      select: {
        mois: true,
        montant: true,
        anneeScolaire: true,
        classeId: true,
        dateEcheanceAJournee: true,
        paiementEcolages: { select: { montant: true } },
        eleve: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            responsable: {
              select: { id: true, nom: true, prenom: true, userId: true },
            },
          },
        },
      },
    });

    const classeIds = [
      ...new Set(
        ecolages.map((e) => e.classeId).filter((id): id is string => !!id), // Filtre les IDs de classe non nuls et uniques
      ),
    ];
    const configs = classeIds.length
      ? await prisma.ecolageConfig.findMany({
          where: { schoolId, classeId: { in: classeIds } },
          include: { echeances: true },
        })
      : []; // Si aucun ID de classe n'est trouvé, retourne un tableau vide pour les configurations

    const echeanceParCle = new Map<string, Date>();
    for (const config of configs) {
      for (const echeance of config.echeances) {
        echeanceParCle.set(
          `${config.classeId}-${config.anneeScolaire}-${echeance.mois}`,
          echeance.dateEcheance,
        ); // Stocke la date d'échéance pour chaque combinaison classe-année scolaire-mois
      }
    }

    const parEleve = new Map<string, Destinataire>();
    for (const ecolage of ecolages) {
      const reste =
        Number(ecolage.montant) -
        ecolage.paiementEcolages.reduce((t, p) => t + Number(p.montant), 0); // Calcule le montant restant à payer pour cet écolage
      if (reste <= 0) continue; // Si le reste à payer est nul ou négatif, passe à l'écolage suivant

      const echeance =
        ecolage.dateEcheanceAJournee ??
        (ecolage.classeId
          ? echeanceParCle.get(
              `${ecolage.classeId}-${ecolage.anneeScolaire}-${ecolage.mois}`,
            )
          : undefined); // Récupère la date d'échéance à partir de la configuration de la classe si elle n'est pas définie sur l'écolage

      if (!echeance || echeance > now) continue; // Si la date d'échéance n'est pas définie ou est dans le futur, passe à l'écolage suivant

      const existant = parEleve.get(ecolage.eleve.id); // Récupère l'entrée existante pour cet élève, s'il y en a une
      if (existant) {
        existant.montantDu += reste; // Ajoute le montant restant à payer à l'entrée existante pour cet élève
        existant.mois.push(ecolage.mois); // Ajoute le mois correspondant à l'échéance à l'entrée existante pour cet élève
        continue; // Passe à l'écolage suivant après avoir mis à jour l'entrée existante pour cet élève
      }
      const p = ecolage.eleve.responsable;
      parEleve.set(ecolage.eleve.id, {
        eleveId: ecolage.eleve.id,
        eleveNom: `${ecolage.eleve.prenom} ${ecolage.eleve.nom}`,
        parentId: p?.id ?? null,
        parentUserId: p?.userId ?? null,
        parentNom: p ? `${p.prenom} ${p.nom}` : "Parent",
        montantDu: reste,
        mois: [ecolage.mois], // Initialise le tableau des mois avec le mois correspondant à l'échéance
      });
    }

    return [...parEleve.values()]; // Retourne un tableau des destinataires avec les montants dus et les mois correspondants
  }

  /**
   * Fournit un aperçu des retards de paiement pour les élèves correspondant au filtre donné.
   * @param filtre Filtre pour sélectionner les destinataires en retard de paiement
   * @param user Contexte de l'utilisateur effectuant la requête
   * @returns Aperçu des retards de paiement, incluant le nombre d'élèves, le montant total dû et le nombre d'élèves sans compte parent
   */
  static async apercu(filtre: FiltreDestinataireInput, user: UserContext) {
    const destinataire = await this.detecterRetards(
      requireSchoolId(user),
      filtre,
    );
    return {
      nbEleves: destinataire.length, // Nombre total d'élèves en retard de paiement
      montantTotal: destinataire.reduce((t, d) => t + d.montantDu, 0), // Montant total dû par tous les élèves
      sansCompteParent: destinataire.filter((d) => !d.parentUserId).length, // Nombre d'élèves dont le parent n'a pas de compte utilisateur
    };
  }

  /**
   * Crée une nouvelle relance de paiement en fonction des données fournies.
   * @param input Données nécessaires pour créer une relance
   * @param user Contexte de l'utilisateur effectuant la création
   * @returns La relance créée avec ses informations complètes
   */
  static async creer(input: CreerRelanceInput, user: UserContext) {
    const schoolId = requireSchoolId(user); // Récupère l'identifiant de l'école à partir du contexte utilisateur

    if (!CANAUX_DISPONIBLES.has(input.canal)) {
      throw new RelanceError(400, "Ce canal n'est pas encore disponible");
    }

    const dateProgrammee = // Détermine la date programmée en fonction du type et de la récurrence de la relance
      input.type === "AUTOMATIQUE"
        ? input.recurrent
          ? prochaineOccurrence(input.jourMois!, new Date())
          : input.dateProgrammee!
        : null; // Si le type n'est pas automatique, aucune date programmée n'est définie

    const relance = await prisma.relancePaiement.create({
      data: {
        schoolId,
        type: input.type,
        canal: input.canal,
        ciblage: input.ciblage,
        cibleIds: input.cibleIds,
        message: input.message,
        statut: "EN_ATTENTE", // Statut initial de la relance
        dateProgrammee, // Date programmée de la relance, si applicable
        recurrent: input.recurrent, // Indique si la relance est récurrente
        jourMois: input.jourMois, // Jour ou mois de la relance, si applicable
        createdById: user.id, // Identifiant de l'utilisateur ayant créé la relance
      },
    });

    if (input.type === "MANUELLE") {
      await this.executer(relance.id); // Exécute immédiatement la relance si elle est de type manuelle
    }

    return prisma.relancePaiement.findUniqueOrThrow({
      where: { id: relance.id },
    });
  }

  /**
   * Exécute une relance en mettant à jour son statut et en envoyant les notifications aux destinataires.
   * @param relanceId Identifiant de la relance à exécuter
   * @returns Une promesse résolue lorsque l'exécution de la relance est terminée
   */
  static async executer(relanceId: string): Promise<void> {
    const claim = await prisma.relancePaiement.updateMany({
      where: { id: relanceId, statut: "EN_ATTENTE" },
      data: { statut: "EN_COURS" },
    });
    if (claim.count === 0) return; // Si aucune relance n'a été mise à jour, on arrête l'exécution

    const relance = await prisma.relancePaiement.findUniqueOrThrow({
      where: { id: relanceId },
    });

    let nbEchecs = 0; // Initialise le compteur d'échecs à 0
    let destinataires: Destinataire[] = []; // Initialise la liste des destinataires comme un tableau vide
    try {
      destinataires = await this.detecterRetards(relance.schoolId, {
        ciblage: relance.ciblage as CiblageRelance,
        cibleIds: relance.cibleIds,
      });

      for (const destinataire of destinataires) {
        try {
          await this.envoyer(
            relance.canal,
            relance.schoolId,
            destinataire,
            rendreMessage(relance.message, destinataire),
          );
        } catch {
          nbEchecs++; // Incrémente le compteur d'échecs si l'envoi échoue
        }
      }
    } catch (error) {
      console.error("Echec de la relance", relanceId, error);
      await prisma.relancePaiement.update({
        where: { id: relanceId },
        data: { statut: "ECHOUE", dateExecution: new Date() },
      });
      return;
    }

    const now = new Date();
    const tousEchoue =
      destinataires.length > 0 && nbEchecs === destinataires.length;
    // Récurrente : on la reprogramme au mois suivant au lieu de la clôturer.
    const reprogrammer = relance.recurrent && relance.jourMois; // On reprogramme si la relance est récurrente et a un jour/mois défini

    await prisma.relancePaiement.update({
      where: { id: relanceId },
      data: {
        statut: reprogrammer ? "EN_ATTENTE" : tousEchoue ? "ECHOUE" : "ENVOYE",
        dateProgrammee: reprogrammer
          ? prochaineOccurrence(relance.jourMois!, now)
          : relance.dateProgrammee,
        dateExecution: now,
        nbDestinataires: destinataires.length,
        nbEchecs,
      },
    });
  }

  /**
   * Envoie une relance au destinataire via le canal spécifié.
   * @param canal Le canal de relance (ex: NOTIFICATION)
   * @param schoolId L'identifiant de l'école
   * @param destinataire Le destinataire de la relance
   * @param message Le message à envoyer
   */
  private static async envoyer(
    canal: CanalRelance,
    schoolId: string,
    destinataire: Destinataire,
    message: string,
  ): Promise<void> {
    if (canal !== "NOTIFICATION") {
      throw new RelanceError(400, "Canal non supporté");
    }
    if (!destinataire.parentUserId) {
      throw new RelanceError(422, "Le parent n'a pas de compte utilisateur");
    }
    await prisma.notification.create({
      data: {
        userId: destinataire.parentUserId,
        schoolId,
        message,
        lien: "/ajournements",
      },
    });
  }

  /**
   * Liste les relances de paiement pour l'école de l'utilisateur connecté
   * @param query Les paramètres de pagination et de filtrage des relances
   * @param user Le contexte utilisateur contenant les informations de l'utilisateur connecté
   * @returns Une liste paginée des relances de paiement pour l'école de l'utilisateur
   */
  static async lister(query: ListeRelancesQuery, user: UserContext) {
    const schoolId = requireSchoolId(user);
    const where = { schoolId };
    const [data, total] = await Promise.all([
      prisma.relancePaiement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.relancePaiement.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  /**
   * Annule une relance de paiement pour l'école de l'utilisateur connecté
   * @param relanceId L'identifiant de la relance à annuler
   * @param user Le contexte utilisateur contenant les informations de l'utilisateur connecté
   * @returns Un objet contenant l'identifiant de la relance et son nouveau statut
   */
  static async annuler(relanceId: string, user: UserContext) {
    const schoolId = requireSchoolId(user); // Récupère l'identifiant de l'école de l'utilisateur connecté
    const res = await prisma.relancePaiement.updateMany({
      where: {
        id: relanceId,
        schoolId,
        type: "AUTOMATIQUE",
        statut: "EN_ATTENTE",
      },
      data: { statut: "ANNULEE" },
    });
    if (res.count === 0) {
      throw new RelanceError(404, "Programmation introuvable ou déjà exécutée");
    }
    return { id: relanceId, statut: "ANNULEE" as const };
  }

  /**
   * Exécute toutes les relances automatiques programmées qui sont dues à la date et l'heure actuelles.
   * @param now La date et l'heure actuelles utilisées pour déterminer quelles relances automatiques doivent être exécutées
   */
  static async executerProgrammees(now = new Date()): Promise<void> {
    const dues = await prisma.relancePaiement.findMany({
      where: {
        type: "AUTOMATIQUE",
        statut: "EN_ATTENTE",
        dateExecution: { lte: now },
      },
      select: { id: true },
    });
    for (const { id } of dues) {
      await this.executer(id); // Exécute la relance automatique due
    }
  }
}

let timer: NodeJS.Timeout | null = null; // Timer utilisé pour exécuter périodiquement les relances automatiques programmées

export function demarrerPlanificateurRelances(): void {
  if (timer) return; // Si le planificateur est déjà démarré, ne rien faire
  timer = setInterval(
    () => {
      RelanceService.executerProgrammees().catch((error) =>
        console.error("Planificateur de relances", error),
      );
    },
    15 * 60 * 1000,
  ); // Exécute toutes les 15 minutes
}
