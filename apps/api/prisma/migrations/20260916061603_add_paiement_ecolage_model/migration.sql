-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('ESPECES', 'VIREMENT', 'CHEQUE', 'MOBILE_MONEY');

-- CreateEnum
CREATE TYPE "StatutPaiementEcolage" AS ENUM ('IMPAYE', 'PARTIEL', 'PAYE', 'EN_RETARD');

-- CreateTable
CREATE TABLE "PaiementEcolage" (
    "id" TEXT NOT NULL,
    "numeroReçu" TEXT NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "modePaiement" "ModePaiement" NOT NULL,
    "referencePaiement" TEXT,
    "datePaiement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarque" TEXT,
    "eleveId" TEXT NOT NULL,
    "ecolageId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "PaiementEcolage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaiementEcolage_numeroReçu_key" ON "PaiementEcolage"("numeroReçu");

-- CreateIndex
CREATE INDEX "PaiementEcolage_eleveId_idx" ON "PaiementEcolage"("eleveId");

-- CreateIndex
CREATE INDEX "PaiementEcolage_ecolageId_idx" ON "PaiementEcolage"("ecolageId");

-- CreateIndex
CREATE INDEX "PaiementEcolage_schoolId_idx" ON "PaiementEcolage"("schoolId");

-- CreateIndex
CREATE INDEX "PaiementEcolage_agentId_idx" ON "PaiementEcolage"("agentId");

-- AddForeignKey
ALTER TABLE "PaiementEcolage" ADD CONSTRAINT "PaiementEcolage_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaiementEcolage" ADD CONSTRAINT "PaiementEcolage_ecolageId_fkey" FOREIGN KEY ("ecolageId") REFERENCES "Ecolage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaiementEcolage" ADD CONSTRAINT "PaiementEcolage_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaiementEcolage" ADD CONSTRAINT "PaiementEcolage_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaiementEcolage" ADD CONSTRAINT "PaiementEcolage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
