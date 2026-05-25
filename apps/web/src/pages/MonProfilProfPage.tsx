import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

/**
 * Redirige automatiquement un professeur connecté vers sa page profil.
 * Appelle GET /api/profils/me pour récupérer son id Professeur.
 */
export default function MonProfilProfPage() {
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/api/profils/me")
      .then(({ data }) => {
        navigate(`/professeurs/${data.id}`, { replace: true });
      })
      .catch(() => {
        navigate("/", { replace: true });
      });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-64">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  );
}
