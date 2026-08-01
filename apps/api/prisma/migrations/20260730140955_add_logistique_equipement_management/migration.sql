-- CreateEnum
CREATE TYPE "CategorieEquipement" AS ENUM ('AUDIOVISUEL', 'INFORMATIQUE', 'SPORT', 'LABORATOIRE', 'MOBILIER', 'OUTILLAGE', 'AUTRE');

-- CreateEnum
CREATE TYPE "EtatEquipement" AS ENUM ('NEUF', 'BON', 'MOYEN', 'MAUVAIS', 'HORS_SERVICE');

-- CreateEnum
CREATE TYPE "TypeEmprunteur" AS ENUM ('PROF', 'ELEVE', 'PERSONNEL', 'EXTERNE');

-- CreateEnum
CREATE TYPE "StatutPret" AS ENUM ('EN_COURS', 'RETOURNE', 'EN_RETARD', 'PERDU');

-- CreateTable
CREATE TABLE "Equipement" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "reference" TEXT,
    "numeroSerie" TEXT,
    "categorie" "CategorieEquipement" NOT NULL,
    "etat" "EtatEquipement" NOT NULL,
    "description" TEXT,
    "valeur" DOUBLE PRECISION,
    "dateAcquisition" TIMESTAMP(3),
    "emplacement" TEXT,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PretEquipement" (
    "id" TEXT NOT NULL,
    "equipementId" TEXT NOT NULL,
    "emprunterType" "TypeEmprunteur" NOT NULL,
    "emprunterNom" TEXT NOT NULL,
    "emprunterId" TEXT,
    "datePret" TIMESTAMP(3) NOT NULL,
    "dateRetourPrevue" TIMESTAMP(3) NOT NULL,
    "dateRetourEffective" TIMESTAMP(3),
    "statut" "StatutPret" NOT NULL DEFAULT 'EN_COURS',
    "motif" TEXT,
    "observations" TEXT,
    "etatRetour" "EtatEquipement",
    "pretParId" TEXT NOT NULL,
    "retourParId" TEXT,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PretEquipement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Equipement_schoolId_numeroSerie_key" ON "Equipement"("schoolId", "numeroSerie");

-- CreateIndex
CREATE INDEX "Equipement_schoolId_idx" ON "Equipement"("schoolId");

-- CreateIndex
CREATE INDEX "Equipement_categorie_idx" ON "Equipement"("categorie");

-- CreateIndex
CREATE INDEX "Equipement_etat_idx" ON "Equipement"("etat");

-- CreateIndex
CREATE INDEX "PretEquipement_equipementId_idx" ON "PretEquipement"("equipementId");

-- CreateIndex
CREATE INDEX "PretEquipement_schoolId_idx" ON "PretEquipement"("schoolId");

-- CreateIndex
CREATE INDEX "PretEquipement_statut_idx" ON "PretEquipement"("statut");

-- CreateIndex
CREATE INDEX "PretEquipement_datePret_idx" ON "PretEquipement"("datePret");

-- AddForeignKey
ALTER TABLE "Equipement" ADD CONSTRAINT "Equipement_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PretEquipement" ADD CONSTRAINT "PretEquipement_equipementId_fkey" FOREIGN KEY ("equipementId") REFERENCES "Equipement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PretEquipement" ADD CONSTRAINT "PretEquipement_pretParId_fkey" FOREIGN KEY ("pretParId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PretEquipement" ADD CONSTRAINT "PretEquipement_retourParId_fkey" FOREIGN KEY ("retourParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PretEquipement" ADD CONSTRAINT "PretEquipement_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
