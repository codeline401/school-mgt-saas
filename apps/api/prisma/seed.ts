import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Début du seed...");

  // A. Création de l'école (TENANT)
  const school = await prisma.school.create({
    data: {
      nom: "Idéale School Tanjombato",
    },
  });

  // B. Création des classes
  const classe6A = await prisma.classe.create({
    data: {
      nom: "6ème A",
      schoolId: school.id, // Association à l'école créée
    },
  });

  const classe5B = await prisma.classe.create({
    data: {
      nom: "5ème B",
      schoolId: school.id, // Association à l'école créée
    },
  });

  // C. Création d'un professeur (Multi-classes)
  await prisma.professeur.create({
    data: {
      nom: "M. Rakoto",
      prenom: "Rakoto",
      schoolId: school.id,
      classes: {
        connect: [{ id: classe6A.id }, { id: classe5B.id }],
      },
    },
  });

  // D. Création des élèves (1 seule classe par élève)
  await prisma.eleve.createMany({
    data: [
      {
        nom: "Randria",
        prenom: "Jean Jacques",
        schoolId: school.id,
        classeId: classe6A.id,
      },
      {
        nom: "Sitraka",
        prenom: "Jean Dauphin",
        schoolId: school.id,
        classeId: classe6A.id,
      },
      {
        nom: "Soa",
        prenom: "Jean De Dieu",
        schoolId: school.id,
        classeId: classe5B.id,
      },
    ],
  });

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
