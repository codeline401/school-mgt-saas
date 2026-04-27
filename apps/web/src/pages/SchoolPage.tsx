import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getApiError } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Building2, Plus, Copy, Check } from "lucide-react";
import type { School, CreateSchoolInput } from "@school-mgt/types";

function SchoolsPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const modalRef = useRef<HTMLDialogElement>(null);

  const [nom, setNom] = useState("");
  const [copied, setCopied] = useState(false);
  const [createdSchool, setCreatedSchool] = useState<School | null>(null);

  const isSudoAdmin = user?.role === "SUDO_ADMIN";
  const isAdmin = user?.role === "ADMIN";
  const alreadyHasSchool = isAdmin && user?.schoolId !== null;

  // Charge la liste des écoles — uniquement pour le SUDO_ADMIN
  const {
    data: schools = [],
    isLoading,
    isError,
  } = useQuery<School[]>({
    queryKey: ["schools"],
    queryFn: async () => {
      const { data } = await api.get("/api/schools");
      return data;
    },
    enabled: isSudoAdmin,
  });

  // Mutation pour créer une école
  const createMutation = useMutation({
    mutationFn: async (payload: CreateSchoolInput) => {
      const { data } = await api.post<School>("/api/schools", payload);
      return data;
    },
    onSuccess: (data) => {
      setCreatedSchool(data);
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      modalRef.current?.close();
      setNom("");
    },
  });

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── VUE ADMIN ──────────────────────────────────────────────
  if (isAdmin) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Mon école</h1>
          <p className="text-base-content/60">Gérez votre établissement</p>
        </div>

        {/* ADMIN a déjà une école mais n'en a pas créé dans cette session */}
        {alreadyHasSchool && !createdSchool && (
          <div role="alert" className="alert alert-info alert-soft">
            <span>
              Votre école est déjà configurée. Accédez aux paramètres pour voir
              votre code d'invitation.
            </span>
          </div>
        )}

        {/* École venant d'être créée — afficher l'inviteCode */}
        {createdSchool && (
          <div role="alert" className="alert alert-success mb-6">
            <div>
              <p className="font-bold">
                École « {createdSchool.nom} » créée avec succès !
              </p>
              <p className="text-sm mt-1">
                Partagez ce code d'invitation à vos collaborateurs :
              </p>
              <div className="flex items-center gap-3 bg-black/10 rounded-lg px-4 py-2 mt-3">
                <code className="font-mono font-bold text-lg tracking-widest flex-1">
                  {createdSchool.inviteCode}
                </code>
                <button
                  onClick={() => handleCopy(createdSchool.inviteCode)}
                  className="btn btn-ghost btn-sm gap-1"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copié !" : "Copier"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bouton pour ouvrir le modal de création */}
        {!alreadyHasSchool && !createdSchool && (
          <button
            onClick={() => modalRef.current?.showModal()}
            className="btn btn-primary gap-2"
          >
            <Plus size={16} />
            Créer mon école
          </button>
        )}

        {/* Modal DaisyUI — méthode <dialog> recommandée */}
        <dialog ref={modalRef} className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Créer mon établissement</h3>

            {createMutation.isError && (
              <div role="alert" className="alert alert-error alert-soft mb-4">
                <span>
                  {getApiError(createMutation.error, "Erreur lors de la création")}
                </span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate({ nom });
              }}
              className="space-y-4"
            >
              <fieldset className="fieldset">
                <legend className="fieldset-legend">
                  Nom de l'établissement
                </legend>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Ex : Lycée Victor Hugo"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                />
              </fieldset>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => modalRef.current?.close()}
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
          {/* Ferme le modal si on clique en dehors */}
          <form method="dialog" className="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>
      </div>
    );
  }

  // ── VUE SUDO_ADMIN ─────────────────────────────────────────
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Toutes les écoles</h1>
          <p className="text-base-content/60">
            Vue globale de toutes les écoles du SaaS
          </p>
        </div>
        <span className="badge badge-neutral badge-soft text-sm px-3 py-2">
          {schools.length} école(s)
        </span>
      </div>

      {isError && (
        <div role="alert" className="alert alert-error alert-soft mb-4">
          <span>Impossible de charger les écoles.</span>
        </div>
      )}

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>École</th>
                <th>Élèves</th>
                <th>Classes</th>
                <th>Profs</th>
                <th>Créée le</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10">
                    <span className="loading loading-spinner loading-md" />
                  </td>
                </tr>
              ) : schools.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <Building2
                      size={36}
                      className="mx-auto mb-3 text-base-content/30"
                    />
                    <p className="text-base-content/50 font-medium">
                      Aucune école enregistrée
                    </p>
                  </td>
                </tr>
              ) : (
                schools.map((school) => (
                  <tr key={school.id} className="hover">
                    <td className="font-medium">{school.nom}</td>
                    <td>{school._count?.eleves ?? "—"}</td>
                    <td>{school._count?.classes ?? "—"}</td>
                    <td>{school._count?.profs ?? "—"}</td>
                    <td className="text-sm text-base-content/60">
                      {new Date(school.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SchoolsPage;
