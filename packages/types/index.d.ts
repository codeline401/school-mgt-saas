export interface BaseEntity {
    id: string;
    createdAt: string;
    updatedAt: string;
    schoolId: string;
}
export interface Eleve extends BaseEntity {
    nom: string;
    prenom: string;
    classeId: string;
}
export interface Classe {
    id: string;
    nom: string;
    schoolId: string;
    _count?: {
        eleves: number;
        profs: number;
    };
}
export interface CreateClasseInput {
    nom: string;
}
export interface Professeur extends BaseEntity {
    nom: string;
    prenom: string;
    classeIds: string[];
}
export interface School {
    id: string;
    nom: string;
    inviteCode: string;
    createdAt: string;
    _count?: {
        eleves: number;
        classes: number;
        profs: number;
        users: number;
    };
}
export interface CreateSchoolInput {
    nom: string;
}
export interface Parent {
    id: string;
    nom: string;
    prenom: string;
    email?: string | null;
    telephone?: string | null;
    adresse?: string | null;
    schoolId: string;
    createdAt: string;
    updatedAt: string;
}
export interface DossierAdmission {
    id: string;
    statut: "EN_ATTENTE" | "EN_LISTE_ATTENTE" | "ADMIS" | "REFUSE";
    nomEleve: string;
    prenomEleve: string;
    classeVisee: string;
    createdAt: string;
    updatedAt: string;
}
export interface EleveProfil extends BaseEntity {
    nom: string;
    prenom: string;
    dateNaissance?: string | null;
    telephone?: string | null;
    adresse?: string | null;
    photoUrl?: string | null;
    classeId?: string | null;
    parentId?: string | null;
    classe?: Classe | null;
    parent?: Parent | null;
    admissions?: DossierAdmission[];
}
export interface EleveResume {
    id: string;
    nom: string;
    prenom: string;
    schoolId: string;
    classeId: string;
    createdAt: string;
    updatedAt: string;
    classe?: Classe | null;
}
export interface Contrat {
    id: string;
    typeContrat: "CDI" | "CDD" | "VACATAIRE" | "STAGIAIRE";
    dateDebut: string;
    dateFin?: string | null;
    poste: string;
    salaire: number | null;
    schoolId: string;
    createdAt: string;
    updatedAt: string;
}
export interface Remplacement {
    id: string;
    date: string;
    motif?: string | null;
    classeNom?: string | null;
    schoolId: string;
    createdAt: string;
    updatedAt: string;
}
export interface ProfesseurProfil extends BaseEntity {
    nom: string;
    prenom: string;
    telephone?: string | null;
    adresse?: string | null;
    dateNaissance?: string | null;
    photoUrl?: string | null;
    specialites?: string | null;
    classes: Classe[];
    contrat: Contrat[];
    remplacements: Remplacement[];
    matieres: {
        id: string;
        nom: string;
        classeId: string;
    }[];
}
export interface ParentProfil {
    id: string;
    nom: string;
    prenom: string;
    email?: string | null;
    telephone?: string | null;
    adresse?: string | null;
    schoolId: string;
    createdAt: string;
    updatedAt: string;
    eleves: EleveResume[];
}
export interface Matiere extends BaseEntity {
    nom: string;
    description?: string | null;
    classeId: string;
}
/** Résumé d'un élève retourné dans la liste des notes */
export interface NoteEleveResume {
    id: string;
    nom: string;
    prenom: string;
}
/** Résumé d'une matière retourné dans la liste des notes */
export interface NoteMatiereResume {
    id: string;
    nom: string;
}
/**
 * Note d'un elève pour une matière dans une classe
 *
 * Un élève peut avoir plusieurs notes pour la même matière, chacune
 * identifiée par un titre d'évaluation unique (ex: "DS1", "Examen final", etc.)
 */
export type TypeNote = "INTERROGATION" | "DS" | "EXAMEN" | "AUTRE";
/**
 * Retourné par GET /api/classes/:classeId/notes
 */
export interface Note extends BaseEntity {
    titre: string;
    note: number;
    noteMax: number;
    coefficient: number;
    typeNote: TypeNote;
    dateEval: string;
    commentaire?: string | null;
    feuillePath?: string | null;
    eleveId: string;
    matiereId: string;
    classeId: string;
    createdById: string;
    eleve?: NoteEleveResume;
    matiere?: NoteMatiereResume;
}
export type TypeDocument = "COURS" | "DEVOIR" | "EVALUATION" | "NOTE_SERVICE" | "CIRCULAIRE" | "AUTRE";
export interface DocumentUploader {
    id: string;
    nom: string;
    prenom: string;
    role: string;
}
export interface ClasseDocument {
    id: string;
    titre: string;
    description?: string | null;
    type: TypeDocument;
    filePath: string;
    mimeType: string;
    classeId: string;
    matiereId?: string | null;
    uploadedById: string;
    schoolId: string;
    createdAt: string;
    updatedAt: string;
    uploadedBy?: DocumentUploader;
    matiere?: {
        id: string;
        nom: string;
    } | null;
}
export type JourSemaine = "LUNDI" | "MARDI" | "MERCREDI" | "JEUDI" | "VENDREDI" | "SAMEDI" | "DIMANCHE";
export interface CreneauHoraire {
    id: string;
    classeId: string;
    schoolId: string;
    jour: JourSemaine;
    heureDebut: string;
    heureFin: string;
    intitule?: string | null;
    matiereId?: string | null;
    matiere?: {
        id: string;
        nom: string;
    } | null;
    couleur?: string | null;
    createdAt: string;
    updatedAt: string;
}
/** Créneau enrichi pour l'emploi du temps personnel d'un prof */
export interface CreneauHoraireProf extends CreneauHoraire {
    classe: {
        id: string;
        nom: string;
    };
}
export type StatutPresence = "PRESENT" | "ABSENT" | "RETARD";
export interface PresenceEleve {
    id: string;
    nom: string;
    prenom: string;
}
export interface Presence {
    id: string;
    appelId: string;
    eleveId: string;
    statut: StatutPresence;
    updatedAt: string;
    eleve?: PresenceEleve;
}
export interface CreneauResume {
    id: string;
    jour: JourSemaine;
    heureDebut: string;
    heureFin: string;
    intitule?: string | null;
    couleur?: string | null;
    matiere?: {
        id: string;
        nom: string;
    } | null;
}
export interface Appel {
    id: string;
    creneauId: string;
    classeId: string;
    schoolId: string;
    date: string;
    createdAt: string;
    updatedAt: string;
    creneau?: CreneauResume;
    presences?: Presence[];
}
/** Statistiques d'absences par élève sur une période */
export interface AbsenceStat {
    eleveId: string;
    nom: string;
    prenom: string;
    /** Appels où une présence a été enregistrée pour cet élève (peut différer du total classe si l'élève a rejoint la classe en cours de période) */
    appelsEleve: number;
    present: number;
    absent: number;
    retard: number;
    tauxPresence: number;
}
/** Réponse de GET /api/classes/:classeId/appels/stats/absences */
export interface AbsenceStatsResponse {
    from: string;
    to: string;
    totalAppels: number;
    stats: AbsenceStat[];
}
export interface Notification {
    id: string;
    userId: string;
    message: string;
    lien?: string | null;
    lu: boolean;
    createdAt: string;
}
/**
 * Module Prof - quiz & Cahier de texte
 */
export type StatutQuiz = "BROUILLON" | "PUBLIE" | "FERME";
export type TypeQuestion = "QCM" | "VRAI_FAUX" | "REPONSE_COURTE";
export interface Devoir {
    id: string;
    titre: string;
    description?: string | null;
    dateRendu: string;
    cahierTexteId: string;
    createdAt: string;
    updatedAt: string;
}
export interface CahierTexte {
    id: string;
    titre: string;
    detail?: string | null;
    date: string;
    classeId: string;
    matiereId?: string | null;
    professeurId: string;
    schoolId: string;
    createdAt: string;
    updatedAt: string;
    matiere?: {
        id: string;
        nom: string;
    } | null;
    classe?: {
        id: string;
        nom: string;
    } | null;
    devoir?: Devoir[];
}
export interface Question {
    id: string;
    quizId: string;
    enonce: string;
    type: TypeQuestion;
    options: string[];
    bonneReponse: string;
    ordre: number;
    createdAt: string;
}
export interface Reponse {
    id: string;
    soumissionId: string;
    questionId: string;
    valeur: string;
    correcte: boolean | null;
}
export interface Soumission {
    id: string;
    quizId: string;
    eleveId: string;
    score?: number | null;
    total: number;
    soumisAt: string;
    reponses?: Reponse[];
    eleve?: {
        id: string;
        nom: string;
        prenom: string;
    } | null;
}
export interface Quiz {
    id: string;
    titre: string;
    classeId: string;
    matiereId?: string | null;
    professeurId: string;
    schoolId: string;
    statut: StatutQuiz;
    createdAt: string;
    updatedAt: string;
    matiere?: {
        id: string;
        nom: string;
    } | null;
    classe?: {
        id: string;
        nom: string;
    } | null;
    questions?: Question[];
    _count?: {
        questions: number;
        soumissions: number;
    };
}
/**
 * COnfiguration JSON du canevas de bulletin
 * Stockée dans BuuletinTemplate.config (Prisma Json)
 * Les valeurs manquantes dans la DB sont complétés par DEFAULT_BULLETIN_CONFIG.
 */
export interface BulletinTemplateConfig {
    /** Texte d'en-tête affiché en haut de chaque bulletin imprimé */
    enteteTexte: string;
    /** Année scolaire, ex: "2025-2026" */
    anneeTexte: string;
    /** Texte de peid de page, ex: "Le Directeur : "_______________________" */
    piedTexte: string;
    /** Afficher le rang de l'élève dans la classe */
    showRang: boolean;
    /** Afficher la colonne de coefficient dans le tableau des matières */
    showCoef: boolean;
    /** Afficher le nombre d'évaluation pas matières */
    showNbEval: boolean;
    /** Note minimale (sur 20) pour afficher la couleur "Bien" */
    seuilBien: number;
    /** Note minimale (sur 20) pour afficher la couleur "Assez-Bien" */
    seuilAssezBien: number;
    /** Note minimale (sur 20) pour afficher la couleur "Passable" */
    seuilPassable: number;
}
/** Valeur par défaut appliquées quand aucun canevas n'a été configuré */
export declare const DEFAULT_BULLETIN_CONFIG: BulletinTemplateConfig;
/**
 * Canevas de bulletin retourné par GET /api/bulletin-template.
 * `config` est toujours peuplé (fusionné avec les défauts côté serveur).
 */
export interface BulletinTemplate extends BaseEntity {
    schoolId: string;
    config: BulletinTemplateConfig;
}
//# sourceMappingURL=index.d.ts.map