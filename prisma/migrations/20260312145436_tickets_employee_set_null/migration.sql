-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_employee_id_employees_id_fk";

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
