/*
  Warnings:

  - A unique constraint covering the columns `[classeId,nom]` on the table `Matiere` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Matiere_schoolId_nom_key";

-- CreateIndex
CREATE UNIQUE INDEX "Matiere_classeId_nom_key" ON "Matiere"("classeId", "nom");
