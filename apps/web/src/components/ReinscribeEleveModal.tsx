import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import axios from "axios"; // [REVIEW FIX] : Import d'axios requis pour isAxiosError
import type { Eleve, Classe } from "@school-mgt/types";

interface ReinscribeEleveModalProps {
  isOpen: boolean;
  handleClose: () => void;
}

export default function ReinscribeEleveModal({
  isOpen,
  handleClose,
}: ReinscribeEleveModalProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedEleveId, setSelectedEleveId] = useState("");
  const [selectedClasseId, setSelectedClasseId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // [REVIEW FIX] : Déclaration de resetAndClose remontée et stabilisée avec useCallback
  const resetAndClose = useCallback(() => {
    setSearch("");
    setSelectedEleveId("");
    setSelectedClasseId("");
    setErrorMsg("");
    handleClose();
  }, [handleClose]);

  // Écouteur de touche Échap pour fermer le modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        resetAndClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, resetAndClose]); // [REVIEW FIX] : resetAndClose ajouté aux dépendances sans causer de loop grâce au useCallback

  // Récupération des élèves
  const { data: eleves = [] } = useQuery<Eleve[]>({
    queryKey: ["eleves"],
    queryFn: async () => {
      const { data } = await api.get("/api/eleves");
      return data;
    },
    enabled: isOpen,
  });

  // Récupération des classes
  const { data: classes = [] } = useQuery<Classe[]>({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await api.get("/api/classes");
      return data;
    },
    enabled: isOpen,
  });

  // Filtrer la liste des élèves selon la recherche
  const filteredEleves = eleves.filter((e) =>
    `${e.nom} ${e.prenom}`.toLowerCase().includes(search.toLowerCase()),
  );

  const mutation = useMutation({
    mutationFn: async (payload: { eleveId: string; classeId: string }) => {
      const { data } = await api.post("/api/reinscription", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eleves"] });
      resetAndClose();
    },
    onError: (err) => {
      // [REVIEW FIX] : Remplacement de la validation manuelle par le type guard natif axios.isAxiosError
      if (axios.isAxiosError(err)) {
        setErrorMsg(
          err.response?.data?.error ||
            "Une erreur est survenue lors de la communication avec le serveur.",
        );
      } else {
        setErrorMsg("Une erreur réseau ou une erreur inattendue est survenue.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEleveId || !selectedClasseId) return;
    mutation.mutate({ eleveId: selectedEleveId, classeId: selectedClasseId });
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal modal-open"
      // [REVIEW FIX] : Amélioration de l'accessibilité avec les attributs ARIA standardisés
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-reinscription-title"
    >
      <div className="modal-box max-w-md border border-base-200">
        <h3 id="modal-reinscription-title" className="font-bold text-lg mb-4">
          Réinscrire un élève existant
        </h3>

        {errorMsg && (
          <div className="alert alert-error alert-soft mb-4 text-sm">
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ÉTAPE 1 : Moteur de recherche d'élèves */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">
                1. Rechercher l'élève
              </span>
            </label>
            <input
              type="text"
              placeholder="Tapez son nom ou prénom..."
              className="input input-bordered w-full input-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={!!selectedEleveId} // Bloque l'input si un élève est validé
            />

            {/* Dropdown de résultats DaisyUI */}
            {search && selectedEleveId === "" && (
              <ul className="menu bg-base-200 rounded-box max-h-40 overflow-y-auto mt-1 p-1 z-50 shadow-sm text-sm">
                {filteredEleves.slice(0, 5).map((eleve) => (
                  <li key={eleve.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEleveId(eleve.id);
                        setSearch(`${eleve.nom} ${eleve.prenom}`);
                      }}
                    >
                      {eleve.nom} {eleve.prenom}
                    </button>
                  </li>
                ))}
                {filteredEleves.length === 0 && (
                  <li className="disabled text-base-content/40 italic p-2">
                    Aucun élève trouvé
                  </li>
                )}
              </ul>
            )}

            {selectedEleveId && (
              <label className="label">
                <span className="label-text-alt text-success font-medium">
                  ✓ Élève sélectionné
                </span>
                <button
                  type="button"
                  className="label-text-alt link link-hover text-error"
                  onClick={() => {
                    setSelectedEleveId("");
                    setSearch("");
                  }}
                >
                  Changer
                </button>
              </label>
            )}
          </div>

          {/* ÉTAPE 2 : Choix de la nouvelle classe */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">
                2. Nouvelle classe d'affectation
              </span>
            </label>
            <select
              className="select select-bordered w-full select-sm"
              value={selectedClasseId}
              onChange={(e) => setSelectedClasseId(e.target.value)}
              required
            >
              <option value="">-- Choisir la classe --</option>
              {classes.map((classe) => (
                <option key={classe.id} value={classe.id}>
                  {classe.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Actions du Modal */}
          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={resetAndClose}
              disabled={mutation.isPending}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={
                !selectedEleveId || !selectedClasseId || mutation.isPending
              }
            >
              {mutation.isPending ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                "Confirmer la réinscription"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
