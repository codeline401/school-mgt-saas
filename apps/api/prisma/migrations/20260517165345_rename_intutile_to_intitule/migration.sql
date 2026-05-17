/*
  Warnings:

  - You are about to drop the column `intutile` on the `CreneauHoraire` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CreneauHoraire" DROP COLUMN "intutile",
ADD COLUMN     "intitule" TEXT;
