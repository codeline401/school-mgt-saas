import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  PenLine,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ImageIcon,
} from "lucide-react";
import { api, getApiError } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Signature {
  id: string;
  userId: string;
  filePath: string;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function SignatureNumeriqueTab() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const canSign =
    user?.role === "SUDO_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "PROF";

  // ── Query : signature actuelle ───────────────────────────────────────────────
  const {
    data: signature,
    isLoading,
    isError,
  } = useQuery<Signature>({
    queryKey: ["my-signature"],
    queryFn: async () => {
      const { data } = await api.get("/api/signature");
      return data;
    },
    enabled: canSign,
    retry: false, // 404 = pas de signature, pas une erreur critique
  });

  // ── Signature image URL pour affichage ───────────────────────────────────────
  const { data: signaturePreview } = useQuery<{ dataUrl: string }>({
    queryKey: ["my-signature-preview", signature?.userId],
    queryFn: async () => {
      const { data } = await api.get(`/api/signature/file/${user!.id}`);
      return data;
    },
    enabled: !!signature && canSign,
  });

  // ── Mutation : upload ────────────────────────────────────────────────────────
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("signature", file);
      const { data } = await api.post("/api/signature/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data as Signature;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-signature"] });
      queryClient.invalidateQueries({ queryKey: ["my-signature-preview"] });
      setSelectedFile(null);
      setPreviewUrl(null);
      toast.success("Signature enregistrée avec succès.");
    },
    onError: (err) => {
      toast.error(getApiError(err, "Erreur lors de l'upload de la signature."));
    },
  });

  // ── Mutation : suppression ───────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete("/api/signature");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-signature"] });
      queryClient.invalidateQueries({ queryKey: ["my-signature-preview"] });
      setDeleteConfirm(false);
      toast.success("Signature supprimée.");
    },
    onError: (err) => {
      toast.error(getApiError(err, "Erreur lors de la suppression."));
      setDeleteConfirm(false);
    },
  });

  // ── Gestion fichier ──────────────────────────────────────────────────────────
  function handleFile(file: File) {
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      toast.error("Seuls les fichiers PNG et JPEG sont acceptés.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Le fichier ne doit pas dépasser 2 Mo.");
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  if (!canSign) {
    return (
      <div className="text-center py-16 text-base-content/40 text-sm">
        Accès non autorisé.
      </div>
    );
  }

  const roleLabel =
    user?.role === "PROF"
      ? "Professeur principal"
      : "Directeur / Administration";

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <PenLine size={18} className="text-primary" />
        <h2 className="font-semibold text-base">Signature numérique</h2>
      </div>

      <div className="alert alert-info text-sm">
        <AlertCircle size={15} />
        <div>
          <p>
            Votre signature sera apposée sur les bulletins PDF générés.{" "}
            <strong>
              {user?.role === "PROF"
                ? "Elle apparaîtra à gauche (zone prof principal)."
                : "Elle apparaîtra à droite (zone directeur)."}
            </strong>
          </p>
          <p className="mt-0.5 opacity-70">
            Formats acceptés : PNG (fond transparent recommandé) et JPEG — 2 Mo
            max.
          </p>
        </div>
      </div>

      {/* ── Signature actuelle ─────────────────────────────────────────────── */}
      <div className="card card-border bg-base-100">
        <div className="card-body gap-4">
          <div className="flex items-center justify-between">
            <h3 className="card-title text-sm">
              Signature actuelle · {roleLabel}
            </h3>
            {signature && (
              <span className="badge badge-success badge-sm gap-1">
                <CheckCircle2 size={11} />
                Enregistrée
              </span>
            )}
          </div>

          {isLoading && (
            <div className="flex justify-center py-6">
              <span className="loading loading-spinner loading-sm" />
            </div>
          )}

          {!isLoading && !signature && !isError && (
            <div className="flex flex-col items-center gap-2 py-8 text-base-content/40">
              <ImageIcon size={32} className="opacity-30" />
              <p className="text-sm">Aucune signature enregistrée.</p>
            </div>
          )}

          {signature && signaturePreview && (
            <div className="flex flex-col items-center gap-3">
              <div className="border border-base-300 rounded-box p-4 bg-base-200/50">
                <img
                  src={signaturePreview.dataUrl}
                  alt="Ma signature"
                  className="max-h-32 max-w-xs object-contain"
                />
              </div>
              <p className="text-xs text-base-content/40">
                Mise à jour le{" "}
                {new Date(signature.updatedAt).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>

              {/* Suppression */}
              {deleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-error">
                    Confirmer la suppression ?
                  </span>
                  <button
                    className="btn btn-error btn-sm"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate()}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      "Oui, supprimer"
                    )}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setDeleteConfirm(false)}
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-ghost btn-sm text-error"
                  onClick={() => setDeleteConfirm(true)}
                >
                  <Trash2 size={13} />
                  Supprimer ma signature
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Upload nouvelle signature ──────────────────────────────────────── */}
      <div className="card card-border bg-base-100">
        <div className="card-body gap-4">
          <h3 className="card-title text-sm">
            {signature ? "Remplacer ma signature" : "Ajouter ma signature"}
          </h3>

          {/* Zone drag & drop */}
          <div
            className={`border-2 border-dashed rounded-box p-8 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-base-300 hover:border-primary/50 hover:bg-base-200/50"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <Upload
              size={24}
              className={`mx-auto mb-2 ${dragOver ? "text-primary" : "text-base-content/30"}`}
            />
            <p className="text-sm text-base-content/60">
              Glissez votre signature ici ou{" "}
              <span className="text-primary font-medium">
                cliquez pour parcourir
              </span>
            </p>
            <p className="text-xs text-base-content/40 mt-1">
              PNG ou JPEG — 2 Mo max
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={handleInputChange}
            />
          </div>

          {/* Preview du fichier sélectionné */}
          {previewUrl && selectedFile && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-base-content/60">
                <ImageIcon size={14} />
                <span>{selectedFile.name}</span>
                <span className="badge badge-ghost badge-xs">
                  {(selectedFile.size / 1024).toFixed(0)} Ko
                </span>
              </div>

              <div className="border border-base-300 rounded-box p-4 bg-base-200/50 flex justify-center">
                <img
                  src={previewUrl}
                  alt="Aperçu"
                  className="max-h-28 max-w-xs object-contain"
                />
              </div>

              <div className="flex gap-2">
                <button
                  className="btn btn-primary btn-sm"
                  disabled={uploadMutation.isPending}
                  onClick={() => uploadMutation.mutate(selectedFile)}
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Enregistrement…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} />
                      Enregistrer cette signature
                    </>
                  )}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Infos placement sur le bulletin ───────────────────────────────── */}
      <div className="card card-border bg-base-100">
        <div className="card-body gap-3">
          <h3 className="card-title text-sm">Placement sur le bulletin</h3>
          <div className="grid grid-cols-2 gap-3">
            <div
              className={`border rounded-box p-3 text-center text-xs space-y-1 ${
                user?.role === "PROF"
                  ? "border-primary bg-primary/5"
                  : "border-base-300 opacity-50"
              }`}
            >
              <p className="font-medium">Zone gauche</p>
              <p className="text-base-content/60">Professeur principal</p>
              {user?.role === "PROF" && (
                <span className="badge badge-primary badge-xs">Votre zone</span>
              )}
            </div>
            <div
              className={`border rounded-box p-3 text-center text-xs space-y-1 ${
                user?.role !== "PROF"
                  ? "border-primary bg-primary/5"
                  : "border-base-300 opacity-50"
              }`}
            >
              <p className="font-medium">Zone droite</p>
              <p className="text-base-content/60">Directeur / Admin</p>
              {user?.role !== "PROF" && (
                <span className="badge badge-primary badge-xs">Votre zone</span>
              )}
            </div>
          </div>
          <p className="text-xs text-base-content/40">
            Les signatures sont automatiquement incrustées lors de la génération
            du bulletin PDF depuis l'onglet "Export PDF".
          </p>
        </div>
      </div>
    </div>
  );
}
