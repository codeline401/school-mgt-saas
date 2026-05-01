-- ============================================================
-- Corrective migration for admin module
-- ============================================================

-- 1. Add missing timestamp columns to Parent (added in schema but missing from initial migration)
--    updatedAt has no DB default — Prisma's @updatedAt manages it at the application layer
ALTER TABLE "Parent" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Parent" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
-- Drop the spurious DB default so only Prisma controls the value going forward
ALTER TABLE "Parent" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- 3. Add CHECK constraint to Contrat: exactly one of professeurId or userId must be set
DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Contrat_exactly_one_target_chk'
  ) THEN
    -- Optionally fix violating rows first, or use NOT VALID to defer validation
    ALTER TABLE "Contrat" ADD CONSTRAINT "Contrat_exactly_one_target_chk"
      CHECK (
        (CASE WHEN "professeurId" IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN "userId" IS NOT NULL THEN 1 ELSE 0 END) = 1
      );
  END IF;
END $;
-- 3. Upgrade Contrat person check to exactly-one (XOR) constraint
-- Drop the weaker "at least one" constraint added in the initial migration first
ALTER TABLE "Contrat" DROP CONSTRAINT IF EXISTS "Contrat_person_check";

-- Re-add as a strict exactly-one constraint: professeurId XOR userId must be set
ALTER TABLE "Contrat" ADD CONSTRAINT "Contrat_exactly_one_target_chk"
  CHECK (
    (CASE WHEN "professeurId" IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN "userId" IS NOT NULL THEN 1 ELSE 0 END) = 1
  );
