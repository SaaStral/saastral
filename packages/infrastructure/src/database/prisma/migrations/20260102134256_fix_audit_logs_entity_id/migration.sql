/*
  Warnings:

  - You are about to drop the column `entityId` on the `audit_logs` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "audit_logs_entity_type_entityId_created_at_idx";

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "entityId",
ADD COLUMN     "entity_id" TEXT;

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_created_at_idx" ON "audit_logs"("entity_type", "entity_id", "created_at");
