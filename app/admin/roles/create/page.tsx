import RoleCreateForm from "@/components/admin/roles/create-form";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { forbidden, unauthorized } from "next/navigation";
import { isSuperAdmin } from "@/lib/helpers/permission";

export default async function RoleCreatePage() {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (!isSuperAdmin(user)) {
    forbidden();
  }

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Role</h1>
      </div>
      <RoleCreateForm />
    </div>
  );
}
