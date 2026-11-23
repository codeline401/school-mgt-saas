import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function requireEnv(name: string): string {
  const value = process.env[name]; // Récupère la valeur de la variable d'environnement
  if (!value) {
    throw new Error(
      `Variable d'environnement ${name} manquante ou non définie`,
    );
  }
  return value;
}

const accountId = requireEnv("R2_ACCOUNT_ID"); // Récupère l'ID du compte R2 depuis les variables d'environnement
export const R2_BUCKET_NAME = requireEnv("R2_BUCKET_NAME"); // Récupère le nom du bucket R2 depuis les variables d'environnement

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
  },
});

/**
 * Crée une URL signée pour l'upload d'un objet dans le bucket R2.
 * @param objectKey - La clé de l'objet à uploader.
 * @param mimeType - Le type MIME de l'objet.
 * @returns Une promesse résolue avec l'URL signée pour l'upload.
 */
export async function creerUrlUpload(
  objectKey: string,
  mimeType: string,
): Promise<string> {
  const command = new (await import("@aws-sdk/client-s3")).PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: objectKey,
    ContentType: mimeType,
  });

  return getSignedUrl(r2Client, command, { expiresIn: 300 }); // Génère une URL signée pour l'upload avec une expiration de 5 minutes (300 secondes)
}

/**
 * Vérifie l'existence d'un objet dans le bucket R2.
 * @param objectKey - La clé de l'objet à vérifier.
 * @returns Une promesse résolue avec les métadonnées de l'objet si celui-ci existe, ou une erreur si l'objet n'existe pas.
 */
export async function veriferObject(objectKey: string) {
  return r2Client.send(
    new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
    }),
  );
}

/**
 * Crée une URL signée pour le téléchargement d'un objet depuis le bucket R2.
 * @param objectKey - La clé de l'objet à télécharger.
 * @param fileName - Le nom de fichier à utiliser pour le téléchargement.
 * @param mimeType - Le type MIME de l'objet.
 * @returns Une promesse résolue avec l'URL signée pour le téléchargement.
 */
export async function creerUrlTelechargement(
  objectKey: string,
  fileName: string,
  mimeType: string,
): Promise<string> {
  return getSignedUrl(
    r2Client,
    new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`, // Force le téléchargement avec le nom de fichier spécifié
      ResponseContentType: mimeType, // Définit le type MIME de l'objet pour le téléchargement
    }),
    { expiresIn: 300 }, // Génère une URL signée pour le téléchargement avec une expiration de 5 minutes (300 secondes)
  );
}

/**
 * Supprime un objet du bucket R2.
 * @param objectKey - La clé de l'objet à supprimer.
 * @returns Une promesse résolue lorsque l'objet est supprimé.
 */
export async function supprimerObject(objectKey: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
    }),
  );
}
