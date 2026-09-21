/*
  Warnings:

  - A unique constraint covering the columns `[schoolId,idempotencyKey]` on the table `PaiementEcolage` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PaiementEcolage" ADD COLUMN     "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PaiementEcolage_schoolId_idempotencyKey_key" ON "PaiementEcolage"("schoolId", "idempotencyKey");
