/**
 * ImportElevesModal — Modale d'import en masse d'élèves depuis un fichier Excel.
 *
 * Flux utilisateur :
 *  1. Télécharger le modèle (.xlsx) généré dynamiquement avec les classes de l'école.
 *  2. Remplir le fichier et l'uploader.
 *  3. Prévisualiser les lignes parsées (validation côté client : classe connue, champs requis).
 *  4. Confirmer → envoi vers POST /api/eleves/import → affichage du bilan.
 *
 * Dépendances :
 *  - SheetJS (xlsx) pour la génération et le parsing du fichier Excel.
 *  - TanStack Query pour le chargement des classes et la mutation d'import.
 */
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import * as XLSX from "xlsx";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getApiError } from "../lib/api";
import type { Classe } from "@school-mgt/types";
import toast from "react-hot-toast";
import { Download, Upload, AlertTriangle, CheckCircle2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Représente une ligne parsée depuis le fichier Excel,
 * enrichie de son état de validation côté client.
 */
interface ImportRow {
  nom: string;
  prenom: string;
  /** Nom lisible de la classe (ex: "6ème A") — résolu en UUID côté backend */
  classe: string;
  dateNaissance: string; // format YYYY-MM-DD ou vide
  telephone: string;
  adresse: string;
  /** true si la ligne passe toutes les validations client */
  _valid: boolean;
  /** Message d'erreur affiché dans l'aperçu si _valid === false */
  _error?: string;
}

/**
 * Réponse renvoyée par POST /api/eleves/import.
 * `created` = nombre d'élèves effectivement créés en base.
 * `errors`  = lignes ignorées avec leur raison.
 */
interface ImportResult {
  created: number;
  errors: { ligne: number; nom: string; prenom: string; raison: string }[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Colonnes du fichier Excel (ordre des colonnes dans le .xlsx) ─────────────
const COLUMNS = ["nom", "prenom", "classe", "dateNaissance", "telephone", "adresse"] as const;

/** Labels affichés dans la première ligne (en-tête) du fichier généré */
const COLUMN_LABELS: Record<(typeof COLUMNS)[number], string> = {
  nom: "Nom",
  prenom: "Prénom",
  classe: "Classe",
  dateNaissance: "Date de naissance (AAAA-MM-JJ)",
  telephone: "Téléphone",
  adresse: "Adresse",
};

// ─────────────────────────────────────────────────────────────────────────────
export default function ImportElevesModal({ isOpen, onClose }: Props) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const queryClient = useQueryClient();

  const [rows, setRows] = useState<ImportRow[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);

  // ── Ouvre / ferme le dialog natif ─────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      modalRef.current?.showModal();
    } else {
      modalRef.current?.close();
    }
  }, [isOpen]);

  // ── Classes disponibles (pour validation + canevas) ────────────────────────
  const { data: classes = [] } = useQuery<Classe[]>({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await api.get("/api/classes");
      return data;
    },
    enabled: isOpen,
  });

  // ── Génération du canevas dynamique ───────────────────────────────────────
  /**
   * Génère et télécharge un fichier .xlsx pré-formaté :
   *  - Feuille "Élèves"  : en-têtes + ligne d'exemple, largeurs de colonnes définies.
   *  - Feuille "Classes" : liste des classes disponibles (aide à la saisie).
   *
   * Le canevas est dynamique : les classes reflètent celles chargées depuis l'API,
   * donc toujours à jour même si des classes sont ajoutées ou supprimées.
   */
  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Ligne d'exemple pour guider l'utilisateur
    const exampleRow = [
      "Randria",
      "Jean Jacques",
      classes[0]?.nom ?? "Nom de la classe",
      "2010-05-20",
      "0321234567",
      "Lot II A Antananarivo",
    ];
    const wsData = [COLUMNS.map((c) => COLUMN_LABELS[c]), exampleRow];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Largeurs de colonnes pour la lisibilité
    ws["!cols"] = [
      { wch: 18 }, // Nom
      { wch: 18 }, // Prénom
      { wch: 20 }, // Classe
      { wch: 28 }, // Date de naissance
      { wch: 16 }, // Téléphone
      { wch: 30 }, // Adresse
    ];

    // Feuille secondaire listant toutes les classes disponibles
    // → aide l'utilisateur à saisir le bon nom de classe (copier-coller)
    const wsClasses = XLSX.utils.aoa_to_sheet([
      ["Classes disponibles"],
      ...classes.map((c) => [c.nom]),
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Élèves");
    XLSX.utils.book_append_sheet(wb, wsClasses, "Classes");

    XLSX.writeFile(wb, "canevas_import_eleves.xlsx");
    toast.success("Modèle téléchargé !");
  };

  // ── Lecture du fichier uploadé ─────────────────────────────────────────────
  /**
   * Parse le fichier Excel sélectionné par l'utilisateur et alimente `rows`.
   *
   * Étapes :
   *  1. Lecture via FileReader (ArrayBuffer).
   *  2. Parsing SheetJS avec `cellDates: true` pour convertir les dates Excel.
   *  3. Itération sur les lignes (skip ligne 0 = en-tête).
   *  4. Validation côté client de chaque ligne (nom, prénom, classe connue).
   *  5. Les lignes invalides sont conservées dans `rows` mais marquées `_valid: false`
   *     → elles s'affichent en rouge dans l'aperçu et sont exclues de l'envoi.
   */
  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    setResult(null); // Réinitialise un éventuel résultat précédent
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        // cellDates: true → SheetJS convertit les cellules date Excel en objets Date JS
        const wb = XLSX.read(data, { type: "array", cellDates: true });
        // On traite uniquement la première feuille du classeur
        const ws = wb.Sheets[wb.SheetNames[0]!]!;
        // header: 1 → retourne un tableau de tableaux (pas d'objet avec clés)
        const raw = (XLSX.utils.sheet_to_json(ws, {
          header: 1,
          defval: "",
        }) as unknown) as unknown[][];

        // Un fichier valide contient au moins l'en-tête (ligne 0) + une ligne de données
        if (raw.length < 2) {
          toast.error("Le fichier est vide ou ne contient pas de données.");
          return;
        }

        // Ensemble des noms de classes connus (insensible à la casse) pour validation rapide
        const classNames = new Set(classes.map((c) => c.nom.toLowerCase().trim()));

        const parsed: ImportRow[] = [];

        // Ligne 0 = en-têtes → on commence à i = 1
        for (let i = 1; i < raw.length; i++) {
          const r = raw[i] as unknown[];
          const nom = String(r[0] ?? "").trim();
          const prenom = String(r[1] ?? "").trim();
          const classe = String(r[2] ?? "").trim();

          // dateNaissance : SheetJS renvoie un objet Date si cellDates:true,
          // sinon une string (ex: "2010-05-20") selon la saisie utilisateur
          const rawDate = r[3];
          let dateNaissance = "";
          if (rawDate instanceof Date) {
            dateNaissance = rawDate.toISOString().split("T")[0]!;
          } else if (rawDate) {
            dateNaissance = String(rawDate).trim();
          }

          const telephone = String(r[4] ?? "").trim();
          const adresse = String(r[5] ?? "").trim();

          // Ignorer silencieusement les lignes entièrement vides (ex: fin de fichier)
          if (!nom && !prenom && !classe) continue;

          // Validation client — les erreurs sont affichées dans l'aperçu
          let _valid = true;
          let _error: string | undefined;

          if (!nom || nom.length < 2) {
            _valid = false;
            _error = "Nom trop court";
          } else if (!prenom || prenom.length < 2) {
            _valid = false;
            _error = "Prénom trop court";
          } else if (!classe) {
            _valid = false;
            _error = "Classe manquante";
          } else if (!classNames.has(classe.toLowerCase())) {
            // La classe ne correspond à aucune classe de l'école
            _valid = false;
            _error = `Classe "${classe}" inconnue`;
          }

          parsed.push({ nom, prenom, classe, dateNaissance, telephone, adresse, _valid, _error });
        }

        if (parsed.length === 0) {
          toast.error("Aucun élève trouvé dans le fichier.");
          return;
        }

        setRows(parsed);
      } catch {
        toast.error("Impossible de lire le fichier Excel.");
      }
    };
    reader.readAsArrayBuffer(file);
    // Réinitialise la valeur de l'input pour permettre re-upload du même fichier
    e.target.value = "";
  };

  // ── Mutation import ────────────────────────────────────────────────────────
  const importMutation = useMutation({
    mutationFn: async (eleves: ImportRow[]) => {
      const { data } = await api.post<ImportResult>("/api/eleves/import", {
        eleves: eleves.map(({ nom, prenom, classe, dateNaissance, telephone, adresse }) => ({
          nom,
          prenom,
          classe,
          dateNaissance: dateNaissance || undefined,
          telephone: telephone || undefined,
          adresse: adresse || undefined,
        })),
      });
      return data;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["eleves"] });
      if (data.errors.length === 0) {
        toast.success(`${data.created} élève(s) importé(s) avec succès !`);
      } else {
        toast(`${data.created} importé(s), ${data.errors.length} erreur(s).`, {
          icon: "⚠️",
        });
      }
    },
    onError: (err) => {
      toast.error(getApiError(err, "Erreur lors de l'import."));
    },
  });

  const validRows = rows.filter((r) => r._valid);
  const invalidRows = rows.filter((r) => !r._valid);

  const handleClose = () => {
    if (importMutation.isPending) return;
    setRows([]);
    setResult(null);
    onClose();
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <dialog ref={modalRef} className="modal" onClose={handleClose}>
      <div className="modal-box w-11/12 max-w-4xl">
        <h3 className="font-bold text-lg mb-1">Importer des élèves depuis Excel</h3>
        <p className="text-base-content/60 text-sm mb-5">
          Téléchargez le modèle, remplissez-le, puis importez-le.
        </p>

        {/* ── Étape 1 : télécharger le canevas ── */}
        <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg mb-5">
          <div className="flex-1">
            <p className="font-medium text-sm">Étape 1 — Télécharger le modèle</p>
            <p className="text-xs text-base-content/50">
              Le fichier contient les colonnes requises et la liste des{" "}
              {classes.length} classe(s) disponibles.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm gap-2"
            onClick={downloadTemplate}
            disabled={classes.length === 0}
          >
            <Download size={14} />
            Télécharger le modèle
          </button>
        </div>

        {/* ── Étape 2 : uploader le fichier rempli ── */}
        <div className="mb-5">
          <p className="font-medium text-sm mb-2">Étape 2 — Importer le fichier rempli</p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="file-input w-full"
            onChange={handleFile}
            disabled={importMutation.isPending}
          />
        </div>

        {/* ── Prévisualisation ── */}
        {rows.length > 0 && !result && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-sm">
                Aperçu — {rows.length} ligne(s) détectée(s)
              </p>
              <div className="flex gap-2 text-xs">
                <span className="badge badge-success badge-sm">{validRows.length} valides</span>
                {invalidRows.length > 0 && (
                  <span className="badge badge-error badge-sm">{invalidRows.length} erreurs</span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto max-h-64 rounded border border-base-300">
              <table className="table table-xs table-zebra">
                <thead className="sticky top-0 bg-base-100 z-10">
                  <tr>
                    <th>#</th>
                    <th>Nom</th>
                    <th>Prénom</th>
                    <th>Classe</th>
                    <th>Date naiss.</th>
                    <th>Tél.</th>
                    <th>État</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className={r._valid ? "" : "bg-error/10"}>
                      <td className="text-base-content/40">{i + 2}</td>
                      <td>{r.nom}</td>
                      <td>{r.prenom}</td>
                      <td>{r.classe}</td>
                      <td>{r.dateNaissance}</td>
                      <td>{r.telephone}</td>
                      <td>
                        {r._valid ? (
                          <CheckCircle2 size={14} className="text-success" />
                        ) : (
                          <span className="flex items-center gap-1 text-error text-xs">
                            <AlertTriangle size={12} />
                            {r._error}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {invalidRows.length > 0 && (
              <p className="text-xs text-base-content/50 mt-1">
                Les lignes en erreur seront ignorées lors de l'import.
              </p>
            )}
          </div>
        )}

        {/* ── Résultat après import ── */}
        {result && (
          <div className="mb-5 space-y-3">
            <div
              role="alert"
              className={`alert ${result.errors.length === 0 ? "alert-success" : "alert-warning"} alert-soft`}
            >
              <span>
                {result.created} élève(s) créé(s) avec succès.
                {result.errors.length > 0 &&
                  ` ${result.errors.length} ligne(s) ignorée(s).`}
              </span>
            </div>

            {result.errors.length > 0 && (
              <div className="overflow-x-auto max-h-40 rounded border border-base-300">
                <table className="table table-xs">
                  <thead>
                    <tr>
                      <th>Ligne</th>
                      <th>Nom</th>
                      <th>Prénom</th>
                      <th>Raison</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((e, i) => (
                      <tr key={i}>
                        <td>{e.ligne}</td>
                        <td>{e.nom}</td>
                        <td>{e.prenom}</td>
                        <td className="text-error">{e.raison}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="modal-action">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleClose}
            disabled={importMutation.isPending}
          >
            {result ? "Fermer" : "Annuler"}
          </button>

          {validRows.length > 0 && !result && (
            <button
              type="button"
              className="btn btn-primary gap-2"
              disabled={importMutation.isPending}
              onClick={() => importMutation.mutate(validRows)}
            >
              {importMutation.isPending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  <Upload size={14} />
                  Importer {validRows.length} élève(s)
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button type="submit" onClick={handleClose}>Fermer</button>
      </form>
    </dialog>
  );
}
