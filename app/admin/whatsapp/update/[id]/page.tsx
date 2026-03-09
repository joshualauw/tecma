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
      displayName: true,
      wabaId: true,
      phoneId: true,
      phoneNumber: true,
    },
  });

  if (!whatsapp) {
    notFound();
  }

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Update WhatsApp</h1>
      </div>
      <WhatsappUpdateForm data={whatsapp} />
    </div>
  );
}
