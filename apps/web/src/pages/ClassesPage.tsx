import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getApiError } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { BookOpen, Plus, Users, GraduationCap } from "lucide-react";
import type {
  Classe,
  CreateClasseInput,
  Niveau,
  Option,
  School,
  Section,
} from "@school-mgt/types";
import { Link } from "react-router-dom";

function ClassesPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const modalRef = useRef<HTMLDialogElement>(null);

  const [nom, setNom] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [niveauId, setNiveauId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [optionId, setOptionId] = useState("");
  const [nomError, setNomError] = useState<string | null>(null);
  const [schoolIdError, setSchoolIdError] = useState<string | null>(null);
  const [structureError, setStructureError] = useState<string | null>(null);

  const isAdmin = user?.role === "ADMIN";
  const isSudoAdmin = user?.role === "SUDO_ADMIN";
  const selectedSchoolId = isSudoAdmin ? schoolId : (user?.schoolId ?? "");

  useEffect(() => {
    setNiveauId("");
    setSectionId("");
    setOptionId("");
  }, [selectedSchoolId]);

  // Charge la liste des écoles (pour SUDO_ADMIN uniquement)
  const { data: schools = [], isLoading: isLoadingSchools } = useQuery<
    School[]
  >({
    queryKey: ["schools"],
    queryFn: async () => {
      const { data } = await api.get("/api/schools");
      return data;
    },
    enabled: isSudoAdmin, // Charger seulement si SUDO_ADMIN
  });

  const { data: niveaux = [], isLoading: isLoadingNiveaux } = useQuery<
    Niveau[]
  >({
    queryKey: ["niveaux", selectedSchoolId],
    queryFn: async () =>
      (
        await api.get("/api/classes/niveaux", {
          params: { schoolId: selectedSchoolId },
        })
      ).data,
    enabled: (isAdmin || isSudoAdmin) && !!selectedSchoolId,
  });

  const { data: sections = [], isLoading: isLoadingSections } = useQuery<
    Section[]
  >({
    queryKey: ["sections", selectedSchoolId, niveauId],
    queryFn: async () =>
      (
        await api.get("/api/classes/sections", {
          params: { schoolId: selectedSchoolId },
        })
      ).data,
    enabled: (isAdmin || isSudoAdmin) && !!selectedSchoolId && !!niveauId,
  });

  const { data: options = [], isLoading: isLoadingOptions } = useQuery<
    Option[]
  >({
    queryKey: ["options", selectedSchoolId],
    queryFn: async () =>
      (
        await api.get("/api/classes/options", {
          params: { schoolId: selectedSchoolId },
        })
      ).data,
    enabled: (isAdmin || isSudoAdmin) && !!selectedSchoolId,
  });

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
      closeModal();
    },
  });

  const closeModal = () => {
    modalRef.current?.close();
    setNom("");
    setSchoolId("");
    setNiveauId("");
    setSectionId("");
    setOptionId("");
    setNomError(null);
    setSchoolIdError(null);
    setStructureError(null);
    createMutation.reset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nom.trim();

    // Validation du nom
    if (trimmed.length < 2) {
      setNomError("Le nom doit contenir au moins 2 caractères.");
      return;
    }

    // Validation du schoolId pour SUDO_ADMIN
    if (isSudoAdmin && !schoolId) {
      setSchoolIdError("Veuillez sélectionner une école.");
      return;
    }

    if (!niveauId) {
      setStructureError("Veuillez sélectionner un niveau.");
      return;
    }

    setNomError(null);
    setSchoolIdError(null);
    setStructureError(null);

    const payload: CreateClasseInput = { nom: trimmed, niveauId };
    if (isSudoAdmin && schoolId) {
      payload.schoolId = schoolId;
    }
    if (sectionId) payload.sectionId = sectionId;
    if (optionId) payload.optionId = optionId;

    createMutation.mutate(payload);
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

        {/* ADMIN et SUDO_ADMIN peuvent créer une classe */}
        {(isAdmin || isSudoAdmin) && (
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
                    {(isAdmin || isSudoAdmin) && (
                      <p className="text-base-content/30 text-sm mt-1">
                        Commencez par créer une classe.
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                classes.map((classe) => (
                  <tr key={classe.id} className="hover">
                    <td>
                      <Link
                        to={`/classes/${classe.id}`}
                        className="font-medium hover:underline"
                      >
                        {classe.nom}
                      </Link>
                    </td>
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
            {/* Sélection d'école (SUDO_ADMIN uniquement) */}
            {isSudoAdmin && (
              <fieldset className="fieldset">
                <legend className="fieldset-legend">École</legend>
                <select
                  className={`select w-full${schoolIdError ? " select-error" : ""}`}
                  value={schoolId}
                  onChange={(e) => {
                    setSchoolId(e.target.value);
                    setNiveauId("");
                    setSectionId("");
                    setOptionId("");
                    if (schoolIdError) setSchoolIdError(null);
                  }}
                  required
                >
                  <option value="">Sélectionnez une école</option>
                  {isLoadingSchools ? (
                    <option disabled>Chargement...</option>
                  ) : (
                    schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.nom}
                      </option>
                    ))
                  )}
                </select>
                {schoolIdError && (
                  <p className="text-error text-sm mt-1">{schoolIdError}</p>
                )}
              </fieldset>
            )}

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Nom de la classe</legend>
              <input
                type="text"
                className={`input w-full${nomError ? " input-error" : ""}`}
                placeholder="Ex : 6ème A, Terminale S…"
                value={nom}
                onChange={(e) => {
                  setNom(e.target.value);
                  if (nomError) setNomError(null);
                }}
                required
                minLength={2}
                maxLength={50}
              />
              {nomError && (
                <p className="text-error text-sm mt-1">{nomError}</p>
              )}
            </fieldset>

            {structureError && (
              <div role="alert" className="alert alert-error alert-soft">
                <span>{structureError}</span>
              </div>
            )}

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Niveau</legend>
              <select
                className="select w-full"
                value={niveauId}
                onChange={(e) => {
                  setNiveauId(e.target.value);
                  setSectionId("");
                  if (structureError) setStructureError(null);
                }}
                required
              >
                <option value="">Sélectionnez un niveau</option>
                {isLoadingNiveaux ? (
                  <option disabled>Chargement...</option>
                ) : (
                  niveaux.map((niveau) => (
                    <option key={niveau.id} value={niveau.id}>
                      {niveau.nom}
                    </option>
                  ))
                )}
              </select>
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Section (optionnel)</legend>
              <select
                className="select w-full"
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                disabled={!niveauId || isLoadingSections}
              >
                <option value="">
                  {niveauId
                    ? "Aucune section"
                    : "Sélectionnez d'abord un niveau"}
                </option>
                {sections
                  .filter((section) => section.niveauId === niveauId)
                  .map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.nom}
                    </option>
                  ))}
              </select>
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Option (optionnel)</legend>
              <select
                className="select w-full"
                value={optionId}
                onChange={(e) => setOptionId(e.target.value)}
                disabled={isLoadingOptions}
              >
                <option value="">Aucune option</option>
                {options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.nom}
                  </option>
                ))}
              </select>
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
