/*
  Warnings:

  - You are about to drop the column `numeroReçu` on the `PaiementEcolage` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[numeroRecu]` on the table `PaiementEcolage` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `numeroRecu` to the `PaiementEcolage` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "PaiementEcolage_numeroReçu_key";

-- AlterTable
ALTER TABLE "PaiementEcolage" DROP COLUMN "numeroReçu",
ADD COLUMN     "numeroRecu" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PaiementEcolage_numeroRecu_key" ON "PaiementEcolage"("numeroRecu");
