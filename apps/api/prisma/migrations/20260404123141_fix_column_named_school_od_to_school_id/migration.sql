/*
  Warnings:

  - You are about to drop the column `schoolOd` on the `Professeur` table. All the data in the column will be lost.
  - Added the required column `schoolId` to the `Professeur` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Professeur" DROP CONSTRAINT "Professeur_schoolOd_fkey";

-- AlterTable
ALTER TABLE "Professeur" DROP COLUMN "schoolOd",
ADD COLUMN     "schoolId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Professeur" ADD CONSTRAINT "Professeur_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
