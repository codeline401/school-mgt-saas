-- CreateTable
CREATE TABLE "BulletinTemplate" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulletinTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BulletinTemplate_schoolId_key" ON "BulletinTemplate"("schoolId");

-- CreateIndex
CREATE INDEX "BulletinTemplate_schoolId_idx" ON "BulletinTemplate"("schoolId");

-- AddForeignKey
ALTER TABLE "BulletinTemplate" ADD CONSTRAINT "BulletinTemplate_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
