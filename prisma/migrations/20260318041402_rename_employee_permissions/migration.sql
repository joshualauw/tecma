/*
  Warnings:

  - You are about to drop the `employee_properties` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "employee_properties" DROP CONSTRAINT "employee_properties_employee_id_employees_id_fk";

-- DropForeignKey
ALTER TABLE "employee_properties" DROP CONSTRAINT "employee_properties_property_id_properties_id_fk";

-- DropTable
DROP TABLE "employee_properties";

-- CreateTable
CREATE TABLE "employee_permissions" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "property_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_permissions_employee_id_property_id_key" ON "employee_permissions"("employee_id", "property_id");

-- AddForeignKey
ALTER TABLE "employee_permissions" ADD CONSTRAINT "employee_permissions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee_permissions" ADD CONSTRAINT "employee_permissions_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
