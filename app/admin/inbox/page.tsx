import InboxContainer from "@/components/admin/inbox/container";
import { prisma } from "@/lib/prisma";

export default async function InboxPage() {
  const properties = await prisma.properties.findMany({
    select: {
      id: true,
      name: true,
    },
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
