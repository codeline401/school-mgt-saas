import { useState } from "react";
import { Link } from "react-router-dom";
import { LogIn, Loader2, GraduationCap } from "lucide-react";
import { useLogin } from "../hooks/useAuth";
import { getApiError } from "../lib/api";
import { themeHex } from "../lib/themeTokens";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [schoolId, setSchoolId] = useState("");

  const loginMutation = useLogin();
  const schools =
    loginMutation.data && loginMutation.data.requireSchool
      ? loginMutation.data.schools
      : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password, schoolId: schoolId || undefined });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {/* Cercles décoratifs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{
            background: `radial-gradient(circle, ${themeHex.accent}, transparent)`,
          }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{
            background: `radial-gradient(circle, ${themeHex.primary}, transparent)`,
          }}
        />
      </div>

      <div className="relative max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background: `linear-gradient(135deg, ${themeHex.primary}, ${themeHex.accent})`,
            }}
          >
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-text-main font-display">
            e-anatra
          </h1>
          <p className="text-muted mt-2 font-medium">Plateforme INTSA</p>
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

              {schools && (
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Ecole à consulter</legend>
                  <select
                    className="select w-full"
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Choisir une école
                    </option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.nom}
                      </option>
                    ))}
                  </select>
                </fieldset>
              )}

              <button
                type="submit"
                disabled={loginMutation.isPending}
                aria-busy={loginMutation.isPending}
                className="btn btn-primary btn-block mt-2"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2
                      className="animate-spin"
                      aria-hidden="true"
                      size={20}
                    />
                    <span className="sr-only">Connexion en cours…</span>
                  </>
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

        <p className="text-center text-muted/80 text-xs mt-6">
          by codeline401 © 2026 School SaaS Madagascar — Tous droits réservés
        </p>
      </div>
    </div>
  );
}
