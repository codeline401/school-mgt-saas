import { useState } from "react";
import {
  useArticlesStock,
  useDeleteArticle,
  useStatistiquesStock,
  type ArticleStock,
} from "../hooks/useStocks";
import ConfirmModal from "../../../components/ConfirmModal";
import {
  AlertTriangle,
  Edit,
  MapPin,
  Package,
  Search,
  Trash2,
  TrendingUp,
} from "lucide-react";
import ArticleStockModal from "./ArticlesStockModal";

/**
 * COMPOSANT ARTICLES STOCK TAB
 * @returns
 *
 * Affiche la liste des articles en stock avec filtres et statistiques
 */
function ArticleStockTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectArticle, setSelectArticle] = useState<ArticleStock | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<{
    id: string;
    nom: string;
  } | null>(null);

  // --- Queries --------------------------------------------------
  const { data: articles = [], isLoading, error } = useArticlesStock();
  const { data: stats } = useStatistiquesStock();

  // --- Mutations ------------------------------------------------
  const deleteMutation = useDeleteArticle();

  // --- Filtrage des articles ------------------------------------
  const filteredArticles = articles.filter((article) =>
    article.nom.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // --- handlers -------------------------------------------------
  const handleEdit = (article: ArticleStock) => {
    setSelectArticle(article);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectArticle(null);
    setIsModalOpen(false);
  };

  // ouvre le modal de confirmation pour la suppression d'un article
  const handleDeleteClick = (articleId: string, articleNom: string) => {
    setArticleToDelete({ id: articleId, nom: articleNom });
    setIsConfirmModalOpen(true);
  };

  // confirma le suppression
  const handleConfirmDelete = async () => {
    if (articleToDelete) {
      await deleteMutation.mutateAsync(articleToDelete.id);
      setIsConfirmModalOpen(false);
      setArticleToDelete(null);
    }
  };

  // Annuler la suppression
  const handleCancelDelete = () => {
    setIsConfirmModalOpen(false);
    setArticleToDelete(null);
  };

  // --- Utilitaires ------------------------------------------------
  const isEnAlerte = (article: ArticleStock) =>
    article.quantite <= article.seuilMinimal;

  const formatPrix = (prix: number | null) => {
    if (prix === null) return "-";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(prix);
  };

  const getCategorieLabel = (categorie: string) => {
    const labels: Record<string, string> = {
      FOURNITURES_SCOLAIRES: "Fournitures scolaires",
      MATERIEL_PEDAGOGIQUE: "Matériel pédagogique",
      MATERIEL_INFORMATIQUE: "Matériel informatique",
      EQUIPEMENT_SPORTIF: "Équipement sportif",
      CONSOMMABLES: "Consommables",
      IMMOBILIERS: "Immobiliers",
      AUTRE: "Autre",
    };
    return labels[categorie] || categorie;
  };

  // --- Rendu du composant ------------------------------------------
  if (error) {
    return (
      <div className="alert alert-error">
        <AlertTriangle size={20} />
        <span>
          Erreur lors du chargement des articles en stock : {error.message}
        </span>
      </div>
    );
  }

  return (
    <div>
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-figure text-primary">
            <Package size={32} />
          </div>
          <div className="stat-title">Total articles</div>
          <div className="stat-value text-primary">
            {stats?.totalArticles || articles.length}
          </div>
          <div className="stat-desc">En stock</div>
        </div>

        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-figure text-warning">
            <AlertTriangle size={32} />
          </div>
          <div className="stat-title">Alertes</div>
          <div className="stat-value text-warning">
            {stats?.articlesEnAlerte || articles.filter(isEnAlerte).length}
          </div>
          <div className="stat-desc">Articles sous le seuil</div>
        </div>

        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-figure text-success">
            <TrendingUp size={32} />
          </div>
          <div className="stat-title">Valeur totale</div>
          <div className="stat-value text-success">
            {formatPrix(stats?.valeurTotale || 0)}
          </div>
          <div className="stat-desc">Estimation du stock</div>
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
              placeholder="Rechercher un article par nom..."
              className="input input-bordered w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="text-sm text-base-content/60">
          {filteredArticles.length} article(s)
        </div>
      </div>

      {/* Tableau des articles */}
      <div className="overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Article</th>
              <th>Catégorie</th>
              <th>Quantité</th>
              <th>Seuil</th>
              <th>Prix unitaire</th>
              <th>Emplacement</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </td>
              </tr>
            ) : filteredArticles.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-8 text-base-content/60"
                >
                  {searchTerm
                    ? "Aucun article ne correspond à votre recherche"
                    : "Aucun article en stock"}
                </td>
              </tr>
            ) : (
              filteredArticles.map((article) => (
                <tr
                  key={article.id}
                  className={isEnAlerte(article) ? "bg-warning/10" : ""}
                >
                  <td>
                    <div className="flex items-start gap-2">
                      {isEnAlerte(article) && (
                        <AlertTriangle
                          size={16}
                          className="text-warning mt-1 shrink-0"
                        />
                      )}
                      <div>
                        <div className="font-semibold">{article.nom}</div>
                        {article.reference && (
                          <div className="text-xs text-base-content/60">
                            Réf: {article.reference}
                          </div>
                        )}
                        {article.description && (
                          <div className="text-xs text-base-content/60 mt-1">
                            {article.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-outline badge-sm">
                      {getCategorieLabel(article.categorie)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`font-semibold ${
                        isEnAlerte(article) ? "text-warning" : ""
                      }`}
                    >
                      {article.quantite} {article.unite}
                    </span>
                  </td>
                  <td>
                    <div className="text-sm">
                      <div>Min: {article.seuilMinimal}</div>
                      {article.seuilOptimal && (
                        <div className="text-base-content/60">
                          Opt: {article.seuilOptimal}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>{formatPrix(article.prixUnitaire)}</td>
                  <td>
                    {article.emplacement ? (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin size={14} className="text-base-content/60" />
                        {article.emplacement}
                      </div>
                    ) : (
                      <span className="text-base-content/40">-</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(article)}
                        className="btn btn-ghost btn-xs"
                        title="Modifier"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteClick(article.id, article.nom)
                        }
                        className="btn btn-ghost btn-xs text-error"
                        title="Supprimer"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal d'édition */}
      {isModalOpen && (
        <ArticleStockModal article={selectArticle} onClose={handleCloseModal} />
      )}

      {/** Modal dde confirmation de suppression */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Supprimer l'article"
        message={`Êtes-vous sûr de vouloir supprimer l'article ${articleToDelete?.nom} de votre stock`}
        confirmLabel="Oui, Supprimer"
        cancelLabel="Non, j'ai changé d'avis"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}

export default ArticleStockTab;
