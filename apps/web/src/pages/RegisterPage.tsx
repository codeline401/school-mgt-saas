import { useState } from "react";
import { Link } from "react-router-dom";
import {
  UserPlus,
  Loader2,
  AlertCircle,
  GraduationCap,
  KeyRound,
  Info,
} from "lucide-react";
import { useRegister, type RegisterInput } from "../hooks/useAuth";

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
      [name]: value,
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
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background:
          "linear-gradient(135deg, #0a0e45 0%, #1a237e 50%, #0d3b0e 100%)",
      }}
    >
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
          <h1
            className="text-4xl font-bold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Créer un compte
          </h1>
          <p className="text-blue-200 mt-2">
            Rejoignez la plateforme scolaire 🇲🇬
          </p>
        </div>

        {/* Carte */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
          <div className="p-8">
            {registerMutation.isError && (
              <div className="flex items-center gap-3 bg-red-500/20 text-red-200 p-4 rounded-2xl mb-6 text-sm border border-red-500/30">
                <AlertCircle size={18} />
                <span>
                  {(registerMutation.error as Error & { response?: { data?: { error?: string } } })?.response?.data?.error ||
                    "Erreur lors de l'inscription"}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nom */}
              <div>
                <label className="block text-sm font-semibold text-blue-100 mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  name="nom"
                  placeholder="Jean Rakoto"
                  className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-blue-300/50 focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Prénom */}
              <div>
                <label className="block text-sm font-semibold text-blue-100 mb-2">
                  Prénom
                </label>
                <input
                  type="text"
                  name="prenom"
                  placeholder="Jean"
                  className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-blue-300/50 focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-blue-100 mb-2">
                  Email professionnel
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="nom@ecole.mg"
                  className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-blue-300/50 focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-sm font-semibold text-blue-100 mb-2">
                  Mot de passe
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Minimum 6 caractères"
                  className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-blue-300/50 focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>

              {/* Rôle */}
              <div>
                <label className="block text-sm font-semibold text-blue-100 mb-2">
                  Je suis un(e)...
                </label>
                <select
                  name="role"
                  className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all appearance-none"
                  value={formData.role}
                  onChange={handleChange}
                  style={{ colorScheme: "dark" }}
                >
                  {ROLES.map((role) => (
                    <option
                      key={role.value}
                      value={role.value}
                      className="bg-imperial-800 text-white"
                      style={{ backgroundColor: "#1a237e" }}
                    >
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Code d'invitation (conditionnel) */}
              {needsInviteCode && (
                <div>
                  <label className="block text-sm font-semibold text-blue-100 mb-2">
                    <KeyRound size={14} className="inline mr-1" />
                    Code d'invitation
                  </label>
                  <input
                    type="text"
                    name="inviteCode"
                    placeholder="Ex: ECOLE2026"
                    className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-blue-300/50 focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all uppercase tracking-widest"
                    value={formData.inviteCode}
                    onChange={handleChange}
                    required
                  />
                  <p className="text-xs text-blue-300/60 mt-1.5 flex items-center gap-1">
                    <Info size={12} />
                    Fourni par votre directeur d'établissement
                  </p>
                </div>
              )}

              {/* Message informatif ADMIN */}
              {!needsInviteCode && (
                <div className="flex items-start gap-3 bg-emerald-500/10 text-emerald-300 p-4 rounded-2xl text-sm border border-emerald-500/20">
                  <Info size={18} className="shrink-0 mt-0.5" />
                  <span>
                    En tant que Directeur, vous créerez votre établissement
                    depuis votre tableau de bord après connexion.
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white transition-all active:scale-95 disabled:opacity-60 mt-2"
                style={{
                  background: "linear-gradient(135deg, #2e7d32, #4caf50)",
                }}
              >
                {registerMutation.isPending ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <UserPlus size={20} />
                    Créer mon compte
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-blue-200 text-sm">
                Déjà un compte ?{" "}
                <Link
                  to="/login"
                  className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Se connecter
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
