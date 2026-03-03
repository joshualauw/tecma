import WhatsappUpdateForm from "@/components/admin/whatsapp/update-form";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface WhatsappUpdatePageProps {
  params: Promise<{ id: string }>;
}

export default async function WhatsappUpdatePage({ params }: WhatsappUpdatePageProps) {
  const { id } = await params;
  const whatsappId = Number(id);

  if (!Number.isInteger(whatsappId) || whatsappId <= 0) {
    notFound();
  }

  const whatsapp = await prisma.whatsapp.findUnique({
    where: {
      id: whatsappId,
    },
    select: {
      id: true,
      display_name: true,
      waba_id: true,
      phone_id: true,
      phone_number: true,
      property_id: true,
    },
  });

  if (!whatsapp) {
    notFound();
  }

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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Update WhatsApp</h1>
      </div>
      <WhatsappUpdateForm
        data={{
          id: whatsapp.id,
          displayName: whatsapp.display_name,
          wabaId: whatsapp.waba_id,
          phoneId: whatsapp.phone_id,
          phoneNumber: whatsapp.phone_number,
          propertyId: whatsapp.property_id,
        }}
        properties={properties}
      />
    </div>
  );
}
