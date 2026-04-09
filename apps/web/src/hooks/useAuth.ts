import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { api } from "../lib/api";
import { useNavigate } from "react-router-dom";

// Type pour les données de formulaire
export interface RegisterInput {
  email: string;
  nom: string;
  prenom: string;
  password: string;
  role: "ADMIN" | "USER" | "PROF" | "ELEVE" | "PARENT";
  inviteCode?: string; // Optionnel, requis pour USER, PROF, ELEVE, PARENT
}

export interface LoginInput {
  email: string;
  password: string;
}

// Hook pour l'inscription
export const useRegister = () => {
  const navigate = useNavigate(); // Hook de navigation de React Router

  return useMutation({
    // Fonction de mutation pour s'inscrire
    mutationFn: async (data: RegisterInput) => {
      const response = await api.post("/api/auth/register", data); // Appel à l'API pour s'inscrire
      return response.data; // On retourne les données de l'utilisateur créé
    },

    // Après l'inscription réussie, on redirige vers la page de connexion
    onSuccess: () => {
      navigate("/login"); // Redirection vers la page de connexion
    },
  });
};

// Hook pour la connexion
export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth); // Récupération de la fonction setAuth depuis Zustand
  const navigate = useNavigate(); // Hook de navigation de React Router

  return useMutation({
    // Fonction de mutation pour se connecter
    mutationFn: async (data: LoginInput) => {
      const response = await api.post("/api/auth/login", data); // Appel à l'API pour se connecter
      return response.data; // On retourne les données de l'utilisateur connecté
    },

    // Après la connexion réussie, on stocke les données de l'utilisateur et le token, puis on redirige vers le dashboard
    onSuccess: (data) => {
      setAuth(data.user, data.token); // On stocke l'utilisateur et le token dans Zustand
      navigate("/"); // Redirection vers la page d'accueil du dashboard
    },
  });
};
