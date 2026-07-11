import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Calendar,
  User,
  AlertCircle,
  Loader2,
  BookmarkCheck,
} from "lucide-react";
import { api, getApiError } from "../../lib/api";
import type { Classe } from "@school-mgt/types";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface DevoirExtended {
  id: string;
  titre: string;
  description: string | null;
  dateRendu: string;
  cahierTexte: {
    titre: string;
    detail: string | null;
    date: string;
    classe: { nom: string };
    matiere: { nom: string } | null;
    professeur: { nom: string; prenom: string };
  };
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export default function DevoirsDonnesTab() {
  const [classeId, setClasseId] = useState("");
  const [dateRendu, setDateRendu] = useState("");

  // ─────────────────────────────────────────────────────────────
  // QUERIES
  // ─────────────────────────────────────────────────────────────

  const {
    data: devoirs = [],
    isLoading,
    isError,
    error,
  } = useQuery<DevoirExtended[]>({
    queryKey: ["devoirs-donnes", classeId, dateRendu],
    queryFn: async () => {
      const { data } = await api.get("/api/devoirs-donnes", {
        params: {
          classeId: classeId || undefined,
          dateRendu: dateRendu || undefined,
        },
      });
      return data;
    },
  });

  const { data: classes = [] } = useQuery<Classe[]>({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await api.get("/api/classes");
      return data;
    },
  });

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BookmarkCheck size={18} className="text-primary" />
        <h2 className="font-semibold text-base">
          Historique des devoirs donnés
        </h2>
      </div>

      {/* ZONE DES FILTRES */}
      <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Filtrer par Classe</legend>
          <select
            className="select select-sm w-full"
            value={classeId}
            onChange={(e) => setClasseId(e.target.value)}
          >
            <option value="">— Toutes les classes —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Date limite de rendu</legend>
          <input
            type="date"
            className="input input-sm w-full"
            value={dateRendu}
            onChange={(e) => setDateRendu(e.target.value)}
          />
        </fieldset>
      </div>

      {/* GESTION DES ERREURS & ETATS */}
      {isError && (
        <div className="alert alert-error text-sm">
          <AlertCircle size={15} />
          {getApiError(error, "Erreur lors du chargement des devoirs.")}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-base-content/50">
          <Loader2 size={15} className="animate-spin" />
          Chargement des devoirs…
        </div>
      )}

      {!isLoading && devoirs.length === 0 && (
        <div className="text-center py-10 text-base-content/40 text-sm">
          Aucun devoir trouvé avec ces critères de recherche.
        </div>
      )}

      {/* GRILLE DES DEVOIRS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {devoirs.map((devoir) => {
          return (
            <div
              key={devoir.id}
              className="card card-border bg-base-100 shadow-xs relative"
            >
              <div className="card-body p-4 gap-2">
                <div className="flex justify-between items-center border-b border-base-200 pb-2">
                  <span className="badge badge-primary font-medium">
                    {devoir.cahierTexte.classe.nom}
                  </span>
                  <span className="text-xs font-semibold text-error bg-error/10 px-2 py-0.5 rounded-md">
                    À rendre : {devoir.dateRendu}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-base-content">
                    {devoir.titre}
                  </h3>
                  <p className="text-xs text-base-content/70 mt-1 whitespace-pre-line">
                    {devoir.description ||
                      "Aucune consigne additionnelle fournie."}
                  </p>
                </div>

                <div className="divider my-1 opacity-50"></div>

                <div className="space-y-1 text-xs text-base-content/50">
                  <div className="flex items-center gap-1.5">
                    <BookOpen size={12} />
                    <span>
                      <strong>Matière :</strong>{" "}
                      {devoir.cahierTexte.matiere?.nom || "Non spécifiée"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User size={12} />
                    <span>
                      <strong>Par :</strong>{" "}
                      {devoir.cahierTexte.professeur.prenom}{" "}
                      {devoir.cahierTexte.professeur.nom}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    <span>
                      <strong>Donné lors du cours :</strong>{" "}
                      {devoir.cahierTexte.titre} du {devoir.cahierTexte.date}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
