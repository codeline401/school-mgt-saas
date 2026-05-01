import "dotenv/config";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/** Returns the env var value if set; otherwise generates a secure random password and logs it. */
function resolvePassword(envVar: string): string {
  const fromEnv = process.env[envVar];
  if (fromEnv) return fromEnv;
  const generated = crypto.randomBytes(16).toString("hex");
  console.warn(`[seed] ${envVar} not set — generated password: ${generated}`);
  console.warn(
    `[seed] Store this password securely; it will not be shown again.`,
  );
  return generated;
}

async function main() {
  console.log("Début du seed...");

  // ── Comptes système par défaut ────────────────────────────────────────────────────────────────────
  // SUDO_ADMIN : accès global, pas rattaché à une école
  const sudoPassword = await bcrypt.hash(resolvePassword("SUDO_PASSWORD"), 10);
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
    10,
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
    update: {},
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

  console.log("Database seeded successfully! ");
}

main()
  .catch((e) => {
    console.error("Seed error:", e?.message ?? String(e));
    console.error("Stack:", e?.stack);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

process.on("uncaughtException", (e) => {
  console.error("Uncaught exception:", e?.message ?? String(e));
  console.error("Stack:", e?.stack);
  process.exit(1);
});
