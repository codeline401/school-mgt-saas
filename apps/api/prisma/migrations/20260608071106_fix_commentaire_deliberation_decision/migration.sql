/*
  Warnings:

  - You are about to drop the column `commetaire` on the `DeliberationDecision` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DeliberationDecision" DROP COLUMN "commetaire",
ADD COLUMN     "commentaire" TEXT;
