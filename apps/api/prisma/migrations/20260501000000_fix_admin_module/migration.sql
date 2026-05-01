-- ============================================================
-- Corrective migration for admin module
-- ============================================================

-- 1. Add missing timestamp columns to Parent (added in schema but missing from initial migration)
ALTER TABLE "Parent" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Parent" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 2. Remove stray userId column from Remplacement (was added by mistake in migration 20260428043030)
ALTER TABLE "Remplacement" DROP COLUMN IF EXISTS "userId";

-- 3. Add CHECK constraint to Contrat: exactly one of professeurId or userId must be set
ALTER TABLE "Contrat" ADD CONSTRAINT "Contrat_exactly_one_target_chk"
  CHECK (
    (CASE WHEN "professeurId" IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN "userId" IS NOT NULL THEN 1 ELSE 0 END) = 1
  );
