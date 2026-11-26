import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const DEFAULT_PRESIGNED_EXPIRES_IN = 300; // 5 minutes

function requireEnv(name: string): string {
  const value = process.env[name]?.trim(); // Récupère et nettoie la variable d'environnement
  if (!value) {
    throw new Error(
      `Variable d'environnement ${name} manquante ou non définie`,
    );
  }
  return value;
}

function sanitizeContentDispositionFileName(fileName: string): {
  asciiFallback: string;
  encodedUtf8: string;
} {
  // Supprime les caractères de contrôle pour éviter toute injection d'en-tête HTTP
  const cleaned =
    fileName.replace(/[\r\n\x00-\x1f\x7f]/g, "_").trim() || "document";
  const asciiFallback =
    cleaned
      .normalize("NFKD")
      .replace(/[^\x20-\x7E]/g, "_")
      .replace(/"/g, "_") || "document";
  const encodedUtf8 = encodeURIComponent(cleaned);

  return { asciiFallback, encodedUtf8 };
}

type R2RuntimeConfig = {
  accountId: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
};

let r2RuntimeConfig: R2RuntimeConfig | null = null;
let r2Client: S3Client | null = null;

function getR2RuntimeConfig(): R2RuntimeConfig {
  if (!r2RuntimeConfig) {
    r2RuntimeConfig = {
      accountId: requireEnv("R2_ACCOUNT_ID"),
      bucketName: requireEnv("R2_BUCKET_NAME"),
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    };
  }
  return r2RuntimeConfig;
}

function getR2Client(): S3Client {
  if (!r2Client) {
    const config = getR2RuntimeConfig();
    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return r2Client;
}

export function getR2BucketName(): string {
  return getR2RuntimeConfig().bucketName;
}

/**
 * Crée une URL signée en mode création uniquement (If-None-Match: "*")
 * afin d'empêcher l'écrasement d'un objet déjà présent sur R2.
 * @param objectKey La clé de l'objet à créer
 * @param mimeType Le type MIME de l'objet
 * @param expiresIn La durée de validité de l'URL signée en secondes
 * @returns L'URL signée pour l'upload
 * @throws Error si la clé d'objet est vide ou si la création de l'URL échoue
 */
export type PresignedUpload = {
  uploadUrl: string;
  headers: {
    "Content-Type": string;
    "If-None-Match": "*";
  };
  expiresIn: number;
};

export async function creerUrlUpload(
  objectKey: string,
  mimeType: string,
  expiresIn: number = DEFAULT_PRESIGNED_EXPIRES_IN,
): Promise<PresignedUpload> {
  if (!objectKey.trim()) {
    throw new Error("La clé d'objet R2 (objectKey) est obligatoire");
  }

  // IfNoneMatch: "*" impose à R2 de refuser le PUT (412 Precondition Failed) si objectKey existe déjà
  const command = new PutObjectCommand({
    Bucket: getR2BucketName(),
    Key: objectKey,
    ContentType: mimeType,
    IfNoneMatch: "*",
  });

  const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn });

  return {
    uploadUrl,
    headers: {
      "Content-Type": mimeType,
      "If-None-Match": "*",
    },
    expiresIn,
  };
}

/**
 * Vérifie l'existence d'un objet dans le bucket R2 et retourne ses métadonnées.
 * @param objectKey La clé de l'objet à vérifier
 * @returns Les métadonnées de l'objet si trouvé
 * @throws Error si la clé d'objet est vide ou si l'objet n'existe pas
 */
export async function verifierObject(objectKey: string) {
  if (!objectKey.trim()) {
    throw new Error("La clé d'objet R2 (objectKey) est obligatoire");
  }

  return getR2Client().send(
    new HeadObjectCommand({
      Bucket: getR2BucketName(),
      Key: objectKey,
    }),
  );
}

// Alias conservé si d'autres modules importent encore "veriferObject"
export const veriferObject = verifierObject;

/**
 * Crée une URL signée pour le téléchargement (GET) d'un objet depuis le bucket R2.
 * @param objectKey La clé de l'objet à télécharger
 * @param fileName Le nom de fichier à utiliser pour le téléchargement
 * @param mimeType Le type MIME attendu de l'objet
 * @param expiresIn La durée de validité de l'URL signée en secondes
 * @returns L'URL signée pour le téléchargement
 * @throws Error si la clé d'objet est vide ou si la création de l'URL échoue
 */
export async function creerUrlTelechargement(
  objectKey: string,
  fileName: string,
  mimeType: string,
  expiresIn: number = DEFAULT_PRESIGNED_EXPIRES_IN,
): Promise<string> {
  if (!objectKey.trim()) {
    throw new Error("La clé d'objet R2 (objectKey) est obligatoire");
  }

  const { asciiFallback, encodedUtf8 } =
    sanitizeContentDispositionFileName(fileName);

  return getSignedUrl(
    getR2Client(),
    new GetObjectCommand({
      Bucket: getR2BucketName(),
      Key: objectKey,
      ResponseContentDisposition: `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodedUtf8}`,
      ResponseContentType: mimeType,
    }),
    { expiresIn },
  );
}

/**
 * Supprime un objet du bucket R2.
 * @param objectKey La clé de l'objet à supprimer
 * @throws Error si la clé d'objet est vide ou si la suppression échoue
 */
export async function supprimerObject(objectKey: string): Promise<void> {
  if (!objectKey.trim()) {
    throw new Error("La clé d'objet R2 (objectKey) est obligatoire");
  }

  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: getR2BucketName(),
      Key: objectKey,
    }),
  );
}
