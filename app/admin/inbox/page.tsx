import InboxChat from "@/components/admin/inbox/inbox-chat";
import { prisma } from "@/lib/prisma";

export default async function InboxPage() {
  const properties = await prisma.properties.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      created_at: "asc",
    },
  });

  return (
    <div className="space-y-6">
      <InboxChat properties={properties} />
    </div>
  );
}
