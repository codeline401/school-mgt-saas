-- CreateEnum
CREATE TYPE "TypeRegleAlerte" AS ENUM ('ABSENCES', 'ABSENCES_NON_JUSTIFIEES', 'RETARDS', 'TAUX_PRESENCE');

-- CreateEnum
CREATE TYPE "DestinataireAlerte" AS ENUM ('ADMIN', 'PARENT', 'PROFESSEUR_PRINCIPAL');

-- CreateTable
CREATE TABLE "RegleAlerte" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeRegleAlerte" NOT NULL,
    "periodeJours" INTEGER NOT NULL DEFAULT 30,
    "classeId" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegleAlerte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PalierAlerte" (
    "id" TEXT NOT NULL,
    "regleId" TEXT NOT NULL,
    "seuil" DOUBLE PRECISION NOT NULL,
    "destinataire" "DestinataireAlerte"[],
    "message" TEXT,

    CONSTRAINT "PalierAlerte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlerteDeclenchee" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "regleId" TEXT NOT NULL,
    "palierId" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "cycle" TEXT NOT NULL,
    "valeur" DOUBLE PRECISION NOT NULL,
    "nbNotification" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlerteDeclenchee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PalierAlerte_regleId_seuil_key" ON "PalierAlerte"("regleId", "seuil");

-- CreateIndex
CREATE INDEX "AlerteDeclenchee_schoolId_createdAt_idx" ON "AlerteDeclenchee"("schoolId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AlerteDeclenchee_palierId_eleveId_cycle_key" ON "AlerteDeclenchee"("palierId", "eleveId", "cycle");

-- AddForeignKey
ALTER TABLE "RegleAlerte" ADD CONSTRAINT "RegleAlerte_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegleAlerte" ADD CONSTRAINT "RegleAlerte_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegleAlerte" ADD CONSTRAINT "RegleAlerte_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PalierAlerte" ADD CONSTRAINT "PalierAlerte_regleId_fkey" FOREIGN KEY ("regleId") REFERENCES "RegleAlerte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlerteDeclenchee" ADD CONSTRAINT "AlerteDeclenchee_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlerteDeclenchee" ADD CONSTRAINT "AlerteDeclenchee_regleId_fkey" FOREIGN KEY ("regleId") REFERENCES "RegleAlerte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlerteDeclenchee" ADD CONSTRAINT "AlerteDeclenchee_palierId_fkey" FOREIGN KEY ("palierId") REFERENCES "PalierAlerte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlerteDeclenchee" ADD CONSTRAINT "AlerteDeclenchee_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;
