import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

interface ProtectedRouteProps {
  // Rôles autorisés à accéder à cette route (ou null pour tous les rôles)
  // Si non spécifié, tous les utilisateurs connectés peuvent passer
  allowedRoles?: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  // On récupère l'user et le token depuis Zustand
  const { user, token } = useAuthStore();

  // Si pas de token, on redirige vers la page de connexion LoginPage
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Si des rôles sont spécifiés et que l'utilisateur n'en fait pas partie => accès réfusé
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // Sinon, on affiche la page demandée
  return <Outlet />;
}
