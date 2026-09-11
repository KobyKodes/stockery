-- DropIndex
DROP INDEX "Location_name_key";

-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE INDEX "Location_parentId_sortOrder_idx" ON "Location"("parentId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Location_parentId_name_key" ON "Location"("parentId", "name");

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

