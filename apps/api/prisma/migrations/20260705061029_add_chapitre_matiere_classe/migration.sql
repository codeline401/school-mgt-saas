-- CreateEnum
CREATE TYPE "StatutChapitre" AS ENUM ('A_FAIRE', 'EN_COURS', 'FAIT');

-- CreateTable
CREATE TABLE "Chapitre" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "statut" "StatutChapitre" NOT NULL DEFAULT 'A_FAIRE',
    "classeId" TEXT NOT NULL,
    "matiereId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapitre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SousChapitre" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "statut" "StatutChapitre" NOT NULL DEFAULT 'A_FAIRE',
    "chapitreId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SousChapitre_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Chapitre_classeId_matiereId_idx" ON "Chapitre"("classeId", "matiereId");

-- CreateIndex
CREATE INDEX "SousChapitre_chapitreId_idx" ON "SousChapitre"("chapitreId");

-- AddForeignKey
ALTER TABLE "Chapitre" ADD CONSTRAINT "Chapitre_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapitre" ADD CONSTRAINT "Chapitre_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "Matiere"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapitre" ADD CONSTRAINT "Chapitre_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SousChapitre" ADD CONSTRAINT "SousChapitre_chapitreId_fkey" FOREIGN KEY ("chapitreId") REFERENCES "Chapitre"("id") ON DELETE CASCADE ON UPDATE CASCADE;
