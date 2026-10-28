export type PeriodeScolaire = {
  id: string;
  nom: string;
  type: "TRIMESTRE" | "SEMESTRE" | "ANNEE" | "AUTRE";
  anneeScolaire: string;
  dateDebut: string | null;
  dateFin: string | null;
};

export type PeriodeOption = {
  key: string;
  label: string;
  from: string;
  to: string;
};

export const PERIODE_PERSONNALISEE = "personnalisee";
export const PERIODE_PAR_DEFAUT = "mois-courant";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const finDeMois = (y: number, m: number) => new Date(y, m, 0).getDate();

// Les dates ISO du paramétrage (AAAA-MM-JJTHH:mm...) sont réduites au jour.
const jour = (value: string) => value.slice(0, 10);

function mois(y: number, m: number): { from: string; to: string } {
  return { from: iso(y, m, 1), to: iso(y, m, finDeMois(y, m)) };
}

export function moisCourant(now = new Date()) {
  return mois(now.getFullYear(), now.getMonth() + 1);
}

// L'année scolaire commence en septembre : "2026-2027" pour octobre 2026 comme pour mars 2027.
function anneeDebut(now: Date): number {
  return now.getMonth() + 1 >= 9 ? now.getFullYear() : now.getFullYear() - 1;
}

function periodesParDefaut(debut: number): PeriodeOption[] {
  return [
    {
      key: "defaut-t1",
      label: "1er trimestre (sept – déc)",
      from: iso(debut, 9, 1),
      to: iso(debut, 12, 31),
    },
    {
      key: "defaut-t2",
      label: "2e trimestre (janv – mars)",
      from: iso(debut + 1, 1, 1),
      to: iso(debut + 1, 3, 31),
    },
    {
      key: "defaut-t3",
      label: "3e trimestre (avril – juin)",
      from: iso(debut + 1, 4, 1),
      to: iso(debut + 1, 6, 30),
    },
  ];
}

/**
 * Options du filtre : mois, trimestres/semestres du paramétrage (ou valeurs par défaut),
 * puis année scolaire. « Personnalisée » est gérée séparément par le composant.
 */
export function construirePeriodes(
  parametrees: PeriodeScolaire[],
  now = new Date(),
): PeriodeOption[] {
  const debut = anneeDebut(now);
  const annee = `${debut}-${debut + 1}`;
  const delAnnee = parametrees.filter(
    (p) => p.anneeScolaire === annee && p.dateDebut && p.dateFin,
  );

  const decoupage: PeriodeOption[] = delAnnee
    .filter((p) => p.type === "TRIMESTRE" || p.type === "SEMESTRE")
    .sort((a, b) => a.dateDebut!.localeCompare(b.dateDebut!))
    .map((p) => ({
      key: `periode-${p.id}`,
      label: `${p.nom} (${formaterDate(jour(p.dateDebut!))} – ${formaterDate(jour(p.dateFin!))})`,
      from: jour(p.dateDebut!),
      to: jour(p.dateFin!),
    }));

  const anneeConfiguree = delAnnee.find((p) => p.type === "ANNEE");
  const anneeScolaire: PeriodeOption = anneeConfiguree
    ? {
        key: "annee-scolaire",
        label: "Année scolaire",
        from: jour(anneeConfiguree.dateDebut!),
        to: jour(anneeConfiguree.dateFin!),
      }
    : {
        key: "annee-scolaire",
        label: "Année scolaire",
        from: iso(debut, 9, 1),
        to: iso(debut + 1, 6, 30),
      };

  const precedent =
    now.getMonth() === 0
      ? mois(now.getFullYear() - 1, 12)
      : mois(now.getFullYear(), now.getMonth());

  return [
    { key: PERIODE_PAR_DEFAUT, label: "Ce mois", ...moisCourant(now) },
    { key: "mois-precedent", label: "Mois précédent", ...precedent },
    ...(decoupage.length > 0 ? decoupage : periodesParDefaut(debut)),
    anneeScolaire,
  ];
}

/**
 * Formate une date ISO en date française.
 * @param value La date au format ISO (yyyy-mm-dd)
 * @returns La date formatée au format français (dd/mm/yyyy)
 */
export function formaterDate(value: string): string {
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
}
