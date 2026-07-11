import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Eleve, Classe } from "@school-mgt/types";

interface ReinscribeEleveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReinscribeEleveModal({
  isOpen,
  onClose,
}: ReinscribeEleveModalProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedEleveId, setSelectedEleveId] = useState("");
  const [selectedClasseId, setSelectedClasseId] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Récupération des données nécessaires avec tes queries habituelles
  const { data: eleves = [] } = useQuery<Eleve[]>({
    queryKey: ["eleves"],
    queryFn: async () => {
      const { data } = await api.get("/api/eleves");
      return data;
    },
    enabled: isOpen, // Ne tourne que si le modal est ouvert
  });

  const { data: classes = [] } = useQuery<Classe[]>({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await api.get("/api/classes");
      return data;
    },
    enabled: isOpen,
  });

  // 2. Filtrer la liste locale des élèves à la volée pendant la saisie
  const filteredEleves = eleves.filter((e) =>
    `${e.nom} ${e.prenom}`.toLowerCase().includes(search.toLowerCase()),
  );

  // 3. Mutation de soumission React-Query vers ton nouvel endpoint réinscription
  // 3. Mutation de soumission React-Query vers ton nouvel endpoint réinscription
  const mutation = useMutation({
    mutationFn: async (payload: { eleveId: string; classeId: string }) => {
      const { data } = await api.post("/api/reinscription", payload);
      return data;
    },
    onSuccess: () => {
      // Force React-Query à rafraîchir la liste en arrière-plan
      queryClient.invalidateQueries({ queryKey: ["eleves"] });
      handleClose();
    },
    onError: (err) => {
      // On extrait proprement le message d'erreur d'Axios sans passer par "any"
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        setErrorMsg(
          axiosError.response?.data?.error || "Une erreur est survenue.",
        );
      } else {
        setErrorMsg("Une erreur réseau ou serveur est survenue.");
      }
    },
  });

  const handleClose = () => {
    setSearch("");
    setSelectedEleveId("");
    setSelectedClasseId("");
    setErrorMsg(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEleveId || !selectedClasseId) return;
    mutation.mutate({ eleveId: selectedEleveId, classeId: selectedClasseId });
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md border border-base-200">
        <h3 className="font-bold text-lg mb-4">Réinscrire un élève existant</h3>

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
              onClick={handleClose}
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
                "Valider la réinscription"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
