import PropertyCreateForm from "@/components/admin/properties/create-form";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/permission";
import { forbidden, unauthorized } from "next/navigation";
import { hasPermissions } from "@/lib/utils";

export default async function PropertyCreatePage() {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (!hasPermissions(user, "properties:create")) {
    forbidden();
  }

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Property</h1>
      </div>
      <PropertyCreateForm />
    </div>
  );
}
