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
  BookOpen,
  Briefcase,
} from "lucide-react";
import { api, getApiError } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import type { ProfesseurProfil, Classe } from "@school-mgt/types";
import CahierTexteTab from "../components/prof/CahierTexteTab";
import QuizTab from "../components/prof/QuizTab";

const CONTRAT_LABELS: Record<string, string> = {
  CDI: "CDI",
  CDD: "CDD",
  VACATAIRE: "Vacataire",
  STAGIAIRE: "Stagiaire",
};

function fmt(val?: Date | string | null): string {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR");
}

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
  dateNaissance: string;
  telephone: string;
  adresse: string;
  photoUrl: string;
  specialites: string;
  classeIds: string[];
};

export default function ProfesseurProfilPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const modalRef = useRef<HTMLDialogElement>(null);
  const user = useAuthStore((s) => s.user);

  const canEdit = user?.role === "ADMIN" || user?.role === "SUDO_ADMIN";

  const {
    data: prof,
    isLoading,
    isError,
    error,
  } = useQuery<ProfesseurProfil>({
    queryKey: ["professeur", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/profils/profs/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const { data: classes = [] } = useQuery<Classe[]>({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await api.get("/api/classes");
      return data;
    },
    enabled: canEdit,
  });

  const [form, setForm] = useState<EditForm>({
    nom: "",
    prenom: "",
    dateNaissance: "",
    telephone: "",
    adresse: "",
    photoUrl: "",
    specialites: "",
    classeIds: [],
  });
  const [activeTab, setActiveTab] = useState<
    "profil" | "cahier-texte" | "quiz"
  >("profil");

  const openModal = () => {
    if (!prof) return;
    setForm({
      nom: prof.nom ?? "",
      prenom: prof.prenom ?? "",
      dateNaissance: prof.dateNaissance
        ? new Date(prof.dateNaissance).toISOString().split("T")[0]
        : "",
      telephone: prof.telephone ?? "",
      adresse: prof.adresse ?? "",
      photoUrl: prof.photoUrl ?? "",
      specialites: prof.specialites ?? "",
      classeIds: prof.classes.map((c) => c.id),
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
      if (f.dateNaissance) body.dateNaissance = f.dateNaissance;
      if (f.telephone.trim()) body.telephone = f.telephone.trim();
      if (f.adresse.trim()) body.adresse = f.adresse.trim();
      if (f.photoUrl.trim()) body.photoUrl = f.photoUrl.trim();
      if (f.specialites.trim()) body.specialites = f.specialites.trim();
      // Always send classeIds: empty array removes all classes
      body.classeIds = f.classeIds;

      const { data } = await api.put(`/api/profils/profs/${id}`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professeur", id] });
      queryClient.invalidateQueries({ queryKey: ["professeurs"] });
      closeModal();
    },
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleClasse = (classeId: string, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      classeIds: checked
        ? [...prev.classeIds, classeId]
        : prev.classeIds.filter((id) => id !== classeId),
    }));
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

  if (isError || !prof) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate("/professeurs")}
          className="btn btn-ghost btn-sm gap-2"
        >
          <ArrowLeft size={16} /> Retour aux professeurs
        </button>
        <div role="alert" className="alert alert-error">
          <span>
            {getApiError(error, "Professeur introuvable ou accès refusé.")}
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
          onClick={() => navigate("/professeurs")}
          className="btn btn-ghost btn-sm gap-2"
        >
          <ArrowLeft size={16} />
          Retour aux professeurs
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
              <div className="bg-secondary text-secondary-content rounded-full w-16 h-16">
                {prof.photoUrl ? (
                  <img
                    src={prof.photoUrl}
                    alt={`${prof.nom} ${prof.prenom}`}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold">
                    {prof.nom[0]}
                    {prof.prenom[0]}
                  </span>
                )}
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {prof.nom} {prof.prenom}
              </h1>
              {prof.specialites && (
                <p className="text-base-content/60 text-sm mt-1">
                  {prof.specialites}
                </p>
              )}
              <div className="flex flex-wrap gap-1 mt-2">
                {prof.classes.map((c) => (
                  <span key={c.id} className="badge badge-outline badge-sm">
                    {c.nom}
                  </span>
                ))}
                {prof.classes.length === 0 && (
                  <span className="text-base-content/40 text-sm">
                    Aucune classe assignée
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="tabs tabs-bordered mb-4">
        {(
          [
            { key: "profil", label: "Profil" },
            { key: "cahier-texte", label: "Cahier de texte" },
            { key: "quiz", label: "Quiz" },
          ] as { key: typeof activeTab; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            className={`tab ${activeTab === t.key ? "tab-active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "profil" && (
        <>
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
              value={fmt(prof.dateNaissance)}
            />
            <InfoRow
              icon={<Phone size={14} />}
              label="Téléphone"
              value={prof.telephone}
            />
            <InfoRow
              icon={<MapPin size={14} />}
              label="Adresse"
              value={prof.adresse}
            />
            <InfoRow
              icon={<BookOpen size={14} />}
              label="Spécialités"
              value={prof.specialites}
            />
          </div>
        </div>
      </div>

      {/* Contrats */}
      {prof.contrat.length > 0 && (
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-base mb-2">
              <Briefcase size={16} /> Contrats
            </h2>
            <div className="overflow-x-auto">
              <table className="table table-sm table-zebra">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Poste</th>
                    <th>Début</th>
                    <th>Fin</th>
                  </tr>
                </thead>
                <tbody>
                  {prof.contrat.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <span className="badge badge-outline badge-sm">
                          {CONTRAT_LABELS[c.typeContrat] ?? c.typeContrat}
                        </span>
                      </td>
                      <td>{c.poste}</td>
                      <td>{fmt(c.dateDebut)}</td>
                      <td>
                        {c.dateFin ? (
                          fmt(c.dateFin)
                        ) : (
                          <span className="text-base-content/40">En cours</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Absences / Remplacements */}
      {prof.remplacements.length > 0 && (
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-base mb-2">Absences récentes</h2>
            <div className="overflow-x-auto">
              <table className="table table-sm table-zebra">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Classe</th>
                    <th>Motif</th>
                  </tr>
                </thead>
                <tbody>
                  {prof.remplacements.map((r) => (
                    <tr key={r.id}>
                      <td>{fmt(r.date)}</td>
                      <td>{r.classeNom ?? "—"}</td>
                      <td>{r.motif ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      </>
      )}

      {/* Modal d'édition */}
      <dialog ref={modalRef} className="modal" onClose={closeModal}>
        <div className="modal-box w-11/12 max-w-2xl">
          <h3 className="font-bold text-lg mb-4">
            Modifier — {prof.nom} {prof.prenom}
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
              <legend className="fieldset-legend">Date de naissance</legend>
              <input
                type="date"
                className="input w-full"
                name="dateNaissance"
                value={form.dateNaissance}
                onChange={handleChange}
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Spécialités</legend>
              <input
                type="text"
                className="input w-full"
                name="specialites"
                value={form.specialites}
                onChange={handleChange}
                placeholder="ex: Mathématiques, Physique"
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

            <fieldset className="fieldset">
              <legend className="fieldset-legend">
                URL de la photo (optionnel)
              </legend>
              <input
                type="url"
                className="input w-full"
                name="photoUrl"
                value={form.photoUrl}
                onChange={handleChange}
                placeholder="https://..."
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Classes assignées</legend>
              <div className="max-h-32 overflow-y-auto space-y-1 border border-base-300 rounded p-2">
                {classes.length === 0 && (
                  <p className="text-base-content/40 text-sm">
                    Aucune classe disponible
                  </p>
                )}
                {classes.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={form.classeIds.includes(c.id)}
                      onChange={(e) => toggleClasse(c.id, e.target.checked)}
                    />
                    <span className="text-sm">{c.nom}</span>
                  </label>
                ))}
              </div>
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
        <form method="dialog" className="modal-backdrop">
          <button type="submit">Fermer</button>
        </form>
      </dialog>

      {activeTab === "cahier-texte" && (
        <CahierTexteTab
          classeId={prof.classes[0]?.id ?? ""}
          matieres={prof.matieres ?? []}
          canWrite={
            user?.role === "PROF" ||
            user?.role === "ADMIN" ||
            user?.role === "SUDO_ADMIN"
          }
        />
      )}

      {activeTab === "quiz" && (
        <QuizTab
          classeId={prof.classes[0]?.id ?? ""}
          matieres={prof.matieres ?? []}
          canWrite={
            user?.role === "PROF" ||
            user?.role === "ADMIN" ||
            user?.role === "SUDO_ADMIN"
          }
        />
      )}
    </div>
  );
}
