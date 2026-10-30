// On va calculer le jours actuel et le jour du prochain cours d'une classe, en heure locale du serveur
const JOURS = [
  "DIMANCHE",
  "LUNDI",
  "MARDI",
  "MERCREDI",
  "JEUDI",
  "VENDREDI",
  "SAMEDI",
];

type Creneau = {
  id: string;
  jour: string;
  heureDebut: string;
  heureFin: string;
  matiere: { nom: string } | null;
  intitule: string | null;
};

export type Proposition = {
  type: "ACTUEL" | "PROCHAIN";
  creneauId: string;
  date: string; // AAAA-MM-JJ
  heureDebut: string;
  heureFin: string;
  libelle: string;
};

const pad = (n: number) => String(n).padStart(2, "0"); // Ajoute un zéro devant les nombres inférieurs à 10 pour le format AAAA-MM-JJ

const enMinutes = (h: string) => {
  const [hh, mm] = h.split(":").map(Number);
  return hh! * 60 + mm!; // Convertit l'heure en minutes totales
};

/**
 * Formate une date au format AAAA-MM-JJ
 * @param date La date à formater
 * @returns La date formatée au format AAAA-MM-JJ
 */
export function formatDateLocale(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`; // Formate la date au format AAAA-MM-JJ
}

/**
 * Ajoute un nombre de jours à une date donnée et retourne la nouvelle date au format AAAA-MM-JJ
 * @param base La date de base
 * @param n Le nombre de jours à ajouter
 * @returns La date au format AAAA-MM-JJ après avoir ajouté n jours à la date de base
 */
function dansNJours(base: Date, n: number): string {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + n); // Crée une nouvelle date en ajoutant n jours à la date de base
  return formatDateLocale(d); // Retourne la date au format AAAA-MM-JJ après avoir ajouté n jours à la date de base
}

export function calculerPropositions(
  creneaux: Creneau[],
  now = new Date(),
): Proposition[] {
  const minutes = now.getHours() * 60 + now.getMinutes(); // Convertit l'heure actuelle en minutes totales
  let actuel: Creneau | null = null; // Le créneau actuel si on est en cours, sinon null
  let prochain: { c: Creneau; offset: number; rang: number } | null = null; // Le prochain créneau avec son décalage en jours et son rang dans la journée

  for (const creneau of creneaux) {
    let offset = (JOURS.indexOf(creneau.jour) - now.getDay() + 7) % 7; // Calcule le décalage en jours entre aujourd'hui et le jour du créneau
    const debut = enMinutes(creneau.heureDebut); // Convertit l'heure de début du créneau en minutes totales

    if (
      offset === 0 &&
      debut <= minutes &&
      minutes < enMinutes(creneau.heureFin)
    ) {
      actuel = creneau; // On est dans le créneau actuel, on le stocke dans la variable actuel
      continue; // On passe au créneau suivant car on a trouvé le créneau actuel
    }

    if (offset === 0 && debut <= minutes) offset = 7; // Si le créneau est déjà passé aujourd'hui, on le considère pour le prochain jour correspondant

    const rang = offset * 1440 + debut; // Calcule le rang du créneau en fonction du décalage et de l'heure de début
    if (!prochain || rang < prochain.rang) {
      prochain = { c: creneau, offset, rang }; // On met à jour le prochain créneau avec son décalage et son rang
    }
  }

  const vers = (
    type: Proposition["type"],
    c: Creneau,
    date: string,
  ): Proposition => ({
    type,
    creneauId: c.id,
    date,
    heureDebut: c.heureDebut,
    heureFin: c.heureFin,
    libelle: c.matiere?.nom ?? c.intitule ?? "Cours",
  });

  return [
    ...(actuel ? [vers("ACTUEL", actuel, formatDateLocale(now))] : []),
    ...(prochain
      ? [vers("PROCHAIN", prochain.c, dansNJours(now, prochain.offset))]
      : []),
  ];
}

/**
 *
 * @param date
 * @returns
 */
export function jourDeLaDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return JOURS[new Date(y!, m! - 1, d!).getDay()]!;
}
