import WhatsappCreateForm from "@/components/admin/whatsapp/create-form";
import { prisma } from "@/lib/prisma";

export default async function WhatsappCreatePage() {
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
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create WhatsApp</h1>
      </div>
      <WhatsappCreateForm properties={properties} />
    </div>
  );
}
