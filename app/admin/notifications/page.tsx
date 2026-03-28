import NotificationsDataList from "@/components/admin/notifications/data-list";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { unauthorized } from "next/navigation";

export default async function NotificationsPage() {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
        </div>
      </div>

      <NotificationsDataList />
    </div>
  );
}
