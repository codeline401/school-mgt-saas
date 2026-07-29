import { useState } from "react";
import {
  AlertTriangle,
  Package,
  TrendingUp,
  Search,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { useArticlesStock, type ArticleStock } from "../hooks/useStocks";
import MouvementStockModal from "./MouvementStockModal";

/**
 * COMPOSANT ALERTES STOCK TAB
 *
 * Affiche les articles en dessous du seuil minimal
 */
function AlertesStockTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(
    null,
  );
  const [isEntreeModalOpen, setIsEntreeModalOpen] = useState(false);

  // ─── Query ────────────────────────────────────────────────
  const { data: articles = [], isLoading, error } = useArticlesStock();

  // ─── Filtrer uniquement les articles en alerte ────────────
  const articlesEnAlerte = articles.filter(
    (article) => article.quantite <= article.seuilMinimal,
  );

  // ─── Filtrage par recherche ───────────────────────────────
  const filteredAlertes = articlesEnAlerte.filter((article) =>
    article.nom.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // ─── Handlers ─────────────────────────────────────────────
  const handleReapprovisionner = (articleId: string) => {
    setSelectedArticleId(articleId);
    setIsEntreeModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEntreeModalOpen(false);
    setSelectedArticleId(null);
  };

  // ─── Utilitaires ──────────────────────────────────────────

  /**
   * Calcule le niveau de criticité de l'alerte
   */
  const getNiveauAlerte = (article: ArticleStock) => {
    const pourcentage = (article.quantite / article.seuilMinimal) * 100;

    if (article.quantite === 0) {
      return {
        niveau: "CRITIQUE",
        color: "text-error",
        bgColor: "bg-error/20",
        badge: "badge-error",
        label: "Stock épuisé",
      };
    } else if (pourcentage <= 50) {
      return {
        niveau: "URGENT",
        color: "text-error",
        bgColor: "bg-error/10",
        badge: "badge-error",
        label: "Critique",
      };
    } else {
      return {
        niveau: "ATTENTION",
        color: "text-warning",
        bgColor: "bg-warning/10",
        badge: "badge-warning",
        label: "Attention",
      };
    }
  };

  /**
   * Calcule la quantité à commander pour atteindre le seuil optimal
   */
  const getQuantiteRecommandee = (article: ArticleStock) => {
    if (!article.seuilOptimal) {
      return article.seuilMinimal * 2 - article.quantite;
    }
    return article.seuilOptimal - article.quantite;
  };

  /**
   * Calcule le pourcentage du stock
   */
  const getPourcentageStock = (article: ArticleStock) => {
    if (article.seuilMinimal === 0) return 0;
    return Math.min(
      100,
      Math.round((article.quantite / article.seuilMinimal) * 100),
    );
  };

  // ─── Statistiques ─────────────────────────────────────────
  const stats = {
    total: articlesEnAlerte.length,
    critique: articlesEnAlerte.filter((a) => a.quantite === 0).length,
    urgent: articlesEnAlerte.filter(
      (a) => a.quantite > 0 && (a.quantite / a.seuilMinimal) * 100 <= 50,
    ).length,
    attention: articlesEnAlerte.filter(
      (a) =>
        a.quantite > 0 &&
        (a.quantite / a.seuilMinimal) * 100 > 50 &&
        a.quantite <= a.seuilMinimal,
    ).length,
  };

  // ─── Rendu ────────────────────────────────────────────────

  if (error) {
    return (
      <div className="alert alert-error">
        <AlertTriangle size={20} />
        <span>Erreur lors du chargement des alertes</span>
      </div>
    );
  }

  return (
    <div>
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-figure text-warning">
            <AlertTriangle size={32} />
          </div>
          <div className="stat-title">Total alertes</div>
          <div className="stat-value text-warning">{stats.total}</div>
          <div className="stat-desc">Articles en alerte</div>
        </div>

        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-figure text-error">
            <AlertCircle size={32} />
          </div>
          <div className="stat-title">Stock épuisé</div>
          <div className="stat-value text-error">{stats.critique}</div>
          <div className="stat-desc">Critique</div>
        </div>

        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-figure text-error">
            <AlertTriangle size={32} />
          </div>
          <div className="stat-title">Très faible</div>
          <div className="stat-value text-error">{stats.urgent}</div>
          <div className="stat-desc">Urgent</div>
        </div>

        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-figure text-warning">
            <AlertTriangle size={32} />
          </div>
          <div className="stat-title">Faible</div>
          <div className="stat-value text-warning">{stats.attention}</div>
          <div className="stat-desc">À surveiller</div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="flex items-center gap-4 mb-6">
        <div className="form-control flex-1">
          <div className="input-group">
            <span className="bg-base-200">
              <Search size={20} />
            </span>
            <input
              type="text"
              placeholder="Rechercher un article en alerte..."
              className="input input-bordered w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="text-sm text-base-content/60">
          {filteredAlertes.length} alerte(s)
        </div>
      </div>

      {/* Message si aucune alerte */}
      {!isLoading && articlesEnAlerte.length === 0 && (
        <div className="alert alert-success">
          <Package size={20} />
          <div>
            <div className="font-semibold">Aucune alerte de stock !</div>
            <div className="text-sm">
              Tous vos articles sont au-dessus du seuil minimal.
            </div>
          </div>
        </div>
      )}

      {/* Liste des alertes */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : filteredAlertes.length === 0 && articlesEnAlerte.length > 0 ? (
          <div className="text-center py-12 text-base-content/60">
            <Search size={48} className="mx-auto mb-4 opacity-30" />
            <p>Aucune alerte ne correspond à votre recherche</p>
          </div>
        ) : (
          filteredAlertes.map((article) => {
            const alerte = getNiveauAlerte(article);
            const pourcentage = getPourcentageStock(article);
            const quantiteRecommandee = getQuantiteRecommandee(article);

            return (
              <div
                key={article.id}
                className={`card ${alerte.bgColor} border-l-4 ${
                  alerte.niveau === "CRITIQUE"
                    ? "border-error"
                    : alerte.niveau === "URGENT"
                      ? "border-error"
                      : "border-warning"
                }`}
              >
                <div className="card-body p-4">
                  <div className="flex items-start gap-4">
                    {/* Icône d'alerte */}
                    <div className={`${alerte.color} mt-1`}>
                      <AlertTriangle size={28} />
                    </div>

                    {/* Contenu principal */}
                    <div className="flex-1 min-w-0">
                      {/* En-tête */}
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                        <div>
                          <h4 className="font-semibold text-lg flex items-center gap-2">
                            {article.nom}
                            <span className={`badge ${alerte.badge} badge-sm`}>
                              {alerte.label}
                            </span>
                          </h4>
                          {article.reference && (
                            <div className="text-sm text-base-content/60">
                              Réf: {article.reference}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleReapprovisionner(article.id)}
                          className="btn btn-success btn-sm gap-2"
                        >
                          <TrendingUp size={16} />
                          Réapprovisionner
                        </button>
                      </div>

                      {/* Barre de progression */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-semibold">
                            Stock actuel: {article.quantite} {article.unite}
                          </span>
                          <span className="text-base-content/60">
                            {pourcentage}%
                          </span>
                        </div>
                        <progress
                          className={`progress ${
                            alerte.niveau === "CRITIQUE"
                              ? "progress-error"
                              : alerte.niveau === "URGENT"
                                ? "progress-error"
                                : "progress-warning"
                          } w-full`}
                          value={pourcentage}
                          max="100"
                        ></progress>
                      </div>

                      {/* Informations détaillées */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-base-content/60">
                            Seuil minimal
                          </div>
                          <div className="font-semibold">
                            {article.seuilMinimal} {article.unite}
                          </div>
                        </div>

                        {article.seuilOptimal && (
                          <div>
                            <div className="text-base-content/60">
                              Seuil optimal
                            </div>
                            <div className="font-semibold">
                              {article.seuilOptimal} {article.unite}
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="text-base-content/60">
                            Quantité recommandée
                          </div>
                          <div className="font-semibold text-success">
                            +{quantiteRecommandee} {article.unite}
                          </div>
                        </div>
                      </div>

                      {/* Emplacement */}
                      {article.emplacement && (
                        <div className="flex items-center gap-2 text-sm text-base-content/60 mt-3">
                          <MapPin size={14} />
                          <span>{article.emplacement}</span>
                        </div>
                      )}

                      {/* Message d'urgence */}
                      {alerte.niveau === "CRITIQUE" && (
                        <div className="alert alert-error mt-3 py-2">
                          <AlertCircle size={16} />
                          <span className="text-sm font-semibold">
                            Stock épuisé ! Réapprovisionnement urgent requis.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de réapprovisionnement */}
      {isEntreeModalOpen && (
        <MouvementStockModal type="ENTREE" onClose={handleCloseModal} />
      )}
    </div>
  );
}

export default AlertesStockTab;
