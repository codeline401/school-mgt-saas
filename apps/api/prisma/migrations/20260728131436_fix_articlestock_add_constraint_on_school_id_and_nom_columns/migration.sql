/*
  Warnings:

  - A unique constraint covering the columns `[schoolId,nom]` on the table `ArticleStock` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ArticleStock_schoolId_nom_key" ON "ArticleStock"("schoolId", "nom");
