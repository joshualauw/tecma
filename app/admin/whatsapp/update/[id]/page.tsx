import WhatsappUpdateForm from "@/components/admin/whatsapp/update-form";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/permission";
import { prisma } from "@/lib/prisma";
import { hasPermissions } from "@/lib/utils";
import { forbidden, notFound, unauthorized } from "next/navigation";

interface WhatsappUpdatePageProps {
  params: Promise<{ id: string }>;
}

export default async function WhatsappUpdatePage({ params }: WhatsappUpdatePageProps) {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (!hasPermissions(user, "whatsapp:edit")) {
    forbidden();
  }

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
