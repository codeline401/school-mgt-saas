import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FolderOpen,
  FileText,
  Download,
  AlertCircle,
  Loader2,
  User,
  BookOpen,
} from "lucide-react";
import { api, getApiError } from "../../lib/api";
import type { Classe } from "@school-mgt/types";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface DocumentExtended {
  id: string;
  titre: string;
  description: string | null;
  type: string;
  filePath: string;
  mimeType: string;
  createdAt: string;
  classe: { nom: string };
  matiere: { nom: string } | null;
  uploadedBy: { nom: string; prenom: string };
}

export default function DocumentsTab() {
  const [classeId, setClasseId] = useState("");

  // ─────────────────────────────────────────────────────────────
  // QUERIES
  // ─────────────────────────────────────────────────────────────

  const { data: classes = [] } = useQuery<Classe[]>({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await api.get("/api/classes");
      return data;
    },
  });

  const {
    data: documents = [],
    isLoading,
    isError,
    error,
  } = useQuery<DocumentExtended[]>({
    queryKey: ["documents-shared", classeId],
    queryFn: async () => {
      const { data } = await api.get("/api/documents", {
        params: { classeId: classeId || undefined },
      });
      return data;
    },
  });

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Entête */}
      <div className="flex items-center gap-2">
        <FolderOpen size={18} className="text-primary" />
        <h2 className="font-semibold text-base">Documentothèque & Partages</h2>
      </div>

      {/* FILTRES */}
      <div className="max-w-xs">
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Filtrer par Classe</legend>
          <select
            className="select select-sm w-full"
            value={classeId}
            onChange={(e) => setClasseId(e.target.value)}
          >
            <option value="">— Toutes les classes —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </fieldset>
      </div>

      {/* REQUÊTE ETATS */}
      {isError && (
        <div className="alert alert-error text-sm">
          <AlertCircle size={15} />
          {getApiError(error, "Erreur lors du chargement des documents.")}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-base-content/50">
          <Loader2 size={15} className="animate-spin" />
          Chargement des fichiers partagés…
        </div>
      )}

      {!isLoading && documents.length === 0 && (
        <div className="text-center py-10 text-base-content/40 text-sm">
          Aucun document disponible pour cette sélection.
        </div>
      )}

      {/* GRILLE DES DOCUMENTS (Style épuré DaisyUI) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <div key={doc.id} className="card card-border bg-base-100 shadow-xs">
            <div className="card-body p-4 gap-3 justify-between">
              {/* Entête Fichier */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                      <FileText size={16} />
                    </div>
                    <span className="badge badge-sm badge-neutral">
                      {doc.type}
                    </span>
                  </div>
                  <span className="badge badge-primary badge-sm font-medium">
                    {doc.classe.nom}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-base-content line-clamp-1">
                  {doc.titre}
                </h3>
                <p className="text-xs text-base-content/60 mt-1 line-clamp-2">
                  {doc.description || "Aucune description fournie."}
                </p>
              </div>

              {/* Méta & Bouton Téléchargement */}
              <div className="border-t border-base-200 pt-2 flex items-center justify-between text-[11px] text-base-content/50">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1">
                    <BookOpen size={10} />
                    <span className="truncate max-w-30">
                      {doc.matiere?.nom || "Toutes matières"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User size={10} />
                    <span>
                      {doc.uploadedBy.prenom} {doc.uploadedBy.nom[0]}.
                    </span>
                  </div>
                </div>

                {/* Lien/Bouton de téléchargement */}
                <a
                  href={`${api.defaults.baseURL}${doc.filePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-square btn-ghost btn-xs text-primary hover:bg-primary/10"
                  title="Télécharger"
                >
                  <Download size={14} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
