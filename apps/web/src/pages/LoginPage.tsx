import { useState } from "react";
import { Link } from "react-router-dom";
import { LogIn, Loader2, AlertCircle, GraduationCap } from "lucide-react";
import { useLogin } from "../hooks/useAuth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div
      className="min-h-screen bg-texture flex items-center justify-center p-6"
      style={{
        background:
          "linear-gradient(135deg, #0a0e45 0%, #1a237e 50%, #0d3b0e 100%)",
      }}
    >
      {/* Cercles décoratifs en arrière-plan */}
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
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, #2e7d32, #4caf50)" }}
          >
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1
            className="text-4xl font-bold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            School SaaS
          </h1>
          <p className="text-blue-200 mt-2 font-medium">
            Plateforme de Gestion Scolaire 🇲🇬
          </p>
        </div>

        {/* Carte du formulaire */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden shadow-2xl">
          <div className="p-8">
            {loginMutation.isError && (
              <div className="flex items-center gap-3 bg-red-500/20 text-red-200 p-4 rounded-2xl mb-6 text-sm border border-red-500/30">
                <AlertCircle size={18} />
                <span>
                  {(
                    loginMutation.error as {
                      response?: { data?: { error?: string } };
                    }
                  )?.response?.data?.error || "Identifiants incorrects"}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-blue-100 mb-2">
                  Email professionnel
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="nom@ecole.mg"
                  className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-blue-300/50 focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-blue-100 mb-2">
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-blue-300/50 focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white transition-all active:scale-95 disabled:opacity-60 mt-2"
                style={{
                  background: "linear-gradient(135deg, #2e7d32, #4caf50)",
                }}
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

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-blue-200 text-sm">
                Pas encore de compte ?{" "}
                <Link
                  to="/register"
                  className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Créer un compte
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-blue-300/50 text-xs mt-6">
          by codeline401 © 2026 School SaaS Madagascar — Tous droits réservés
        </p>
      </div>
    </div>
  );
}
