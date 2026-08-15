import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  RotateCcw,
  User,
  Calendar,
  Phone,
  MapPin,
  GraduationCap,
  Users,
  FileText,
  TrendingUp,
  Clock,
  AlertCircle,
  Home,
  Briefcase,
  Mail,
  Search,
} from "lucide-react";
import {
  useFicheEleve,
  useFichesEleves,
  useDeleteEleve,
  useRestoreEleve,
} from "../hooks/useFicheEleve";
import { useAuthStore } from "../../../../../store/authStore";
import { getApiError } from "../../../../../lib/api";
import FicheEleveFormModal from "../components/FicheEleveFormModal";
import ConfirmModal from "../../../../../components/ConfirmModal";

// ═══════════════════════════════════════════════════════════════════
// HELPER: Formater les dates en français
// ═══════════════════════════════════════════════════════════════════
function formatDate(date?: string | null): string {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

// ═══════════════════════════════════════════════════════════════════
// HELPER: Formater les montants
// ═══════════════════════════════════════════════════════════════════
function formatMontant(montant: number | string | null | undefined): string {
  const parsed = Number(montant ?? 0);

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "MGA",
    minimumFractionDigits: 0,
  }).format(Number.isFinite(parsed) ? parsed : 0);
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT: Ligne d'information
// ═══════════════════════════════════════════════════════════════════
interface InfoRowProps {
  icon?: React.ReactNode;
  label: string;
  value?: string | number | null;
  badge?: boolean;
  badgeColor?: string;
}

function InfoRow({ icon, label, value, badge, badgeColor }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 py-2">
      {icon && (
        <span className="text-base-content/40 mt-0.5 shrink-0">{icon}</span>
      )}
      <span className="text-base-content/60 w-40 shrink-0 text-sm">
        {label}
      </span>
      {badge && value ? (
        <span className={`badge ${badgeColor || "badge-ghost"} badge-sm`}>
          {value}
        </span>
      ) : (
        <span className="font-medium text-sm">{value || "—"}</span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT: Section Card
// ═══════════════════════════════════════════════════════════════════
interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}

function SectionCard({ title, icon, children, action }: SectionCardProps) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <h2 className="card-title text-base flex items-center gap-2">
            {icon}
            {title}
          </h2>
          {action}
        </div>
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE: Fiche Élève Complète
// ═══════════════════════════════════════════════════════════════════
export default function FicheElevePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // États locaux
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(id ?? null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (id) {
      setSelectedId(id);
      return;
    }

    setSelectedId(null);
  }, [id]);

  const activeEleveId = id ?? selectedId ?? undefined;

  const resetSelection = () => {
    setSelectedId(null);
    setSearch("");
  };

  // Permissions
  const canEdit = user?.role === "ADMIN" || user?.role === "SUDO_ADMIN";
  const canDelete = user?.role === "ADMIN" || user?.role === "SUDO_ADMIN";

  // Requêtes API
  const {
    data: eleve,
    isLoading,
    isError,
    error,
  } = useFicheEleve(activeEleveId);
  const { data: allEleves = [], isLoading: isLoadingList } = useFichesEleves();
  const deleteMutation = useDeleteEleve();
  const restoreMutation = useRestoreEleve();

  const filteredEleves = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];

    return allEleves.filter((item) => {
      const matricule = String(item.matricule ?? "").toLowerCase();
      const nomComplet = `${item.nom ?? ""} ${item.prenom ?? ""}`.toLowerCase();
      return matricule.includes(query) || nomComplet.includes(query);
    });
  }, [allEleves, search]);

  const handleSelectEleve = (eleveId: string) => {
    setSelectedId(eleveId);
    setSearch("");
    navigate(`/eleves/informations/${eleveId}`);
  };

  // ─────────────────────────────────────────────────────────────────
  // Gestion de la suppression
  // ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!activeEleveId) return;

    try {
      await deleteMutation.mutateAsync(activeEleveId);
      setShowDeleteModal(false);
      resetSelection();
      navigate("/eleves/informations");
    } catch {
      // L'erreur est déjà gérée par le hook
    }
  };

  const handleRestore = async () => {
    if (!activeEleveId) return;

    try {
      await restoreMutation.mutateAsync(activeEleveId);
    } catch {
      // L'erreur est déjà gérée par le hook
    }
  };

  if (!activeEleveId) {
    return (
      <div className="space-y-5">
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-base flex items-center gap-2">
              <Search size={18} />
              Rechercher un élève
            </h2>
            <p className="text-sm text-base-content/60">
              Entrez un numéro de matricule ou le nom de l&apos;élève pour
              afficher sa fiche.
            </p>

            <fieldset className="fieldset">
              <label className="label">
                <span className="label-text">Matricule ou nom</span>
              </label>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ex. 1234 ou Miarisoa Rakotomalala"
                className="input input-bordered w-full"
              />
            </fieldset>

            {search.trim() && !isLoadingList && filteredEleves.length === 0 && (
              <div role="alert" className="alert alert-warning mt-3">
                <span>Aucun élève trouvé pour cette recherche.</span>
              </div>
            )}

            {filteredEleves.length > 0 && (
              <div className="mt-4 space-y-2">
                {filteredEleves.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="btn btn-outline w-full justify-between"
                    onClick={() => handleSelectEleve(item.id)}
                  >
                    <span>
                      {item.nom} {item.prenom}
                    </span>
                    <span className="badge badge-ghost">
                      {item.matricule ?? "—"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // RENDU: États de chargement et d'erreur
  // ═══════════════════════════════════════════════════════════════
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (isError || !eleve) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => {
            resetSelection();
            navigate("/eleves/informations");
          }}
          className="btn btn-ghost btn-sm gap-2"
        >
          <ArrowLeft size={16} />
          Retour aux élèves
        </button>
        <div role="alert" className="alert alert-error">
          <AlertCircle size={20} />
          <span>{getApiError(error, "Élève introuvable ou accès refusé")}</span>
        </div>
      </div>
    );
  }

  // Configuration des badges de statut
  const statutConfig: Record<string, { label: string; color: string }> = {
    ACTIF: { label: "Actif", color: "badge-success" },
    INACTIF: { label: "Inactif", color: "badge-ghost" },
    INSCRIT: { label: "Inscrit", color: "badge-info" },
    SUSPENDU: { label: "Suspendu", color: "badge-warning" },
    DIPLOME: { label: "Diplômé", color: "badge-success" },
    ABANDON: { label: "Abandon", color: "badge-error" },
  };

  const currentStatut = statutConfig[eleve.statut] || {
    label: eleve.statut,
    color: "badge-ghost",
  };

  const historiqueClasses = eleve.historiqueClasses ?? [];
  const droitInscriptions = eleve.droitInscriptions ?? [];
  const ecolages = eleve.ecolages ?? [];

  // ═══════════════════════════════════════════════════════════════
  // RENDU PRINCIPAL
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 pb-8">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* EN-TÊTE: Navigation et actions */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <button
          onClick={() => {
            resetSelection();
            navigate("/eleves/informations");
          }}
          className="btn btn-ghost btn-sm gap-2"
        >
          <ArrowLeft size={16} />
          Retour aux élèves
        </button>

        <div className="flex items-center gap-2">
          {/* Bouton restaurer si élève supprimé */}
          {eleve.deletedAt && canEdit && (
            <button
              onClick={handleRestore}
              disabled={restoreMutation.isPending}
              className="btn btn-success btn-sm gap-2"
            >
              {restoreMutation.isPending ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <RotateCcw size={16} />
              )}
              Restaurer
            </button>
          )}

          {/* Bouton modifier */}
          {!eleve.deletedAt && canEdit && (
            <button
              onClick={() => setShowEditModal(true)}
              className="btn btn-primary btn-sm gap-2"
            >
              <Edit2 size={16} />
              Modifier
            </button>
          )}

          {/* Bouton supprimer */}
          {!eleve.deletedAt && canDelete && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn btn-error btn-sm gap-2"
            >
              <Trash2 size={16} />
              Supprimer
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ALERTE: Élève supprimé */}
      {/* ─────────────────────────────────────────────────────────── */}
      {eleve.deletedAt && (
        <div role="alert" className="alert alert-warning">
          <AlertCircle size={20} />
          <span>Cet élève a été supprimé le {formatDate(eleve.deletedAt)}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* CARTE IDENTITÉ: Photo + Nom + Classe */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="card bg-base-100 shadow-md border border-base-200">
        <div className="card-body">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-24 h-24">
                {eleve.photoUrl ? (
                  <img
                    src={eleve.photoUrl}
                    alt={eleve.fullName}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold">
                    {eleve.nom[0]}
                    {eleve.prenom[0]}
                  </span>
                )}
              </div>
            </div>

            {/* Informations principales */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold">
                    {eleve.nom} {eleve.prenom}
                  </h1>
                  <p className="text-base-content/60 text-sm mt-1">
                    Matricule:{" "}
                    <span className="font-mono font-semibold">
                      {eleve.matricule}
                    </span>
                  </p>
                </div>
                <span className={`badge ${currentStatut.color} badge-lg`}>
                  {currentStatut.label}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="flex items-center gap-2">
                  <GraduationCap size={18} className="text-primary" />
                  <div>
                    <p className="text-xs text-base-content/60">Classe</p>
                    <p className="font-semibold">
                      {eleve.classe?.nom || "Non assigné"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-primary" />
                  <div>
                    <p className="text-xs text-base-content/60">Âge</p>
                    <p className="font-semibold">
                      {eleve.age ? `${eleve.age} ans` : "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-primary" />
                  <div>
                    <p className="text-xs text-base-content/60">Inscrit le</p>
                    <p className="font-semibold">
                      {formatDate(eleve.dateInscription)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* GRILLE 2 COLONNES: Sections principales */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION: Informations personnelles */}
        <SectionCard
          title="Informations personnelles"
          icon={<User size={18} />}
        >
          <div className="space-y-1">
            <InfoRow
              icon={<User size={14} />}
              label="Genre"
              value={eleve.genre || "—"}
              badge
              badgeColor={
                eleve.genre === "MASCULIN" ? "badge-info" : "badge-secondary"
              }
            />
            <InfoRow
              icon={<Calendar size={14} />}
              label="Date de naissance"
              value={formatDate(eleve.dateNaissance)}
            />
            <InfoRow
              icon={<MapPin size={14} />}
              label="Lieu de naissance"
              value={eleve.lieuNaissance}
            />
            <InfoRow
              icon={<Phone size={14} />}
              label="Téléphone"
              value={eleve.telephone}
            />
            <InfoRow label="Nationalité" value={eleve.nationalite} />
            <InfoRow
              label="Situation familiale"
              value={eleve.situationFamiliale}
              badge
            />
          </div>
        </SectionCard>

        {/* SECTION: Adresse */}
        {eleve.adresse && (
          <SectionCard title="Adresse" icon={<Home size={18} />}>
            <div className="space-y-1">
              <InfoRow label="Fokontany" value={eleve.adresse.fokontany} />
              <InfoRow label="Logement" value={eleve.adresse.logement} />
              <InfoRow label="Ville" value={eleve.adresse.ville} />
              <InfoRow label="Région" value={eleve.adresse.region} />
              <InfoRow label="Pays" value={eleve.adresse.pays} />
            </div>
          </SectionCard>
        )}

        {/* SECTION: Parent responsable */}
        <SectionCard
          title="Parent responsable"
          icon={<Users size={18} />}
          action={
            eleve.parent && (
              <Link
                to={`/parents/${eleve.parent.id}`}
                className="btn btn-ghost btn-xs gap-1"
              >
                Voir la fiche
                <ArrowLeft size={12} className="rotate-180" />
              </Link>
            )
          }
        >
          {eleve.parent ? (
            <div className="space-y-1">
              <InfoRow
                icon={<User size={14} />}
                label="Nom complet"
                value={`${eleve.parent.nom} ${eleve.parent.prenom}`}
              />
              <InfoRow
                icon={<Phone size={14} />}
                label="Téléphone"
                value={eleve.parent.telephone}
              />
              <InfoRow
                icon={<Mail size={14} />}
                label="Email"
                value={eleve.parent.email}
              />
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
        </SectionCard>

        {/* SECTION: Contact d'urgence */}
        {eleve.isRelationContact && (
          <SectionCard
            title="Contact d'urgence"
            icon={<AlertCircle size={18} />}
          >
            <div className="space-y-1">
              <InfoRow
                icon={<User size={14} />}
                label="Nom"
                value={eleve.relationName}
              />
              <InfoRow
                icon={<Phone size={14} />}
                label="Téléphone"
                value={eleve.relationTelephone}
              />
            </div>
          </SectionCard>
        )}

        {/* SECTION: Profession (si élève travaille) */}
        {eleve.professionEleve && (
          <SectionCard title="Profession" icon={<Briefcase size={18} />}>
            <div className="space-y-1">
              <InfoRow label="Titre" value={eleve.professionEleve.titre} />
              <InfoRow label="Lieu" value={eleve.professionEleve.lieu} />
              <InfoRow label="Secteur" value={eleve.professionEleve.secteur} />
            </div>
          </SectionCard>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* SECTION PLEINE LARGEUR: Historique scolaire */}
      {/* ─────────────────────────────────────────────────────────── */}
      {historiqueClasses.length > 0 && (
        <SectionCard
          title="Historique des classes"
          icon={<TrendingUp size={18} />}
        >
          <div className="overflow-x-auto">
            <table className="table table-sm table-zebra">
              <thead>
                <tr>
                  <th>Année scolaire</th>
                  <th>Classe</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {historiqueClasses.map(
                  (hist: (typeof historiqueClasses)[number]) => (
                    <tr key={hist.id}>
                      <td className="font-mono">{hist.anneeScolaire}</td>
                      <td className="font-semibold">{hist.classe.nom}</td>
                      <td>
                        <span className="badge badge-sm badge-ghost">
                          {hist.statutFinAnnee || "EN_COURS"}
                        </span>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* SECTION: Frais scolaires */}
      {/* ─────────────────────────────────────────────────────────── */}
      {(droitInscriptions.length > 0 || ecolages.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Droits d'inscription */}
          {droitInscriptions.length > 0 && (
            <SectionCard
              title="Droits d'inscription"
              icon={<FileText size={18} />}
            >
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Année</th>
                      <th className="text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {droitInscriptions.map(
                      (droit: (typeof droitInscriptions)[number]) => (
                        <tr key={droit.id}>
                          <td className="font-mono">{droit.anneeScolaire}</td>
                          <td className="text-right font-semibold">
                            {formatMontant(droit.montant)}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* Écolages */}
          {ecolages.length > 0 && (
            <SectionCard title="Écolages" icon={<FileText size={18} />}>
              <div className="overflow-x-auto max-h-64">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Période</th>
                      <th className="text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ecolages.map((ecolage: (typeof ecolages)[number]) => {
                      const moisNumber = Number(ecolage.mois ?? 0);
                      const moisNom = new Date(
                        2024,
                        Number.isFinite(moisNumber) ? moisNumber - 1 : 0,
                      ).toLocaleDateString("fr-FR", { month: "long" });
                      return (
                        <tr key={ecolage.id}>
                          <td>
                            <span className="capitalize">{moisNom}</span>{" "}
                            <span className="font-mono text-xs">
                              {ecolage.anneeScolaire}
                            </span>
                          </td>
                          <td className="text-right font-semibold">
                            {formatMontant(ecolage.montant)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* SECTION: Remarques */}
      {/* ─────────────────────────────────────────────────────────── */}
      {eleve.remarque && (
        <SectionCard title="Remarques" icon={<FileText size={18} />}>
          <p className="text-sm whitespace-pre-wrap">{eleve.remarque}</p>
        </SectionCard>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODALS */}
      {/* ─────────────────────────────────────────────────────────── */}

      {/* Modal de modification */}
      {showEditModal && (
        <FicheEleveFormModal
          eleve={eleve}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Supprimer l'élève"
        message={`Êtes-vous sûr de vouloir supprimer ${eleve.fullName} ? Cette action peut être annulée par restauration.`}
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
