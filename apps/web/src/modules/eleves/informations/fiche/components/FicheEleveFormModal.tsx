import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useCreateEleve, useUpdateEleve } from "../hooks/useFicheEleve";
import { api, getApiError } from "../../../../../lib/api";
import type {
  FicheEleveComplete,
  Classe,
  Parent,
  CreateEleveInput,
} from "@school-mgt/types";
import PhotoUpload from "../../../../../components/PhotoUpload";

// ═══════════════════════════════════════════════════════════════════
// PROPS DU COMPOSANT
// ═══════════════════════════════════════════════════════════════════
interface FicheEleveFormModalProps {
  eleve?: FicheEleveComplete; // Si fourni, mode édition, sinon mode création
  isOpen: boolean;
  onClose: () => void;
}

// ═══════════════════════════════════════════════════════════════════
// TYPE DU FORMULAIRE (tout en string pour les inputs)
// ═══════════════════════════════════════════════════════════════════
interface FormState {
  // Identité
  nom: string;
  prenom: string;
  genre: string;
  dateNaissance: string;
  lieuNaissance: string;
  telephone: string;
  photoUrl: string;
  nationalite: string;

  // Scolarité
  classeId: string;
  ecoleOrigine: string;
  dateInscription: string;
  statut: string;
  situationFinAnnee: string;

  // Famille
  parentId: string;
  responsableId: string;
  situationFamiliale: string;

  // Contact urgence
  isRelationContact: boolean;
  relationName: string;
  relationTelephone: string;

  // Adresse
  adresseFokontany: string;
  adresseLogement: string;
  adresseVille: string;
  adresseRegion: string;
  adressePays: string;

  // Profession
  professionTitre: string;
  professionLieu: string;
  professionSecteur: string;

  // Remarque
  remarque: string;
}

const defaultFormState: FormState = {
  nom: "",
  prenom: "",
  genre: "",
  dateNaissance: "",
  lieuNaissance: "",
  telephone: "",
  photoUrl: "",
  nationalite: "",
  classeId: "",
  ecoleOrigine: "",
  dateInscription: "",
  statut: "ACTIF",
  situationFinAnnee: "EN_COURS",
  parentId: "",
  responsableId: "",
  situationFamiliale: "",
  isRelationContact: false,
  relationName: "",
  relationTelephone: "",
  adresseFokontany: "",
  adresseLogement: "",
  adresseVille: "",
  adresseRegion: "",
  adressePays: "",
  professionTitre: "",
  professionLieu: "",
  professionSecteur: "",
  remarque: "",
};

// ═══════════════════════════════════════════════════════════════════
// COMPONENT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════
export default function FicheEleveFormModal({
  eleve,
  isOpen,
  onClose,
}: FicheEleveFormModalProps) {
  const isEditMode = !!eleve;

  // Mutations
  const createMutation = useCreateEleve();
  const updateMutation = useUpdateEleve(eleve?.id || "");

  // ─────────────────────────────────────────────────────────────────
  // Chargement des données de référence (classes et parents)
  // ─────────────────────────────────────────────────────────────────
  const { data: classes = [] } = useQuery<Classe[]>({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await api.get("/api/classes");
      return data;
    },
  });

  const { data: parents = [] } = useQuery<Parent[]>({
    queryKey: ["parents"],
    queryFn: async () => {
      const { data } = await api.get("/api/parents");
      return data;
    },
  });

  // ─────────────────────────────────────────────────────────────────
  // État du formulaire
  // ─────────────────────────────────────────────────────────────────
  const [form, setForm] = useState<FormState>(defaultFormState);

  // ─────────────────────────────────────────────────────────────────
  // Initialisation du formulaire en mode édition
  // Note: setState dans useEffect est acceptable ici car il s'agit d'une
  // initialisation contrôlée par les props (eleve, isOpen)
  // ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;

    if (eleve) {
      setForm({
        nom: eleve.nom || "",
        prenom: eleve.prenom || "",
        genre: eleve.genre || "",
        dateNaissance: eleve.dateNaissance
          ? new Date(eleve.dateNaissance).toISOString().split("T")[0]
          : "",
        lieuNaissance: eleve.lieuNaissance || "",
        telephone: eleve.telephone || "",
        photoUrl: eleve.photoUrl || "",
        nationalite: eleve.nationalite || "",
        classeId: eleve.classeId || "",
        ecoleOrigine: eleve.ecoleOrigine || "",
        dateInscription: eleve.dateInscription
          ? new Date(eleve.dateInscription).toISOString().split("T")[0]
          : "",
        statut: eleve.statut || "ACTIF",
        situationFinAnnee: eleve.situationFinAnnee || "EN_COURS",
        parentId: eleve.parentId || "",
        responsableId: eleve.responsableId || "",
        situationFamiliale: eleve.situationFamiliale || "",
        isRelationContact: eleve.isRelationContact || false,
        relationName: eleve.relationName || "",
        relationTelephone: eleve.relationTelephone || "",
        adresseFokontany: eleve.adresse?.fokontany || "",
        adresseLogement: eleve.adresse?.logement || "",
        adresseVille: eleve.adresse?.ville || "",
        adresseRegion: eleve.adresse?.region || "",
        adressePays: eleve.adresse?.pays || "",
        professionTitre: eleve.professionEleve?.titre || "",
        professionLieu: eleve.professionEleve?.lieu || "",
        professionSecteur: eleve.professionEleve?.secteur || "",
        remarque: eleve.remarque || "",
      });
      return;
    }

    setForm(defaultFormState);
  }, [eleve, isOpen]);

  // ─────────────────────────────────────────────────────────────────
  // Gestionnaire de changement des inputs
  // ─────────────────────────────────────────────────────────────────
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Soumission du formulaire
  // ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Construction du payload
    const payload: CreateEleveInput = {
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      genre: form.genre ? (form.genre as "MASCULIN" | "FEMININ") : null,
      dateNaissance: form.dateNaissance || null,
      lieuNaissance: form.lieuNaissance || null,
      telephone: form.telephone || null,
      photoUrl: form.photoUrl || null,
      nationalite: form.nationalite || null,
      classeId: form.classeId || null,
      ecoleOrigine: form.ecoleOrigine || null,
      dateInscription: form.dateInscription || null,
      statut: form.statut as
        | "ACTIF"
        | "INACTIF"
        | "INSCRIT"
        | "SUSPENDU"
        | "DIPLOME"
        | "ABANDON",
      situationFinAnnee: form.situationFinAnnee as
        | "EN_COURS"
        | "ADMIS"
        | "REDOUBLE"
        | "RENVOYE"
        | "REORIENTE"
        | "QUITTE",
      parentId: form.parentId || null,
      responsableId: form.responsableId || null,
      situationFamiliale:
        (form.situationFamiliale as
          | "CELIBATAIRE"
          | "MARIE"
          | "DIVORCE"
          | "AUTRE"
          | "") || null,
      isRelationContact: form.isRelationContact,
      relationName: form.relationName || null,
      relationTelephone: form.relationTelephone || null,
      remarque: form.remarque || null,
    };

    // Ajouter l'adresse si au moins un champ est rempli
    if (
      form.adresseFokontany ||
      form.adresseLogement ||
      form.adresseVille ||
      form.adresseRegion ||
      form.adressePays
    ) {
      payload.adresse = {
        fokontany: form.adresseFokontany || null,
        logement: form.adresseLogement || null,
        ville: form.adresseVille || null,
        region: form.adresseRegion || null,
        pays: form.adressePays || null,
      };
    }

    // Ajouter la profession si au moins un champ est rempli
    if (form.professionTitre || form.professionLieu || form.professionSecteur) {
      payload.professionEleve = {
        titre: form.professionTitre || null,
        lieu: form.professionLieu || null,
        secteur: form.professionSecteur || null,
      };
    }

    try {
      if (isEditMode) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch {
      // L'erreur est gérée par le hook
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Fermeture du modal
  // ─────────────────────────────────────────────────────────────────
  const handleClose = () => {
    createMutation.reset();
    updateMutation.reset();
    onClose();
  };

  const activeMutation = isEditMode ? updateMutation : createMutation;

  // Si le modal n'est pas ouvert, ne rien afficher
  if (!isOpen) return null;

  // ═══════════════════════════════════════════════════════════════
  // RENDU
  // ═══════════════════════════════════════════════════════════════
  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* ─────────────────────────────────────────────────────────── */}
        {/* EN-TÊTE */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg">
            {isEditMode ? `Modifier ${eleve.fullName}` : "Nouvel élève"}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="btn btn-sm btn-ghost btn-circle"
          >
            <X size={18} />
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* ALERTE D'ERREUR */}
        {/* ─────────────────────────────────────────────────────────── */}
        {activeMutation.isError && (
          <div role="alert" className="alert alert-error mb-4">
            <span>
              {getApiError(
                activeMutation.error,
                "Erreur lors de l'enregistrement",
              )}
            </span>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* FORMULAIRE */}
        {/* ─────────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION: Identité */}
          <div className="border-b border-base-300 pb-4">
            <h4 className="font-semibold mb-4">Identité</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <fieldset>
                <label className="label">
                  <span className="label-text">
                    Nom <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="nom"
                  value={form.nom}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  required
                  minLength={2}
                />
              </fieldset>

              <fieldset>
                <label className="label">
                  <span className="label-text">
                    Prénom <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="prenom"
                  value={form.prenom}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  required
                  minLength={2}
                />
              </fieldset>

              <fieldset>
                <label className="label">
                  <span className="label-text">Genre</span>
                </label>
                <select
                  name="genre"
                  value={form.genre}
                  onChange={handleChange}
                  className="select select-bordered w-full"
                >
                  <option value="">— Non spécifié —</option>
                  <option value="MASCULIN">Masculin</option>
                  <option value="FEMININ">Féminin</option>
                </select>
              </fieldset>

              <fieldset>
                <label className="label">
                  <span className="label-text">Date de naissance</span>
                </label>
                <input
                  type="date"
                  name="dateNaissance"
                  value={form.dateNaissance}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                  className="input input-bordered w-full"
                />
              </fieldset>

              <fieldset>
                <label className="label">
                  <span className="label-text">Lieu de naissance</span>
                </label>
                <input
                  type="text"
                  name="lieuNaissance"
                  value={form.lieuNaissance}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                />
              </fieldset>

              <fieldset>
                <label className="label">
                  <span className="label-text">Téléphone</span>
                </label>
                <input
                  type="tel"
                  name="telephone"
                  value={form.telephone}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                />
              </fieldset>

              <fieldset>
                <label className="label">
                  <span className="label-text">Nationalité</span>
                </label>
                <input
                  type="text"
                  name="nationalite"
                  value={form.nationalite}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Ex: Malgache"
                />
              </fieldset>

              <fieldset>
                <label className="label">
                  <span className="label-text">Situation familiale</span>
                </label>
                <select
                  name="situationFamiliale"
                  value={form.situationFamiliale}
                  onChange={handleChange}
                  className="select select-bordered w-full"
                >
                  <option value="">— Non spécifié —</option>
                  <option value="CELIBATAIRE">Célibataire</option>
                  <option value="MARIE">Marié(e)</option>
                  <option value="DIVORCE">Divorcé(e)</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </fieldset>
            </div>
          </div>

          {/* SECTION: Photo de profil */}
          <div className="border-b border-base-300 pb-4">
            <h4 className="font-semibold mb-4">Photo de profil</h4>
            <PhotoUpload
              value={form.photoUrl}
              onChange={(url) =>
                setForm((prev) => ({ ...prev, photoUrl: url }))
              }
            />
          </div>

          {/* SECTION: Scolarité */}
          <div className="border-b border-base-300 pb-4">
            <h4 className="font-semibold mb-4">Scolarité</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <fieldset>
                <label className="label">
                  <span className="label-text">Classe</span>
                </label>
                <select
                  name="classeId"
                  value={form.classeId}
                  onChange={handleChange}
                  className="select select-bordered w-full"
                >
                  <option value="">— Aucune classe —</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom}
                    </option>
                  ))}
                </select>
              </fieldset>

              <fieldset>
                <label className="label">
                  <span className="label-text">École d'origine</span>
                </label>
                <input
                  type="text"
                  name="ecoleOrigine"
                  value={form.ecoleOrigine}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                />
              </fieldset>

              <fieldset>
                <label className="label">
                  <span className="label-text">Date d'inscription</span>
                </label>
                <input
                  type="date"
                  name="dateInscription"
                  value={form.dateInscription}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                  className="input input-bordered w-full"
                />
              </fieldset>

              <fieldset>
                <label className="label">
                  <span className="label-text">Statut</span>
                </label>
                <select
                  name="statut"
                  value={form.statut}
                  onChange={handleChange}
                  className="select select-bordered w-full"
                >
                  <option value="ACTIF">Actif</option>
                  <option value="INACTIF">Inactif</option>
                  <option value="INSCRIT">Inscrit</option>
                  <option value="SUSPENDU">Suspendu</option>
                  <option value="DIPLOME">Diplômé</option>
                  <option value="ABANDON">Abandon</option>
                </select>
              </fieldset>

              <fieldset>
                <label className="label">
                  <span className="label-text">Situation fin d'année</span>
                </label>
                <select
                  name="situationFinAnnee"
                  value={form.situationFinAnnee}
                  onChange={handleChange}
                  className="select select-bordered w-full"
                >
                  <option value="EN_COURS">En cours</option>
                  <option value="ADMIS">Admis</option>
                  <option value="REDOUBLE">Redouble</option>
                  <option value="RENVOYE">Renvoyé</option>
                  <option value="REORIENTE">Réorienté</option>
                  <option value="QUITTE">Quitté</option>
                </select>
              </fieldset>
            </div>
          </div>

          {/* SECTION: Famille */}
          <div className="border-b border-base-300 pb-4">
            <h4 className="font-semibold mb-4">Famille</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <fieldset>
                <label className="label">
                  <span className="label-text">Parent principal</span>
                </label>
                <select
                  name="parentId"
                  value={form.parentId}
                  onChange={handleChange}
                  className="select select-bordered w-full"
                >
                  <option value="">— Aucun parent —</option>
                  {parents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom} {p.prenom}
                    </option>
                  ))}
                </select>
              </fieldset>

              <fieldset>
                <label className="label">
                  <span className="label-text">Responsable des frais</span>
                </label>
                <select
                  name="responsableId"
                  value={form.responsableId}
                  onChange={handleChange}
                  className="select select-bordered w-full"
                >
                  <option value="">— Aucun responsable —</option>
                  {parents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom} {p.prenom}
                    </option>
                  ))}
                </select>
              </fieldset>
            </div>
          </div>

          {/* SECTION: Contact d'urgence */}
          <div className="border-b border-base-300 pb-4">
            <h4 className="font-semibold mb-4">Contact d'urgence</h4>

            <fieldset className="mb-4">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  name="isRelationContact"
                  checked={form.isRelationContact}
                  onChange={handleChange}
                  className="checkbox checkbox-primary"
                />
                <span className="label-text">Définir un contact d'urgence</span>
              </label>
            </fieldset>

            {form.isRelationContact && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <fieldset>
                  <label className="label">
                    <span className="label-text">
                      Nom du contact <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    name="relationName"
                    value={form.relationName}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    required={form.isRelationContact}
                  />
                </fieldset>

                <fieldset>
                  <label className="label">
                    <span className="label-text">
                      Téléphone du contact <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="tel"
                    name="relationTelephone"
                    value={form.relationTelephone}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    required={form.isRelationContact}
                  />
                </fieldset>
              </div>
            )}
          </div>

          {/* SECTION: Adresse */}
          <div className="border-b border-base-300 pb-4">
            <h4 className="font-semibold mb-4">Adresse</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <fieldset>
                <label className="label">
                  <span className="label-text">Fokontany</span>
                </label>
                <input
                  type="text"
                  name="adresseFokontany"
                  value={form.adresseFokontany}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                />
              </fieldset>

              <fieldset>
                <label className="label">
                  <span className="label-text">Logement</span>
                </label>
                <input
                  type="text"
                  name="adresseLogement"
                  value={form.adresseLogement}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                />
              </fieldset>

              <fieldset>
                <label className="label">
                  <span className="label-text">Ville</span>
                </label>
                <input
                  type="text"
                  name="adresseVille"
                  value={form.adresseVille}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                />
              </fieldset>

              <fieldset>
                <label className="label">
                  <span className="label-text">Région</span>
                </label>
                <input
                  type="text"
                  name="adresseRegion"
                  value={form.adresseRegion}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                />
              </fieldset>

              <fieldset className="md:col-span-2">
                <label className="label">
                  <span className="label-text">Pays</span>
                </label>
                <input
                  type="text"
                  name="adressePays"
                  value={form.adressePays}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Ex: Madagascar"
                />
              </fieldset>
            </div>
          </div>

          {/* SECTION: Profession (si l'élève travaille) */}
          <div className="border-b border-base-300 pb-4">
            <h4 className="font-semibold mb-4">Profession (optionnel)</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <fieldset>
                <label className="label">
                  <span className="label-text">Titre</span>
                </label>
                <input
                  type="text"
                  name="professionTitre"
                  value={form.professionTitre}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Ex: Vendeur"
                />
              </fieldset>

              <fieldset>
                <label className="label">
                  <span className="label-text">Lieu</span>
                </label>
                <input
                  type="text"
                  name="professionLieu"
                  value={form.professionLieu}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Ex: Marché central"
                />
              </fieldset>

              <fieldset>
                <label className="label">
                  <span className="label-text">Secteur</span>
                </label>
                <input
                  type="text"
                  name="professionSecteur"
                  value={form.professionSecteur}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Ex: Commerce"
                />
              </fieldset>
            </div>
          </div>

          {/* SECTION: Remarques */}
          <div className="pb-4">
            <h4 className="font-semibold mb-4">Remarques</h4>

            <fieldset>
              <label className="label">
                <span className="label-text">Observations générales</span>
              </label>
              <textarea
                name="remarque"
                value={form.remarque}
                onChange={handleChange}
                className="textarea textarea-bordered h-24 w-full"
                placeholder="Notes ou observations sur l'élève..."
              />
            </fieldset>
          </div>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* ACTIONS */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="modal-action">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-ghost"
              disabled={activeMutation.isPending}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={activeMutation.isPending}
              className="btn btn-primary"
            >
              {activeMutation.isPending ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  Enregistrement...
                </>
              ) : isEditMode ? (
                "Enregistrer les modifications"
              ) : (
                "Créer l'élève"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Fond du modal cliquable pour fermer */}
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={handleClose}>
          Fermer
        </button>
      </form>
    </dialog>
  );
}
