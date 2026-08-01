import { useState } from "react";
import {
  Calendar,
  User,
  Package,
  CheckCircle,
  AlertTriangle,
  Filter,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { usePrets, type PretEquipement } from "../hooks/useEquipements";
import RetourModal from "./RetourModal";

/**
 * COMPOSANT PRETS TAB
 *
 * Historique des prêts d'équipements
 */
function PretsTab() {
  const [filterStatut, setFilterStatut] = useState<string>("ALL");
  const [selectedPret, setSelectedPret] = useState<PretEquipement | null>(null);
  const [isRetourModalOpen, setIsRetourModalOpen] = useState(false);

  // ─── Query ────────────────────────────────────────────────
  const statutQuery = filterStatut === "ALL" ? undefined : filterStatut;
  const { data: prets = [], isLoading, error } = usePrets(statutQuery);

  // ─── Handlers ─────────────────────────────────────────────
  const handleRetour = (pret: PretEquipement) => {
    setSelectedPret(pret);
    setIsRetourModalOpen(true);
  };

  const handleCloseRetourModal = () => {
    setSelectedPret(null);
    setIsRetourModalOpen(false);
  };

  // ─── Utilitaires ──────────────────────────────────────────
  const getStatutBadge = (statut: string) => {
    const badges: Record<
      string,
      { class: string; label: string; icon: LucideIcon }
    > = {
      EN_COURS: { class: "badge-warning", label: "En cours", icon: Clock },
      RETOURNE: {
        class: "badge-success",
        label: "Retourné",
        icon: CheckCircle,
      },
      EN_RETARD: {
        class: "badge-error",
        label: "En retard",
        icon: AlertTriangle,
      },
      PERDU: { class: "badge-error", label: "Perdu", icon: AlertTriangle },
    };
    return (
      badges[statut] || { class: "badge-ghost", label: statut, icon: Clock }
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isEnRetard = (pret: PretEquipement) => {
    if (pret.statut !== "EN_COURS") return false;
    const aujourdhui = new Date();
    const dateRetourPrevue = new Date(pret.dateRetourPrevue);
    return aujourdhui > dateRetourPrevue;
  };

  // Statistiques
  const stats = {
    enCours: prets.filter((p) => p.statut === "EN_COURS").length,
    retournes: prets.filter((p) => p.statut === "RETOURNE").length,
    enRetard: prets.filter((p) => isEnRetard(p)).length,
  };

  // ─── Rendu ────────────────────────────────────────────────
  if (error) {
    return (
      <div className="alert alert-error">
        <AlertTriangle size={20} />
        <span>Erreur lors du chargement des prêts</span>
      </div>
    );
  }

  return (
    <div>
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-figure text-warning">
            <Clock size={32} />
          </div>
          <div className="stat-title">En cours</div>
          <div className="stat-value text-warning">{stats.enCours}</div>
          <div className="stat-desc">Prêts actifs</div>
        </div>

        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-figure text-success">
            <CheckCircle size={32} />
          </div>
          <div className="stat-title">Retournés</div>
          <div className="stat-value text-success">{stats.retournes}</div>
          <div className="stat-desc">Équipements rendus</div>
        </div>

        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-figure text-error">
            <AlertTriangle size={32} />
          </div>
          <div className="stat-title">En retard</div>
          <div className="stat-value text-error">{stats.enRetard}</div>
          <div className="stat-desc">Retours dépassés</div>
        </div>
      </div>

      {/* Filtre */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter size={20} />
          <span className="text-sm font-semibold">Filtrer par statut:</span>
        </div>
        <select
          className="select select-bordered select-sm"
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
        >
          <option value="ALL">Tous les prêts</option>
          <option value="EN_COURS">En cours</option>
          <option value="RETOURNE">Retournés</option>
          <option value="EN_RETARD">En retard</option>
        </select>
        <div className="text-sm text-base-content/60">
          {prets.length} prêt(s)
        </div>
      </div>

      {/* Liste des prêts */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : prets.length === 0 ? (
          <div className="text-center py-12 text-base-content/60">
            <Calendar size={48} className="mx-auto mb-4 opacity-30" />
            <p>
              {filterStatut !== "ALL"
                ? "Aucun prêt ne correspond au filtre"
                : "Aucun prêt enregistré"}
            </p>
          </div>
        ) : (
          prets.map((pret) => {
            const statutBadge = getStatutBadge(pret.statut);
            const StatutIcon = statutBadge.icon;
            const enRetard = isEnRetard(pret);

            return (
              <div
                key={pret.id}
                className={`card border ${
                  enRetard ? "border-error bg-error/5" : "border-base-300"
                }`}
              >
                <div className="card-body p-4">
                  <div className="flex items-start gap-4">
                    {/* Icône */}
                    <div className="mt-1">
                      <Package size={24} className="text-primary" />
                    </div>

                    {/* Contenu principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-semibold text-base">
                            {pret.equipement?.nom || "Équipement"}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`badge ${statutBadge.class} badge-sm gap-1`}
                            >
                              <StatutIcon size={12} />
                              {statutBadge.label}
                            </span>
                            {enRetard && (
                              <span className="badge badge-error badge-sm">
                                ⚠️ En retard
                              </span>
                            )}
                          </div>
                        </div>

                        {pret.statut === "EN_COURS" && (
                          <button
                            onClick={() => handleRetour(pret)}
                            className="btn btn-success btn-sm"
                          >
                            <CheckCircle size={16} />
                            Retour
                          </button>
                        )}
                      </div>

                      {/* Détails */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-base-content/60" />
                          <span>
                            <span className="font-semibold">Emprunteur:</span>{" "}
                            {pret.emprunteurNom}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar
                            size={16}
                            className="text-base-content/60"
                          />
                          <span>
                            <span className="font-semibold">Prêt:</span>{" "}
                            {formatDate(pret.datePret)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar
                            size={16}
                            className="text-base-content/60"
                          />
                          <span>
                            <span className="font-semibold">Retour prévu:</span>{" "}
                            {formatDate(pret.dateRetourPrevue)}
                          </span>
                        </div>

                        {pret.dateRetourEffective && (
                          <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-success" />
                            <span>
                              <span className="font-semibold">
                                Retour effectif:
                              </span>{" "}
                              {formatDate(pret.dateRetourEffective)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Motif */}
                      {pret.motif && (
                        <div className="text-sm text-base-content/70 mt-2">
                          <span className="font-semibold">Motif:</span>{" "}
                          {pret.motif}
                        </div>
                      )}

                      {/* Observations */}
                      {pret.observations && (
                        <div className="text-sm text-base-content/70 mt-1">
                          <span className="font-semibold">Observations:</span>{" "}
                          {pret.observations}
                        </div>
                      )}

                      {/* Info prêté par / retourné par */}
                      <div className="flex gap-4 text-xs text-base-content/60 mt-2">
                        <span>
                          Prêté par: {pret.pretPar.prenom} {pret.pretPar.nom}
                        </span>
                        {pret.retourPar && (
                          <span>
                            Retourné par: {pret.retourPar.prenom}{" "}
                            {pret.retourPar.nom}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de retour */}
      {isRetourModalOpen && selectedPret && (
        <RetourModal pret={selectedPret} onClose={handleCloseRetourModal} />
      )}
    </div>
  );
}

export default PretsTab;
