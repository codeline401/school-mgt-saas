import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, User, AlertCircle, Loader2, ListChecks } from "lucide-react";
import { api, getApiError } from "../../lib/api";
import type { Classe, ProgrammeGroup } from "@school-mgt/types";

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export default function ProgrammeRealiseTab() {
  const [classeId, setClasseId] = useState("");

  // ─────────────────────────────────────────────────────────────
  // QUERIES (TanStack Query)
  // ─────────────────────────────────────────────────────────────

  // 1. Liste des classes pour le filtre
  const { data: classes = [] } = useQuery<Classe[]>({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await api.get("/api/classes");
      return data;
    },
  });

  // 2. Données consolidées et fusionnées du programme réalisé
  const {
    data: programmes = [],
    isLoading,
    isError,
    error,
  } = useQuery<ProgrammeGroup[]>({
    queryKey: ["programme-realise", classeId],
    queryFn: async () => {
      const { data } = await api.get("/api/programme-realise", {
        params: {
          classeId: classeId || undefined,
        },
      });
      return data;
    },
  });

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Entête */}
      <div className="flex items-center gap-2">
        <ListChecks size={18} className="text-primary" />
        <h2 className="font-semibold text-base">Suivi du programme réalisé</h2>
      </div>

      {/* ZONE DES FILTRES (Style fieldset identique à ton modèle) */}
      <div className="max-w-xs">
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
      </div>

      {/* GESTION DES ERREURS & ETATS */}
      {isError && (
        <div className="alert alert-error text-sm">
          <AlertCircle size={15} />
          {getApiError(
            error,
            "Erreur lors du chargement du programme réalisé.",
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-base-content/50">
          <Loader2 size={15} className="animate-spin" />
          Génération du programme consolidé…
        </div>
      )}

      {!isLoading && programmes.length === 0 && (
        <div className="text-center py-10 text-base-content/40 text-sm">
          Aucune séance de cours répertoriée pour cette recherche.
        </div>
      )}

      {/* RENDER DU PROGRAMME CONSOLIDÉ (Accordéons DaisyUI) */}
      <div className="space-y-3 max-w-4xl">
        {programmes.map((item, index) => (
          <div
            key={`${item.classeNom}-${item.titre}-${index}`}
            className="collapse collapse-arrow card card-border bg-base-100 shadow-xs"
          >
            {/* Input requis par DaisyUI pour activer le comportement d'ouverture au clic */}
            <input
              type="checkbox"
              className="peer"
              defaultChecked={index === 0}
            />

            {/* Entête du panneau pliable */}
            <div className="collapse-title p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pr-12">
              <div className="space-y-1">
                <span className="badge badge-primary font-medium mr-2">
                  {item.classeNom}
                </span>
                <span className="badge badge-outline text-xs">
                  {item.matiereNom}
                </span>
                <h3 className="font-bold text-sm text-base-content mt-1.5">
                  {item.titre}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-base-content/60 bg-base-200/50 px-2 py-1 rounded-md self-start sm:self-center">
                <User size={13} />
                <span>{item.professeurNom}</span>
                <span className="badge badge-xs badge-neutral font-semibold ml-1">
                  {item.sessions.length}{" "}
                  {item.sessions.length > 1 ? "séances" : "séance"}
                </span>
              </div>
            </div>

            {/* Contenu déroulant (Historique des détails fusionnés) */}
            <div className="collapse-content px-4 pb-4 pt-0 border-t border-base-200 peer-checked:block">
              <div className="mt-3 space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-base-content/40 mb-2">
                  Historique des séances et détails du cours
                </h4>

                <div className="relative border-l-2 border-base-300 ml-2 pl-4 space-y-5">
                  {item.sessions.map((session) => (
                    <div key={session.id} className="relative group">
                      {/* Point sur la ligne temporelle */}
                      <div className="absolute -left-5.5 top-1 w-2.5 h-2.5 rounded-full bg-base-300 group-hover:bg-primary transition-colors" />

                      {/* Date de la séance */}
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-1">
                        <Calendar size={12} />
                        <span>Cours du {new Date(session.date).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                      </div>

                      {/* Contenu textuel saisi par le prof */}
                      <p className="text-xs text-base-content/80 whitespace-pre-line bg-base-200/30 p-2.5 rounded-md border border-base-200/50">
                        {session.detail ||
                          "Aucun détail saisi pour cette séance."}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
