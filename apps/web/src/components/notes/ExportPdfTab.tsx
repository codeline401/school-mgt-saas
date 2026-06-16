import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Download,
  FileText,
  Trophy,
  Gavel,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { api, getApiError } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import type { Classe, Eleve } from "@school-mgt/types";

// ─── Types locaux ─────────────────────────────────────────────────────────────

type ExportType = "bulletin" | "releve" | "classement" | "deliberation";
type ExportFormat = "A4" | "A3" | "Letter";
type ExportOrientation = "portrait" | "landscape";

interface DeliberationSession {
  id: string;
  periodeLabel: string;
  anneeScolaire: string;
  statut: "BROUILLON" | "VALIDEE";
}

interface Periode {
  id: string;
  nom: string;
  type: string;
  anneeScolaire: string;
}

const EXPORT_TYPES: Array<{
  value: ExportType;
  label: string;
  icon: React.ElementType;
  description: string;
}> = [
  {
    value: "bulletin",
    label: "Bulletin scolaire",
    icon: FileText,
    description: "Bulletin individuel d'un élève pour une période donnée",
  },
  {
    value: "releve",
    label: "Relevé de notes",
    icon: FileText,
    description: "Relevé détaillé de toutes les évaluations d'un élève",
  },
  {
    value: "classement",
    label: "Classement de classe",
    icon: Trophy,
    description: "Classement complet des élèves d'une classe",
  },
  {
    value: "deliberation",
    label: "Compte-rendu de délibération",
    icon: Gavel,
    description: "PV de la session de délibération du conseil de classe",
  },
];

// ─── Composant principal ──────────────────────────────────────────────────────

export default function ExportPdfTab() {
  const user = useAuthStore((s) => s.user);

  const canExport =
    user?.role === "SUDO_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "USER" ||
    user?.role === "PROF";

  // Sélections communes
  const [exportType, setExportType] = useState<ExportType>("bulletin");
  const [classeId, setClasseId] = useState("");
  const [eleveId, setEleveId] = useState("");
  const [periodeId, setPeriodeId] = useState("");
  const [sessionId, setSessionId] = useState("");

  // Options PDF
  const [format, setFormat] = useState<ExportFormat>("A4");
  const [orientation, setOrientation] = useState<ExportOrientation>("portrait");
  const [watermark, setWatermark] = useState("");
  const [includeGraphs, setIncludeGraphs] = useState(false);

  // ─── Queries ────────────────────────────────────────────────────────────────

  const { data: classes = [] } = useQuery<Classe[]>({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await api.get("/api/classes");
      return data;
    },
    enabled: canExport,
  });

  const { data: eleves = [] } = useQuery<Eleve[]>({
    queryKey: ["classe-eleves-export", classeId],
    queryFn: async () => {
      const { data } = await api.get(`/api/classes/${classeId}/eleves`);
      return data;
    },
    enabled: canExport && !!classeId,
  });

  const { data: periodes = [] } = useQuery<Periode[]>({
    queryKey: ["periodes-export", classeId],
    queryFn: async () => {
      const { data } = await api.get(`/api/classes/${classeId}/notes/periodes`);
      return data;
    },
    enabled:
      canExport &&
      !!classeId &&
      (exportType === "bulletin" ||
        exportType === "releve" ||
        exportType === "classement"),
  });

  const { data: sessions = [] } = useQuery<DeliberationSession[]>({
    queryKey: ["deliberations-export", classeId],
    queryFn: async () => {
      const { data } = await api.get(
        `/api/classes/${classeId}/notes/deliberations`,
      );
      return data;
    },
    enabled: canExport && !!classeId && exportType === "deliberation",
  });

  // ─── Mutation export ─────────────────────────────────────────────────────────

  const exportMutation = useMutation({
    mutationFn: async () => {
      const options = {
        format,
        orientation,
        watermark: watermark || undefined,
        includeGraphs,
      };

      let endpoint = "";
      let payload: Record<string, unknown> = { options };

      switch (exportType) {
        case "bulletin":
          endpoint = "/api/export/bulletin";
          payload = { eleveId, periodeId, options };
          break;
        case "releve":
          endpoint = "/api/export/releve";
          payload = { eleveId, periodeId, options };
          break;
        case "classement":
          endpoint = "/api/export/classement";
          payload = { classeId, periodeId, options };
          break;
        case "deliberation":
          endpoint = "/api/export/deliberation";
          payload = { sessionId, options };
          break;
      }

      const response = await api.post(endpoint, payload, {
        responseType: "blob",
      });
      return response.data as Blob;
    },
    onSuccess: (blob) => {
      // Déclenchement du téléchargement côté client
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exportType}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
  });

  // ─── Validation du formulaire ────────────────────────────────────────────────

  function isFormValid(): boolean {
    if (!classeId) return false;
    switch (exportType) {
      case "bulletin":
      case "releve":
        return !!eleveId && !!periodeId;
      case "classement":
        return !!periodeId;
      case "deliberation":
        return !!sessionId;
    }
  }

  // ─── Reset des champs dépendants quand le type change ────────────────────────

  function handleTypeChange(type: ExportType) {
    setExportType(type);
    setEleveId("");
    setPeriodeId("");
    setSessionId("");
  }

  function handleClasseChange(id: string) {
    setClasseId(id);
    setEleveId("");
    setPeriodeId("");
    setSessionId("");
  }

  if (!canExport) {
    return (
      <div className="text-center py-16 text-base-content/40 text-sm">
        Accès non autorisé.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Download size={18} className="text-primary" />
        <h2 className="font-semibold text-base">Export PDF</h2>
      </div>

      {/* ── Sélection du type d'export ─────────────────────────────────────── */}
      <div>
        <p className="text-sm font-medium mb-2">Type de document</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {EXPORT_TYPES.map(({ value, label, icon: Icon, description }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleTypeChange(value)}
              className={`card card-border cursor-pointer text-left transition-colors ${
                exportType === value
                  ? "border-primary bg-primary/5"
                  : "hover:bg-base-200"
              }`}
            >
              <div className="card-body p-3 gap-1">
                <div className="flex items-center gap-2">
                  <Icon
                    size={15}
                    className={
                      exportType === value
                        ? "text-primary"
                        : "text-base-content/60"
                    }
                  />
                  <span className="font-medium text-sm">{label}</span>
                </div>
                <p className="text-xs text-base-content/50">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* ── Paramètres du document ──────────────────────────────────────── */}
        <div className="space-y-4">
          <h3 className="font-medium text-sm border-b border-base-300 pb-1">
            Paramètres du document
          </h3>

          {/* Classe — toujours visible */}
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Classe *</legend>
            <select
              className="select select-sm w-full max-w-xs"
              value={classeId}
              onChange={(e) => handleClasseChange(e.target.value)}
            >
              <option value="">— Choisir une classe —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </fieldset>

          {/* Élève — bulletin et relevé uniquement */}
          {(exportType === "bulletin" || exportType === "releve") && (
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Élève *</legend>
              <select
                className="select select-sm w-full max-w-xs"
                value={eleveId}
                onChange={(e) => setEleveId(e.target.value)}
                disabled={!classeId}
              >
                <option value="">— Choisir un élève —</option>
                {eleves.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.prenom} {e.nom}
                  </option>
                ))}
              </select>
              {classeId && eleves.length === 0 && (
                <p className="text-xs text-base-content/40 mt-1">
                  Aucun élève dans cette classe.
                </p>
              )}
            </fieldset>
          )}

          {/* Période — bulletin, relevé, classement */}
          {(exportType === "bulletin" ||
            exportType === "releve" ||
            exportType === "classement") && (
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Période *</legend>
              <select
                className="select select-sm w-full max-w-xs"
                value={periodeId}
                onChange={(e) => setPeriodeId(e.target.value)}
                disabled={!classeId}
              >
                <option value="">— Choisir une période —</option>
                {periodes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom} · {p.anneeScolaire}
                  </option>
                ))}
              </select>
              {classeId && periodes.length === 0 && (
                <p className="text-xs text-base-content/40 mt-1">
                  Aucune période disponible.
                </p>
              )}
            </fieldset>
          )}

          {/* Session de délibération */}
          {exportType === "deliberation" && (
            <fieldset className="fieldset">
              <legend className="fieldset-legend">
                Session de délibération *
              </legend>
              <select
                className="select select-sm w-full max-w-xs"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                disabled={!classeId}
              >
                <option value="">— Choisir une session —</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.periodeLabel} · {s.anneeScolaire}
                    {s.statut === "VALIDEE" ? " ✓" : ""}
                  </option>
                ))}
              </select>
              {classeId && sessions.length === 0 && (
                <p className="text-xs text-base-content/40 mt-1">
                  Aucune session de délibération.
                </p>
              )}
            </fieldset>
          )}
        </div>

        {/* ── Options PDF ─────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <h3 className="font-medium text-sm border-b border-base-300 pb-1">
            Options PDF
          </h3>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Format</legend>
            <select
              className="select select-sm w-full"
              value={format}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
            >
              <option value="A4">A4</option>
              <option value="A3">A3</option>
              <option value="Letter">Letter</option>
            </select>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Orientation</legend>
            <div className="flex gap-3">
              {(["portrait", "landscape"] as const).map((o) => (
                <label
                  key={o}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <input
                    type="radio"
                    className="radio radio-sm radio-primary"
                    checked={orientation === o}
                    onChange={() => setOrientation(o)}
                  />
                  <span className="text-sm capitalize">
                    {o === "portrait" ? "Portrait" : "Paysage"}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Filigrane (optionnel)</legend>
            <input
              className="input input-sm w-full"
              placeholder="Ex : CONFIDENTIEL"
              value={watermark}
              onChange={(e) => setWatermark(e.target.value)}
            />
          </fieldset>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="checkbox checkbox-sm checkbox-primary"
              checked={includeGraphs}
              onChange={(e) => setIncludeGraphs(e.target.checked)}
            />
            <span className="text-sm">Inclure les graphiques</span>
          </label>
        </div>
      </div>

      {/* ── Erreur ────────────────────────────────────────────────────────── */}
      {exportMutation.isError && (
        <div className="alert alert-error text-sm">
          <AlertCircle size={15} />
          {getApiError(
            exportMutation.error,
            "Erreur lors de la génération du PDF.",
          )}
        </div>
      )}

      {/* ── Succès ────────────────────────────────────────────────────────── */}
      {exportMutation.isSuccess && (
        <div className="alert alert-success text-sm">
          Le PDF a été généré et téléchargé avec succès.
        </div>
      )}

      {/* ── Bouton export ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          className="btn btn-primary"
          disabled={!isFormValid() || exportMutation.isPending}
          onClick={() => exportMutation.mutate()}
        >
          {exportMutation.isPending ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Génération en cours…
            </>
          ) : (
            <>
              <Download size={15} />
              Générer et télécharger le PDF
            </>
          )}
        </button>

        {!isFormValid() && (
          <p className="text-xs text-base-content/40">
            Remplissez tous les champs requis (*) pour activer l'export.
          </p>
        )}
      </div>
    </div>
  );
}
