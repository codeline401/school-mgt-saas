/*import axios from "axios";
import { useAuthStore } from "../store/authStore.js";

const envBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

if (import.meta.env.PROD && !envBaseUrl) {
  throw new Error("VITE_API_URL must be defined in production");
}

export const api = axios.create({
  baseURL: envBaseUrl ?? "http://localhost:5000",
  timeout: 10_000, // 10 secondes
});*/

import axios from "axios";
import { useAuthStore } from "../store/authStore.js";

const envBaseUrl = import.meta.env.VITE_API_URL;

if (import.meta.env.PROD && !envBaseUrl) {
  throw new Error("VITE_API_URL must be defined in production");
}

export const api = axios.create({
  baseURL: envBaseUrl ?? "https://futur-ecole.com",
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

export function getApiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === "string" && data.trim()) return data.trim();
    if (data && typeof data === "object") {
      const raw = (data as { error?: unknown }).error;
      if (typeof raw === "string") return raw || fallback;
      if (Array.isArray(raw))
        return (
          raw
            .map((issue: unknown) =>
              typeof issue === "object" && issue !== null && "message" in issue
                ? String((issue as { message?: unknown }).message ?? "")
                : String(issue),
            )
            .join(", ") || fallback
        );
      if (raw && typeof raw === "object" && "message" in raw)
        return String((raw as { message: unknown }).message) || fallback;
    }
  }
  return fallback;
}

// SUppression de l'élève
export const deleteEleve = async (id: string) => {
  try {
    const response = await api.delete(`/api/eleves/${id}`);
    return response.data;
  } catch (err) {
    console.error("Erreur lors de la suppresion de l'élève :", err);
    throw err;
  }
};
