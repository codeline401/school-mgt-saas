import "dotenv/config";
import bcrypt from "bcrypt";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/** Returns the env var value if set; otherwise generates a secure random password and writes it to .env.local. */
function resolvePassword(envVar: string): string {
  const fromEnv = process.env[envVar];
  if (fromEnv) return fromEnv;
  const generated = crypto.randomBytes(16).toString("hex");
  const envLocalPath = path.resolve(process.cwd(), ".env.local");
  try {
    fs.appendFileSync(envLocalPath, `${envVar}=${generated}\n`, {
      mode: 0o600,
    });
    console.warn(
      `[seed] ${envVar} not set — generated credential written to ${envLocalPath}`,
    );
    console.warn(`[seed] Keep .env.local secure and do not commit it.`);
  } catch {
    console.warn(
      `[seed] ${envVar} not set — could not persist credential to .env.local. Set ${envVar} in your environment manually.`,
    );
  }
  return generated;
}

async function main() {
  console.log("Début du seed...");

  // ── Comptes système par défaut ────────────────────────────────────────────────────────────────────
  // SUDO_ADMIN : accès global, pas rattaché à une école
  const sudoPassword = await bcrypt.hash(resolvePassword("SUDO_PASSWORD"), 12);
  const sudoAdmin = await prisma.user.upsert({
    where: { email: "sudo_system@school.local" },
    update: {},
    create: {
      email: "sudo_system@school.local",
      password: sudoPassword,
      nom: "SUDO_SYSTEM",
      prenom: "sudo_system",
      role: "SUDO_ADMIN",
    },
  });
  console.log(`SUDO_ADMIN créé : ${sudoAdmin.email}`);

  // ADMIN : rattaché à l'école créée plus bas
  const adminPassword = await bcrypt.hash(
    resolvePassword("ADMIN_PASSWORD"),
    12,
  );

  // ── A. Création de l'école (TENANT) ──────────────────────────────────────────────────────
  // Upsert by stable tenantKey — nom is the display name only and not globally unique
  const school = await prisma.school.upsert({
    where: { tenantKey: "seed-ideale-school-tanjombato" },
    update: {},
    create: {
      nom: "Idéale School Tanjombato",
      tenantKey: "seed-ideale-school-tanjombato",
    },
  });
  console.log(`École créée : ${school.nom} (${school.id})`);

  // Création du compte ADMIN maintenant que l'école existe
  const adminUser = await prisma.user.upsert({
    where: { email: "system@school.local" },
    update: { password: adminPassword },
    create: {
      email: "system@school.local",
      password: adminPassword,
      nom: "SYSTEM",
      prenom: "system",
      role: "ADMIN",
      schoolId: school.id,
    },
  });
  console.log(`ADMIN créé : ${adminUser.email}`);

  // ── ARIELATRA : nouvelle école sans données supplémentaires ─────────────────────────────────────
  const arielatraPassword = await bcrypt.hash(
    resolvePassword("ARIELATRA_ADMIN_PASSWORD"),
    12,
  );

  const arielatraSchool = await prisma.school.upsert({
    where: { tenantKey: "arielatra" },
    update: {},
    create: {
      nom: "ARIELATRA",
      tenantKey: "arielatra",
    },
  });
  console.log(
    `École ARIELATRA créée : ${arielatraSchool.nom} (${arielatraSchool.id})`,
  );

  const arielatraAdmin = await prisma.user.upsert({
    where: { email: "rivo@school.local" },
    update: { password: arielatraPassword, schoolId: arielatraSchool.id },
    create: {
      email: "rivo@school.local",
      password: arielatraPassword,
      nom: "RIVO",
      prenom: "Admin",
      role: "ADMIN",
      schoolId: arielatraSchool.id,
    },
  });
  console.log(`ADMIN ARIELATRA créé : ${arielatraAdmin.email}`);

  // ── CFPE Omega : école avec son seul compte administrateur ─────────────────
  const omegaAdminPassword = await bcrypt.hash(
    resolvePassword("OMEGA_ADMIN_PASSWORD"),
    12,
  );

  const omegaSchool = await prisma.school.upsert({
    where: { tenantKey: "cfpe-omega" },
    update: {},
    create: {
      nom: "CFPE Omega",
      tenantKey: "cfpe-omega",
    },
  });
  console.log(`École CFPE Omega créée : ${omegaSchool.nom} (${omegaSchool.id})`);

  const omegaAdmin = await prisma.user.upsert({
    where: { email: "admin.omega@school.local" },
    update: {
      password: omegaAdminPassword,
      schoolId: omegaSchool.id,
      role: "ADMIN",
    },
    create: {
      email: "admin.omega@school.local",
      password: omegaAdminPassword,
      nom: "OMEGA",
      prenom: "Admin",
      role: "ADMIN",
      schoolId: omegaSchool.id,
    },
  });
  console.log(`ADMIN CFPE Omega créé : ${omegaAdmin.email}`);

  // Compte PROF : peut se connecter et saisir des notes
  const profPassword = await bcrypt.hash(resolvePassword("PROF_PASSWORD"), 12);
  const profUser = await prisma.user.upsert({
    where: { email: "prof.rakoto@school.local" },
    update: { password: profPassword },
    create: {
      email: "prof.rakoto@school.local",
      password: profPassword,
      nom: "Rakoto",
      prenom: "Jean",
      role: "PROF",
      schoolId: school.id,
    },
  });
  console.log(`PROF créé : ${profUser.email}`);

  // ── B. Création des classes ───────────────────────────────────────────────
  const classe6A = await prisma.classe.upsert({
    where: { schoolId_nom: { schoolId: school.id, nom: "6ème A" } },
    update: {},
    create: {
      nom: "6ème A",
      schoolId: school.id,
    },
  });

  const classe5B = await prisma.classe.upsert({
    where: { schoolId_nom: { schoolId: school.id, nom: "5ème B" } },
    update: {},
    create: {
      nom: "5ème B",
      schoolId: school.id,
    },
  });

  // ── D. Création des élèves ────────────────────────────────────────────────
  // On génère le matricule par école, comme dans la logique de création métier,
  // pour éviter les collisions entre écoles et conserver un identifiant cohérent.
  const lastMatricule = await prisma.eleve.findFirst({
    where: { schoolId: school.id },
    orderBy: { matricule: "desc" },
    select: { matricule: true },
  });
  const baseMatricule = lastMatricule?.matricule ?? 0;

  const elevesData = [
    { nom: "Randria", prenom: "Jean Jacques", classeId: classe6A.id },
    { nom: "Sitraka", prenom: "Jean Dauphin", classeId: classe6A.id },
    { nom: "Soa", prenom: "Jean De Dieu", classeId: classe5B.id },
  ];
  for (const [index, e] of elevesData.entries()) {
    const existingEleve = await prisma.eleve.findFirst({
      where: {
        schoolId: school.id,
        nom: e.nom,
        prenom: e.prenom,
      },
    });

    if (!existingEleve) {
      await prisma.eleve.create({
        data: {
          ...e,
          matricule: baseMatricule + index + 1,
          schoolId: school.id,
        },
      });
    }
  }

  // ── E. Création des matières ───────────────────────────────────────────────
  const matieresMath = await prisma.matiere.upsert({
    where: { classeId_nom: { classeId: classe6A.id, nom: "Mathématiques" } },
    update: {},
    create: {
      nom: "Mathématiques",
      classeId: classe6A.id,
      schoolId: school.id,
    },
  });
  const matieresPhysique = await prisma.matiere.upsert({
    where: { classeId_nom: { classeId: classe6A.id, nom: "Physique" } },
    update: {},
    create: { nom: "Physique", classeId: classe6A.id, schoolId: school.id },
  });
  const matieresChimie = await prisma.matiere.upsert({
    where: { classeId_nom: { classeId: classe5B.id, nom: "Chimie" } },
    update: {},
    create: { nom: "Chimie", classeId: classe5B.id, schoolId: school.id },
  });

  // ── C. Création d'un professeur (Multi-classes) lié au compte User ────────
  // Le prof enseigne Maths + Physique en 6ème A, et aussi en 5ème B
  await prisma.professeur.upsert({
    where: {
      schoolId_nom_prenom: {
        schoolId: school.id,
        nom: "Rakoto",
        prenom: "Jean",
      },
    },
    update: {
      userId: profUser.id,
      classes: { connect: [{ id: classe6A.id }, { id: classe5B.id }] },
      matieres: {
        connect: [
          { id: matieresMath.id },
          { id: matieresPhysique.id },
          { id: matieresChimie.id },
        ],
      },
    },
    create: {
      nom: "Rakoto",
      prenom: "Jean",
      schoolId: school.id,
      userId: profUser.id,
      classes: { connect: [{ id: classe6A.id }, { id: classe5B.id }] },
      matieres: {
        connect: [
          { id: matieresMath.id },
          { id: matieresPhysique.id },
          { id: matieresChimie.id },
        ],
      },
    },
  });
  console.log("Professeur Rakoto lié au compte prof et aux matières.");

  console.log("Seed terminé !");
}

process.on("uncaughtException", (e) => {
  console.error("Uncaught exception:", e?.message ?? String(e));
  console.error("Stack:", e?.stack);
  process.exit(1);
});

main()
  .catch((e) => {
    console.error("Seed error:", e?.message ?? String(e));
    console.error("Stack:", e?.stack);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
