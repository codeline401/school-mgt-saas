import { type ChangeEvent } from "react";
import toast from "react-hot-toast";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2 Mo

interface Props {
  value: string;
  onChange: (dataUrl: string) => void;
}

export default function PhotoUpload({ value, onChange }: Props) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; // Récupère le premier fichier sélectionné
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(
        "Type non supporté. Formats acceptés : JPEG, PNG, GIF, WEBP.",
      );
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("La photo ne doit pas dépasser 2 Mo");
      return;
    }

    const reader = new FileReader(); // Crée un FileReader pour lire le fichier en tant que Data URL
    reader.onload = () => onChange(reader.result as string); // Lorsque la lecture est terminée, met à jour la valeur avec le Data URL
    reader.onerror = () => {
      console.error("[PhotoUpload] FileReader error:", reader.error);
      toast.error("Impossible de lire le fichier. Réessayez.");
    };
    reader.readAsDataURL(file); // Lit le fichier et déclenche l'événement onload une fois terminé
  };

  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">Photo de profil (optionnel)</legend>
      {value && (
        <div className="flex items-center gap-3 mb-2">
          <img
            src={value}
            alt="Aperçu"
            className="w-14 h-14 rounded-full object-cover border border-base-300"
          />
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => onChange("")}
          >
            Supprimer
          </button>
        </div>
      )}
      <input
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        className="file-input w-full"
        onChange={handleChange}
      />
    </fieldset>
  );
}
