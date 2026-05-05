import { Construction } from "lucide-react";

interface Props {
  label: string;
}

/**
 * Onglet placeholder pour les fonctionnalités à venir.
 */
export default function PlaceholderTab({ label }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-base-content/40">
      <Construction size={40} />
      <p className="text-lg font-semibold">{label}</p>
      <p className="text-sm">Cette section est en cours de développement.</p>
    </div>
  );
}
