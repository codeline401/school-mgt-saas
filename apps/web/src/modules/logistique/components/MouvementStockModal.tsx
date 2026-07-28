import { useState } from "react";
import {
  X,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  useCreateMouvement,
  useArticlesStock,
  type CreateMouvementStockInput,
} from "../hooks/useStocks";

/**
 * COMPOSANT MODAL MOUVEMENT STOCK
 *
 * Modal pour enregistrer une entrée ou sortie de stock
 */

interface MouvementStockModalProps {
  type: "ENTREE" | "SORTIE";
  onClose: () => void;
}

export default function MouvementStockModal({
  type,
  onClose,
}: MouvementStockModalProps) {
  const isEntree = type === "ENTREE";

  // ─── État du formulaire ──────────────────────────────────
  const [formData, setFormData] = useState<CreateMouvementStockInput>({
    articleId: "",
    type: type,
    quantite: 0,
    motif: "",
    reference: "",
    cout: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Queries & Mutations ──────────────────────────────────
  const { data: articles = [] } = useArticlesStock();
  const createMouvementMutation = useCreateMouvement();

  // ─── Handlers ─────────────────────────────────────────────

  /**
   * Met à jour un champ du formulaire
   */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    // Conversion des nombres
    const numericFields = ["quantite", "cout"];
    const processedValue = numericFields.includes(name)
      ? value === ""
        ? undefined
        : Number(value)
      : value;

    setFormData((prev) => ({ ...prev, [name]: processedValue }));

    // Supprimer l'erreur du champ modifié
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /**
   * Valide le formulaire
   */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.articleId) {
      newErrors.articleId = "Veuillez sélectionner un article";
    }

    if (!formData.quantite || formData.quantite <= 0) {
      newErrors.quantite = "La quantité doit être supérieure à 0";
    }

    // Vérifier si l'article a assez de stock pour une sortie
    if (!isEntree && formData.articleId) {
      const article = articles.find((a) => a.id === formData.articleId);
      if (article && formData.quantite > article.quantite) {
        newErrors.quantite = `Stock insuffisant (disponible: ${article.quantite} ${article.unite})`;
      }
    }

    if (formData.cout !== undefined && formData.cout < 0) {
      newErrors.cout = "Le coût ne peut pas être négatif";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Soumet le formulaire
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const dataToSubmit: CreateMouvementStockInput = {
        articleId: formData.articleId,
        type: type,
        quantite: formData.quantite,
      };

      // Ajouter les champs optionnels s'ils sont remplis
      if (formData.motif?.trim()) {
        dataToSubmit.motif = formData.motif;
      }
      if (formData.reference?.trim()) {
        dataToSubmit.reference = formData.reference;
      }
      if (formData.cout !== undefined) {
        dataToSubmit.cout = formData.cout;
      }

      await createMouvementMutation.mutateAsync(dataToSubmit);
      onClose();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du mouvement:", error);
      setErrors({ submit: "Erreur lors de l'enregistrement" });
    }
  };

  // Trouver l'article sélectionné
  const selectedArticle = articles.find((a) => a.id === formData.articleId);

  const isLoading = createMouvementMutation.isPending;

  // ─── Rendu ────────────────────────────────────────────────

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            {isEntree ? (
              <TrendingUp size={24} className="text-success" />
            ) : (
              <TrendingDown size={24} className="text-error" />
            )}
            <h3 className="font-bold text-lg">
              {isEntree ? "Entrée de stock" : "Sortie de stock"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost"
            disabled={isLoading}
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Sélection de l'article */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend required">Article *</legend>
              <select
                name="articleId"
                value={formData.articleId}
                onChange={handleChange}
                className={`select select-bordered ${errors.articleId ? "select-error" : ""}`}
                disabled={isLoading}
              >
                <option value="">-- Sélectionner un article --</option>
                {articles.map((article) => (
                  <option key={article.id} value={article.id}>
                    {article.nom} (Stock actuel: {article.quantite}{" "}
                    {article.unite})
                  </option>
                ))}
              </select>
              {errors.articleId && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.articleId}
                  </span>
                </label>
              )}
            </fieldset>

            {/* Affichage du stock actuel */}
            {selectedArticle && (
              <div
                className={`alert ${
                  selectedArticle.quantite <= selectedArticle.seuilMinimal
                    ? "alert-warning"
                    : "alert-info"
                }`}
              >
                <AlertCircle size={20} />
                <div>
                  <div className="font-semibold">
                    Stock actuel: {selectedArticle.quantite}{" "}
                    {selectedArticle.unite}
                  </div>
                  <div className="text-sm">
                    Seuil minimal: {selectedArticle.seuilMinimal}
                  </div>
                </div>
              </div>
            )}

            {/* Quantité */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend required">Quantité *</legend>
              <input
                type="number"
                name="quantite"
                value={formData.quantite || ""}
                onChange={handleChange}
                className={`input input-bordered ${errors.quantite ? "input-error" : ""}`}
                min="1"
                placeholder="Ex: 10"
                disabled={isLoading}
              />
              {errors.quantite && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.quantite}
                  </span>
                </label>
              )}
            </fieldset>

            {/* Référence & Coût */}
            <div className="grid grid-cols-2 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend required">Référence</legend>
                <input
                  type="text"
                  name="reference"
                  value={formData.reference}
                  onChange={handleChange}
                  className="input input-bordered"
                  placeholder="Ex: BON-2024-001"
                  disabled={isLoading}
                />
              </fieldset>

              {isEntree && (
                <fieldset className="fieldset">
                  <legend className="fieldset-legend required">
                    Coût (Ariary)
                  </legend>
                  <input
                    type="number"
                    name="cout"
                    value={formData.cout || ""}
                    onChange={handleChange}
                    className={`input input-bordered ${errors.cout ? "input-error" : ""}`}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    disabled={isLoading}
                  />
                  {errors.cout && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.cout}
                      </span>
                    </label>
                  )}
                </fieldset>
              )}
            </div>

            {/* Motif */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend required">Motif</legend>
              <textarea
                name="motif"
                value={formData.motif}
                onChange={handleChange}
                className="textarea textarea-bordered h-20 w-full"
                placeholder={
                  isEntree
                    ? "Ex: Achat de fournitures pour la rentrée"
                    : "Ex: Distribution aux élèves de CM2"
                }
                disabled={isLoading}
              />
            </fieldset>

            {/* Erreur globale */}
            {errors.submit && (
              <div className="alert alert-error">
                <AlertCircle size={20} />
                <span>{errors.submit}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="modal-action">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className={`btn ${isEntree ? "btn-success" : "btn-error"}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Enregistrement...
                </>
              ) : isEntree ? (
                "Enregistrer l'entrée"
              ) : (
                "Enregistrer la sortie"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
