/*
  Warnings:

  - You are about to drop the column `unit_id` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the column `tenant_id` on the `tickets` table. All the data in the column will be lost.
  - Added the required column `lease_id` to the `tickets` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "tenants" DROP CONSTRAINT "tenants_unit_id_units_id_fk";

-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_tenant_id_tenants_id_fk";

-- AlterTable
ALTER TABLE "tenants" DROP COLUMN "unit_id";

-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "tenant_id",
ADD COLUMN     "lease_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "leases"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
