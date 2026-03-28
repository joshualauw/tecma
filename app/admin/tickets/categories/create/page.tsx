import TicketCategoryCreateForm from "@/components/admin/tickets/categories/create-form";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { hasPermissions } from "@/lib/helpers/permission";
import { forbidden, unauthorized } from "next/navigation";

export default async function TicketCategoryCreatePage() {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (!hasPermissions(user, "tickets-categories:create")) {
    forbidden();
  }

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Ticket Category</h1>
      </div>
      <TicketCategoryCreateForm />
    </div>
  );
}
