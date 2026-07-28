import { useState, useEffect } from "react";
import { X, Package, AlertCircle, Loader2 } from "lucide-react";
import {
  useCreateArticle,
  useUpdateArticle,
  type ArticleStock,
  type CreateArticleStockInput,
  type UpdateArticleStockInput,
} from "../hooks/useStocks";

/**
 * COMPOSANT MODAL ARTICLE STOCK
 *
 * Modal pour créer ou modifier un article en stock
 *
 * @param article - Article à modifier (null pour création)
 * @param onClose - Fonction de fermeture du modal
 */

interface ArticleStockModalProps {
  article: ArticleStock | null;
  onClose: () => void;
}

const CATEGORIES = [
  { value: "FOURNITURES_SCOLAIRES", label: "Fournitures scolaires" },
  { value: "MATERIEL_PEDAGOGIQUE", label: "Matériel pédagogique" },
  { value: "EQUIPEMENT_SPORTIF", label: "Équipement sportif" },
  { value: "MATERIEL_INFORMATIQUE", label: "Matériel informatique" },
  { value: "CONSOMMABLES", label: "Consommables" },
  { value: "AUTRE", label: "Autre" },
];

const UNITES = ["unité", "lot", "paquet", "boîte", "kg", "litre", "mètre"];

export default function ArticleStockModal({
  article,
  onClose,
}: ArticleStockModalProps) {
  const isEdit = !!article;

  // ─── État du formulaire ──────────────────────────────────
  const [formData, setFormData] = useState<CreateArticleStockInput>({
    nom: "",
    reference: "",
    description: "",
    categorie: "FOURNITURES_SCOLAIRES",
    quantite: 0,
    unite: "unité",
    seuilMinimal: 10,
    seuilOptimal: undefined,
    prixUnitaire: undefined,
    emplacement: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Mutations ────────────────────────────────────────────
  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle(article?.id || "");

  // ─── Initialisation du formulaire avec les données existantes ───
  useEffect(() => {
    if (article) {
      setFormData({
        nom: article.nom,
        reference: article.reference || "",
        description: article.description || "",
        categorie: article.categorie,
        quantite: article.quantite,
        unite: article.unite,
        seuilMinimal: article.seuilMinimal,
        seuilOptimal: article.seuilOptimal || undefined,
        prixUnitaire: article.prixUnitaire
          ? Number(article.prixUnitaire)
          : undefined,
        emplacement: article.emplacement || "",
      });
    }
  }, [article]);

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
    const numericFields = [
      "quantite",
      "seuilMinimal",
      "seuilOptimal",
      "prixUnitaire",
    ];
    const processedValue = numericFields.includes(name)
      ? value === ""
        ? undefined // <- garder comme string au lieu de undefined pour permettre la suppression de la valeur
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

    if (!formData.nom.trim()) {
      newErrors.nom = "Le nom est requis";
    }

    if (formData.quantite === undefined || formData.quantite < 0) {
      newErrors.quantite = "La quantité ne peut pas être négative";
    }

    if (formData.seuilMinimal < 0) {
      newErrors.seuilMinimal = "Le seuil minimal ne peut pas être négatif";
    }

    if (
      formData.seuilOptimal !== undefined &&
      formData.seuilOptimal <= formData.seuilMinimal
    ) {
      newErrors.seuilOptimal =
        "Le seuil optimal doit être supérieur au seuil minimal";
    }

    if (formData.prixUnitaire !== undefined && formData.prixUnitaire < 0) {
      newErrors.prixUnitaire = "Le prix ne peut pas être négatif";
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
      // Préparer les données (enlever les valeurs vides)
      const dataToSubmit: Partial<CreateArticleStockInput> = {
        nom: formData.nom,
        categorie: formData.categorie,
        quantite: formData.quantite,
        unite: formData.unite,
        seuilMinimal: formData.seuilMinimal,
      };

      // Ajouter les champs optionnels s'ils sont remplis
      if (formData.reference?.trim()) {
        dataToSubmit.reference = formData.reference;
      }
      if (formData.description?.trim()) {
        dataToSubmit.description = formData.description;
      }
      if (formData.seuilOptimal !== undefined) {
        dataToSubmit.seuilOptimal = formData.seuilOptimal;
      }
      if (formData.prixUnitaire !== undefined) {
        dataToSubmit.prixUnitaire = formData.prixUnitaire;
      }
      if (formData.emplacement?.trim()) {
        dataToSubmit.emplacement = formData.emplacement;
      }

      if (isEdit) {
        await updateMutation.mutateAsync(
          dataToSubmit as UpdateArticleStockInput,
        );
      } else {
        await createMutation.mutateAsync(
          dataToSubmit as CreateArticleStockInput,
        );
      }

      onClose();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // ─── Rendu ────────────────────────────────────────────────

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Package size={24} className="text-primary" />
            <h3 className="font-bold text-lg">
              {isEdit ? "Modifier l'article" : "Nouvel article en stock"}
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
            {/* Nom */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend required">
                Nom de l'article
              </legend>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className={`input input-bordered ${errors.nom ? "input-error" : ""}`}
                placeholder="Ex: Cahier 96 pages"
                disabled={isLoading}
              />
              {errors.nom && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.nom}
                  </span>
                </label>
              )}
            </fieldset>

            {/* Référence & Catégorie */}
            <div className="grid grid-cols-2 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Référence</legend>
                <input
                  type="text"
                  name="reference"
                  value={formData.reference}
                  onChange={handleChange}
                  className="input input-bordered"
                  placeholder="Ex: REF-001"
                  disabled={isLoading}
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Catégorie</legend>
                <select
                  name="categorie"
                  value={formData.categorie}
                  onChange={handleChange}
                  className="select select-bordered"
                  disabled={isLoading}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </fieldset>
            </div>

            {/* Description */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Descritpion</legend>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="textarea textarea-bordered w-full"
                placeholder="Description de l'article..."
                disabled={isLoading}
              />
            </fieldset>

            {/* Quantité & Unité */}
            <div className="grid grid-cols-2 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend required">Quantité</legend>
                <input
                  type="number"
                  name="quantite"
                  value={formData.quantite}
                  onChange={handleChange}
                  className={`input input-bordered ${errors.quantite ? "input-error" : ""}`}
                  min="0"
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

              <fieldset className="fieldset">
                <legend className="fieldset-legend required">Unité</legend>
                <select
                  name="unite"
                  value={formData.unite}
                  onChange={handleChange}
                  className="select select-bordered"
                  disabled={isLoading}
                >
                  {UNITES.map((unite) => (
                    <option key={unite} value={unite}>
                      {unite}
                    </option>
                  ))}
                </select>
              </fieldset>
            </div>

            {/* Seuils */}
            <div className="grid grid-cols-2 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend required">
                  Seuil Minimal
                </legend>
                <input
                  type="number"
                  name="seuilMinimal"
                  value={formData.seuilMinimal}
                  onChange={handleChange}
                  className={`input input-bordered ${errors.seuilMinimal ? "input-error" : ""}`}
                  min="0"
                  disabled={isLoading}
                />
                {errors.seuilMinimal && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.seuilMinimal}
                    </span>
                  </label>
                )}
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Seuil Optimal</legend>
                <input
                  type="number"
                  name="seuilOptimal"
                  value={formData.seuilOptimal || ""}
                  onChange={handleChange}
                  className={`input input-bordered ${errors.seuilOptimal ? "input-error" : ""}`}
                  min="0"
                  placeholder="Optionnel"
                  disabled={isLoading}
                />
                {errors.seuilOptimal && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.seuilOptimal}
                    </span>
                  </label>
                )}
              </fieldset>
            </div>

            {/* Prix & Emplacement */}
            <div className="grid grid-cols-2 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Prix unitaire (Ar)</legend>
                <input
                  type="number"
                  name="prixUnitaire"
                  value={formData.prixUnitaire || ""}
                  onChange={handleChange}
                  className={`input input-bordered ${errors.prixUnitaire ? "input-error" : ""}`}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  disabled={isLoading}
                />
                {errors.prixUnitaire && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.prixUnitaire}
                    </span>
                  </label>
                )}
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Emplacement</legend>
                <input
                  type="text"
                  name="emplacement"
                  value={formData.emplacement}
                  onChange={handleChange}
                  className="input input-bordered"
                  placeholder="Ex: Magasin A - Étagère 3"
                  disabled={isLoading}
                />
              </fieldset>
            </div>

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
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Enregistrement...
                </>
              ) : isEdit ? (
                "Modifier"
              ) : (
                "Créer l'article"
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
