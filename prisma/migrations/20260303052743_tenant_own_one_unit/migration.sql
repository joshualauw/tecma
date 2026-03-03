/*
  Warnings:

  - You are about to drop the `occupancies` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "occupancies" DROP CONSTRAINT "occupancies_property_id_properties_id_fk";

-- DropForeignKey
ALTER TABLE "occupancies" DROP CONSTRAINT "occupancies_tenant_id_tenants_id_fk";

-- DropForeignKey
ALTER TABLE "occupancies" DROP CONSTRAINT "occupancies_unit_id_units_id_fk";

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "unit_id" INTEGER;

-- DropTable
DROP TABLE "occupancies";

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
