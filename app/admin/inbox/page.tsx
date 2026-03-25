import InboxContainer from "@/components/admin/inbox/container";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { hasPermissions, propertiesWhereForUser } from "@/lib/utils";
import { forbidden, unauthorized } from "next/navigation";
import { InboxProvider } from "@/components/admin/inbox/providers/inbox-context";

export default async function InboxPage() {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (!hasPermissions(user, "inbox:view")) {
    forbidden();
  }

  const canSend = hasPermissions(user, "inbox:send");
  const canResolve = hasPermissions(user, "inbox:send");
  const canViewTickets = hasPermissions(user, "tickets:view");
  const canCreateTicket = hasPermissions(user, "tickets:create");
  const canEditTicket = hasPermissions(user, "tickets:edit");
  const canViewTicketProgress = hasPermissions(user, "tickets-progress:view");

  const properties = await prisma.properties.findMany({
    select: {
      id: true,
      name: true,
    },
    where: propertiesWhereForUser(user),
    orderBy: {
      createdAt: "asc",
    },
  });

  return (
    <div className="space-y-6">
      <InboxProvider
        properties={properties}
        permissions={{ canSend, canResolve, canViewTickets, canCreateTicket, canEditTicket, canViewTicketProgress }}
      >
        <InboxContainer />
      </InboxProvider>
    </div>
  );
}
