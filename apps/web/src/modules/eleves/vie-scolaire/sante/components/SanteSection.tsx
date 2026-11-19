import { useState } from "react";
import { HeartPulse, Plus, Search } from "lucide-react";
import type { FicheEleveComplete } from "@school-mgt/types";
import ConfirmModal from "../../../../../components/ConfirmModal";
import { useAuthStore } from "../../../../../store/authStore";
import { StudentSearchSelect } from "../../../informations/emergencyContact/components/StudentSearchSelect";
import {
  useArchiverSuiviSante,
  useCreerSuiviSante,
  useModifierSuiviSante,
  useSuivisSante,
  type SuiviSante,
  type SuiviSanteFiltres,
} from "../hooks/useSante";
import { SanteFilters } from "./SanteFilters";
import { SanteFormModal } from "./SanteFormModal";
import { SanteList } from "./SanteList";

type Props = {
  initialEleveId?: string;
};

type FormState =
  | { mode: "creation" }
  | { mode: "edition"; suivi: SuiviSante }
  | null;

const FILTRES_VIDES: SuiviSanteFiltres = {};

export function SanteSection({ initialEleveId }: Props) {
  const user = useAuthStore((state) => state.user);
  const autorise = user?.role === "ADMIN" || user?.role === "SUDO_ADMIN";

  const [eleve, setEleve] = useState<FicheEleveComplete | null>(null);
  const [eleveIdInitial, setEleveIdInitial] = useState(initialEleveId);
  const [filtres, setFiltres] = useState<SuiviSanteFiltres>(FILTRES_VIDES);
  const [formState, setFormState] = useState<FormState>(null);
  const [suiviAArchiver, setSuiviAArchiver] = useState<SuiviSante | null>(null);

  const eleveId = eleve?.id ?? eleveIdInitial;
  const suivis = useSuivisSante(eleveId, filtres);
  const creer = useCreerSuiviSante();
  const modifier = useModifierSuiviSante();
  const archiver = useArchiverSuiviSante();

  async function enregistrer(
    input:
      | Parameters<typeof creer.mutateAsync>[0]
      | Parameters<typeof modifier.mutateAsync>[0]["input"],
  ) {
    if (formState?.mode === "edition") {
      await modifier.mutateAsync({
        suiviId: formState.suivi.id,
        input,
      });
    } else if (eleveId) {
      await creer.mutateAsync({
        ...(input as Parameters<typeof creer.mutateAsync>[0]),
        eleveId,
      });
    }
    setFormState(null);
  }

  if (!autorise) {
    return (
      <p role="alert" className="alert alert-warning">
        Cette section est réservée aux administrateurs.
      </p>
    );
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <HeartPulse className="text-primary" size={22} />
          <div>
            <h2 className="text-lg font-bold">Santé & sécurité</h2>
            <p className="text-sm text-base-content/60">
              Allergies, soins, visites médicales et incidents de santé.
            </p>
          </div>
        </div>

        {eleveId && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setFormState({ mode: "creation" })}
          >
            <Plus size={16} />
            Ajouter une information
          </button>
        )}
      </header>

      <StudentSearchSelect
        selectedStudentId={eleveId}
        onSelect={(student) => {
          setEleve(student);
          setEleveIdInitial(undefined);
          setFiltres(FILTRES_VIDES);
        }}
      />

      {!eleveId && (
        <div className="rounded border border-dashed border-base-300 p-8 text-center">
          <Search className="mx-auto text-base-content/40" size={24} />
          <p className="mt-2 font-medium">Aucun élève sélectionné</p>
          <p className="text-sm text-base-content/60">
            Recherchez un élève pour consulter son dossier de santé.
          </p>
        </div>
      )}

      {eleveId && (
        <>
          <SanteFilters
            type={filtres.type ?? ""}
            from={filtres.from ?? ""}
            to={filtres.to ?? ""}
            onTypeChange={(type) =>
              setFiltres((current) => ({
                ...current,
                type: type || undefined,
              }))
            }
            onFromChange={(from) =>
              setFiltres((current) => ({
                ...current,
                from: from || undefined,
              }))
            }
            onToChange={(to) =>
              setFiltres((current) => ({
                ...current,
                to: to || undefined,
              }))
            }
          />

          {suivis.isLoading && (
            <div className="flex justify-center py-10" aria-busy="true">
              <span className="loading loading-spinner loading-lg" />
            </div>
          )}

          {suivis.isError && (
            <p role="alert" className="alert alert-error">
              Impossible de charger le dossier de santé.
            </p>
          )}

          {suivis.data && (
            <SanteList
              suivis={suivis.data.data}
              onEdit={(suivi) => setFormState({ mode: "edition", suivi })}
              onArchive={setSuiviAArchiver}
            />
          )}
        </>
      )}

      {formState && eleveId && (
        <SanteFormModal
          key={
            formState.mode === "edition"
              ? formState.suivi.id
              : `creation-${eleveId}`
          }
          eleveId={eleveId}
          suivi={formState.mode === "edition" ? formState.suivi : undefined}
          pending={creer.isPending || modifier.isPending}
          onClose={() => setFormState(null)}
          onSave={enregistrer}
        />
      )}

      <ConfirmModal
        isOpen={!!suiviAArchiver}
        title="Archiver l’information ?"
        message={
          suiviAArchiver
            ? `« ${suiviAArchiver.titre} » ne sera plus affiché dans le dossier actif.`
            : ""
        }
        icon="danger"
        confirmLabel="Archiver"
        cancelLabel="Annuler"
        isLoading={archiver.isPending}
        onConfirm={() => {
          if (!suiviAArchiver) return;
          const targetId = suiviAArchiver.id;
          archiver.mutate(targetId, {
            onSettled: () =>
              setSuiviAArchiver((current) =>
                current?.id === targetId ? null : current,
              ),
          });
        }}
        onCancel={() => setSuiviAArchiver(null)}
      />
    </section>
  );
}
