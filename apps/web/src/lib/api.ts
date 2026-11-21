import axios from "axios";
import { useAuthStore } from "../store/authStore.js";

const envBaseUrl = import.meta.env.VITE_API_URL;

if (import.meta.env.PROD && !envBaseUrl) {
  throw new Error("VITE_API_URL must be defined in production");
}

export const api = axios.create({
  baseURL: envBaseUrl ?? "https://e-anatra.online",
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gestion des erreurs: Si le token est expiré ou invalide, on peut gérer la déconnexion automatique
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout(); // Déconnexion automatique si le token est invalide
    }
    return Promise.reject(error); // Rejette l'erreur pour que les composants puissent la gérer
  },
);

/**
 * Extrait le texte d'une valeur inconnue, en gérant les chaînes, les tableaux et les objets.
 * @param value La valeur à extraire, qui peut être de type inconnu.
 * @returns Le texte extrait ou `null` si aucune information n'est disponible.
 */
function extractFromUnknown(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((item: unknown) => {
        if (typeof item === "string") {
          return item.trim();
        }
        if (item && typeof item === "object") {
          const record = item as {
            field?: unknown;
            path?: unknown;
            message?: unknown;
          };
          const msg =
            typeof record.message === "string" ? record.message.trim() : "";
          const field =
            typeof record.field === "string"
              ? record.field.trim()
              : Array.isArray(record.path)
                ? record.path.map(String).join(".")
                : typeof record.path === "string"
                  ? record.path.trim()
                  : "";
          if (field && msg) return `${field}: ${msg}`;
          return msg;
        }
        return String(item ?? "").trim();
      })
      .filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : null;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    if ("message" in record && typeof record.message === "string") {
      const trimmed = record.message.trim();
      if (trimmed) return trimmed;
    }

    const entries = Object.entries(record)
      .flatMap(([key, val]) => {
        if (typeof val === "string") {
          const trimmed = val.trim();
          return trimmed ? [`${key}: ${trimmed}`] : [];
        }
        if (Array.isArray(val)) {
          return val
            .map((v) => String(v ?? "").trim())
            .filter(Boolean)
            .map((v) => `${key}: ${v}`);
        }
        return [];
      })
      .filter(Boolean);

    return entries.length > 0 ? entries.join(", ") : null;
  }

  return null;
}

/**
 * Extrait le message d'erreur d'une erreur Axios ou retourne un texte de secours si aucune information n'est disponible.
 * @param error L'erreur à analyser, généralement une erreur Axios.
 * @param fallback Le texte à retourner si aucune information d'erreur n'est disponible.
 * @returns Le message d'erreur extrait ou le texte de secours.
 */
export function getApiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === "string") {
      const trimmed = data.trim();
      if (trimmed) return trimmed;
    }

    if (data && typeof data === "object") {
      const payload = data as {
        error?: unknown;
        errors?: unknown;
        message?: unknown;
      };

      const errorText = extractFromUnknown(payload.error);
      const errorsText = extractFromUnknown(payload.errors);
      const messageText = extractFromUnknown(payload.message);

      // Conserve le comportement existant sur `error` (ex. doublon de nom),
      // tout en exposant `errors` lorsque disponible
      if (errorText) {
        if (
          errorsText &&
          !errorText.toLowerCase().includes(errorsText.toLowerCase())
        ) {
          return `${errorText} (${errorsText})`;
        }
        return errorText;
      }

      if (errorsText) {
        return errorsText;
      }

      if (messageText) {
        return messageText;
      }
    }
  }

  return fallback;
}

// Suppression de l'élève
export const deleteEleve = async (id: string) => {
  try {
    const response = await api.delete(`/api/eleves/${id}`);
    return response.data;
  } catch (err) {
    console.error("Erreur lors de la suppression de l'élève :", err);
    throw err;
  }
};
