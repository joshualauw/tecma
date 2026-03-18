import RoleCreateForm from "@/components/admin/roles/create-form";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { forbidden, unauthorized } from "next/navigation";

export default async function RoleCreatePage() {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (user.role !== "super-admin") {
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

