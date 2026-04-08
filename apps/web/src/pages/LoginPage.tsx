import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import type { AxiosError } from "axios";
import { AlertCircle, Loader2, LogIn } from "lucide-react";

function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth); // Récupère la fonction setAuth du store d'authentification

  // Etats Locaux seulement pour le formulaire
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Définition de la mutation avec tanStack Query
  const loginMutation = useMutation({
    // La fonction qui appelle notre API pour se connecter
    mutationFn: async () => {
      const response = await api.post("/api/auth/login", { email, password });
      return response.data; // L'API renvoie { user, token}
    },

    // Ce qu'on fait si la connexion réussit
    onSuccess: (data) => {
      // On range le token et l'user dans le store de Zustand
      setAuth(data.user, data.token);
      // On redirige vers la page d'accueil ou le dashboard
      navigate("/");
    },
  });

  // Gestion du submit du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Empêche le rechargement de la page
    loginMutation.mutate(); // Lance la mutation de connexion
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="relative max-w-md w-full">
        {/* Logo / header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/40 mb-4">
            <LogIn size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            School Management
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Connectez-vous pour continuer
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl p-8">
          {/* Erreur */}
          {loginMutation.isError && (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-center gap-3 bg-red-500/10 text-red-400 p-4 rounded-xl mb-6 text-sm border border-red-500/20"
            >
              <AlertCircle size={18} className="shrink-0" />
              <span>
                {(loginMutation.error as AxiosError<{ error: string }>)
                  ?.response?.data?.error || "Erreur de connexion"}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600/50 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
              >
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600/50 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-[.98] text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loginMutation.isPending ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <LogIn size={20} />
                  Se connecter
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
