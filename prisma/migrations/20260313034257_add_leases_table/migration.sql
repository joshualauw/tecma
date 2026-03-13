-- CreateEnum
CREATE TYPE "lease_status" AS ENUM ('active', 'expired', 'terminated');

-- CreateTable
CREATE TABLE "leases" (
    "id" SERIAL NOT NULL,
    "property_id" INTEGER NOT NULL,
    "unit_id" INTEGER NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "lease_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leases_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
