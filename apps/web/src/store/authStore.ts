// permet de stocker les données utilisateurs et le token d'authentification dans la mémore du navigateur
import { create } from "zustand";
import { persist } from "zustand/middleware";

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
      setAuth: (user, token) => set({ user, token }), // met à jour le store avec les données de l'utilisateur et le token
      logout: () => set({ user: null, token: null }), // réinitialise le store lors de la déconnexion
    }),
    {
      name: "auth-storage-school-mgt", // nom de la clé dans le localStorage
    },
  ),
);
