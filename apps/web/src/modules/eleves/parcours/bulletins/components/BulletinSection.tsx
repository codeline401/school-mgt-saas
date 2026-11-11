import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { api } from "../../../../../lib/api";
import { useAuthStore } from "../../../../../store/authStore";
import { StudentSearchSelect } from "../../../informations/emergencyContact/components/StudentSearchSelect";
import { useFicheEleve } from "../../../informations/fiche/hooks/useFicheEleve";
import { useHistoriqueEleve } from "../../../informations/historique/hooks/useHistoriqueEleve";

type Periode = {
  id: string;
  nom: string;
  anneeScolaire: string;
};

type Selection = {
  eleveId: string;
  classeId: string;
  periodeId: string;
};

export function BulletinSection({
  initialEleveId,
}: {
  initialEleveId?: string;
}) {
  const user = useAuthStore((state) => state.user);
  const autorise = user?.role === "ADMIN" || user?.role === "SUDO_ADMIN";

  if (!autorise) {
    return <p role="alert">Cette section est réservée aux administrateurs.</p>;
  }

  return <BulletinContenu initialEleveId={initialEleveId} />;
}

function BulletinContenu({ initialEleveId }: { initialEleveId?: string }) {
  const [eleveId, setEleveId] = useState(initialEleveId ?? "");
  const [classeChoisie, setClasseChoisie] = useState("");
  const [periodeId, setPeriodeId] = useState("");

  const fiche = useFicheEleve(eleveId || undefined);
  const historique = useHistoriqueEleve(eleveId || undefined);

  const classes = new Map<string, string>();

  if (fiche.data?.classe) {
    classes.set(fiche.data.classe.id, fiche.data.classe.nom);
  }

  for (const entree of historique.data?.academicHistory ?? []) {
    if (entree.classe) classes.set(entree.classe.id, entree.classe.nom);
  }

  for (const changement of historique.data?.classChanges ?? []) {
    if (changement.ancienneClasse) {
      classes.set(changement.ancienneClasse.id, changement.ancienneClasse.nom);
    }
    if (changement.nouvelleClasse) {
      classes.set(changement.nouvelleClasse.id, changement.nouvelleClasse.nom);
    }
  }

  const classeId = classeChoisie || fiche.data?.classeId || "";

  const periodes = useQuery({
    queryKey: ["bulletin-periodes", classeId],
    queryFn: async () => {
      const { data } = await api.get<Periode[]>(
        `/api/classes/${classeId}/notes/periodes`,
      );
      return data;
    },
    enabled: !!classeId,
  });

  const generation = useMutation({
    mutationFn: async (selection: Selection) => {
      const { data } = await api.post<Blob>("/api/export/bulletin", selection, {
        responseType: "blob",
      });
      return { url: URL.createObjectURL(data), selection };
    },
  });

  const selectionActuelle =
    generation.data?.selection.eleveId === eleveId &&
    generation.data?.selection.classeId === classeId &&
    generation.data?.selection.periodeId === periodeId;

  useEffect(() => {
    const url = generation.data?.url;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [generation.data?.url]);

  const pdfUrl = selectionActuelle ? generation.data?.url : undefined;

  return (
    <section className="space-y-5">
      <h2 className="text-lg font-bold">Bulletin de l’élève</h2>

      <StudentSearchSelect
        selectedStudentId={eleveId || undefined}
        onSelect={(eleve) => {
          setEleveId(eleve.id);
          setClasseChoisie("");
          setPeriodeId("");
          generation.reset();
        }}
      />

      {eleveId && (fiche.isLoading || historique.isLoading) && (
        <span className="loading loading-spinner" />
      )}

      {eleveId && (fiche.isError || historique.isError) && (
        <p role="alert" className="text-error">
          Impossible de charger le parcours de l’élève.
        </p>
      )}

      {eleveId && fiche.data && historique.data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="fieldset">
              <span className="label">Classe</span>
              <select
                className="select select-bordered w-full"
                value={classeId}
                onChange={(event) => {
                  setClasseChoisie(event.target.value);
                  setPeriodeId("");
                  generation.reset();
                }}
              >
                <option value="">Choisir une classe</option>
                {[...classes].map(([id, nom]) => (
                  <option key={id} value={id}>
                    {nom}
                  </option>
                ))}
              </select>
            </label>

            <label className="fieldset">
              <span className="label">Période</span>
              <select
                className="select select-bordered w-full"
                value={periodeId}
                disabled={!classeId || periodes.isLoading}
                onChange={(event) => {
                  setPeriodeId(event.target.value);
                  generation.reset();
                }}
              >
                <option value="">Choisir une période</option>
                {periodes.data?.map((periode) => (
                  <option key={periode.id} value={periode.id}>
                    {periode.nom} — {periode.anneeScolaire}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {periodes.isError && (
            <p role="alert" className="text-error">
              Impossible de charger les périodes.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!classeId || !periodeId || generation.isPending}
              onClick={() =>
                generation.mutate({ eleveId, classeId, periodeId })
              }
            >
              <FileText size={16} />
              {generation.isPending ? "Génération..." : "Afficher le bulletin"}
            </button>

            {pdfUrl && (
              <a
                className="btn btn-outline btn-sm"
                href={pdfUrl}
                download={`bulletin-${eleveId}.pdf`}
              >
                <Download size={16} />
                Télécharger
              </a>
            )}
          </div>

          {generation.isError && (
            <p role="alert" className="text-error">
              Impossible de générer le bulletin. Vérifiez la classe, la période
              et les notes associées.
            </p>
          )}

          {pdfUrl && (
            <iframe
              title="Aperçu du bulletin"
              src={pdfUrl}
              className="h-[70vh] w-full border border-base-300"
            />
          )}
        </>
      )}
    </section>
  );
}
