import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Edit2,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useAuthStore } from "../../../../../store/authStore";
import ConfirmModal from "../../../../../components/ConfirmModal";
import {
  type CreateResponsableInput,
  type Responsable,
  type TypeResponsable,
  useAffilierElevesAuResponsable,
  useCreateResponsable,
  useDeleteResponsable,
  useElevesPourResponsable,
  useResponsable,
  useRetirerAffiliationEleve,
  useUpdateResponsable,
} from "../hooks/useResponsables";

type FormState = {
  nom: string;
  prenom: string;
  type: TypeResponsable;
  email: string;
  telephone: string;
  adresse: string;
  eleveIds: string[];
};

const emptyForm: FormState = {
  nom: "",
  prenom: "",
  type: "PARENT",
  email: "",
  telephone: "",
  adresse: "",
  eleveIds: [],
};

function buildFormState(responsable?: Responsable): FormState {
  if (!responsable) return emptyForm;

  return {
    nom: responsable.nom,
    prenom: responsable.prenom,
    type: responsable.type,
    email: responsable.email ?? "",
    telephone: responsable.telephone ?? "",
    adresse: responsable.adresse ?? "",
    eleveIds: responsable.affiliations.map(
      (affiliation) => affiliation.eleveId,
    ),
  };
}

export default function ResponsablesPage() {
  const user = useAuthStore((state) => state.user);
  const [search, setSearch] = useState("");
  const [selectedResponsableId, setSelectedResponsableId] = useState<
    string | null
  >(null);
  const [showForm, setShowForm] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data: responsables = [], isLoading, isError } = useResponsable();
  const { data: eleves = [] } = useElevesPourResponsable();

  const createMutation = useCreateResponsable();
  const updateMutation = useUpdateResponsable();
  const deleteMutation = useDeleteResponsable();
  const affilierMutation = useAffilierElevesAuResponsable();
  const retirerMutation = useRetirerAffiliationEleve();

  const canManage = user?.role === "ADMIN" || user?.role === "SUDO_ADMIN";

  const filteredResponsables = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return responsables;

    return responsables.filter((responsable) => {
      const fullName = `${responsable.prenom} ${responsable.nom}`.toLowerCase();

      return (
        fullName.includes(query) ||
        responsable.email?.toLowerCase().includes(query) ||
        responsable.telephone?.toLowerCase().includes(query)
      );
    });
  }, [responsables, search]);

  const selectedResponsable = useMemo(
    () =>
      responsables.find(
        (responsable) => responsable.id === selectedResponsableId,
      ) ?? null,
    [responsables, selectedResponsableId],
  );

  const openCreate = () => {
    setSelectedResponsableId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (responsable: Responsable) => {
    setSelectedResponsableId(responsable.id);
    setForm(buildFormState(responsable));
    setShowForm(true);
  };

  const toggleEleve = (eleveId: string) => {
    setForm((current) => ({
      ...current,
      eleveIds: current.eleveIds.includes(eleveId)
        ? current.eleveIds.filter((id) => id !== eleveId)
        : [...current.eleveIds, eleveId],
    }));
  };

  const formDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = formDialogRef.current;
    if (!dialog) return;
    if (showForm) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [showForm]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const payload: CreateResponsableInput = {
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      type: form.type,
      email: form.email.trim() || null,
      telephone: form.telephone.trim() || null,
      adresse: form.adresse.trim() || null,
      eleveIds: form.eleveIds,
    };

    if (selectedResponsable) {
      const existingIds = selectedResponsable.affiliations.map(
        (affiliation) => affiliation.eleveId,
      );

      await updateMutation.mutateAsync({
        id: selectedResponsable.id,
        input: {
          nom: payload.nom,
          prenom: payload.prenom,
          type: payload.type,
          email: payload.email,
          telephone: payload.telephone,
          adresse: payload.adresse,
        },
      });

      const newEleveIds = payload.eleveIds.filter(
        (eleveId) => !existingIds.includes(eleveId),
      );

      if (newEleveIds.length > 0) {
        await affilierMutation.mutateAsync({
          responsableId: selectedResponsable.id,
          eleveIds: newEleveIds,
        });
      }

      const removedEleveIds = existingIds.filter(
        // Find the IDs that were removed from the form
        (eleveId) => !payload.eleveIds.includes(eleveId),
      );

      for (const eleveId of removedEleveIds) {
        // Remove the affiliations for the removed IDs
        await retirerMutation.mutateAsync({
          responsableId: selectedResponsable.id,
          eleveId,
        });
      }
    } else {
      await createMutation.mutateAsync(payload);
    }

    setShowForm(false);
    setSelectedResponsableId(null);
    setForm(emptyForm);
  };

  const handleDelete = async () => {
    if (!selectedResponsable) return;

    await deleteMutation.mutateAsync(selectedResponsable.id);
    setShowDelete(false);
    setSelectedResponsableId(null);
  };

  const handleRemoveEleve = async (eleveId: string) => {
    if (!selectedResponsable) return;

    await retirerMutation.mutateAsync({
      responsableId: selectedResponsable.id,
      eleveId,
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="alert alert-error">
        <span>Impossible de charger les responsables.</span>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.85fr)]">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Responsables légaux</h2>
            <p className="text-sm text-base-content/60">
              Parents et tuteurs associés aux élèves.
            </p>
          </div>

          {canManage && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={openCreate}
            >
              <Plus size={18} />
              Nouveau responsable
            </button>
          )}
        </div>

        <fieldset className="fieldset">
          <label className="input w-full">
            <Search size={18} className="text-base-content/50" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un parent ou tuteur"
            />
          </label>
        </fieldset>

        <div className="overflow-x-auto border border-base-200 bg-base-100">
          <table className="table">
            <thead>
              <tr>
                <th>Responsable</th>
                <th>Type</th>
                <th>Élèves</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredResponsables.map((responsable) => (
                <tr
                  key={responsable.id}
                  className="cursor-pointer hover"
                  onClick={() => setSelectedResponsableId(responsable.id)}
                >
                  <td>
                    <div className="font-semibold">
                      {responsable.prenom} {responsable.nom}
                    </div>
                    <div className="text-xs text-base-content/60">
                      {responsable.telephone ?? responsable.email ?? "—"}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge badge-sm ${
                        responsable.type === "TUTEUR"
                          ? "badge-secondary"
                          : "badge-primary"
                      }`}
                    >
                      {responsable.type === "TUTEUR" ? "Tuteur" : "Parent"}
                    </span>
                  </td>
                  <td>{responsable.affiliations.length}</td>
                  <td>
                    {canManage && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-square"
                        onClick={(event) => {
                          event.stopPropagation();
                          openEdit(responsable);
                        }}
                        aria-label={`Modifier ${responsable.prenom} ${responsable.nom}`}
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredResponsables.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-10 text-center text-base-content/60"
                  >
                    Aucun responsable trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="border border-base-200 bg-base-100 p-5">
        {selectedResponsable ? (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="flex size-11 items-center justify-center bg-primary text-primary-content">
                  <UserRound size={21} />
                </div>
                <div>
                  <h3 className="font-bold">
                    {selectedResponsable.prenom} {selectedResponsable.nom}
                  </h3>
                  <span className="text-sm text-base-content/60">
                    {selectedResponsable.type === "TUTEUR"
                      ? "Tuteur légal"
                      : "Parent"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-sm btn-square"
                onClick={() => setSelectedResponsableId(null)}
                aria-label="Fermer le détail"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              {selectedResponsable.telephone && (
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-base-content/50" />
                  {selectedResponsable.telephone}
                </div>
              )}
              {selectedResponsable.email && (
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-base-content/50" />
                  {selectedResponsable.email}
                </div>
              )}
              {selectedResponsable.adresse && (
                <p className="text-base-content/70">
                  {selectedResponsable.adresse}
                </p>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2">
                <Users size={17} />
                <h4 className="font-semibold">Élèves affiliés</h4>
              </div>

              <div className="space-y-2">
                {selectedResponsable.affiliations.map((affiliation) => (
                  <div
                    key={affiliation.id}
                    className="flex items-center justify-between gap-3 border border-base-200 px-3 py-2"
                  >
                    <div>
                      <div className="font-medium">
                        {affiliation.eleve.prenom} {affiliation.eleve.nom}
                      </div>
                      <div className="font-mono text-xs text-base-content/60">
                        #{affiliation.eleve.matricule}
                      </div>
                    </div>

                    {canManage && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-square text-error"
                        onClick={() => handleRemoveEleve(affiliation.eleveId)}
                        disabled={retirerMutation.isPending}
                        aria-label="Retirer l'affiliation"
                      >
                        <X size={17} />
                      </button>
                    )}
                  </div>
                ))}

                {selectedResponsable.affiliations.length === 0 && (
                  <p className="text-sm text-base-content/60">
                    Aucun élève affilié.
                  </p>
                )}
              </div>
            </div>

            {canManage && (
              <div className="flex gap-2 border-t border-base-200 pt-4">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => openEdit(selectedResponsable)}
                >
                  <Edit2 size={16} />
                  Modifier
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-error btn-sm"
                  onClick={() => setShowDelete(true)}
                >
                  <Trash2 size={16} />
                  Supprimer
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center text-center text-base-content/60">
            <Users size={34} />
            <p className="mt-3 text-sm">
              Sélectionnez un responsable pour afficher ses informations.
            </p>
          </div>
        )}
      </aside>

      {showForm && (
        <dialog
          ref={formDialogRef}
          className="modal"
          onClose={() => setShowForm(false)}
        >
          <div className="modal-box max-w-3xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {selectedResponsable
                  ? "Modifier le responsable"
                  : "Nouveau responsable"}
              </h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-square"
                onClick={() => setShowForm(false)}
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Nom</legend>
                  <input
                    required
                    className="input w-full"
                    value={form.nom}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        nom: event.target.value,
                      }))
                    }
                  />
                </fieldset>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Prénom</legend>
                  <input
                    required
                    className="input w-full"
                    value={form.prenom}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        prenom: event.target.value,
                      }))
                    }
                  />
                </fieldset>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Type</legend>
                  <select
                    className="select w-full"
                    value={form.type}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        type: event.target.value as TypeResponsable,
                      }))
                    }
                  >
                    <option value="PARENT">Parent</option>
                    <option value="TUTEUR">Tuteur</option>
                  </select>
                </fieldset>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Téléphone</legend>
                  <input
                    type="tel"
                    className="input w-full"
                    value={form.telephone}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        telephone: event.target.value,
                      }))
                    }
                  />
                </fieldset>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Email</legend>
                  <input
                    type="email"
                    className="input w-full"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />
                </fieldset>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Adresse</legend>
                  <input
                    className="input w-full"
                    value={form.adresse}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        adresse: event.target.value,
                      }))
                    }
                  />
                </fieldset>
              </div>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">
                  Élèves affiliés {!selectedResponsable && "*"}
                </legend>

                <div className="grid max-h-52 gap-2 overflow-y-auto border border-base-200 p-3 sm:grid-cols-2">
                  {eleves.map((eleve) => (
                    <label
                      key={eleve.id}
                      className="flex cursor-pointer items-center gap-3 p-2 hover:bg-base-200"
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-sm"
                        checked={form.eleveIds.includes(eleve.id)}
                        onChange={() => toggleEleve(eleve.id)}
                      />
                      <span className="text-sm">
                        <strong>
                          {eleve.prenom} {eleve.nom}
                        </strong>
                        <span className="ml-2 font-mono text-xs text-base-content/60">
                          #{eleve.matricule}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowForm(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    createMutation.isPending ||
                    updateMutation.isPending ||
                    affilierMutation.isPending ||
                    retirerMutation.isPending ||
                    (!selectedResponsable && form.eleveIds.length === 0)
                  }
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}

      <ConfirmModal
        isOpen={showDelete}
        title="Supprimer le responsable"
        message={`Supprimer ${selectedResponsable?.prenom ?? ""} ${selectedResponsable?.nom ?? ""} et détacher ses élèves ?`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
