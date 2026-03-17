import InboxContainer from "@/components/admin/inbox/container";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/permission";
import { prisma } from "@/lib/prisma";
import { hasPermissions } from "@/lib/utils";
import { forbidden, unauthorized } from "next/navigation";

export default async function InboxPage() {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (!hasPermissions(user, "inbox:view")) {
    forbidden();
  }

  const properties = await prisma.properties.findMany({
    select: {
      id: true,
      name: true,
    },
    where: user.role === "super-admin" ? undefined : { id: { in: user.allowedProperties } },
    orderBy: {
      createdAt: "asc",
    },
  });

  return (
    <div className="space-y-6">
      <InboxContainer properties={properties} />
    </div>
  );
}
