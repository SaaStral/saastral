/*
  Warnings:

  - You are about to drop the column `notification_channel` on the `alerts` table. All the data in the column will be lost.
  - You are about to drop the column `notification_sent_at` on the `alerts` table. All the data in the column will be lost.
  - You are about to alter the column `potential_savings` on the `alerts` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `BigInt`.
  - You are about to alter the column `total_cost` on the `cost_history` table. The data in that column could be lost. The data in that column will be cast from `Decimal(14,2)` to `BigInt`.
  - You are about to alter the column `potential_savings` on the `cost_history` table. The data in that column could be lost. The data in that column will be cast from `Decimal(14,2)` to `BigInt`.
  - You are about to alter the column `realized_savings` on the `cost_history` table. The data in that column could be lost. The data in that column will be cast from `Decimal(14,2)` to `BigInt`.
  - You are about to alter the column `monthly_saas_cost` on the `employees` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `BigInt`.
  - You are about to alter the column `price_per_unit` on the `subscriptions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `BigInt`.
  - You are about to alter the column `total_monthly_cost` on the `subscriptions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `BigInt`.
  - You are about to alter the column `annual_value` on the `subscriptions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(14,2)` to `BigInt`.
  - You are about to alter the column `original_price` on the `subscriptions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `BigInt`.

*/
-- AlterTable
ALTER TABLE "alerts" DROP COLUMN "notification_channel",
DROP COLUMN "notification_sent_at",
ALTER COLUMN "potential_savings" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "cost_history" ALTER COLUMN "total_cost" SET DATA TYPE BIGINT,
ALTER COLUMN "potential_savings" SET DATA TYPE BIGINT,
ALTER COLUMN "realized_savings" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "employees" ALTER COLUMN "monthly_saas_cost" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "subscriptions" ALTER COLUMN "price_per_unit" SET DATA TYPE BIGINT,
ALTER COLUMN "total_monthly_cost" SET DATA TYPE BIGINT,
ALTER COLUMN "annual_value" SET DATA TYPE BIGINT,
ALTER COLUMN "original_price" SET DATA TYPE BIGINT;
