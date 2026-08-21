-- CreateEnum
CREATE TYPE "TypeAffectation" AS ENUM ('INSCRIPTION', 'TRANSFERT', 'PROMOTION', 'REDOUBLEMENT', 'RETRAIT');

-- AlterTable
ALTER TABLE "Classe" ADD COLUMN     "niveauId" TEXT,
ADD COLUMN     "optionId" TEXT,
ADD COLUMN     "sectionId" TEXT;

-- CreateTable
CREATE TABLE "Niveau" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Niveau_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "niveauId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Option" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffectationClasse" (
    "id" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "ancienneClasseId" TEXT,
    "nouvelleClasseId" TEXT,
    "type" "TypeAffectation" NOT NULL,
    "motif" TEXT,
    "anneeScolaire" TEXT NOT NULL,
    "effectueParId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "AffectationClasse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Niveau_schoolId_idx" ON "Niveau"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Niveau_schoolId_nom_key" ON "Niveau"("schoolId", "nom");

-- CreateIndex
CREATE INDEX "Section_schoolId_idx" ON "Section"("schoolId");

-- CreateIndex
CREATE INDEX "Section_niveauId_idx" ON "Section"("niveauId");

-- CreateIndex
CREATE UNIQUE INDEX "Section_schoolId_nom_niveauId_key" ON "Section"("schoolId", "nom", "niveauId");

-- CreateIndex
CREATE INDEX "Option_schoolId_idx" ON "Option"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Option_schoolId_nom_key" ON "Option"("schoolId", "nom");

-- CreateIndex
CREATE INDEX "AffectationClasse_eleveId_idx" ON "AffectationClasse"("eleveId");

-- CreateIndex
CREATE INDEX "AffectationClasse_schoolId_idx" ON "AffectationClasse"("schoolId");

-- CreateIndex
CREATE INDEX "AffectationClasse_nouvelleClasseId_idx" ON "AffectationClasse"("nouvelleClasseId");

-- CreateIndex
CREATE INDEX "AffectationClasse_anneeScolaire_idx" ON "AffectationClasse"("anneeScolaire");

-- AddForeignKey
ALTER TABLE "Classe" ADD CONSTRAINT "Classe_niveauId_fkey" FOREIGN KEY ("niveauId") REFERENCES "Niveau"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classe" ADD CONSTRAINT "Classe_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classe" ADD CONSTRAINT "Classe_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Niveau" ADD CONSTRAINT "Niveau_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_niveauId_fkey" FOREIGN KEY ("niveauId") REFERENCES "Niveau"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffectationClasse" ADD CONSTRAINT "AffectationClasse_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffectationClasse" ADD CONSTRAINT "AffectationClasse_ancienneClasseId_fkey" FOREIGN KEY ("ancienneClasseId") REFERENCES "Classe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffectationClasse" ADD CONSTRAINT "AffectationClasse_nouvelleClasseId_fkey" FOREIGN KEY ("nouvelleClasseId") REFERENCES "Classe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffectationClasse" ADD CONSTRAINT "AffectationClasse_effectueParId_fkey" FOREIGN KEY ("effectueParId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffectationClasse" ADD CONSTRAINT "AffectationClasse_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffectationClasse" ADD CONSTRAINT "AffectationClasse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
