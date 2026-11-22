-- CreateEnum
CREATE TYPE "StatutAffectationCantine" AS ENUM ('ACTIVE', 'SUSPENDUE', 'TERMINEE');

-- CreateTable
CREATE TABLE "AffectationCantine" (
    "id" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "offreCantineId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "statut" "StatutAffectationCantine" NOT NULL DEFAULT 'ACTIVE',
    "dateDebut" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateFin" DATE,
    "regimeSpecial" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffectationCantine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AffectationCantine_schoolId_statut_idx" ON "AffectationCantine"("schoolId", "statut");

-- CreateIndex
CREATE INDEX "AffectationCantine_eleveId_statut_idx" ON "AffectationCantine"("eleveId", "statut");

-- CreateIndex
CREATE INDEX "AffectationCantine_offreCantineId_idx" ON "AffectationCantine"("offreCantineId");

-- AddForeignKey
ALTER TABLE "AffectationCantine" ADD CONSTRAINT "AffectationCantine_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffectationCantine" ADD CONSTRAINT "AffectationCantine_offreCantineId_fkey" FOREIGN KEY ("offreCantineId") REFERENCES "OffreCantine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffectationCantine" ADD CONSTRAINT "AffectationCantine_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffectationCantine" ADD CONSTRAINT "AffectationCantine_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
