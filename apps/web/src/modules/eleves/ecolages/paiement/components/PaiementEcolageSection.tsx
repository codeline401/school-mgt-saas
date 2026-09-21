import type { FicheEleveComplete } from "@school-mgt/types";
import { Wallet } from "lucide-react";
import { useState } from "react";
import { StudentSearchSelect } from "../../../informations/emergencyContact/components/StudentSearchSelect";
import { StatutFinancierCard } from "./StatutFinancierCard";
import { SaisiePaiementForm } from "./SaisiePaiementForm";

type PaiementEcolageSectionProps = {
  initialEleveId?: string;
};

/**
 * Conteneur principal de l'ognlet "Paiement d'écolage";
 */
export function PaiementEcolageSection({
  initialEleveId,
}: PaiementEcolageSectionProps) {
  const [selectedEleve, setSelectedEleve] = useState<FicheEleveComplete | null>(
    null,
  ); // État local pour l'élève sélectionné dans la section de paiement d'écolage.

  const activeELeveId = selectedEleve?.id ?? initialEleveId; // ID de l'élève actuellement actif dans la section de paiement d'écolage.

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Wallet size={20} className="text-primary" />
          <h2 className="text-lg font-bold">Paiement d'écolage</h2>
        </div>
        <p className="mt-1 text-sm text-base-content/60">
          Recherchez un élève pour encaisser un paiement d'écolage
        </p>
      </div>

      <StudentSearchSelect
        selectedStudentId={activeELeveId}
        onSelect={setSelectedEleve}
      />

      {!activeELeveId && (
        <div className="rounded-lg border border-dashed border-base-300 p-8 text-center">
          <p className="font-medium">Aucun élève sélectionné</p>
          <p className="mt-1 text-sm text-base-content/60">
            Recherchez un élève pour afficher sa situation financière.
          </p>
        </div>
      )}

      {activeELeveId && (
        <>
          <StatutFinancierCard eleveId={activeELeveId} />
          <SaisiePaiementForm eleveId={activeELeveId} />
        </>
      )}
    </div>
  );
}
