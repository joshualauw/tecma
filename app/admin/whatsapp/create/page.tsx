import WhatsappCreateForm from "@/components/admin/whatsapp/create-form";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { forbidden, unauthorized } from "next/navigation";
import { isSuperAdmin } from "@/lib/utils";

export default async function WhatsappCreatePage() {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (!isSuperAdmin(user)) {
    forbidden();
  }

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create WhatsApp</h1>
      </div>
      <WhatsappCreateForm />
    </div>
  );
}
