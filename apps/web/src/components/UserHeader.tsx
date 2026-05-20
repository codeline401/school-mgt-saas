import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { LogOut, UserCircle } from "lucide-react";

import NotificationBell from "./NotificationBell";

const ROLE_LABELS: Record<string, string> = {
  SUDO_ADMIN: "Super Admin",
  ADMIN: "Administrateur",
  USER: "Utilisateur",
  PROF: "Professeur",
  ELEVE: "Élève",
  PARENT: "Parent",
};

const ROLE_BADGE: Record<string, string> = {
  SUDO_ADMIN: "badge-error",
  ADMIN: "badge-warning",
  USER: "badge-info",
  PROF: "badge-primary",
  ELEVE: "badge-secondary",
  PARENT: "badge-accent",
};

export default function UserHeader() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  if (!user) return null;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const initiales =
    (user.prenom?.[0] ?? user.email[0]).toUpperCase() +
    (user.nom?.[0] ?? "").toUpperCase();

  return (
    <div className="flex items-center gap-3">
      {/* Avatar initiales */}
      <div className="w-9 h-9 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-bold shrink-0">
        {initiales.trim() ? initiales : <UserCircle className="w-5 h-5" />}
      </div>

      {/* Nom + rôle */}
      <div className="hidden sm:flex flex-col leading-tight">
        <span className="text-sm font-semibold text-base-content">
          {user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email}
        </span>
        <span
          className={`badge badge-sm mt-0.5 ${ROLE_BADGE[user.role] ?? "badge-ghost"}`}
        >
          {ROLE_LABELS[user.role] ?? user.role}
        </span>
      </div>

      <NotificationBell />

      {/* Bouton déconnexion */}
      <button
        onClick={handleLogout}
        className="btn btn-ghost btn-sm gap-1 text-error"
        title="Se déconnecter"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden md:inline">Déconnexion</span>
      </button>
    </div>
  );
}
