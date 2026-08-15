-- AlterTable
ALTER TABLE "Eleve" ADD COLUMN     "dateInscription" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ecoleOrigine" TEXT,
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "matricule" DROP DEFAULT;
DROP SEQUENCE "Eleve_matricule_seq";

-- CreateTable
CREATE TABLE "DroitInscription" (
    "id" TEXT NOT NULL,
    "anneeScolaire" TEXT NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "eleveId" TEXT NOT NULL,
    "classeId" TEXT,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DroitInscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ecolage" (
    "id" TEXT NOT NULL,
    "anneeScolaire" TEXT NOT NULL,
    "mois" INTEGER NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "eleveId" TEXT NOT NULL,
    "classeId" TEXT,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ecolage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DroitInscription_eleveId_idx" ON "DroitInscription"("eleveId");

-- CreateIndex
CREATE INDEX "DroitInscription_schoolId_idx" ON "DroitInscription"("schoolId");

-- CreateIndex
CREATE INDEX "DroitInscription_classeId_idx" ON "DroitInscription"("classeId");

-- CreateIndex
CREATE UNIQUE INDEX "DroitInscription_eleveId_anneeScolaire_key" ON "DroitInscription"("eleveId", "anneeScolaire");

-- CreateIndex
CREATE INDEX "Ecolage_eleveId_idx" ON "Ecolage"("eleveId");

-- CreateIndex
CREATE INDEX "Ecolage_schoolId_idx" ON "Ecolage"("schoolId");

-- CreateIndex
CREATE INDEX "Ecolage_classeId_idx" ON "Ecolage"("classeId");

-- CreateIndex
CREATE UNIQUE INDEX "Ecolage_eleveId_anneeScolaire_mois_key" ON "Ecolage"("eleveId", "anneeScolaire", "mois");

-- CreateIndex
CREATE INDEX "Eleve_responsableId_idx" ON "Eleve"("responsableId");

-- CreateIndex
CREATE INDEX "Eleve_deletedById_idx" ON "Eleve"("deletedById");

-- AddForeignKey
ALTER TABLE "Eleve" ADD CONSTRAINT "Eleve_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Parent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Eleve" ADD CONSTRAINT "Eleve_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Eleve" ADD CONSTRAINT "Eleve_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DroitInscription" ADD CONSTRAINT "DroitInscription_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DroitInscription" ADD CONSTRAINT "DroitInscription_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DroitInscription" ADD CONSTRAINT "DroitInscription_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ecolage" ADD CONSTRAINT "Ecolage_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ecolage" ADD CONSTRAINT "Ecolage_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ecolage" ADD CONSTRAINT "Ecolage_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
