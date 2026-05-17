-- CreateEnum
CREATE TYPE "JourSemaine" AS ENUM ('LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE');

-- CreateTable
CREATE TABLE "CreneauHoraire" (
    "id" TEXT NOT NULL,
    "classeId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "jour" "JourSemaine" NOT NULL,
    "heureDebut" TEXT NOT NULL,
    "heureFin" TEXT NOT NULL,
    "intutile" TEXT,
    "matiereId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreneauHoraire_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreneauHoraire_schoolId_idx" ON "CreneauHoraire"("schoolId");

-- CreateIndex
CREATE INDEX "CreneauHoraire_classeId_idx" ON "CreneauHoraire"("classeId");

-- CreateIndex
CREATE UNIQUE INDEX "CreneauHoraire_classeId_jour_heureDebut_heureFin_key" ON "CreneauHoraire"("classeId", "jour", "heureDebut", "heureFin");

-- AddForeignKey
ALTER TABLE "CreneauHoraire" ADD CONSTRAINT "CreneauHoraire_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreneauHoraire" ADD CONSTRAINT "CreneauHoraire_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreneauHoraire" ADD CONSTRAINT "CreneauHoraire_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "Matiere"("id") ON DELETE SET NULL ON UPDATE CASCADE;
