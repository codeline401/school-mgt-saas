import { useState, useRef } from "react";
import type { ReactNode, ChangeEvent, FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Edit2,
  User,
  Calendar,
  Phone,
  MapPin,
  Users,
  BookOpen,
  Trash,
} from "lucide-react";
import { api, getApiError } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import type { EleveProfil, Classe } from "@school-mgt/types";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import ConfirmModal from "../components/ConfirmModal";

// ─── Labels et couleurs DaisyUI pour les statuts d'admission ─────────────────
const STATUT_CONFIG: Record<string, { label: string; cls: string }> = {
  EN_ATTENTE: { label: "En attente", cls: "badge-warning" },
  EN_LISTE_ATTENTE: { label: "Liste d'attente", cls: "badge-info" },
  ADMIS: { label: "Admis", cls: "badge-success" },
  REFUSE: { label: "Refusé", cls: "badge-error" },
};

// ─── Utilitaire : formate une date en français ────────────────────────────────
function fmt(val?: Date | string | null): string {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR");
}

// ─── Composant de ligne d'info (label + valeur + icône optionnelle) ──────────
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

// ─── Type du formulaire d'édition (toujours des strings, conversion à l'envoi) ─
type EditForm = {
  nom: string;
  prenom: string;
  dateNaissance: string; // format YYYY-MM-DD pour <input type="date">
  telephone: string;
  adresse: string;
  photoUrl: string;
  classeId: string;
  parentId: string; // vide = null côté API
};

// ─────────────────────────────────────────────────────────────────────────────
export default function EleveProfilPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const modalRef = useRef<HTMLDialogElement>(null);
  const user = useAuthStore((s) => s.user);

  // Seuls ADMIN et SUDO_ADMIN peuvent modifier ou supprimer un élève
  const canSuppr = user?.role === "ADMIN" || user?.role === "SUDO_ADMIN";
  const canEdit = user?.role === "ADMIN" || user?.role === "SUDO_ADMIN";

  // ── 1. Chargement du profil élève complet ─────────────────────────────────
  const {
    data: eleve,
    isLoading,
    isError,
    error,
  } = useQuery<EleveProfil>({
    queryKey: ["eleve", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/profils/eleves/${id}`);
      return data;
    },
    enabled: !!id,
  });

  // ── 2. Chargement des classes (pour le <select> dans le modal) ────────────
  const { data: classes = [] } = useQuery<Classe[]>({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await api.get("/api/classes");
      return data;
    },
    enabled: canEdit, // inutile de charger si l'utilisateur ne peut pas éditer
  });

  // ── 3. État local du formulaire ───────────────────────────────────────────
  const [form, setForm] = useState<EditForm>({
    nom: "",
    prenom: "",
    dateNaissance: "",
    telephone: "",
    adresse: "",
    photoUrl: "",
    classeId: "",
    parentId: "",
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Pré-remplit le formulaire avec les données actuelles avant d'ouvrir le modal
  const openModalModif = () => {
    if (!eleve) return;
    setForm({
      nom: eleve.nom ?? "",
      prenom: eleve.prenom ?? "",
      dateNaissance: eleve.dateNaissance
        ? new Date(eleve.dateNaissance).toISOString().split("T")[0]
        : "",
      telephone: eleve.telephone ?? "",
      adresse: eleve.adresse ?? "",
      photoUrl: eleve.photoUrl ?? "",
      classeId: eleve.classeId ?? "",
      parentId: eleve.parentId ?? "",
    });
    modalRef.current?.showModal();
  };

  const closeModal = () => {
    modalRef.current?.close();
    updateMutation.reset(); // efface l'état d'erreur précédent
  };

  // ── 4. Mutation PUT /api/profils/eleves/:id ──────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async (f: EditForm) => {
      // On construit le payload en n'incluant que les champs renseignés
      // dateNaissance est envoyé comme ISO string — z.coerce.date() côté API le convertit
      const body: Record<string, unknown> = {};
      if (f.nom.trim()) body.nom = f.nom.trim();
      if (f.prenom.trim()) body.prenom = f.prenom.trim();
      // Optional fields: omit when cleared so Zod optional() validation passes
      if (f.dateNaissance) body.dateNaissance = f.dateNaissance;
      if (f.telephone.trim()) body.telephone = f.telephone.trim();
      if (f.adresse.trim()) body.adresse = f.adresse.trim();
      if (f.photoUrl.trim()) body.photoUrl = f.photoUrl.trim();
      if (f.classeId) body.classeId = f.classeId;
      // parentId is nullable().optional() in the schema — explicit null removes the link
      body.parentId = f.parentId || null;

      const { data } = await api.put(`/api/profils/eleves/${id}`, body);
      return data;
    },
    onSuccess: () => {
      // Invalide les deux caches : la liste ET cette fiche
      queryClient.invalidateQueries({ queryKey: ["eleve", id] });
      queryClient.invalidateQueries({ queryKey: ["eleves"] });
      closeModal();
    },
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  // ── Mutation DELETE /api/profils/eleves/:id ──────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("ID élève manquant");
      await api.delete(`/api/eleves/${id}`);
    },
    onSuccess: () => {
      // Invalide les caches pour mettre à jour la liste des élèves
      queryClient.invalidateQueries({ queryKey: ["eleves"] });
      toast.success("Élève supprimé avec succès");
      navigate("/eleves");
    },
    onError: (err) => {
      toast.error(
        getApiError(
          err,
          "Erreur lors de la suppression de l'élève \n Veuillez contacter votre Administrateur",
        ),
      );
    },
  });

  // ── 5. États de chargement / erreur ──────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (isError || !eleve) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate("/eleves")}
          className="btn btn-ghost btn-sm gap-2"
        >
          <ArrowLeft size={16} /> Retour aux élèves
        </button>
        <div role="alert" className="alert alert-error">
          <span>
            {getApiError(error, "Élève introuvable ou accès refusé.")}
          </span>
        </div>
      </div>
    );
  }

  // ── 6. Rendu principal ───────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── En-tête : retour + bouton modifier ── */}
      <div className="flex items-end">
        <button
          onClick={() => navigate("/eleves")}
          className="btn btn-ghost btn-sm gap-2"
        >
          <ArrowLeft size={16} />
          Retour aux élèves
        </button>

        {canEdit && (
          <button onClick={openModalModif} className="btn btn-primary gap-2">
            <Edit2 size={16} />
            Modifier le profil
          </button>
        )}

        {canSuppr && (
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn btn-ghost gap-2"
            disabled={deleteMutation.isPending}
          >
            <Trash size={16} />
            Supprimer l'élève
          </button>
        )}
      </div>

      {/* ── Carte identité (avatar + nom + classe) ── */}
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
          <div className="flex items-center gap-5">
            {/* Avatar : photo si disponible, sinon initiales */}
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-16 h-16">
                {eleve.photoUrl ? (
                  <img
                    src={eleve.photoUrl}
                    alt={`${eleve.nom} ${eleve.prenom}`}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold">
                    {eleve.nom[0]}
                    {eleve.prenom[0]}
                  </span>
                )}
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {eleve.nom} {eleve.prenom}
              </h1>
              <div className="flex items-center gap-2 mt-1 text-base-content/60 text-sm">
                <BookOpen size={14} />
                <span>{eleve.classe?.nom ?? "Aucune classe assignée"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Grille 2 colonnes : infos perso + famille ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Informations personnelles */}
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-base mb-2">
              <User size={16} /> Informations personnelles
            </h2>
            <div className="space-y-3">
              <InfoRow
                icon={<Calendar size={14} />}
                label="Date de naissance"
                value={fmt(eleve.dateNaissance)}
              />
              <InfoRow
                icon={<Phone size={14} />}
                label="Téléphone"
                value={eleve.telephone}
              />
              <InfoRow
                icon={<MapPin size={14} />}
                label="Adresse"
                value={eleve.adresse}
              />
            </div>
          </div>
        </div>

        {/* Parent responsable */}
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <div className="flex items-center justify-between mb-2">
              <h2 className="card-title text-base">
                <Users size={16} /> Parent responsable
              </h2>
              {eleve.parent && (
                <Link
                  to={`/parents/${eleve.parent.id}`}
                  className="btn btn-ghost btn-xs gap-1"
                >
                  Voir la fiche <ArrowLeft size={12} className="rotate-180" />
                </Link>
              )}
            </div>
            {eleve.parent ? (
              <div className="space-y-3">
                <InfoRow
                  label="Nom"
                  value={`${eleve.parent.nom} ${eleve.parent.prenom}`}
                />
                <InfoRow
                  icon={<Phone size={14} />}
                  label="Téléphone"
                  value={eleve.parent.telephone}
                />
                <InfoRow label="Email" value={eleve.parent.email} />
                <InfoRow
                  icon={<MapPin size={14} />}
                  label="Adresse"
                  value={eleve.parent.adresse}
                />
              </div>
            ) : (
              <p className="text-base-content/40 text-sm">
                Aucun parent enregistré
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Historique des admissions (affiché seulement s'il existe) ── */}
      {eleve.admissions && eleve.admissions.length > 0 && (
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-base mb-2">
              Historique des admissions
            </h2>
            <div className="overflow-x-auto">
              <table className="table table-sm table-zebra">
                <thead>
                  <tr>
                    <th>Classe visée</th>
                    <th>Date</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {eleve.admissions.map((a) => {
                    const s = STATUT_CONFIG[a.statut] ?? {
                      label: a.statut,
                      cls: "badge-ghost",
                    };
                    return (
                      <tr key={a.id}>
                        <td>{a.classeVisee}</td>
                        <td>{fmt(a.createdAt)}</td>
                        <td>
                          <span className={`badge badge-sm ${s.cls}`}>
                            {s.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal d'édition ── */}
      <dialog ref={modalRef} className="modal" onClose={closeModal}>
        <div className="modal-box w-11/12 max-w-2xl">
          <h3 className="font-bold text-lg mb-4">
            Modifier — {eleve.nom} {eleve.prenom}
          </h3>

          {/* Alerte erreur API */}
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
            {/* Nom / Prénom côte à côte */}
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

            {/* Date de naissance */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Date de naissance</legend>
              <input
                type="date"
                className="input w-full"
                name="dateNaissance"
                value={form.dateNaissance}
                onChange={handleChange}
              />
            </fieldset>

            {/* Classe (select alimenté par l'API /api/classes) */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Classe</legend>
              <select
                className="select w-full"
                name="classeId"
                value={form.classeId}
                onChange={handleChange}
              >
                <option value="">— Aucune classe —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </fieldset>

            {/* Téléphone / Adresse côte à côte */}
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

            {/* Photo de profil */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend">
                Photo de profil (optionnel)
              </legend>
              {form.photoUrl && (
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={form.photoUrl}
                    alt="Aperçu"
                    className="w-14 h-14 rounded-full object-cover border border-base-300"
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, photoUrl: "" }))
                    }
                  >
                    Supprimer
                  </button>
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="file-input w-full"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) {
                    toast.error("La photo ne doit pas dépasser 2 Mo");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () =>
                    setForm((prev) => ({
                      ...prev,
                      photoUrl: reader.result as string,
                    }));
                  reader.readAsDataURL(file);
                }}
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

        {/* Fermeture en cliquant en dehors */}
        <form method="dialog" className="modal-backdrop">
          <button type="submit">Fermer</button>
        </form>
      </dialog>

      {/** --- Modal de confirmation de suppression --- */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Supprimer l'élève"
        message={`Êtes-vous sûr de vouloir supprimer ${eleve.nom} ${eleve.prenom} de votre école ? Cette action est irreversible`}
        confirmLabel="Oui, Supprimer"
        cancelLabel="Annuler"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
