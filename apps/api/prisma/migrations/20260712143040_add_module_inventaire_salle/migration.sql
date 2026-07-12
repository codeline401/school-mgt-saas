-- CreateEnum
CREATE TYPE "TypeSalle" AS ENUM ('COURS', 'LABO_SCIENCE', 'INFORMATIQUE', 'AMPHI', 'REUNION', 'SPORT', 'ADMINISTRATIF', 'AUTRE');

-- CreateEnum
CREATE TYPE "StatutSalle" AS ENUM ('DISPONIBLE', 'MAINTENANCE', 'RESERVEE');

-- CreateTable
CREATE TABLE "Batiment" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "nbEtages" INTEGER NOT NULL DEFAULT 1,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Salle" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "code" TEXT,
    "type" "TypeSalle" NOT NULL DEFAULT 'COURS',
    "etage" INTEGER NOT NULL DEFAULT 0,
    "capacite" INTEGER NOT NULL,
    "pmrAccessible" BOOLEAN NOT NULL DEFAULT true,
    "equipements" JSONB DEFAULT '{}',
    "statut" "StatutSalle" NOT NULL DEFAULT 'DISPONIBLE',
    "batimentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Salle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Batiment_schoolId_idx" ON "Batiment"("schoolId");

-- CreateIndex
CREATE INDEX "Salle_schoolId_idx" ON "Salle"("schoolId");

-- CreateIndex
CREATE INDEX "Salle_schoolId_batimentId_idx" ON "Salle"("schoolId", "batimentId");

-- CreateIndex
CREATE INDEX "Salle_schoolId_type_idx" ON "Salle"("schoolId", "type");

-- CreateIndex
CREATE INDEX "Salle_schoolId_statut_idx" ON "Salle"("schoolId", "statut");

-- AddForeignKey
ALTER TABLE "Batiment" ADD CONSTRAINT "Batiment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Salle" ADD CONSTRAINT "Salle_batimentId_fkey" FOREIGN KEY ("batimentId") REFERENCES "Batiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Salle" ADD CONSTRAINT "Salle_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
