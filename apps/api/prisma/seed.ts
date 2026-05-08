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
    fs.appendFileSync(envLocalPath, `${envVar}=${generated}\n`, { mode: 0o600 });
    console.warn(`[seed] ${envVar} not set — generated credential written to ${envLocalPath}`);
    console.warn(`[seed] Keep .env.local secure and do not commit it.`);
  } catch {
    console.warn(`[seed] ${envVar} not set — could not persist credential to .env.local. Set ${envVar} in your environment manually.`);
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

  // ── C. Création d'un professeur (Multi-classes) ───────────────────────────
  await prisma.professeur.upsert({
    where: {
      schoolId_nom_prenom: {
        schoolId: school.id,
        nom: "M. Rakoto",
        prenom: "Rakoto",
      },
    },
    update: {},
    create: {
      nom: "M. Rakoto",
      prenom: "Rakoto",
      schoolId: school.id,
      classes: {
        connect: [{ id: classe6A.id }, { id: classe5B.id }],
      },
    },
  });

  // ── D. Création des élèves ────────────────────────────────────────────────
  // createMany ne supporte pas l'upsert, on itère pour être idempotent
  const elevesData = [
    { nom: "Randria", prenom: "Jean Jacques", classeId: classe6A.id },
    { nom: "Sitraka", prenom: "Jean Dauphin", classeId: classe6A.id },
    { nom: "Soa", prenom: "Jean De Dieu", classeId: classe5B.id },
  ];
  for (const e of elevesData) {
    await prisma.eleve.upsert({
      where: {
        schoolId_nom_prenom: {
          schoolId: school.id,
          nom: e.nom,
          prenom: e.prenom,
        },
      },
      update: {},
      create: { ...e, schoolId: school.id },
    });
  }

  // ── E. Création des matières ───────────────────────────────────────────────
  const matieresData = [
    { nom: "Mathématiques", classeId: classe6A.id, schoolId: school.id },
    { nom: "Physique", classeId: classe6A.id, schoolId: school.id },
    { nom: "Chimie", classeId: classe5B.id, schoolId: school.id },
  ];
  for (const m of matieresData) {
    await prisma.matiere.upsert({
      where: {
        classeId_nom: {
          classeId: m.classeId,
          nom: m.nom,
        },
      },
      update: {},
      create: m,
    });
  }

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
