/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Professeur` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Professeur" ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "_ProfesseurMatieres" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProfesseurMatieres_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ProfesseurMatieres_B_index" ON "_ProfesseurMatieres"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Professeur_userId_key" ON "Professeur"("userId");

-- CreateIndex
CREATE INDEX "Professeur_userId_idx" ON "Professeur"("userId");

-- AddForeignKey
ALTER TABLE "Professeur" ADD CONSTRAINT "Professeur_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfesseurMatieres" ADD CONSTRAINT "_ProfesseurMatieres_A_fkey" FOREIGN KEY ("A") REFERENCES "Matiere"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfesseurMatieres" ADD CONSTRAINT "_ProfesseurMatieres_B_fkey" FOREIGN KEY ("B") REFERENCES "Professeur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
