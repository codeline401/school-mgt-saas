import { useState, useRef } from "react";
import type { ReactNode, ChangeEvent, FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Edit2,
  User,
  Phone,
  MapPin,
  Mail,
  Users,
} from "lucide-react";
import { api, getApiError } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import type { ParentProfil } from "@school-mgt/types";

function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {icon && (
        <span className="text-base-content/40 mt-0.5 shrink-0">{icon}</span>
      )}
      <span className="text-base-content/50 w-36 shrink-0">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}

type EditForm = {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
};

export default function ParentProfilPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const modalRef = useRef<HTMLDialogElement>(null);
  const user = useAuthStore((s) => s.user);

  const canEdit = user?.role === "ADMIN" || user?.role === "SUDO_ADMIN";

  const {
    data: parent,
    isLoading,
    isError,
    error,
  } = useQuery<ParentProfil>({
    queryKey: ["parent", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/profils/parents/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const [form, setForm] = useState<EditForm>({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    adresse: "",
  });

  const openModal = () => {
    if (!parent) return;
    setForm({
      nom: parent.nom ?? "",
      prenom: parent.prenom ?? "",
      email: parent.email ?? "",
      telephone: parent.telephone ?? "",
      adresse: parent.adresse ?? "",
    });
    modalRef.current?.showModal();
  };

  const closeModal = () => {
    modalRef.current?.close();
    updateMutation.reset();
  };

  const updateMutation = useMutation({
    mutationFn: async (f: EditForm) => {
      const body: Record<string, unknown> = {};
      if (f.nom.trim()) body.nom = f.nom.trim();
      if (f.prenom.trim()) body.prenom = f.prenom.trim();
      // email est nullable dans le schéma — null retire l'email existant
      body.email = f.email.trim() || null;
      if (f.telephone.trim()) body.telephone = f.telephone.trim();
      if (f.adresse.trim()) body.adresse = f.adresse.trim();

      const { data } = await api.put(`/api/profils/parents/${id}`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parent", id] });
      closeModal();
    },
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (isError || !parent) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost btn-sm gap-2"
        >
          <ArrowLeft size={16} /> Retour
        </button>
        <div role="alert" className="alert alert-error">
          <span>
            {getApiError(error, "Parent introuvable ou accès refusé.")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost btn-sm gap-2"
        >
          <ArrowLeft size={16} />
          Retour
        </button>
        {canEdit && (
          <button onClick={openModal} className="btn btn-primary gap-2">
            <Edit2 size={16} />
            Modifier le profil
          </button>
        )}
      </div>

      {/* Carte identité */}
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
          <div className="flex items-center gap-5">
            <div className="avatar placeholder">
              <div className="bg-accent text-accent-content rounded-full w-16 h-16">
                <span className="text-xl font-bold">
                  {parent.nom[0]}
                  {parent.prenom[0]}
                </span>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {parent.nom} {parent.prenom}
              </h1>
              <p className="text-base-content/60 text-sm mt-1">
                {parent.eleves.length} enfant
                {parent.eleves.length > 1 ? "s" : ""} inscrit
                {parent.eleves.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grille : coordonnées + enfants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Coordonnées */}
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-base mb-2">
              <User size={16} /> Coordonnées
            </h2>
            <div className="space-y-3">
              <InfoRow
                icon={<Mail size={14} />}
                label="Email"
                value={parent.email}
              />
              <InfoRow
                icon={<Phone size={14} />}
                label="Téléphone"
                value={parent.telephone}
              />
              <InfoRow
                icon={<MapPin size={14} />}
                label="Adresse"
                value={parent.adresse}
              />
            </div>
          </div>
        </div>

        {/* Enfants */}
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-base mb-2">
              <Users size={16} /> Enfants inscrits
            </h2>
            {parent.eleves.length === 0 ? (
              <p className="text-base-content/40 text-sm">Aucun enfant lié</p>
            ) : (
              <div className="space-y-2">
                {parent.eleves.map((e) => (
                  <Link
                    key={e.id}
                    to={`/eleves/${e.id}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-base-200 hover:bg-base-300 transition-colors"
                    aria-label={`Voir le profil de ${e.nom} ${e.prenom}`}
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {e.nom} {e.prenom}
                      </p>
                      <p className="text-xs text-base-content/60">
                        {e.classe?.nom ?? "Aucune classe"}
                      </p>
                    </div>
                    <ArrowLeft
                      size={14}
                      className="rotate-180 text-base-content/40"
                    />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal d'édition */}
      <dialog ref={modalRef} className="modal" onClose={closeModal}>
        <div className="modal-box max-w-lg">
          <h3 className="font-bold text-lg mb-4">
            Modifier — {parent.nom} {parent.prenom}
          </h3>

          {updateMutation.isError && (
            <div role="alert" className="alert alert-error alert-soft mb-4">
              <span>
                {getApiError(
                  updateMutation.error,
                  "Erreur lors de la mise à jour",
                )}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Nom</legend>
                <input
                  type="text"
                  className="input w-full"
                  name="nom"
                  value={form.nom}
                  onChange={handleChange}
                  minLength={3}
                />
              </fieldset>
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Prénom</legend>
                <input
                  type="text"
                  className="input w-full"
                  name="prenom"
                  value={form.prenom}
                  onChange={handleChange}
                  minLength={3}
                />
              </fieldset>
            </div>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Email</legend>
              <input
                type="email"
                className="input w-full"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="exemple@email.com"
              />
            </fieldset>

            <div className="grid grid-cols-2 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Téléphone</legend>
                <input
                  type="tel"
                  className="input w-full"
                  name="telephone"
                  value={form.telephone}
                  onChange={handleChange}
                />
              </fieldset>
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Adresse</legend>
                <input
                  type="text"
                  className="input w-full"
                  name="adresse"
                  value={form.adresse}
                  onChange={handleChange}
                />
              </fieldset>
            </div>

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
                disabled={updateMutation.isPending}
                className="btn btn-primary"
              >
                {updateMutation.isPending ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  "Enregistrer"
                )}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="submit">Fermer</button>
        </form>
      </dialog>
    </div>
  );
}
