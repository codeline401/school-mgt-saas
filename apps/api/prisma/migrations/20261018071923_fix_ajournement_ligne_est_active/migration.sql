/*
  Warnings:

  - You are about to drop the column `estAcvtive` on the `AjournementLigne` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AjournementLigne" DROP COLUMN "estAcvtive",
ADD COLUMN     "estActive" BOOLEAN NOT NULL DEFAULT true;
