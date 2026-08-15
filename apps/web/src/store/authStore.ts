// permet de stocker les données utilisateurs et le token d'authentification dans la mémore du navigateur
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { queryClient } from "../lib/queryClient";

// définition de la structure d'un utilisateur connecté
interface User {
  id: string;
  nom: string; //
  prenom: string; //
  email: string;
  role: "SUDO_ADMIN" | "ADMIN" | "USER" | "PROF" | "ELEVE" | "PARENT";
  schoolId: string | null;
}

// interface pour le store d'authentification
interface AuthState {
  user: User | null; // utilisateur connecté
  token: string | null; // token d'authentification
  // fonction pour enregistrer les données après la connexion
  setAuth: (user: User, token: string) => void;

  // fonction pour tout effacer lors de la déconnexion
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        // Nettoie les données des requêtes précédemment chargées avant
        // de charger le compte d'un autre établissement.
        queryClient.clear();
        set({ user, token });
      },
      logout: () => {
        queryClient.clear();
        set({ user: null, token: null });
      },
    }),
    {
      name: "auth-storage-school-mgt", // nom de la clé dans le localStorage
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        const state = (persistedState ?? {}) as Partial<AuthState>;
        if (version < 1 && state.user) {
          state.user = {
            ...state.user,
            nom: state.user.nom ?? "",
            prenom: state.user.prenom ?? "",
          };
        }
        return state as AuthState;
      },
    },
  ),
);
