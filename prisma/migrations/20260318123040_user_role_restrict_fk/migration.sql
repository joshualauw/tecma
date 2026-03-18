-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_role_id_roles_id_fk";

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
