import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import type { FicheEleveComplete } from "@school-mgt/types";
import { useAuthStore } from "../../../../../store/authStore";
import { StudentSearchSelect } from "./StudentSearchSelect";
import { EmergencyContactCard } from "./EmergencyContactCard";

type EmergencyContactSectionProps = {
  initialStudentId?: string;
};

/**
 * Conteneur principal du sous-module Contact d'urgence.
 *
 * Il ne charge aucune donnée de contact tant qu'aucun élève
 * n'a été sélectionné.
 */
export function EmergencyContactSection({
  initialStudentId,
}: EmergencyContactSectionProps) {
  const user = useAuthStore((state) => state.user);
  const [selectedStudent, setSelectedStudent] =
    useState<FicheEleveComplete | null>(null);

  const canEdit = user?.role === "ADMIN" || user?.role === "SUDO_ADMIN";

  const handleStudentSelect = (student: FicheEleveComplete) => {
    setSelectedStudent(student);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <ShieldAlert size={20} className="text-primary" />
          <h2 className="text-lg font-bold">Contacts d’urgence</h2>
        </div>

        <p className="mt-1 text-sm text-base-content/60">
          Recherchez un élève pour consulter ou modifier son contact d’urgence.
        </p>
      </div>

      <StudentSearchSelect
        selectedStudentId={selectedStudent?.id ?? initialStudentId}
        onSelect={handleStudentSelect}
      />

      {!selectedStudent && (
        <div className="rounded-lg border border-dashed border-base-300 p-8 text-center">
          <p className="font-medium">Aucun élève sélectionné</p>
          <p className="mt-1 text-sm text-base-content/60">
            Recherchez un élève pour afficher ses informations de contact.
          </p>
        </div>
      )}

      {selectedStudent && (
        <EmergencyContactCard eleveId={selectedStudent.id} canEdit={canEdit} />
      )}
    </div>
  );
}
