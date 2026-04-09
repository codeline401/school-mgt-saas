/*
  Warnings:

  - Made the column `inviteCode` on table `School` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "School" ALTER COLUMN "inviteCode" SET NOT NULL;
