import { useState } from "react";
import {
  History,
  TrendingUp,
  TrendingDown,
  RefreshCcw,
  Calendar,
  Package,
  User,
  FileText,
} from "lucide-react";
import { useAllMouvementsStock } from "../hooks/useStocks";

/**
 * COMPOSANT MOUVEMENTS STOCK TAB
 *
 * Affiche l'historique complet des mouvements de stock
 */
function MouvementsStockTab() {
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // ─── Query ────────────────────────────────────────────────
  const {
    data: mouvements = [],
    isLoading,
    error,
    refetch,
  } = useAllMouvementsStock();

  // ─── Filtrage des mouvements ──────────────────────────────
  const filteredMouvements = mouvements.filter((mouvement) => {
    const matchType = filterType === "ALL" || mouvement.type === filterType;
    const matchSearch =
      searchTerm === "" ||
      mouvement.article.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mouvement.motif?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mouvement.reference?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchType && matchSearch;
  });

  // ─── Utilitaires ──────────────────────────────────────────

  /**
   * Retourne l'icône et la couleur selon le type de mouvement
   */
  const getMouvementStyle = (type: string) => {
    switch (type) {
      case "ENTREE":
        return {
          icon: TrendingUp,
          color: "text-success",
          bgColor: "bg-success/10",
          label: "Entrée",
        };
      case "SORTIE":
        return {
          icon: TrendingDown,
          color: "text-error",
          bgColor: "bg-error/10",
          label: "Sortie",
        };
      case "AJUSTEMENT":
        return {
          icon: RefreshCcw,
          color: "text-warning",
          bgColor: "bg-warning/10",
          label: "Ajustement",
        };
      default:
        return {
          icon: History,
          color: "text-info",
          bgColor: "bg-info/10",
          label: "Transfert",
        };
    }
  };

  /**
   * Formate la date
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  /**
   * Formate le coût
   */
  const formatCout = (cout: number | null) => {
    if (cout === null) return "-";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(cout);
  };

  // ─── Statistiques rapides ─────────────────────────────────
  const stats = {
    entrees: mouvements.filter((m) => m.type === "ENTREE").length,
    sorties: mouvements.filter((m) => m.type === "SORTIE").length,
    ajustements: mouvements.filter((m) => m.type === "AJUSTEMENT").length,
  };

  // ─── Rendu ────────────────────────────────────────────────

  if (error) {
    return (
      <div className="alert alert-error">
        <History size={20} />
        <span>Erreur lors du chargement des mouvements</span>
      </div>
    );
  }

  return (
    <div>
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-figure text-success">
            <TrendingUp size={32} />
          </div>
          <div className="stat-title">Entrées</div>
          <div className="stat-value text-success">{stats.entrees}</div>
          <div className="stat-desc">Approvisionnements</div>
        </div>

        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-figure text-error">
            <TrendingDown size={32} />
          </div>
          <div className="stat-title">Sorties</div>
          <div className="stat-value text-error">{stats.sorties}</div>
          <div className="stat-desc">Distributions</div>
        </div>

        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-figure text-warning">
            <RefreshCcw size={32} />
          </div>
          <div className="stat-title">Ajustements</div>
          <div className="stat-value text-warning">{stats.ajustements}</div>
          <div className="stat-desc">Corrections</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Recherche */}
        <div className="form-control flex-1">
          <div className="input-group">
            <input
              type="text"
              placeholder="Rechercher par article, motif ou référence..."
              className="input input-bordered w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Filtre par type */}
        <div className="form-control w-full md:w-48">
          <select
            className="select select-bordered"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">Tous les types</option>
            <option value="ENTREE">Entrées</option>
            <option value="SORTIE">Sorties</option>
            <option value="AJUSTEMENT">Ajustements</option>
            <option value="TRANSFERT">Transferts</option>
          </select>
        </div>

        {/* Bouton refresh */}
        <button
          onClick={() => refetch()}
          className="btn btn-outline btn-sm md:btn-md"
          disabled={isLoading}
        >
          <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* Compteur */}
      <div className="text-sm text-base-content/60 mb-4">
        {filteredMouvements.length} mouvement(s)
      </div>

      {/* Liste des mouvements */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : filteredMouvements.length === 0 ? (
          <div className="text-center py-12 text-base-content/60">
            <History size={48} className="mx-auto mb-4 opacity-30" />
            <p>
              {searchTerm || filterType !== "ALL"
                ? "Aucun mouvement ne correspond aux filtres"
                : "Aucun mouvement de stock enregistré"}
            </p>
          </div>
        ) : (
          filteredMouvements.map((mouvement) => {
            const style = getMouvementStyle(mouvement.type);
            const Icon = style.icon;

            return (
              <div
                key={mouvement.id}
                className={`card ${style.bgColor} border border-base-300`}
              >
                <div className="card-body p-4">
                  <div className="flex items-start gap-4">
                    {/* Icône du type */}
                    <div className={`${style.color} mt-1`}>
                      <Icon size={24} />
                    </div>

                    {/* Contenu principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-semibold text-base flex items-center gap-2">
                            <Package size={16} />
                            {mouvement.article?.nom}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-base-content/60 mt-1">
                            <span className={`badge badge-sm ${style.color}`}>
                              {style.label}
                            </span>
                            <span>
                              {mouvement.type === "ENTREE" ? "+" : "-"}
                              {mouvement.quantite} {mouvement.article.unite}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm text-base-content/60 flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(mouvement.createdAt)}
                          </div>
                          {mouvement.cout && (
                            <div className="text-sm font-semibold mt-1">
                              {formatCout(mouvement.cout)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Détails */}
                      <div className="space-y-1 text-sm">
                        {mouvement.motif && (
                          <div className="flex items-start gap-2">
                            <FileText
                              size={14}
                              className="text-base-content/60 mt-0.5 shrink-0"
                            />
                            <span className="text-base-content/70">
                              {mouvement.motif}
                            </span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-4 text-base-content/60">
                          {mouvement.reference && (
                            <span>Réf: {mouvement.reference}</span>
                          )}
                          {mouvement.user && (
                            <span className="flex items-center gap-1">
                              <User size={14} />
                              {mouvement.user.prenom} {mouvement.user.nom}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default MouvementsStockTab;
