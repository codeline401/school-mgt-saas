-- CreateEnum
CREATE TYPE "StatutAjournement" AS ENUM ('EN_ATTENTE', 'ACCEPTE', 'REFUSE', 'CONTRE_PROPOSITION', 'CONTRE_PROPOSITION_ACCEPTE', 'CONTRE_PROPOSITION_REFUSE', 'ANNULE');

-- CreateTable
CREATE TABLE "Ajournement" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "motif" TEXT NOT NULL,
    "statut" "StatutAjournement" NOT NULL DEFAULT 'EN_ATTENTE',
    "commentaireAdmin" TEXT,
    "traiteParId" TEXT,
    "dateDecision" TIMESTAMP(3),
    "dateReponseParent" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ajournement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AjournementLigne" (
    "id" TEXT NOT NULL,
    "ajournementId" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "ecolageId" TEXT NOT NULL,
    "dateEcheanceOrigine" TIMESTAMP(3) NOT NULL,
    "dateDemandee" TIMESTAMP(3) NOT NULL,
    "dateProposee" TIMESTAMP(3),
    "dateAppliquee" TIMESTAMP(3),
    "estAcvtive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AjournementLigne_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ajournement_schoolId_statut_idx" ON "Ajournement"("schoolId", "statut");

-- CreateIndex
CREATE INDEX "Ajournement_parentId_idx" ON "Ajournement"("parentId");

-- CreateIndex
CREATE INDEX "Ajournement_traiteParId_idx" ON "Ajournement"("traiteParId");

-- CreateIndex
CREATE INDEX "AjournementLigne_ajournementId_idx" ON "AjournementLigne"("ajournementId");

-- CreateIndex
CREATE INDEX "AjournementLigne_eleveId_idx" ON "AjournementLigne"("eleveId");

-- CreateIndex
CREATE INDEX "AjournementLigne_ecolageId_idx" ON "AjournementLigne"("ecolageId");

-- AddForeignKey
ALTER TABLE "Ajournement" ADD CONSTRAINT "Ajournement_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ajournement" ADD CONSTRAINT "Ajournement_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ajournement" ADD CONSTRAINT "Ajournement_traiteParId_fkey" FOREIGN KEY ("traiteParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AjournementLigne" ADD CONSTRAINT "AjournementLigne_ajournementId_fkey" FOREIGN KEY ("ajournementId") REFERENCES "Ajournement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AjournementLigne" ADD CONSTRAINT "AjournementLigne_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AjournementLigne" ADD CONSTRAINT "AjournementLigne_ecolageId_fkey" FOREIGN KEY ("ecolageId") REFERENCES "Ecolage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
