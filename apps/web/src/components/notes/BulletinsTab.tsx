/**
 * @file BulletinsTab.tsx
 * Calcul client-side : moyenne/matière (pondérée, ramenée sur 20),
 * moyenne générale, rang. Filtre Classe + Élève + titre d'évaluation libre.
 * Pas de champ "période" dans la DB → le filtre opère sur note.titre.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Printer } from "lucide-react";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import CanevasBulletinModal from "./CanevasBulletinModal";
import type {
  BulletinTemplate,
  BulletinTemplateConfig,
  Classe,
  Eleve,
  Matiere,
  Note,
} from "@school-mgt/types";
// BulletinTemplate est utilisé comme type de retour de la query ci-dessous.
import { DEFAULT_BULLETIN_CONFIG } from "@school-mgt/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function moyenneMatiere(notes: Note[]): number | null {
  if (!notes.length) return null;
  const sumCoef = notes.reduce((a, n) => a + Number(n.coefficient), 0);
  if (!sumCoef) return null;
  const sumPond = notes.reduce(
    (a, n) =>
      a + (Number(n.note) / Number(n.noteMax)) * 20 * Number(n.coefficient),
    0,
  );
  return sumPond / sumCoef;
}

interface LigneBulletin {
  matiere: Matiere;
  moyenne: number | null;
  nbNotes: number;
  coefTotal: number;
}
interface Bulletin {
  eleve: Eleve;
  lignes: LigneBulletin[];
  moyenneGenerale: number | null;
  rang: number | null;
}

function buildBulletin(
  eleve: Eleve,
  matieres: Matiere[],
  notes: Note[],
): Bulletin {
  const notesEleve = notes.filter((n) => n.eleveId === eleve.id);
  const lignes: LigneBulletin[] = matieres.map((m) => {
    const notesMat = notesEleve.filter((n) => n.matiereId === m.id);
    return {
      matiere: m,
      moyenne: moyenneMatiere(notesMat),
      nbNotes: notesMat.length,
      coefTotal: notesMat.reduce((a, n) => a + Number(n.coefficient), 0),
    };
  });
  const with_ = lignes.filter((l) => l.moyenne !== null);
  const sumC = with_.reduce((a, l) => a + l.coefTotal, 0);
  const moyenneGenerale =
    with_.length && sumC
      ? with_.reduce((a, l) => a + (l.moyenne as number) * l.coefTotal, 0) /
        sumC
      : null;
  return { eleve, lignes, moyenneGenerale, rang: null };
}

function attribuerRangs(bulletins: Bulletin[]): Bulletin[] {
  const sorted = [...bulletins].sort((a, b) => {
    if (a.moyenneGenerale === null) return 1;
    if (b.moyenneGenerale === null) return -1;
    return b.moyenneGenerale - a.moyenneGenerale;
  });
  let rang = 1;
  return sorted.map((b, i) => {
    if (i > 0 && sorted[i - 1].moyenneGenerale !== b.moyenneGenerale)
      rang = i + 1;
    return { ...b, rang: b.moyenneGenerale !== null ? rang : null };
  });
}

const fmt = (n: number | null) => (n !== null ? n.toFixed(2) : "—");
// const colorMoy = (n: number | null) =>
//   n === null
//     ? "text-base-content/40"
//     : n >= 14
//       ? "text-success font-semibold"
//       : n >= 10
//         ? "text-warning font-semibold"
//         : "text-error font-semibold";

/** Couleur CSS selon la moyenne et les seuils configurés dans le canevas. */
function colorMoyDyn(
  n: number | null,
  seuilBien: number,
  seuilPassable: number,
): string {
  if (n === null) return "text-base-content/40";
  if (n >= seuilBien) return "text-success font-semibold";
  if (n >= seuilPassable) return "text-warning font-semibold";
  return "text-error font-semibold";
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function BulletinsTab() {
  const [classeId, setClasseId] = useState(""); // Par défaut, aucun bulletin n'est affiché tant que l'utilisateur n'a pas sélectionné une classe.
  const [eleveId, setEleveId] = useState(""); // Permet de filtrer les bulletins par élève. Par défaut, tous les élèves de la classe sont affichés.
  const [filtreEval, setFiltreEval] = useState(""); // Filtre textuel appliqué au titre des évaluations (ex : "T1", "DS1", "Trim 1"…) pour n'afficher que les notes correspondantes dans les bulletins. Par défaut, toutes les évaluations sont prises en compte.

  /** Utilisateur connecté — pour conditionner le bouton « Canevas ». */
  const user = useAuthStore((s) => s.user);
  const canEditTemplate = user?.role === "ADMIN" || user?.role === "SUDO_ADMIN";

  const { data: classes = [] } = useQuery<Classe[]>({
    queryKey: ["classes"], // Clé de cache générique pour les classes de l'enseignant connecté. Si besoin, on pourra la spécialiser par établissement ou par année scolaire.
    queryFn: async () => (await api.get("/api/classes")).data, // Récupère la liste des classes de l'enseignant connecté. Chaque classe doit inclure au minimum son id et son nom. Les autres données (élèves, matières, notes) sont récupérées dans des requêtes séparées pour permettre un rafraîchissement plus ciblé lors du changement de classe ou de filtre.
  });

  const { data: eleves = [], isLoading: loadE } = useQuery<Eleve[]>({
    queryKey: ["classe-eleves", classeId], // Clé de cache spécifique aux élèves d'une classe donnée. Se rafraîchit à chaque changement de classe.
    queryFn: async () =>
      (await api.get(`/api/classes/${classeId}/eleves`)).data,
    enabled: !!classeId,
  });

  const { data: matieres = [] } = useQuery<Matiere[]>({
    queryKey: ["classe-matieres", classeId],
    queryFn: async () =>
      (await api.get(`/api/classes/${classeId}/matieres`)).data,
    enabled: !!classeId,
  });

  const { data: allNotes = [], isLoading: loadN } = useQuery<Note[]>({
    queryKey: ["classe-notes", classeId],
    queryFn: async () => (await api.get(`/api/classes/${classeId}/notes`)).data,
    enabled: !!classeId,
  });

  /**
   * Canevas de bulletin de l'école (GET /api/bulletin-template).
   * Retourne les valeurs par défaut si aucun canevas n'a encore été configuré.
   */
  const { data: templateData } = useQuery<BulletinTemplate>({
    queryKey: ["bulletin-template"],
    queryFn: async () => (await api.get("/api/bulletin-template")).data,
  });

  /** Config effective : valeurs DB fusionnées avec les défauts. */
  const templateConfig: BulletinTemplateConfig = {
    ...DEFAULT_BULLETIN_CONFIG,
    ...(templateData?.config ?? {}),
  };

  const bulletins = useMemo<Bulletin[]>(() => {
    if (!classeId || !eleves.length || !matieres.length) return [];
    const notes = filtreEval.trim()
      ? allNotes.filter((n) =>
          n.titre.toLowerCase().includes(filtreEval.toLowerCase()),
        )
      : allNotes;
    const classement = attribuerRangs(
      eleves.map((e) => buildBulletin(e, matieres, notes)),
    );
    return eleveId
      ? classement.filter((b) => b.eleve.id === eleveId)
      : classement;
  }, [classeId, eleveId, filtreEval, eleves, matieres, allNotes]);

  const isLoading = loadE || loadN;
  const nomClasse = classes.find((c) => c.id === classeId)?.nom ?? "";

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap gap-3 items-end">
        <fieldset className="fieldset min-w-44">
          <legend className="fieldset-legend">Classe</legend>
          <select
            className="select select-sm w-full"
            value={classeId}
            onChange={(e) => {
              setClasseId(e.target.value);
              setEleveId("");
            }}
            aria-label="Sélectionner une classe"
          >
            <option value="">— Choisir —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset className="fieldset min-w-52">
          <legend className="fieldset-legend">Élève</legend>
          <select
            className="select select-sm w-full"
            value={eleveId}
            onChange={(e) => setEleveId(e.target.value)}
            disabled={!classeId}
            aria-label="Filtrer par élève"
          >
            <option value="">— Tous —</option>
            {eleves.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nom} {e.prenom}
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset className="fieldset min-w-52">
          <legend className="fieldset-legend">Filtrer par évaluation</legend>
          <input
            type="text"
            className="input input-sm w-full"
            placeholder="ex : T1, Trim 1, DS1…"
            value={filtreEval}
            onChange={(e) => setFiltreEval(e.target.value)}
            disabled={!classeId}
          />
        </fieldset>

        {bulletins.length > 0 && (
          <button
            className="btn btn-outline btn-sm gap-1 ml-auto"
            onClick={() =>
              handlePrint(
                bulletins,
                nomClasse,
                eleves.length,
                filtreEval,
                templateConfig,
              )
            }
          >
            <Printer size={14} /> Imprimer
          </button>
        )}

        {/* Bouton canevas — ADMIN et SUDO_ADMIN uniquement */}
        {canEditTemplate && <CanevasBulletinModal config={templateConfig} />}
      </div>

      {!classeId && (
        <div className="text-center py-16 text-base-content/40 text-sm">
          Sélectionnez une classe pour générer les bulletins.
        </div>
      )}
      {classeId && isLoading && (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}

      {!isLoading && bulletins.length > 0 && (
        <div className="space-y-6 print:space-y-8">
          {bulletins.map((b) => (
            <BulletinCard
              key={b.eleve.id}
              bulletin={b}
              nomClasse={nomClasse}
              effectif={eleves.length}
              filtreEval={filtreEval}
              config={templateConfig}
            />
          ))}
        </div>
      )}

      {classeId && !isLoading && bulletins.length === 0 && (
        <div className="text-center py-12 text-base-content/40 text-sm">
          Aucune note trouvée{filtreEval ? ` pour « ${filtreEval} »` : ""}.
        </div>
      )}
    </div>
  );
}

// ── Carte bulletin ────────────────────────────────────────────────────────────

function BulletinCard({
  bulletin,
  nomClasse,
  effectif,
  filtreEval,
  config,
}: {
  bulletin: Bulletin;
  nomClasse: string;
  effectif: number;
  filtreEval: string;
  config: BulletinTemplateConfig; // ← nouveau
}) {
  const { eleve, lignes, moyenneGenerale, rang } = bulletin;
  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm print:shadow-none print:break-inside-avoid">
      <div className="card-body pb-3 pt-4">
        {/* En-tête : nom de l'école si configuré */}
        {config.enteteTexte && (
          <div className="text-center font-semibold text-sm border-b border-base-300 pb-2 mb-3">
            {config.enteteTexte}
            {config.anneeTexte && (
              <span className="ml-2 text-base-content/50 font-normal">
                — {config.anneeTexte}
              </span>
            )}
          </div>
        )}

        {/* Identité élève + récap moyennes */}
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-primary" />
              <span className="font-bold text-base">
                {eleve.nom} {eleve.prenom}
              </span>
            </div>
            <div className="text-sm text-base-content/60 mt-0.5 ml-6">
              Classe : {nomClasse}
              {filtreEval && (
                <span className="ml-2 badge badge-ghost badge-xs">
                  {filtreEval}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <div
                className={`text-xl ${colorMoyDyn(moyenneGenerale, config.seuilBien, config.seuilPassable)}`}
              >
                {fmt(moyenneGenerale)}
                <span className="text-xs text-base-content/40 font-normal">
                  /20
                </span>
              </div>
              <div className="text-xs text-base-content/50">Moy. générale</div>
            </div>
            {/* Rang — affiché seulement si activé dans le canevas */}
            {config.showRang && rang !== null && (
              <div>
                <div className="text-xl font-semibold text-secondary">
                  {rang}
                  <span className="text-xs text-base-content/40 font-normal">
                    /{effectif}
                  </span>
                </div>
                <div className="text-xs text-base-content/50">Rang</div>
              </div>
            )}
          </div>
        </div>

        {/* Tableau matières */}
        <div className="overflow-x-auto">
          <table
            className="table table-sm w-full"
            aria-label={`Bulletin de ${eleve.nom} ${eleve.prenom}`}
          >
            <thead>
              <tr>
                <th>Matière</th>
                {config.showNbEval && (
                  <th className="text-center">Évaluations</th>
                )}
                {config.showCoef && <th className="text-center">Coef.</th>}
                <th className="text-center">Moyenne /20</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => (
                <tr key={l.matiere.id}>
                  <td>{l.matiere.nom}</td>
                  {config.showNbEval && (
                    <td className="text-center text-sm text-base-content/60">
                      {l.nbNotes > 0 ? l.nbNotes : "—"}
                    </td>
                  )}
                  {config.showCoef && (
                    <td className="text-center text-sm text-base-content/60">
                      {l.coefTotal > 0 ? l.coefTotal : "—"}
                    </td>
                  )}
                  <td
                    className={`text-center ${colorMoyDyn(l.moyenne, config.seuilBien, config.seuilPassable)}`}
                  >
                    {fmt(l.moyenne)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold border-t border-base-300">
                <td>Moyenne générale</td>
                {config.showNbEval && <td />}
                {config.showCoef && <td />}
                <td
                  className={`text-center ${colorMoyDyn(moyenneGenerale, config.seuilBien, config.seuilPassable)}`}
                >
                  {fmt(moyenneGenerale)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pied de page — affiché seulement si configuré */}
        {config.piedTexte && (
          <div className="text-xs text-base-content/50 border-t border-base-300 pt-2 mt-2">
            {config.piedTexte}
          </div>
        )}
      </div>
    </div>
  );
}

function handlePrint(
  bulletins: Bulletin[],
  nomClasse: string,
  effectif: number,
  filtreEval: string,
  config: BulletinTemplateConfig, // ← nouveau
) {
  const cartes = bulletins
    .map((b) => {
      const { eleve, lignes, moyenneGenerale, rang } = b;

      // Colonnes configurables
      const colCoef = config.showCoef
        ? `<th style="text-align:center">Coef.</th>`
        : "";
      const colEvals = config.showNbEval
        ? `<th style="text-align:center">Évals</th>`
        : "";

      const lignesHtml = lignes
        .map(
          (l) => `
      <tr>
        <td>${l.matiere.nom}</td>
        ${config.showNbEval ? `<td style="text-align:center">${l.nbNotes > 0 ? l.nbNotes : "—"}</td>` : ""}
        ${config.showCoef ? `<td style="text-align:center">${l.coefTotal > 0 ? l.coefTotal : "—"}</td>` : ""}
        <td style="text-align:center;font-weight:600">${l.moyenne !== null ? l.moyenne.toFixed(2) : "—"}</td>
      </tr>`,
        )
        .join("");

      const rangHtml =
        config.showRang && rang !== null
          ? `<div style="font-size:1.2rem;font-weight:600">${rang}/${effectif}</div><div style="font-size:.75rem;color:#666">Rang</div>`
          : "";

      return `
      <div class="bulletin">
        ${config.enteteTexte ? `<div class="ecole">${config.enteteTexte}</div>` : ""}
        <div class="entete">
          <div>
            <strong>${eleve.nom} ${eleve.prenom}</strong><br/>
            <span>Classe : ${nomClasse}${filtreEval ? ` — ${filtreEval}` : ""}${config.anneeTexte ? ` — ${config.anneeTexte}` : ""}</span>
          </div>
          <div style="text-align:right">
            <div style="font-size:1.4rem;font-weight:700">${moyenneGenerale !== null ? moyenneGenerale.toFixed(2) + "/20" : "—"}</div>
            <div style="font-size:.75rem;color:#666">Moy. générale</div>
            ${rangHtml}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Matière</th>
              ${colEvals}
              ${colCoef}
              <th style="text-align:center">Moyenne /20</th>
            </tr>
          </thead>
          <tbody>${lignesHtml}</tbody>
          <tfoot>
            <tr>
              <td><strong>Moyenne générale</strong></td>
              ${config.showNbEval ? "<td></td>" : ""}
              ${config.showCoef ? "<td></td>" : ""}
              <td style="text-align:center;font-weight:700">${moyenneGenerale !== null ? moyenneGenerale.toFixed(2) : "—"}</td>
            </tr>
          </tfoot>
        </table>
        ${config.piedTexte ? `<div class="pied">${config.piedTexte}</div>` : ""}
      </div>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Bulletins — ${nomClasse}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: sans-serif; font-size: 12px; }
    body { padding: 1cm; }
    .ecole { font-size: 13px; font-weight: 600; text-align: center; margin-bottom: 10px; border-bottom: 2px solid #333; padding-bottom: 6px; }
    .bulletin { page-break-after: always; border: 1px solid #ccc; border-radius: 6px; padding: 16px; margin-bottom: 24px; }
    .bulletin:last-child { page-break-after: avoid; }
    .entete { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
    .entete strong { font-size: 14px; }
    .entete span { color: #555; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    th, td { border: 1px solid #ddd; padding: 5px 8px; }
    th { background: #f3f4f6; font-weight: 600; }
    tfoot td { background: #f9fafb; }
    .pied { margin-top: 12px; font-size: 11px; color: #555; border-top: 1px solid #ddd; padding-top: 8px; }
    @page { size: A4; margin: 1cm; }
  </style>
</head>
<body>${cartes}</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    win.print();
    win.close();
  };
}
