import {
  Ajournement,
  Prisma,
  StatutAjournement,
} from "../../../../generated/prisma/client.js";
import { prisma } from "../../../../lib/prisma.js";
import { notifierAjournement } from "./ajournement.events.js";
import {
  AccepterAjournementInput,
  AjournementListResponse,
  AjournementResponse,
  ContrePropositionInput,
  CreerAjournementInput,
  ListeAjournemntQuery,
  RefuserAjournementInput,
  ReponseContrePropositionInput,
} from "./ajournement.schema.js";

type UserContext = {
  id: string;
  role: string;
  schoolId: string | null;
};

// Type représentant la base de données dans le contexte d'une transaction Prisma
type Db = Prisma.TransactionClient;

// Classe représentant une erreur spécifique aux ajournements, incluant un statut HTTP et un nom d'erreur.
export class AjournementError extends Error {
  status: number;
  constructor(status: number, message: string, name: string) {
    super(message);
    this.status = status;
    this.name = name;
  }
}

// Classe représentant une erreur spécifique lorsque le parent associé à un transport est introuvable.
export class AjournementParentIntrouvableError extends AjournementError {
  constructor(message = "Aucun profil parent associé à ce compte") {
    super(403, message, "AjournementParentIntrouvableError");
  }
}

// Classe représentant une erreur spécifique lorsque la demande d'ajournement est introuvable.
export class AjournementNotFoundError extends AjournementError {
  constructor(message = "Demande d'ajournement introuvable") {
    super(404, message, "AjournementNotFoundError");
  }
}

// Classe représentant une erreur spécifique lorsque l'action sur la demande d'ajournement est interdite.
export class AjournementForbiddenError extends AjournementError {
  constructor(message = "Action interdite sur la demande d'ajournement") {
    super(403, message, "AjournementForbiddenError");
  }
}

// Classe représentant une erreur spécifique lorsque l'élève n'est pas lié au compte de l'utilisateur.
export class AjournementEleveNonLieError extends AjournementError {
  constructor(message = "L'élève n'est pas lié à votre compte") {
    super(403, message, "AjournementEleveNonLieError");
  }
}

// Classe représentant une erreur spécifique lorsque l'écolage est introuvable.
export class AjournementEcolageNotFoundError extends AjournementError {
  constructor(message = "Écolage introuvable") {
    super(404, message, "AjournementEcolageNotFoundError");
  }
}

// Classe représentant une erreur spécifique lorsque le solde de l'écolage est insuffisant.
export class AjournementEcolageSoldeError extends AjournementError {
  constructor(message = "Solde insuffisant pour l'écolage") {
    super(403, message, "AjournementEcolageSoldeError");
  }
}

// Classe représentant une erreur spécifique lorsque l'échéance d'un écolage est introuvable.
export class AjournementEcheanceIntrouvableError extends AjournementError {
  constructor(message = "Aucune échéance définie pour cet écolage") {
    super(404, message, "AjournementEcheanceIntrouvableError");
  }
}

// Classe représentant une erreur spécifique lorsqu'une demande d'ajournement en double est détectée.
export class AjournementDoublonError extends AjournementError {
  constructor(
    message = "Une demande d'ajournement est déjà en cours pour cet écolage",
  ) {
    super(409, message, "AjournementDoublonError");
  }
}

// Classe représentant une erreur spécifique lorsque la date de la demande d'ajournement est invalide.
export class AjournementDateInvalideError extends AjournementError {
  constructor(message = "La date doit être postérieure à l'échéance actuelle") {
    super(400, message, "AjournementDateInvalideError");
  }
}

// Classe représentant une erreur spécifique lorsque l'action sur la demande d'ajournement est invalide.
export class AjournementStatutInvalideError extends AjournementError {
  constructor(
    message = "Cette action n'est pas possible dans l'état actuel de la demande",
  ) {
    super(409, message, "AjournementStatutInvalideError");
  }
}

// Classe représentant une erreur spécifique lorsque les lignes de la contre-proposition sont invalides.
export class AjournementLignesInvaldesError extends AjournementError {
  constructor(
    message = "La contre-proposition doit couvrir toutes les lignes de la demande",
  ) {
    super(400, message, "AjournementLignesInvaldesError");
  }
}

// Détail des relations à inclure lors de la récupération d'un ajournement.
const detailInclude = {
  parent: {
    select: {
      id: true,
      nom: true,
      prenom: true,
      userId: true,
    },
  },
  traitePar: { select: { id: true, nom: true, prenom: true } },
  ligne: {
    orderBy: { createdAt: "asc" },
    include: {
      eleve: {
        select: { id: true, matricule: true, nom: true, prenom: true },
      },
      ecolage: {
        select: {
          id: true,
          anneeScolaire: true,
          mois: true,
          montant: true,
          statutPaiement: true,
        },
      },
    },
  },
} satisfies Prisma.AjournementInclude;

// Type représentant le détail complet d'un ajournement, incluant les relations définies dans `detailInclude`.
type AjournementDetail = Prisma.AjournementGetPayload<{
  include: typeof detailInclude;
}>;

// Fonction utilitaire pour convertir une date en chaîne ISO, ou retourner null si la date est nulle.
function iso(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

// Fonction utilitaire pour convertir un ajournement en réponse API.
function toResponse(ajournement: AjournementDetail): AjournementResponse {
  return {
    id: ajournement.id,
    statut: ajournement.statut,
    motif: ajournement.motif,
    commentaireAdmin: ajournement.commentaireAdmin,
    dateDecision: iso(ajournement.dateDecision),
    dateResponseParent: iso(ajournement.dateReponseParent),
    parent: {
      id: ajournement.parent.id,
      nom: ajournement.parent.nom,
      prenom: ajournement.parent.prenom,
    },
    traitePar: ajournement.traitePar
      ? {
          id: ajournement.traitePar.id,
          nom: ajournement.traitePar.nom,
          prenom: ajournement.traitePar.prenom,
        }
      : null,
    lignes: ajournement.ligne.map((l) => ({
      id: l.id,
      eleve: {
        id: l.eleve.id,
        matricule: l.eleve.matricule.toString(),
        nom: l.eleve.nom,
        prenom: l.eleve.prenom,
      },
      ecolage: {
        id: l.ecolage.id,
        anneeScolaire: l.ecolage.anneeScolaire,
        mois: l.ecolage.mois,
        montant: l.ecolage.montant.toString(),
        statutPaiement: l.ecolage.statutPaiement,
      },
      dateEcheanceOrigine: l.dateEcheanceOrigine.toISOString(),
      dateDemandee: l.dateDemandee.toISOString(),
      dateProposee: iso(l.dateProposee),
      dateAppliquee: iso(l.dateAppliquee),
      estActive: l.estActive,
    })),
    createdAt: ajournement.createdAt.toISOString(),
    updatedAt: ajournement.updatedAt.toISOString(),
  };
}

// Fonction utilitaire pour vérifier si une erreur est un conflit d'unicité (code P2002 de Prisma).
function estConflitUnique(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "P2002"
  );
}

/**
 * Résout la date d'échéance pour un écolage donné en tenant compte de la date d'échéance mise à jour et de la configuration de la classe.
 * @param db L'instance de la base de données.
 * @param ecolage Les informations sur l'écolage pour lequel résoudre l'échéance.
 * @returns La date d'échéance résolue, ou null si elle ne peut pas être déterminée.
 */
async function resoudreEcheance(
  db: Db,
  ecolage: {
    classeId: string | null;
    anneeScolaire: string;
    mois: number;
    dateEcheanceAJournee: Date | null;
  },
): Promise<Date | null> {
  if (ecolage.dateEcheanceAJournee) return ecolage.dateEcheanceAJournee; // Retourne la date d'échéance mise à jour si elle existe.
  if (!ecolage.classeId) return null;

  const echeance = await db.ecolageEcheance.findFirst({
    where: {
      mois: ecolage.mois,
      config: {
        classeId: ecolage.classeId,
        anneeScolaire: ecolage.anneeScolaire,
      },
    },
    select: { dateEcheance: true },
  });
  return echeance?.dateEcheance ?? null;
}

/**
 * Met à jour le statut d'un ajournement en fonction du statut actuel attendu.
 * @param tx L'instance de la base de données pour effectuer la mise à jour.
 * @param id L'identifiant de l'ajournement à mettre à jour.
 * @param depuis Le statut actuel attendu de l'ajournement.
 * @param data Les données de mise à jour pour l'ajournement.
 */
async function changeStatut(
  tx: Db,
  id: string,
  depuis: StatutAjournement,
  data: Prisma.AjournementUncheckedUpdateManyInput,
): Promise<void> {
  const { count } = await tx.ajournement.updateMany({
    where: { id, statut: depuis },
    data,
  });
  if (count === 0) {
    throw new AjournementStatutInvalideError(); // Lève une erreur si aucun enregistrement n'a été mis à jour, indiquant que le statut actuel ne correspond pas à celui attendu.
  }
}

/**
 * Applique les dates d'ajournement aux écolages correspondants, en mettant à jour la date d'échéance et le statut des lignes d'ajournement.
 * @param tx L'instance de la base de données pour effectuer les mises à jour.
 * @param lignes Les lignes d'ajournement contenant les identifiants et les dates à appliquer.
 */
async function appliquerDates(
  tx: Db,
  lignes: { id: string; ecolageId: string; date: Date }[],
): Promise<void> {
  for (const ligne of lignes) {
    const ecolage = await tx.ecolage.findUniqueOrThrow({
      where: { id: ligne.ecolageId },
      select: {
        classeId: true,
        anneeScolaire: true,
        mois: true,
        statutPaiement: true,
        dateEcheanceAJournee: true,
      },
    });

    if (ecolage.statutPaiement === "PAYE") {
      throw new AjournementEcolageSoldeError(); // Lève une erreur si l'écolage est déjà payé.
    }

    const echeance = await resoudreEcheance(tx, ecolage); // Résout la date d'échéance pour l'écolage en tenant compte de la date d'échéance mise à jour et de la configuration de la classe.
    if (echeance && ligne.date <= echeance) {
      throw new AjournementDateInvalideError(); // Lève une erreur si la date de l'ajournement est antérieure ou égale à la date d'échéance.
    }

    await tx.ecolage.update({
      where: { id: ligne.ecolageId },
      data: { dateEcheanceAJournee: ligne.date },
    });
    await tx.ajournementLigne.update({
      where: { id: ligne.id },
      data: { dateAppliquee: ligne.date, estActive: false },
    });
  }
}

/**
 * Désactive toutes les lignes d'ajournement associées à un ajournement spécifique.
 * @param tx L'instance de la base de données pour effectuer la mise à jour.
 * @param ajournementId L'identifiant de l'ajournement dont les lignes doivent être désactivées.
 */
async function desactiverLignes(tx: Db, ajournementId: string): Promise<void> {
  await tx.ajournementLigne.updateMany({
    where: { ajournementId },
    data: { estActive: false },
  });
}

/**
 * Charge les détails d'un ajournement spécifique en fonction de son identifiant.
 * @param id L'identifiant de l'ajournement à charger.
 * @returns Les détails de l'ajournement correspondant à l'identifiant fourni.
 */
async function chargerDetail(id: string): Promise<AjournementDetail> {
  const ajournement = await prisma.ajournement.findUnique({
    where: { id },
    include: detailInclude,
  });
  if (!ajournement) {
    throw new AjournementNotFoundError(); // Lève une erreur si l'ajournement n'existe pas.
  }
  return ajournement;
}

/**
 * Récupère les informations du parent associé à l'utilisateur fourni.
 * @param user Le contexte utilisateur contenant l'identifiant de l'utilisateur.
 * @returns Les informations du parent correspondant à l'utilisateur fourni.
 */
async function getParents(user: UserContext) {
  const parent = await prisma.parent.findUnique({
    where: { userId: user.id },
    select: { id: true, schoolId: true },
  });
  if (!parent) {
    throw new AjournementParentIntrouvableError(); // Lève une erreur si le parent n'existe pas.
  }
  return parent;
}

/**
 * Charge les détails d'un ajournement spécifique pour le parent associé à l'utilisateur fourni.
 * @param id L'identifiant de l'ajournement à charger.
 * @param user Le contexte utilisateur contenant l'identifiant de l'utilisateur.
 */
async function chargerPourParent(id: string, user: UserContext) {
  const parent = await getParents(user);
  const ajournement = await chargerDetail(id); // Charge les détails de l'ajournement pour le parent.
  if (ajournement.parentId !== parent.id) {
    throw new AjournementForbiddenError();
  }
  return ajournement;
}

/**
 * Charge les détails d'un ajournement spécifique pour l'administrateur associé à l'utilisateur fourni.
 * @param id L'identifiant de l'ajournement à charger.
 * @param user Le contexte utilisateur contenant l'identifiant de l'utilisateur.
 * @returns Les détails de l'ajournement correspondant à l'identifiant fourni.
 */
async function chargerPourAdmin(id: string, user: UserContext) {
  const ajournement = await chargerDetail(id);
  if (user.role !== "SUDO_ADMIN" && user.schoolId !== ajournement.schoolId) {
    throw new AjournementForbiddenError(); // Lève une erreur si l'utilisateur n'a pas les droits d'accès à l'ajournement.
  }
  return ajournement;
}

/**
 * Construit les conditions de filtrage pour la requête des ajournements en fonction des critères fournis.
 * @param query Les critères de filtrage pour la liste des ajournements.
 * @param schoolId L'identifiant de l'école pour filtrer les ajournements.
 * @param parentId L'identifiant du parent pour filtrer les ajournements.
 * @returns Un objet Prisma.AjournementWhereInput représentant les conditions de filtrage construites.
 */
function construireWhere(
  query: ListeAjournemntQuery,
  schoolId: string | null,
  parentId: string | null,
): Prisma.AjournementWhereInput {
  const dateFixeExclusive = query.dateFin
    ? new Date(query.dateFin.getTime() + 24 * 60 * 60 * 1000)
    : undefined; // Ajoute un jour à la date de fin pour rendre la comparaison exclusive.

  return {
    ...(schoolId && { schoolId }), // Filtre par identifiant de l'école si fourni.
    ...(parentId && { parentId }), // Filtre par identifiant du parent si fourni.
    ...(query.statut && { statut: query.statut }), // Filtre par statut si fourni.
    ...(query.eleveId && { ligne: { some: { eleveId: query.eleveId } } }), // Filtre par identifiant de l'élève si fourni.
    ...((query.dateDebut || query.dateFin) && {
      // Filtre par plage de dates si une date de début ou de fin est fournie.
      createdAt: {
        ...(query.dateDebut && { gte: query.dateDebut }),
        ...(dateFixeExclusive && { lt: dateFixeExclusive }),
      },
    }),
  };
}

/**
 * Retourne la liste des ajournements en fonction des critères de filtrage et de pagination fournis.
 * @param where Les conditions de filtrage pour la requête des ajournements.
 * @param query Les critères de pagination et de filtrage pour la liste des ajournements.
 * @returns Une promesse résolue avec la liste des ajournements et les informations de pagination.
 */
async function lister(
  where: Prisma.AjournementWhereInput,
  query: ListeAjournemntQuery,
): Promise<AjournementListResponse> {
  const [total, ajournements] = await Promise.all([
    prisma.ajournement.count({ where }),
    prisma.ajournement.findMany({
      where,
      include: detailInclude,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit, // Calcule le nombre d'éléments à ignorer pour la pagination.
      take: query.limit, // Limite le nombre d'éléments retournés pour la pagination.
    }),
  ]);

  return {
    data: ajournements.map(toResponse),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export class AjournementService {
  // -------------- PARENT -----------------------

  /**
   * Crée un nouvel ajournement pour les écolages spécifiés.
   * @param input Les données nécessaires pour créer un ajournement.
   * @param user Le contexte utilisateur du parent effectuant la création de l'ajournement.
   * @returns La réponse contenant les détails de l'ajournement créé.
   */
  static async creer(
    input: CreerAjournementInput,
    user: UserContext,
  ): Promise<AjournementResponse> {
    const parent = await getParents(user); // Récupère les informations du parent à partir du contexte utilisateur.

    const ecolages = await prisma.ecolage.findMany({
      where: {
        id: { in: input.lignes.map((ligne) => ligne.ecolageId) },
        schoolId: parent.schoolId,
        eleve: { deletedAt: null },
      },
      select: {
        id: true,
        eleveId: true,
        classeId: true,
        anneeScolaire: true,
        mois: true,
        statutPaiement: true,
        dateEcheanceAJournee: true,
      },
    });

    if (ecolages.length !== input.lignes.length) {
      throw new AjournementEcolageNotFoundError(); // Lève une erreur si le nombre d'écolages trouvés ne correspond pas au nombre de lignes fournies.
    }

    const eleveIds = [...new Set(ecolages.map((ecolage) => ecolage.eleveId))]; // Récupère les identifiants uniques des élèves à partir des écolages trouvés.
    const liens = await prisma.responsableEleve.count({
      where: { responsableId: parent.id, eleveId: { in: eleveIds } },
    });
    if (liens !== eleveIds.length) {
      throw new AjournementEleveNonLieError(); // Lève une erreur si le parent n'est pas lié à tous les élèves des écolages fournis.
    }

    const ecolageParId = new Map(
      ecolages.map((ecolage) => [ecolage.id, ecolage]),
    ); // Crée une map des écolages par leur identifiant pour un accès rapide.
    const lignes: {
      eleveId: string;
      ecolageId: string;
      dateEcheanceOrigine: Date;
      dateDemandee: Date;
    }[] = [];

    for (const ligne of input.lignes) {
      const ecolage = ecolageParId.get(ligne.ecolageId)!; // Récupère l'écolage correspondant à la ligne actuelle.

      if (ecolage.statutPaiement === "PAYE") {
        throw new AjournementEcolageSoldeError();
      }

      const echeance = await resoudreEcheance(prisma, ecolage);
      if (!echeance) {
        throw new AjournementEcheanceIntrouvableError();
      }
      if (ligne.dateDemandee <= echeance) {
        throw new AjournementDateInvalideError();
      }

      lignes.push({
        eleveId: ecolage.eleveId,
        ecolageId: ecolage.id,
        dateEcheanceOrigine: echeance,
        dateDemandee: ligne.dateDemandee,
      });
    }

    try {
      const cree = await prisma.$transaction(async (tx) => {
        const doublon = await tx.ajournementLigne.findFirst({
          where: {
            ecolageId: { in: lignes.map((ligne) => ligne.ecolageId) },
            estActive: true,
          },
          select: { id: true },
        });
        if (doublon) {
          throw new AjournementDoublonError();
        }

        return tx.ajournement.create({
          data: {
            schoolId: parent.schoolId,
            parentId: parent.id,
            motif: input.motif,
            ligne: { create: lignes },
          },
          select: { id: true },
        });
      });

      return toResponse(await chargerDetail(cree.id));
    } catch (error) {
      // Filet de sécurité: l'index unique partiel couvre les créations concurrentes.
      if (estConflitUnique(error)) {
        throw new AjournementDoublonError();
      }
      throw error;
    }
  }

  /**
   * Liste les ajournements demandés par le parent connecté.
   * @param query Les critères de filtrage pour lister les ajournements.
   * @param user Le contexte utilisateur du parent effectuant la requête.
   * @returns La liste des ajournements correspondant aux critères spécifiés.
   */
  static async listerMesDemandes(
    query: ListeAjournemntQuery,
    user: UserContext,
  ): Promise<AjournementListResponse> {
    const parent = await getParents(user);
    return lister(construireWhere(query, parent.schoolId, parent.id), query);
  }

  /**
   * Récupère les détails d'une demande d'ajournement spécifique pour le parent connecté.
   * @param id L'identifiant de la demande d'ajournement à récupérer.
   * @param user Le contexte utilisateur du parent effectuant la requête.
   * @returns Les détails de la demande d'ajournement spécifiée.
   */
  static async getMaDemande(
    id: string,
    user: UserContext,
  ): Promise<AjournementResponse> {
    return toResponse(await chargerPourParent(id, user));
  }

  /**
   * Annule une demande d'ajournement spécifique pour le parent connecté.
   * @param id L'identifiant de la demande d'ajournement à annuler.
   * @param user Le contexte utilisateur du parent effectuant la requête.
   * @returns Les détails de la demande d'ajournement après son annulation.
   */
  static async annuler(
    id: string,
    user: UserContext,
  ): Promise<AjournementResponse> {
    await chargerPourParent(id, user);

    await prisma.$transaction(async (tx) => {
      await changeStatut(tx, id, "EN_ATTENTE", { statut: "ANNULE" }); // Change le statut de l'ajournement de "EN_ATTENTE" à "ANNULE"
      await desactiverLignes(tx, id); // Désactive toutes les lignes associées à l'ajournement annulé.
    });
    return toResponse(await chargerDetail(id)); // Retourne les détails de la demande d'ajournement après son annulation.
  }

  /**
   * Permet au parent de répondre à une contre-proposition pour une demande d'ajournement spécifique.
   * @param id L'identifiant de la demande d'ajournement pour laquelle le parent répond à la contre-proposition.
   * @param input Les informations de la réponse du parent à la contre-proposition.
   * @param user Le contexte utilisateur du parent effectuant la réponse.
   * @returns Les détails de la demande d'ajournement après la réponse à la contre-proposition.
   */
  static async repondreContreProposition(
    id: string,
    input: ReponseContrePropositionInput,
    user: UserContext,
  ): Promise<AjournementResponse> {
    const ajournement = await chargerPourParent(id, user);
    const accepte = input.decision === "ACCEPTER";
    const statut: StatutAjournement = accepte
      ? "CONTRE_PROPOSITION_ACCEPTE"
      : "CONTRE_PROPOSITION_REFUSE";

    await prisma.$transaction(async (tx) => {
      await changeStatut(tx, id, "CONTRE_PROPOSITION", {
        statut,
        dateReponseParent: new Date(),
      });

      if (accepte) {
        await appliquerDates(
          tx,
          ajournement.ligne.map((ligne) => ({
            id: ligne.id,
            ecolageId: ligne.ecolageId,
            date: ligne.dateProposee ?? ligne.dateDemandee,
          })),
        );
      } else {
        await desactiverLignes(tx, id); // Désactive toutes les lignes associées à l'ajournement refusé.
      }
    });

    if (ajournement.traiteParId) {
      notifierAjournement({
        destinataireUserId: ajournement.traiteParId,
        type: `AJOURNEMENT_${statut}`,
        ajournementId: id,
        statut,
        commentaire: null,
      });
    }

    return toResponse(await chargerDetail(id));
  }

  // -------------------- ADMIN ----------------------

  /**
   * Lister toutes les demandes d'ajournement
   * @param query Les critères de filtrage pour lister les demandes d'ajournement.
   * @param user Le contexte utilisateur effectuant la requête.
   * @returns La liste des demandes d'ajournement correspondant aux critères de filtrage.
   */
  static async listerToutes(
    query: ListeAjournemntQuery,
    user: UserContext,
  ): Promise<AjournementListResponse> {
    let schoolId: string | null;
    if (user.role === "SUDO_ADMIN") {
      schoolId = null;
    } else {
      if (!user.schoolId) {
        throw new AjournementForbiddenError(
          "Aucune école associée à l'utilisateur",
        );
      }
      schoolId = user.schoolId;
    }

    return lister(construireWhere(query, schoolId, query.parentId ?? null), query);
  }

  /**
   * Obtenir les détails d'une demande d'ajournement spécifique.
   * @param id L'identifiant de la demande d'ajournement dont on souhaite obtenir les détails.
   * @param user Le contexte utilisateur effectuant la requête.
   * @returns Les détails de la demande d'ajournement spécifiée.
   */
  static async getDetail(
    id: string,
    user: UserContext,
  ): Promise<AjournementResponse> {
    return toResponse(await chargerPourAdmin(id, user));
  }

  static async accepter(
    id: string,
    input: AccepterAjournementInput,
    user: UserContext,
  ): Promise<AjournementResponse> {
    const ajournement = await chargerPourAdmin(id, user); // Charger les détails de l'ajournement pour l'administrateur.

    await prisma.$transaction(async (tx) => {
      await changeStatut(tx, id, "EN_ATTENTE", {
        statut: "ACCEPTE",
        commentaireAdmin: input.commentaire ?? null,
        traiteParId: user.id,
        dateDecision: new Date(),
      });

      await appliquerDates(
        tx,
        ajournement.ligne.map((ligne) => ({
          id: ligne.id,
          ecolageId: ligne.ecolageId,
          date: ligne.dateDemandee,
        })),
      );
    });

    this.notifierParent(ajournement, "ACCEPTE", input.commentaire ?? null);
    return toResponse(await chargerDetail(id));
  }

  static async refuser(
    id: string,
    input: RefuserAjournementInput,
    user: UserContext,
  ): Promise<AjournementResponse> {
    const ajournement = await chargerPourAdmin(id, user); // Charger les détails de l'ajournement pour l'administrateur.

    await prisma.$transaction(async (tx) => {
      await changeStatut(tx, id, "EN_ATTENTE", {
        statut: "REFUSE",
        commentaireAdmin: input.commentaire,
        traiteParId: user.id,
        dateDecision: new Date(),
      });
      await desactiverLignes(tx, id);
    });

    this.notifierParent(ajournement, "REFUSE", input.commentaire);
    return toResponse(await chargerDetail(id));
  }

  static async contreProposer(
    id: string,
    input: ContrePropositionInput,
    user: UserContext,
  ): Promise<AjournementResponse> {
    const ajournement = await chargerPourAdmin(id, user); // Charger les détails de l'ajournement pour l'administrateur.

    // Crée une map des lignes existantes pour vérifier la validité des lignes proposées.
    const lignesParId = new Map(
      ajournement.ligne.map((ligne) => [ligne.id, ligne]),
    );
    if (
      input.lignes.length !== lignesParId.size ||
      input.lignes.some((l) => !lignesParId.has(l.ligneId))
    ) {
      throw new AjournementLignesInvaldesError();
    }

    // Vérifie que toutes les lignes proposées correspondent aux lignes existantes et qu'aucune ligne n'est manquante.
    for (const propose of input.lignes) {
      const ligne = lignesParId.get(propose.ligneId)!;
      if (propose.dateProposee <= ligne.dateEcheanceOrigine) {
        throw new AjournementDateInvalideError();
      }
    }

    // Met à jour le statut de l'ajournement et les dates proposées pour chaque ligne.
    await prisma.$transaction(async (tx) => {
      await changeStatut(tx, id, "EN_ATTENTE", {
        statut: "CONTRE_PROPOSITION",
        commentaireAdmin: input.commentaire,
        traiteParId: user.id,
        dateDecision: new Date(),
      });
      // Met à jour les dates proposées pour chaque ligne d'ajournement.
      for (const propose of input.lignes) {
        await tx.ajournementLigne.update({
          where: { id: propose.ligneId },
          data: { dateProposee: propose.dateProposee },
        });
      }
    });

    // Notifie le parent de la contre-proposition.
    this.notifierParent(ajournement, "CONTRE_PROPOSITION", input.commentaire);
    return toResponse(await chargerDetail(id));
  }

  // appelé après commit : une notification en échec ne doit jamais annuler la décision
  private static notifierParent(
    ajournement: AjournementDetail,
    statut: StatutAjournement,
    commentaire: string | null,
  ): void {
    if (!ajournement.parent.userId) return;
    notifierAjournement({
      destinataireUserId: ajournement.parent.userId,
      type: `AJOURNEMENT_${statut}`,
      ajournementId: ajournement.id,
      statut,
      commentaire,
    });
  }
}
