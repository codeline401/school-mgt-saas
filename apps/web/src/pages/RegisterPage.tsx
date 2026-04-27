import { useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Loader2, GraduationCap, KeyRound, Info } from "lucide-react";
import { useRegister, type RegisterInput } from "../hooks/useAuth";
import { getApiError } from "../lib/api";

const ROLES = [
  { value: "ADMIN", label: "Directeur / Administrateur" },
  { value: "USER", label: "Collaborateur" },
  { value: "PROF", label: "Professeur" },
  { value: "ELEVE", label: "Élève" },
  { value: "PARENT", label: "Parent d'élève" },
] as const;

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterInput>({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    role: "ADMIN",
    inviteCode: "",
  });

  const registerMutation = useRegister();
  const needsInviteCode = formData.role !== "ADMIN";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "inviteCode" ? value.trim() : value,
      ...(name === "role" && value === "ADMIN" ? { inviteCode: "" } : {}),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: RegisterInput = {
      nom: formData.nom,
      prenom: formData.prenom,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      ...(needsInviteCode ? { inviteCode: formData.inviteCode } : {}),
    };
    registerMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {/* Cercles décoratifs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #4caf50, transparent)",
          }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-10"
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
            Créer un compte
          </h1>
          <p className="text-blue-200 mt-2">
            Rejoignez la plateforme scolaire 🇲🇬
          </p>
        </div>

        {/* Carte DaisyUI */}
        <div className="card bg-base-100 shadow-2xl">
          <div className="card-body gap-4">
            {/* Erreur API */}
            {registerMutation.isError && (
              <div role="alert" className="alert alert-error alert-soft">
                <span>
                  {getApiError(
                    registerMutation.error,
                    "Erreur lors de l'inscription",
                  )}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {/* Nom */}
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Nom</legend>
                <input
                  id="nom"
                  type="text"
                  name="nom"
                  className="input w-full"
                  placeholder="Rakoto"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                />
              </fieldset>

              {/* Prénom */}
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Prénom</legend>
                <input
                  id="prenom"
                  type="text"
                  name="prenom"
                  className="input w-full"
                  placeholder="Jean"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                />
              </fieldset>

              {/* Email */}
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Email professionnel</legend>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className="input w-full"
                  placeholder="nom@ecole.mg"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </fieldset>

              {/* Mot de passe */}
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Mot de passe</legend>
                <input
                  id="password"
                  type="password"
                  name="password"
                  className="input w-full"
                  placeholder="Minimum 6 caractères"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </fieldset>

              {/* Rôle */}
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Je suis un(e)...</legend>
                <select
                  id="role"
                  name="role"
                  className="select w-full"
                  value={formData.role}
                  onChange={handleChange}
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </fieldset>

              {/* Code d'invitation conditionnel */}
              {needsInviteCode && (
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">
                    <KeyRound size={13} className="inline mr-1" />
                    Code d'invitation
                  </legend>
                  <input
                    id="inviteCode"
                    type="text"
                    name="inviteCode"
                    className="input w-full font-mono tracking-widest lowercase"
                    placeholder="Ex : ecole2026"
                    value={formData.inviteCode}
                    onChange={handleChange}
                    required
                  />
                  <p className="fieldset-label flex items-center gap-1">
                    <Info size={11} />
                    Fourni par votre directeur d'établissement
                  </p>
                </fieldset>
              )}

              {/* Info ADMIN */}
              {!needsInviteCode && (
                <div
                  role="alert"
                  className="alert alert-success alert-soft text-sm"
                >
                  <Info size={16} className="shrink-0" />
                  <span>
                    En tant que Directeur, vous créerez votre établissement
                    depuis le tableau de bord.
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={registerMutation.isPending}
                aria-busy={registerMutation.isPending}
                className="btn btn-success btn-block mt-2"
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2
                      className="animate-spin"
                      size={20}
                      aria-hidden="true"
                    />
                    <span className="sr-only">
                      Création du compte en cours...
                    </span>
                  </>
                ) : (
                  <>
                    <UserPlus size={20} />
                    Créer mon compte
                  </>
                )}
              </button>
            </form>

            <div className="divider text-xs text-base-content/40">
              Déjà un compte ?
            </div>

            <Link to="/login" className="btn btn-ghost btn-block">
              Se connecter
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
