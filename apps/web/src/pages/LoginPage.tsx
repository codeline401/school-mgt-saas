import { useState } from "react";
import { Link } from "react-router-dom";
import { LogIn, Loader2, GraduationCap } from "lucide-react";
import { useLogin } from "../hooks/useAuth";
import { getApiError } from "../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {/* Cercles décoratifs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #4caf50, transparent)",
          }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #3949ab, transparent)",
          }}
        />
      </div>

      <div className="relative max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, #2e7d32, #4caf50)" }}
          >
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white font-display">
            School SaaS
          </h1>
          <p className="text-blue-200 mt-2 font-medium">
            Plateforme de Gestion Scolaire 🇲🇬
          </p>
        </div>

        {/* Carte DaisyUI */}
        <div className="card bg-base-100 shadow-2xl">
          <div className="card-body gap-5">
            {/* Erreur API */}
            {loginMutation.isError && (
              <div role="alert" className="alert alert-error alert-soft">
                <span>
                  {getApiError(loginMutation.error, "Identifiants incorrects")}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Email professionnel</legend>
                <input
                  id="email"
                  type="email"
                  className="input w-full"
                  placeholder="nom@ecole.mg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Mot de passe</legend>
                <input
                  id="password"
                  type="password"
                  className="input w-full"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </fieldset>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="btn btn-success btn-block mt-2"
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

            <div className="divider text-xs text-base-content/40">
              Pas encore de compte ?
            </div>

            <Link to="/register" className="btn btn-ghost btn-block">
              Créer un compte
            </Link>
          </div>
        </div>

        <p className="text-center text-blue-300/50 text-xs mt-6">
          by codeline401 © 2026 School SaaS Madagascar — Tous droits réservés
        </p>
      </div>
    </div>
  );
}
