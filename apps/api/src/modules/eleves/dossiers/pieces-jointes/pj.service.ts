import { randomUUID } from "crypto";
import { Prisma } from "../../../../generated/prisma/browser.js";
import { prisma } from "../../../../lib/prisma.js";
import { CreerUploadAttachementUrlInput } from "./pj.schema.js";
import {
  creerUrlTelechargement,
  creerUrlUpload,
  supprimerObject,
  veriferObject,
} from "../../../../lib/r2.service.js";

type UserContext = {
  id: string;
  role: string;
  schoolId: string | null;
};

const MAX_FILE_SIZE = 2 * 1024 * 1024; // Maximum file size 2MB

export class EleveAttachementError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "EleveAttachementError";
  }
}

/**
 * Vérifie que l'utilisateur appartient à une école et retourne un filtre pour les élèves de cette école.
 * @param user L'utilisateur courant
 * @returns Un objet Prisma.EleveWhereInput pour filtrer les élèves par école
 */
function requireSchool(user: UserContext): Prisma.EleveWhereInput {
  if (user.role === "SUDO_ADMIN") return {};
  if (!user.schoolId) {
    throw new EleveAttachementError(
      "Vous devez appartenir à une école pour accéder à ces documents",
      403,
    );
  }
  return { schoolId: user.schoolId };
}

/**
 * Nettoie et normalise le nom d'un fichier en supprimant les caractères non autorisés et en limitant sa longueur.
 * @param fileName Le nom du fichier à nettoyer
 * @returns Le nom de fichier nettoyé et normalisé
 */
function nettoyerNomFichier(fileName: string) {
  const baseName = fileName
    .replace(/\\/g, "/") // Remplace les backslashes par des slashes
    .split("/") // Sépare le chemin en segments
    .pop() // Récupère le dernier segment du chemin, c'est-à-dire le nom de fichier
    ?.normalize("NFKD") // Normalise le nom de fichier pour séparer les caractères accentués de leurs diacritiques
    .replace(/[\u0300-\u036f]/g, "") // Supprime les diacritiques
    .replace(/[^A-Za-z0-9._-]/g, "_") // Remplace les caractères non autorisés par des underscores
    .replace(/_+/g, "_") // Remplace les multiples underscores consécutifs par un seul underscore
    .slice(0, 120); // Limite la longueur du nom de fichier à 120 caractères
  return baseName || "document"; // Retourne "document" si le nom de fichier est vide
}

/**
 * Vérifie que l'élève existe et que l'utilisateur a accès à cet élève.
 * @param eleveId L'ID de l'élève à vérifier
 * @param user L'utilisateur courant
 * @returns L'élève trouvé
 * @throws EleveAttachementError si l'élève n'existe pas ou si l'utilisateur n'a pas accès
 */
async function verifierEleve(eleveId: string, user: UserContext) {
  const eleve = await prisma.eleve.findFirst({
    where: { id: eleveId, deletedAt: null, ...requireSchool(user) },
    select: { id: true, schoolId: true, school: { select: { nom: true } } },
  });

  if (!eleve) {
    throw new EleveAttachementError("Eleve introuvable", 404);
  }

  return eleve;
}

/**
 * Trouve une pièce jointe et vérifier l'accès de l'utilisateur
 * @param pjId L'ID de la pièce jointe à vérifier
 * @param user L'utilisateur courant
 * @returns La pièce jointe trouvée
 * @throws EleveAttachementError si l'utilisateur n'a pas accès
 */
async function trouverPieceJointe(
  pjId: string,
  user: UserContext,
  eleveId?: string,
) {
  if (user.role !== "SUDO_ADMIN" && !user.schoolId) {
    throw new EleveAttachementError(
      "Vous devez appartenir à une école pour accéder à ces documents",
      403,
    );
  }

  const pieceJointe = await prisma.eleveAttachement.findFirst({
    where: {
      id: pjId,
      ...(eleveId ? { eleveId } : {}),
      ...(user.role === "SUDO_ADMIN" ? {} : { schoolId: user.schoolId! }), // Restreint l'accès aux pièces jointes de l'école de l'utilisateur si ce n'est pas un SUDO_ADMIN
    },
  });
  if (!pieceJointe) {
    throw new EleveAttachementError(
      "Pièce jointe introuvable ou accès refusé",
      404,
    );
  }
  return pieceJointe;
}

export class EleveAttachementService {
  /**
   * Liste les pièces jointes d'un élève
   * @param eleveId L'ID de l'élève
   * @param user L'utilisateur courant
   * @returns La liste des pièces jointes de l'élève
   * @throws EleveAttachementError si l'élève n'existe pas ou si l'utilisateur n'a pas accès
   */
  static async lister(eleveId: string, archived: boolean, user: UserContext) {
    const eleve = await verifierEleve(eleveId, user); // Vérifie que l'élève existe et que l'utilisateur a accès

    return prisma.eleveAttachement.findMany({
      where: {
        eleveId: eleve.id,
        schoolId: eleve.schoolId,
        status: "READY",
        archivedAt: archived ? { not: null } : null,
      },
      select: {
        id: true,
        type: true,
        fileName: true,
        mimeType: true,
        sizeBytes: true,
        createdAt: true,
        verifiedAt: true,
        archivedAt: true,
        createdBy: {
          select: { id: true, nom: true, prenom: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   *
   * @param eleveId L'ID de l'élève
   * @param input Les informations pour créer l'URL de téléchargement
   * @param user L'utilisateur courant
   * @returns L'URL de téléchargement et les informations associées
   */
  static async creerAttachementUploadUrl(
    eleveId: string,
    input: CreerUploadAttachementUrlInput,
    user: UserContext,
  ) {
    if (input.sizeBytes > MAX_FILE_SIZE) {
      throw new EleveAttachementError(
        "Le fichier ne doit pas dépasser 2 Mo qui est la taille maximale autorisée",
        400,
      );
    }

    const eleve = await verifierEleve(eleveId, user); // Vérifie que l'élève existe et que l'utilisateur a accès
    const fileName = nettoyerNomFichier(input.fileName); // Nettoie le nom du fichier pour éviter les caractères indésirables
    const objectKey =
      `schools/${eleve.school.nom}/elevesid=${eleve.id}/dossiers/piecesjointes/` + // Chemin de stockage de la pièce jointe dans l'espace de stockage
      `${randomUUID()}_${fileName}`;

    const attachement = await prisma.eleveAttachement.create({
      data: {
        schoolId: eleve.schoolId,
        eleveId: eleve.id,
        createdById: user.id,
        type: input.type,
        status: "PENDING_UPLOAD",
        fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        objectKey,
      },
      select: { id: true },
    });

    try {
      const uploadUrl = await creerUrlUpload(objectKey, input.mimeType);
      return {
        attachmentId: attachement.id,
        uploadUrl,
        method: "PUT" as const,
        headers: { "content-Type": input.mimeType },
        expiresIn: 300,
      };
    } catch (error) {
      // En cas d'erreur lors de la création de l'URL de téléchargement, supprime l'attachement créé pour éviter les fichiers orphelins
      await prisma.eleveAttachement.delete({
        where: { id: attachement.id },
      });
      throw error;
    }
  }

  /**
   * Confirme que l'upload d'une pièce jointe a été effectué correctement en vérifiant sa présence et ses métadonnées dans le stockage.
   * @param attachementId L'ID de la pièce jointe à confirmer
   * @param user Le contexte utilisateur effectuant l'action
   * @returns Les informations mises à jour de la pièce jointe
   */
  static async confirmerUpload(
    eleveId: string,
    attachementId: string,
    user: UserContext,
  ) {
    const attachement = await trouverPieceJointe(attachementId, user, eleveId); // Vérifie que l'attachement appartient à l'élève et à l'école

    if (attachement.status !== "PENDING_UPLOAD") {
      throw new EleveAttachementError(
        "Cette pièce jointe a déjà été validée.",
        409,
      );
    }

    let head: Awaited<ReturnType<typeof veriferObject>>; // Contiendra les informations de l'objet dans le stockage (ex: taille, type MIME)
    try {
      head = await veriferObject(attachement.objectKey); // Récupère les informations de l'objet dans le stockage (ex: taille, type MIME)
    } catch (error) {
      throw new EleveAttachementError(
        "Le fichier n'a pas été trouvé dans le stockage. Réessayer l'envoi",
        409,
      );
    }

    if (
      head.ContentLength !== attachement.sizeBytes ||
      head.ContentType !== attachement.mimeType
    ) {
      await supprimerObject(attachement.objectKey); // Supprime l'objet du stockage si sa taille ou son type MIME ne correspond pas à ce qui est attendu
      await prisma.eleveAttachement.delete({
        where: { id: attachement.id },
      });
      throw new EleveAttachementError(
        "Le fichier envoyé ne correspond pas aux métadonnées déclarées.",
        400,
      );
    }

    return prisma.eleveAttachement.update({
      where: { id: attachement.id },
      data: {
        status: "READY",
        verifiedAt: new Date(), // Date de vérification de l'attachement
      },
      select: {
        id: true,
        type: true,
        fileName: true,
        mimeType: true,
        sizeBytes: true,
        status: true,
        verifiedAt: true,
      },
    });
  }

  /**
   * Crée une URL de téléchargement pour une pièce jointe prête à être téléchargée.
   * @param attachementId L'ID de la pièce jointe
   * @param user Le contexte utilisateur effectuant l'action
   * @returns Un objet contenant l'URL de téléchargement et sa durée de validité en secondes
   */
  static async creerUrlTelechargement(
    eleveId: string,
    attachementId: string,
    user: UserContext,
  ) {
    const attachement = await trouverPieceJointe(attachementId, user, eleveId); // Vérifie que l'attachement appartient à l'élève et à l'école

    if (attachement.status !== "READY" || attachement.archivedAt) {
      throw new EleveAttachementError(
        "Cette pièce jointe n'est pas encore disponbile",
        409,
      );
    }

    const url = await creerUrlTelechargement(
      attachement.objectKey,
      attachement.fileName,
      attachement.mimeType,
    );

    return { url, expiresIn: 300 }; // Retourne l'URL de téléchargement et sa durée de validité en secondes
  }

  static async archiver(
    eleveId: string,
    attachementId: string,
    user: UserContext,
  ) {
    const attachement = await trouverPieceJointe(attachementId, user, eleveId);
    if (attachement.status !== "READY") {
      throw new EleveAttachementError("Pièce jointe non disponible.", 409);
    }
    if (attachement.archivedAt) {
      throw new EleveAttachementError("Pièce jointe déjà archivée.", 409);
    }
    return prisma.eleveAttachement.update({
      where: { id: attachement.id },
      data: { archivedAt: new Date() },
      select: { id: true, archivedAt: true },
    });
  }

  static async restaurer(
    eleveId: string,
    attachementId: string,
    user: UserContext,
  ) {
    const attachement = await trouverPieceJointe(attachementId, user, eleveId);
    if (!attachement.archivedAt) {
      throw new EleveAttachementError("Pièce jointe non archivée.", 409);
    }
    return prisma.eleveAttachement.update({
      where: { id: attachement.id },
      data: { archivedAt: null },
      select: { id: true, archivedAt: true },
    });
  }

  static async supprimer(
    eleveId: string,
    attachementId: string,
    user: UserContext,
  ) {
    const attachement = await trouverPieceJointe(attachementId, user, eleveId); // Vérifie que l'attachement appartient à l'élève et à l'école

    await supprimerObject(attachement.objectKey); // Supprime l'objet du stockage
    await prisma.eleveAttachement.delete({
      where: { id: attachement.id },
    });

    return { id: attachement.id }; // Retourne l'ID de la pièce jointe supprimée
  }
}
