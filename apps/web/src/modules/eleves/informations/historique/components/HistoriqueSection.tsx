import { useState } from "react";
import { BookOpen } from "lucide-react";
import type { FicheEleveComplete } from "@school-mgt/types";
import { StudentSearchSelect } from "../../emergencyContact/components/StudentSearchSelect";
import { HistoriqueCard } from "./HistoriqueCard";

type HistoriqueSectionProps = {
  initialStudentId?: string;
};

/**
 * Conteneur principal du sous-module Historique élève.
 *
 * Il ne charge aucune donnée tant qu'aucun élève n'a été sélectionné.
 */
export function HistoriqueSection({
  initialStudentId,
}: HistoriqueSectionProps) {
  const [selectedStudent, setSelectedStudent] =
    useState<FicheEleveComplete | null>(null);

  const activeStudentId = selectedStudent?.id ?? initialStudentId;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-primary" />
          <h2 className="text-lg font-bold">Historique de l’élève</h2>
        </div>

        <p className="mt-1 text-sm text-base-content/60">
          Recherchez un élève pour consulter son parcours complet.
        </p>
      </div>

      <StudentSearchSelect
        selectedStudentId={activeStudentId}
        onSelect={setSelectedStudent}
      />

      {!activeStudentId && (
        <div className="rounded-lg border border-dashed border-base-300 p-8 text-center">
          <p className="font-medium">Aucun élève sélectionné</p>
          <p className="mt-1 text-sm text-base-content/60">
            Recherchez un élève pour afficher son historique.
          </p>
        </div>
      )}

      {activeStudentId && <HistoriqueCard eleveId={activeStudentId} />}
    </div>
  );
}
