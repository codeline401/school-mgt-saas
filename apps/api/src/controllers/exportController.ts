import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { pdfGenerator } from "../lib/pdfGenerator.js";
import { templateEngine } from "../lib/templateEngine.js";
import type { BulletinTemplateConfig } from "@school-mgt/types";
import { DEFAULT_BULLETIN_CONFIG } from "@school-mgt/types";
import fs from "fs/promises";

import { bulletinExportSchema } from "../schemas/bulletinExportSchema.js";
import { releveExportSchema } from "../schemas/releveExportSchema.js";
import { classementExportSchema } from "../schemas/classementExportSchema.js";
import { deliberationExportSchema } from "../schemas/deliberationExportSchema.js";

import type {
  BulletinData,
  BulletinSubject,
  ReleveData,
  ReleveMatiere,
  ReleveEvaluation,
  ClassementData,
  ClassementEntry,
  DeliberationData,
  DeliberationEntry,
  SchoolExportInfo,
  ExportOptions,
} from "@school-mgt/types";
import { DEFAULT_EXPORT_OPTIONS } from "@school-mgt/types";

// ============================================================================
// EXPORT CONTROLLER
// ============================================================================

// ---------- Helpers ----------

function mergeExportOptions(
  options?: Partial<ExportOptions>,
): Required<ExportOptions> {
  return {
    format: options?.format ?? DEFAULT_EXPORT_OPTIONS.format,
    orientation: options?.orientation ?? DEFAULT_EXPORT_OPTIONS.orientation,
    watermark: options?.watermark ?? DEFAULT_EXPORT_OPTIONS.watermark,
    includeGraphs:
      options?.includeGraphs ?? DEFAULT_EXPORT_OPTIONS.includeGraphs,
    primaryColor: options?.primaryColor ?? DEFAULT_EXPORT_OPTIONS.primaryColor,
  };
}

async function resolveTemplateConfig(
  schoolId: string,
): Promise<BulletinTemplateConfig> {
  const template = await prisma.bulletinTemplate.findUnique({
    where: { schoolId },
  });
  return {
    ...DEFAULT_BULLETIN_CONFIG,
    ...((template?.config as Partial<BulletinTemplateConfig> | null) ?? {}),
  };
}

function mapSchool(school: {
  nom: string;
  logoUrl: string | null;
  devise: string | null;
  slogan: string | null;
  siteWeb: string | null;
  numAutorisation: string | null;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
}): SchoolExportInfo {
  return {
    nom: school.nom,
    logoUrl: school.logoUrl,
    devise: school.devise,
    slogan: school.slogan,
    siteWeb: school.siteWeb,
    numAutorisation: school.numAutorisation,
    adresse: school.adresse,
    telephone: school.telephone,
    email: school.email,
  };
}

function normalizeTo20(note: number, noteMax: number): number {
  if (noteMax <= 0) return 0;
  return Number(((note * 20) / noteMax).toFixed(2));
}

function computeStudentAverages(
  notes: Array<{
    matiereId: string;
    note: number;
    noteMax: number;
    coefficient: number;
  }>,
): {
  moyenneGenerale: number;
  parMatiere: Map<string, { sum: number; count: number; coef: number }>;
} {
  const parMatiere = new Map<
    string,
    { sum: number; count: number; coef: number }
  >();
  for (const n of notes) {
    const norm = normalizeTo20(n.note, n.noteMax);
    const ex = parMatiere.get(n.matiereId);
    if (ex) {
      ex.sum += norm;
      ex.count += 1;
    } else {
      parMatiere.set(n.matiereId, { sum: norm, count: 1, coef: n.coefficient });
    }
  }

  let totalCoef = 0;
  let sommeCoef = 0;
  parMatiere.forEach((v) => {
    const moy = v.count > 0 ? v.sum / v.count : 0;
    totalCoef += v.coef;
    sommeCoef += moy * v.coef;
  });

  const moyenneGenerale =
    totalCoef > 0 ? Number((sommeCoef / totalCoef).toFixed(2)) : 0;
  return { moyenneGenerale, parMatiere };
}

// FIX (typo) : singatureToDataUrl -> signatureToDataUrl, + version async
async function signatureToDataUrl(
  filePath: string,
  mimeType: string,
): Promise<string | null> {
  try {
    const buffer = await fs.readFile(filePath);
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

const schoolSelect = {
  select: {
    nom: true,
    logoUrl: true,
    devise: true,
    slogan: true,
    siteWeb: true,
    numAutorisation: true,
    adresse: true,
    telephone: true,
    email: true,
  },
} as const;

// ---------- Handlers ----------

export const exportController = {
  // ====== BULLETIN ======
  async generateBulletin(req: Request, res: Response): Promise<void> {
    try {
      const parsed = bulletinExportSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: "Données invalides",
          details: parsed.error.flatten(),
        });
        return;
      }
      const { eleveId, periodeId, options: rawOptions } = parsed.data;
      const options = mergeExportOptions(rawOptions);

      const eleve = await prisma.eleve.findFirst({
        where: {
          id: eleveId,
          classe: { schoolId: req.user!.schoolId as string },
        },
        include: {
          classe: {
            include: {
              school: schoolSelect,
            },
          },
        },
      });
      if (!eleve) {
        res.status(404).json({ error: "Élève introuvable" });
        return;
      }

      if (!eleve.classeId || !eleve.classe) {
        res.status(400).json({ error: "L'élève n'est pas affecté à une classe" });
        return;
      }

      const periode = await prisma.periode.findFirst({
        where: { id: periodeId, schoolId: req.user!.schoolId as string },
      });
      if (!periode) {
        res.status(404).json({ error: "Période introuvable" });
        return;
      }

      const notes = await prisma.note.findMany({
        where: { eleveId, periodeId },
        include: { matiere: true },
      });

      const { moyenneGenerale, parMatiere } = computeStudentAverages(
        notes.map((n) => ({
          matiereId: n.matiereId,
          note: Number(n.note),
          noteMax: Number(n.noteMax),
          coefficient: Number(n.coefficient),
        })),
      );

      const subjects: BulletinSubject[] = [];
      for (const n of notes) {
        const stat = parMatiere.get(n.matiereId);
        if (!stat) continue;
        const moyenne =
          stat.count > 0 ? Number((stat.sum / stat.count).toFixed(2)) : 0;
        if (subjects.find((s) => s.matiereId === n.matiereId)) continue;
        subjects.push({
          matiereId: n.matiereId,
          nom: n.matiere.nom,
          coefficient: stat.coef,
          moyenne,
          nbEvaluations: stat.count,
          rang: null,
          appreciation: n.commentaire,
        });
      }

      const elevesClasse = await prisma.eleve.findMany({
        where: { classeId: eleve.classeId },
        select: { id: true },
      });

      const moyennesAutres = await Promise.all(
        elevesClasse
          .filter((e) => e.id !== eleveId)
          .map(async (e) => {
            const ns = await prisma.note.findMany({
              where: { eleveId: e.id, periodeId },
            });
            if (ns.length === 0) return 0;
            const { moyenneGenerale: m } = computeStudentAverages(
              ns.map((x) => ({
                matiereId: x.matiereId,
                note: Number(x.note),
                noteMax: Number(x.noteMax),
                coefficient: Number(x.coefficient),
              })),
            );
            return m;
          }),
      );
      const allSorted = [...moyennesAutres, moyenneGenerale].sort(
        (a, b) => b - a,
      );
      const rang = allSorted.indexOf(moyenneGenerale) + 1;

      // Récupère la signature du directeur (ADMIN de l'école)
      const admin = await prisma.user.findFirst({
        where: {
          schoolId: eleve.classe.schoolId,
          role: { in: ["ADMIN", "SUDO_ADMIN"] },
        },
        include: { signature: true },
      });

      // FIX : prof principal désigné via Classe.professeurPrincipalId,
      // au lieu d'un professeur arbitraire parmi ceux affectés à la classe.
      const classeAvecPrincipal = (await prisma.classe.findUnique({
        where: { id: eleve.classeId },
        include: {
          professeurPrincipal: {
            include: { user: { include: { signature: true } } },
          },
        },
      })) as {
        professeurPrincipal?: {
          user?: {
            signature?: {
              filePath: string;
              mimeType: string;
            } | null;
          } | null;
        } | null;
      } | null;
      const profPrincipal = classeAvecPrincipal?.professeurPrincipal ?? null;

      // FIX (typo + async) : signatureToDataUrl, awaited
      const signatureDirecteur = admin?.signature
        ? await signatureToDataUrl(
            admin.signature.filePath,
            admin.signature.mimeType,
          )
        : null;

      const signatureProfPrincipal = profPrincipal?.user?.signature
        ? await signatureToDataUrl(
            profPrincipal.user.signature.filePath,
            profPrincipal.user.signature.mimeType,
          )
        : null;

      const config = await resolveTemplateConfig(eleve.classe.schoolId);

      const data: BulletinData = {
        eleve: {
          id: eleve.id,
          nom: eleve.nom,
          prenom: eleve.prenom,
          dateNaissance: eleve.dateNaissance?.toISOString() ?? null,
          photoUrl: eleve.photoUrl,
        },
        classe: { id: eleve.classe.id, nom: eleve.classe.nom },
        periode: {
          id: periode.id,
          nom: periode.nom,
          type: periode.type,
          anneeScolaire: periode.anneeScolaire,
        },
        subjects,
        moyenneGenerale,
        rang,
        totalEleves: elevesClasse.length,
        appreciationConseil: null,
        decision: null,
        mention: null,
        avertissement: null,
        config,
        school: mapSchool(eleve.classe.school),
        dateGeneration: new Date().toISOString(),
        watermark: options.watermark,
        primaryColor: options.primaryColor ?? "#2563eb",
        signatureDirecteur,
        signatureProfPrincipal,
      };

      const html = await templateEngine.compile(
        "bulletin",
        data as unknown as Record<string, unknown>,
      );
      const pdf = await pdfGenerator.htmlToPdf(html, {
        format: options.format,
        orientation: options.orientation,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="bulletin-${eleveId}-${Date.now()}.pdf"`,
      );
      res.status(200).send(pdf);
    } catch (error) {
      console.error("[EXPORT] Bulletin error:", error);
      res.status(500).json({
        error: "Erreur lors de la génération du bulletin",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  },

  // ====== RELEVÉ ======
  async generateReleve(req: Request, res: Response): Promise<void> {
    try {
      const parsed = releveExportSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: "Données invalides",
          details: parsed.error.flatten(),
        });
        return;
      }
      const { eleveId, periodeId, options: rawOptions } = parsed.data;
      const options = mergeExportOptions(rawOptions);

      const eleve = await prisma.eleve.findFirst({
        where: {
          id: eleveId,
          classe: { schoolId: req.user!.schoolId as string },
        },
        include: {
          classe: {
            include: {
              school: schoolSelect,
            },
          },
        },
      });
      if (!eleve) {
        res.status(404).json({ error: "Élève introuvable" });
        return;
      }
      if (!eleve.classeId || !eleve.classe) {
        res.status(400).json({ error: "L'élève n'est pas affecté à une classe" });
        return;
      }
      const periode = await prisma.periode.findFirst({
        where: { id: periodeId, schoolId: req.user!.schoolId as string },
      });
      if (!periode) {
        res.status(404).json({ error: "Période introuvable" });
        return;
      }

      const notes = await prisma.note.findMany({
        where: { eleveId, periodeId },
        include: { matiere: true },
        orderBy: { dateEval: "asc" },
      });

      const matieresMap = new Map<string, ReleveMatiere>();
      for (const n of notes) {
        const noteNorm = normalizeTo20(Number(n.note), Number(n.noteMax));
        let mat = matieresMap.get(n.matiereId);
        if (!mat) {
          mat = {
            matiereId: n.matiereId,
            nom: n.matiere.nom,
            coefficient: Number(n.coefficient),
            evaluations: [],
            moyenne: 0,
            appreciation: null,
          };
          matieresMap.set(n.matiereId, mat);
        }
        const evalItem: ReleveEvaluation = {
          titre: n.titre,
          type: n.typeNote,
          date: n.dateEval.toISOString(),
          note: Number(n.note),
          noteMax: Number(n.noteMax),
          noteNormalisee: noteNorm,
          coefficient: Number(n.coefficient),
        };
        mat.evaluations.push(evalItem);
      }
      for (const m of matieresMap.values()) {
        const sum = m.evaluations.reduce((s, e) => s + e.noteNormalisee, 0);
        m.moyenne =
          m.evaluations.length > 0
            ? Number((sum / m.evaluations.length).toFixed(2))
            : 0;
      }

      const matieres = Array.from(matieresMap.values());
      const totalCoef = matieres.reduce((s, m) => s + m.coefficient, 0);
      const sommeCoef = matieres.reduce(
        (s, m) => s + m.moyenne * m.coefficient,
        0,
      );
      const moyenneGenerale =
        totalCoef > 0 ? Number((sommeCoef / totalCoef).toFixed(2)) : 0;

      const config = await resolveTemplateConfig(eleve.classe.schoolId);
      const totalEleves = await prisma.eleve.count({
        where: { classeId: eleve.classeId },
      });

      const data: ReleveData = {
        eleve: {
          id: eleve.id,
          nom: eleve.nom,
          prenom: eleve.prenom,
          dateNaissance: eleve.dateNaissance?.toISOString() ?? null,
          photoUrl: eleve.photoUrl,
        },
        classe: { id: eleve.classe.id, nom: eleve.classe.nom },
        periode: {
          id: periode.id,
          nom: periode.nom,
          type: periode.type,
          anneeScolaire: periode.anneeScolaire,
        },
        matieres,
        moyenneGenerale,
        rang: null,
        totalEleves,
        config,
        school: mapSchool(eleve.classe.school),
        dateGeneration: new Date().toISOString(),
      };

      const html = await templateEngine.compile(
        "releve",
        data as unknown as Record<string, unknown>,
      );
      const pdf = await pdfGenerator.htmlToPdf(html, {
        format: options.format,
        orientation: options.orientation,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="releve-${eleveId}-${Date.now()}.pdf"`,
      );
      res.status(200).send(pdf);
    } catch (error) {
      console.error("[EXPORT] Releve error:", error);
      res.status(500).json({
        error: "Erreur lors de la génération du relevé",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  },

  // ====== CLASSEMENT ======
  async generateClassement(req: Request, res: Response): Promise<void> {
    try {
      const parsed = classementExportSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: "Données invalides",
          details: parsed.error.flatten(),
        });
        return;
      }
      const { classeId, periodeId, options: rawOptions } = parsed.data;
      const options = mergeExportOptions(rawOptions);

      const classe = await prisma.classe.findFirst({
        where: { id: classeId, schoolId: req.user!.schoolId as string },
        include: {
          school: schoolSelect,
        },
      });
      if (!classe) {
        res.status(404).json({ error: "Classe introuvable" });
        return;
      }
      const periode = await prisma.periode.findFirst({
        where: { id: periodeId, schoolId: req.user!.schoolId as string },
      });
      if (!periode) {
        res.status(404).json({ error: "Période introuvable" });
        return;
      }

      const eleves = await prisma.eleve.findMany({ where: { classeId } });

      type EntryWithNum = ClassementEntry & { moyenneNumerique: number };
      const entriesAvecMoy: EntryWithNum[] = await Promise.all(
        eleves.map(async (e) => {
          const ns = await prisma.note.findMany({
            where: { eleveId: e.id, periodeId },
          });
          if (ns.length === 0) {
            return {
              rang: 0,
              eleveId: e.id,
              nom: e.nom,
              prenom: e.prenom,
              moyenne: 0,
              nbMatieres: 0,
              mention: null,
              moyenneNumerique: 0,
            };
          }
          const { moyenneGenerale, parMatiere } = computeStudentAverages(
            ns.map((x) => ({
              matiereId: x.matiereId,
              note: Number(x.note),
              noteMax: Number(x.noteMax),
              coefficient: Number(x.coefficient),
            })),
          );
          return {
            rang: 0,
            eleveId: e.id,
            nom: e.nom,
            prenom: e.prenom,
            moyenne: moyenneGenerale,
            nbMatieres: parMatiere.size,
            mention: null,
            moyenneNumerique: moyenneGenerale,
          };
        }),
      );

      entriesAvecMoy.sort((a, b) => b.moyenneNumerique - a.moyenneNumerique);
      let lastScore: number | null = null;
      let lastRank = 0;
      entriesAvecMoy.forEach((e, i) => {
        if (lastScore === null || e.moyenneNumerique < lastScore) {
          lastRank = i + 1;
          lastScore = e.moyenneNumerique;
        }
        e.rang = lastRank;
      });

      const moyennes = entriesAvecMoy
        .map((e) => e.moyenneNumerique)
        .filter((m) => m > 0);
      const moyenneClasse =
        moyennes.length > 0
          ? Number(
              (moyennes.reduce((s, m) => s + m, 0) / moyennes.length).toFixed(
                2,
              ),
            )
          : 0;
      const moyenneMax = moyennes.length > 0 ? Math.max(...moyennes) : 0;
      const moyenneMin = moyennes.length > 0 ? Math.min(...moyennes) : 0;
      const reussis = moyennes.filter((m) => m >= 10).length;
      const tauxReussite =
        moyennes.length > 0
          ? Number(((reussis / moyennes.length) * 100).toFixed(1))
          : 0;

      const entries: ClassementEntry[] = entriesAvecMoy.map((e) => ({
        rang: e.rang,
        eleveId: e.eleveId,
        nom: e.nom,
        prenom: e.prenom,
        moyenne: e.moyenne,
        nbMatieres: e.nbMatieres,
        // Code enum brut (MentionDeliberation) ; le label lisible est résolu
        // côté template via le helper {{mentionLabel}}.
        mention:
          e.moyenneNumerique >= 16
            ? "FELICITATIONS"
            : e.moyenneNumerique >= 14
              ? "ENCOURAGEMENT"
              : e.moyenneNumerique >= 12
                ? "TABLEAU_HONNEUR"
                : null,
      }));

      const config = await resolveTemplateConfig(classe.schoolId);

      const data: ClassementData = {
        classe: { id: classe.id, nom: classe.nom },
        periode: {
          id: periode.id,
          nom: periode.nom,
          type: periode.type,
          anneeScolaire: periode.anneeScolaire,
        },
        entries,
        moyenneClasse,
        moyenneMin: Number(moyenneMin.toFixed(2)),
        moyenneMax: Number(moyenneMax.toFixed(2)),
        tauxReussite,
        config,
        school: mapSchool(classe.school),
        dateGeneration: new Date().toISOString(),
      };

      const html = await templateEngine.compile(
        "classement",
        data as unknown as Record<string, unknown>,
      );
      const pdf = await pdfGenerator.htmlToPdf(html, {
        format: options.format,
        orientation: options.orientation,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="classement-${classeId}-${Date.now()}.pdf"`,
      );
      res.status(200).send(pdf);
    } catch (error) {
      console.error("[EXPORT] Classement error:", error);
      res.status(500).json({
        error: "Erreur lors de la génération du classement",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  },

  // ====== DÉLIBÉRATION ======
  async generateDeliberation(req: Request, res: Response): Promise<void> {
    try {
      const parsed = deliberationExportSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: "Données invalides",
          details: parsed.error.flatten(),
        });
        return;
      }
      const { sessionId, options: rawOptions } = parsed.data;
      const options = mergeExportOptions(rawOptions);

      // FIX : findUnique n'accepte pas {id, schoolId} combinés (schoolId n'est
      // pas une clé unique) -> findFirst pour appliquer correctement le filtre tenant.
      const session = await prisma.deliberationSession.findFirst({
        where: { id: sessionId, schoolId: req.user!.schoolId as string },
        include: {
          classe: {
            include: {
              school: schoolSelect,
            },
          },
          decisions: { include: { eleve: true } },
          validatedBy: true,
        },
      });
      if (!session) {
        res.status(404).json({ error: "Session de délibération introuvable" });
        return;
      }

      let entries: DeliberationEntry[] = session.decisions.map((d) => ({
        rang: null,
        eleveId: d.eleveId,
        nom: d.eleve.nom,
        prenom: d.eleve.prenom,
        moyenne: 0,
        decision: d.decision,
        mention: d.mention,
        avertissement: d.avertissement,
        commentaire: d.commentaire,
      }));

      if (session.periodeId) {
        const allNotes = await prisma.note.findMany({
          where: { classeId: session.classeId, periodeId: session.periodeId },
        });
        const groupedByEleve = new Map<
          string,
          Array<{
            matiereId: string;
            note: number;
            noteMax: number;
            coefficient: number;
          }>
        >();
        for (const n of allNotes) {
          if (!groupedByEleve.has(n.eleveId)) groupedByEleve.set(n.eleveId, []);
          groupedByEleve.get(n.eleveId)!.push({
            matiereId: n.matiereId,
            note: Number(n.note),
            noteMax: Number(n.noteMax),
            coefficient: Number(n.coefficient),
          });
        }
        entries = entries.map((e) => {
          const ns = groupedByEleve.get(e.eleveId);
          if (!ns || ns.length === 0) return e;
          const { moyenneGenerale } = computeStudentAverages(ns);
          return { ...e, moyenne: moyenneGenerale };
        });
        entries.sort((a, b) => b.moyenne - a.moyenne);
        entries = entries.map((e, i) => ({ ...e, rang: i + 1 }));
      }

      const statistiques = {
        totalEleves: entries.length,
        passes: entries.filter((e) => e.decision === "PASSE").length,
        redoublants: entries.filter((e) => e.decision === "REDOUBLE").length,
        orientes: entries.filter((e) => e.decision === "ORIENTE").length,
        exclus: entries.filter((e) => e.decision === "EXCLU").length,
        moyenneClasse:
          entries.length > 0
            ? Number(
                (
                  entries.reduce((s, e) => s + e.moyenne, 0) / entries.length
                ).toFixed(2),
              )
            : 0,
        tauxReussite:
          entries.length > 0
            ? Number(
                (
                  (entries.filter((e) => e.moyenne >= 10).length /
                    entries.length) *
                  100
                ).toFixed(1),
              )
            : 0,
      };

      const config = await resolveTemplateConfig(session.schoolId);

      const data: DeliberationData = {
        session: {
          id: session.id,
          periodeLabel: session.periodeLabel,
          anneeScolaire: session.anneeScolaire,
          statut: session.statut,
          compteRendu: session.compteRendu,
          dateValidation: session.validatedAt?.toISOString() ?? null,
          validePar: session.validatedBy
            ? `${session.validatedBy.prenom} ${session.validatedBy.nom}`
            : null,
        },
        classe: { id: session.classe.id, nom: session.classe.nom },
        entries,
        statistiques,
        config,
        school: mapSchool(session.classe.school),
        dateGeneration: new Date().toISOString(),
      };

      const html = await templateEngine.compile(
        "deliberation",
        data as unknown as Record<string, unknown>,
      );
      const pdf = await pdfGenerator.htmlToPdf(html, {
        format: options.format,
        orientation: options.orientation,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="deliberation-${sessionId}-${Date.now()}.pdf"`,
      );
      res.status(200).send(pdf);
    } catch (error) {
      console.error("[EXPORT] Deliberation error:", error);
      res.status(500).json({
        error: "Erreur lors de la génération du compte-rendu",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  },
};
