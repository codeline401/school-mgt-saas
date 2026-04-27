/*
  Warnings:

  - A unique constraint covering the columns `[inviteCode]` on the table `School` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "School" ADD COLUMN     "inviteCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "School_inviteCode_key" ON "School"("inviteCode");
