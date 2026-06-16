-- CreateEnum
CREATE TYPE "TypePeriode" AS ENUM ('TRIMESTRE', 'SEMESTRE', 'ANNEE');

-- AlterTable
ALTER TABLE "BulletinTemplate" ADD COLUMN     "defaultWatermark" TEXT,
ADD COLUMN     "primaryColor" TEXT;

-- AlterTable
ALTER TABLE "DeliberationSession" ADD COLUMN     "periodeId" TEXT;

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "periodeId" TEXT;

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "devise" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "numAutorisation" TEXT,
ADD COLUMN     "siteWeb" TEXT,
ADD COLUMN     "slogan" TEXT;

-- CreateTable
CREATE TABLE "Periode" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypePeriode" NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "anneeScolaire" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Periode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Periode_schoolId_idx" ON "Periode"("schoolId");

-- CreateIndex
CREATE INDEX "Periode_anneeScolaire_idx" ON "Periode"("anneeScolaire");

-- CreateIndex
CREATE UNIQUE INDEX "Periode_schoolId_nom_anneeScolaire_key" ON "Periode"("schoolId", "nom", "anneeScolaire");

-- CreateIndex
CREATE INDEX "DeliberationSession_periodeId_idx" ON "DeliberationSession"("periodeId");

-- CreateIndex
CREATE INDEX "Note_periodeId_idx" ON "Note"("periodeId");

-- AddForeignKey
ALTER TABLE "Periode" ADD CONSTRAINT "Periode_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_periodeId_fkey" FOREIGN KEY ("periodeId") REFERENCES "Periode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliberationSession" ADD CONSTRAINT "DeliberationSession_periodeId_fkey" FOREIGN KEY ("periodeId") REFERENCES "Periode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
