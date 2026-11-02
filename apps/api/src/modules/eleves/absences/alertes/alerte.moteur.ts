import { prisma } from "../../../../lib/prisma.js";
import { compterParEleve, formatDate } from "./alerte.service.js";

const MIN_APPELS_TAUX = 5; // en dessous, un taux n'est pas significatif
const INTERVALLE_MS = 60 * 60 * 1000; // évaluation toutes les heures

type Destinataire = "ADMIN" | "PARENT" | "PROFESSEUR_PRINCIPAL";
type TypeRegle =
  | "ABSENCES"
  | "ABSENCES_NON_JUSTIFIEES"
  | "RETARDS"
  | "TAUX_PRESENCE";

type Palier = {
  id: string;
  seuil: number;
  destinataire: Destinataire[];
  message: string | null;
};

export type RegleAvecPaliers = {
  id: string;
  schoolId: string;
  nom: string;
  type: TypeRegle;
  periodeJours: number;
  classeId: string | null;
  paliers: Palier[];
};

export type Correspondance = {
  eleveId: string;
  palier: Palier;
  valeur: number;
};

const LIBELLES: Record<TypeRegle, string> = {
  ABSENCES: "Absence(s)",
  ABSENCES_NON_JUSTIFIEES: "Absence(s) non justifiée(s)",
  RETARDS: "Retard(s)",
  TAUX_PRESENCE: "% de présence",
};

const DEFAUT_ADMIN =
  "Alerte assiduité : {{nom_eleve}} cumule {{valeur}} {{libelle}} sur {{periode}} jours (seuil : {{seuil}}).";
const DEFAUT_PARENT =
  "Votre enfant {{nom_eleve}} cumule {{valeur}} {{libelle}} sur les {{periode}} derniers jours. Merci de contacter l'établissement.";

const pad = (n: number) => String(n).padStart(2, "0"); // ajoute un zéro devant les nombres inférieurs à 10

/**
 * Remplace les {{variables}} ; tolère les espaces et laisse les inconnus intacts
 * @param modele Le modèle de chaîne contenant des variables {{nom}}
 * @param vars Un objet contenant les valeurs des variables à remplacer
 * @returns La chaîne de caractères avec les variables remplacées
 */
function rendre(modele: string, vars: Record<string, string>): string {
  return modele.replace(/\{\{\s*(\w+)\s*}}/g, (m, k) => vars[k] ?? m); // remplace les variables {{nom}} par leur valeur dans vars, sinon laisse {{nom}} intacte
}

/**
 * Valeur mesurée pour un élève, ou null si non significative
 * @param type Le type de règle à évaluer
 * @param compteur Les compteurs d'absences, retards et présences
 * @returns La valeur mesurée pour l'élève, ou null si non significative
 */
function valeuMetrique(
  type: TypeRegle,
  compteur: {
    present: number;
    absent: number;
    absentNonJustifie: number;
    retard: number;
  },
): number | null {
  const total = compteur.present + compteur.absent + compteur.retard;
  switch (type) {
    case "ABSENCES":
      return compteur.absent;
    case "ABSENCES_NON_JUSTIFIEES":
      return compteur.absentNonJustifie;
    case "RETARDS":
      return compteur.retard;
    case "TAUX_PRESENCE":
      return total >= MIN_APPELS_TAUX
        ? (((compteur.present + compteur.retard) / total) * 1000) / 10
        : null;
  }
}

// taux déclenche en dessous du seuil, les compteurs au-dessus
const atteint = (type: TypeRegle, valeur: number, seuil: number) =>
  type === "TAUX_PRESENCE" ? valeur <= seuil : valeur >= seuil;

/**
 * Evalue un règle sur sa fenêtre glissante
 * @param regle La règle à évaluer pour les élèves
 * @param now La date actuelle utilisée pour calculer la période
 * @param notifier Indique si les notifications doivent être envoyées
 * @returns Une liste de correspondances pour les élèves ayant atteint un palier de la règle
 */
export async function evaluerRegle(
  regle: RegleAvecPaliers,
  now: Date,
  notifier: boolean,
): Promise<Correspondance[]> {
  const debut = new Date(now);
  debut.setDate(debut.getDate() - regle.periodeJours); // calcule la date de début de la période à partir de la date actuelle et de la durée de la règle

  const compteur = await compterParEleve({
    eleve: {
      schoolId: regle.schoolId,
      deletedAt: null,
      ...(regle.classeId ? { classId: regle.classeId } : {}),
    },
    appel: { date: { gte: formatDate(debut), lte: formatDate(now) } },
  });

  const taux = regle.type === "TAUX_PRESENCE"; //
  const resultat: Correspondance[] = [];
  for (const [eleveId, comp] of compteur) {
    const valeur = valeuMetrique(regle.type, comp);
    if (valeur === null) continue;
    const atteints = regle.paliers.filter((palier) =>
      atteint(regle.type, valeur, palier.seuil),
    );
    if (atteints.length === 0) continue;
    // Palier le plus grace : plus petit seuil pour un taux, plus grand sinon
    const palier = atteints.reduce((a, b) =>
      (taux ? b.seuil < a.seuil : b.seuil > a.seuil) ? b : a,
    );
    resultat.push({ eleveId, palier, valeur }); // Ajoute la correspondance pour l'élève avec le palier atteint et la valeur mesurée
  }
  return resultat;
}

// Créé le journal puis les notifications ; ignore ce qui a déjà été emis ce mois-ci
/**
 * Notifie les correspondances d'une règle d'alerte aux destinataires appropriés.
 * Crée un journal des notifications et ignore celles déjà émises pour le cycle en cours.
 * @param regle La règle d'alerte pour laquelle les correspondances doivent être notifiées
 * @param correspondances La liste des correspondances d'élèves ayant atteint un palier de la règle
 * @param now La date et l'heure actuelles pour l'évaluation des notifications
 */
async function notifierCorrespondance(
  regle: RegleAvecPaliers,
  correspondances: Correspondance[],
  now: Date,
): Promise<void> {
  const cycle = `${now.getFullYear()}-${now.getMonth() + 1}`; // Format du cycle : "YYYY-MM"
  const [eleves, admins] = await Promise.all([
    prisma.eleve.findMany({
      where: { id: { in: correspondances.map((c) => c.eleveId) } },
      select: {
        id: true,
        nom: true,
        prenom: true,
        parent: { select: { userId: true } },
        classe: {
          select: { professeurPrincipal: { select: { userId: true } } },
        },
      },
    }),
    prisma.user.findMany({
      where: { schoolId: regle.schoolId, role: "ADMIN" },
      select: { id: true },
    }),
  ]);
  const parId = new Map(eleves.map((eleve) => [eleve.id, eleve])); // Crée une map pour accéder rapidement aux informations des élèves par leur ID

  for (const { eleveId, palier, valeur } of correspondances) {
    const eleve = parId.get(eleveId); // Récupère les informations de l'élève à partir de la map
    if (!eleve) continue; // Ignore si l'élève n'existe pas dans la base de données

    const vars = {
      nom_eleve: `${eleve.prenom} ${eleve.nom}`, // Nom complet de l'élève
      valeur: String(valeur), // Valeur mesurée pour l'élève
      seuil: String(palier.seuil), // Seuil du palier atteint
      periode: String(regle.periodeJours), // Période en jours pour la règle
      libelle: LIBELLES[regle.type], // Libellé correspondant au type de règle
    };

    // Un message par destinataire ; un même utilisateur n'est notifié qu'une fois
    const messages = new Map<string, string>(); // Map pour stocker les messages par destinataire (userId)
    for (const dest of palier.destinataire) {
      const modele =
        palier.message ?? (dest === "PARENT" ? DEFAUT_PARENT : DEFAUT_ADMIN); // Utilise le message du palier ou le message par défaut selon le destinataire
      const ids = // Récupère les IDs des destinataires selon le type de destinataire
        dest === "ADMIN"
          ? admins.map((admin) => admin.id)
          : dest === "PARENT"
            ? [eleve.parent?.userId]
            : [eleve.classe?.professeurPrincipal?.userId];
      for (const id of ids) {
        if (id && !messages.has(id)) {
          // Ajoute le message pour ce destinataire s'il n'a pas déjà été ajouté
          messages.set(id, rendre(modele, vars));
        }
      }
    }
    // Sans destinataire joignable on ne journalise pas : on réessaie au prochain passage
    if (messages.size === 0) continue; // Ignore si aucun destinataire n'est joignable

    try {
      await prisma.$transaction([
        prisma.alerteDeclenchee.create({
          data: {
            schoolId: regle.schoolId,
            regleId: regle.id,
            palierId: palier.id,
            eleveId,
            cycle,
            valeur,
            nbNotification: messages.size,
          },
        }),
        prisma.notification.createMany({
          data: [...messages].map(([userId, message]) => ({
            userId,
            schoolId: regle.schoolId,
            message,
            lien: "/absences/alertes",
          })),
        }),
      ]);
    } catch (error) {
      // P2002 : alerte déjà émise ce mois-ci (aussi si plusieurs instances tournent en parallèle)
      if ((error as { code?: string }).code !== "P2002") {
        throw error;
      }
    }
  }
}

/**
 * Évalue toutes les règles d'alerte actives pour tous les élèves et déclenche les alertes si nécessaire.
 * @param now La date et l'heure actuelles pour l'évaluation des règles
 */
export async function evaluerToutesLesRegles(now = new Date()): Promise<void> {
  const regles = await prisma.regleAlerte.findMany({
    where: { actif: true },
    include: { paliers: true },
  });
  for (const regle of regles) {
    try {
      await evaluerRegle(regle, now, true);
    } catch (error) {
      console.error(`Regles d'alerts ${regle.id}`, error);
    }
  }
}

let timer: NodeJS.Timeout | null = null; // Timer pour planifier l'évaluation périodique des règles d'alerte
let enCours = false; // évite le chevauchement de deux passages

/**
 *
 * @returns
 */
export function demarrerPlanificateurAlertes(): void {
  if (timer) return; //
  timer = setInterval(async () => {
    if (enCours) return; //
    try {
      await evaluerToutesLesRegles();
    } catch (error) {
      console.error("Erreur lors de l'évaluation des règles d'alerte", error);
    } finally {
      enCours = false;
    }
  }, INTERVALLE_MS);
}
