-- CreateEnum
CREATE TYPE "TypeSuiviSante" AS ENUM ('ALLERGIE', 'VISITE_MEDICALE', 'SOIN', 'MALADIE', 'ACCIDENT');

-- CreateEnum
CREATE TYPE "GraviteSante" AS ENUM ('FAIBLE', 'MODEREE', 'ELEVEE', 'URGENTE');

-- CreateTable
CREATE TABLE "SuiviSante" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "type" "TypeSuiviSante" NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "gravite" "GraviteSante",
    "dateEvenement" DATE NOT NULL,
    "dateFin" DATE,
    "parentNotifieAt" TIMESTAMP(3),
    "archiveeAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuiviSante_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SuiviSante_schoolId_type_dateEvenement_idx" ON "SuiviSante"("schoolId", "type", "dateEvenement");

-- CreateIndex
CREATE INDEX "SuiviSante_eleveId_archiveeAt_idx" ON "SuiviSante"("eleveId", "archiveeAt");

-- AddForeignKey
ALTER TABLE "SuiviSante" ADD CONSTRAINT "SuiviSante_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuiviSante" ADD CONSTRAINT "SuiviSante_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuiviSante" ADD CONSTRAINT "SuiviSante_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
