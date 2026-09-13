-- CreateEnum
CREATE TYPE "Measure" AS ENUM ('COUNT', 'WEIGHT');

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "measure" "Measure" NOT NULL DEFAULT 'COUNT';
