import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getApiError } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { BookOpen, Plus, Users, GraduationCap } from "lucide-react";
import type { Classe, CreateClasseInput } from "@school-mgt/types";

function ClassesPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const modalRef = useRef<HTMLDialogElement>(null);

  const [nom, setNom] = useState("");

  const isAdmin = user?.role === "ADMIN";
  const isSudoAdmin = user?.role === "SUDO_ADMIN";

  // Charge la liste des classes de l'école
  const {
    data: classes = [],
    isLoading,
    isError,
  } = useQuery<Classe[]>({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await api.get("/api/classes");
      return data;
    },
  });

  // Mutation pour créer une classe
  const createMutation = useMutation({
    mutationFn: async (payload: CreateClasseInput) => {
      const { data } = await api.post<Classe>("/api/classes", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      // closeModal est défini après mais la callback est asynchrone — OK
      closeModal();
    },
  });

  const closeModal = () => {
    modalRef.current?.close();
    setNom("");
    createMutation.reset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ nom });
  };

  return (
    <div>
      {/* En-tête */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Gestion des classes</h1>
          <p className="text-base-content/60">
            {isSudoAdmin
              ? "Vue globale de toutes les classes"
              : "Classes de votre établissement"}
          </p>
        </div>

        {/* Seul l'ADMIN peut créer une classe */}
        {isAdmin && (
          <button
            onClick={() => modalRef.current?.showModal()}
            className="btn btn-primary gap-2"
          >
            <Plus size={16} />
            Ajouter une classe
          </button>
        )}
      </div>

      {/* Erreur de chargement */}
      {isError && (
        <div role="alert" className="alert alert-error alert-soft mb-4">
          <span>
            Impossible de charger les classes. Veuillez réessayer plus tard.
          </span>
        </div>
      )}

      {/* Tableau */}
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Nom de la classe</th>
                <th>
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    Élèves
                  </span>
                </th>
                <th>
                  <span className="flex items-center gap-1">
                    <GraduationCap size={14} />
                    Professeurs
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="text-center py-10">
                    <span className="loading loading-spinner loading-md" />
                  </td>
                </tr>
              ) : classes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-12">
                    <BookOpen
                      size={36}
                      className="mx-auto mb-3 text-base-content/30"
                    />
                    <p className="text-base-content/50 font-medium">
                      Aucune classe enregistrée
                    </p>
                    {isAdmin && (
                      <p className="text-base-content/30 text-sm mt-1">
                        Commencez par créer une classe.
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                classes.map((classe) => (
                  <tr key={classe.id} className="hover">
                    <td className="font-medium">{classe.nom}</td>
                    <td>
                      <span className="badge badge-ghost badge-sm">
                        {classe._count?.eleves ?? 0}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-ghost badge-sm">
                        {classe._count?.profs ?? 0}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal DaisyUI — créer une classe */}
      <dialog ref={modalRef} className="modal" onClose={closeModal}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Créer une nouvelle classe</h3>

          {createMutation.isError && (
            <div role="alert" className="alert alert-error alert-soft mb-4">
              <span>
                {getApiError(
                  createMutation.error,
                  "Erreur lors de la création",
                )}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Nom de la classe</legend>
              <input
                type="text"
                className="input w-full"
                placeholder="Ex : 6ème A, Terminale S…"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
                minLength={2}
                maxLength={50}
              />
            </fieldset>

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={closeModal}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="btn btn-primary"
              >
                {createMutation.isPending ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  "Créer"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Fermeture en cliquant en dehors */}
        <form method="dialog" className="modal-backdrop">
          <button type="submit">Fermer</button>
        </form>
      </dialog>
    </div>
  );
}

export default ClassesPage;
