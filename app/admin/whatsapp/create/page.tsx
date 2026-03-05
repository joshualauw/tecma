import WhatsappCreateForm from "@/components/admin/whatsapp/create-form";

export default async function WhatsappCreatePage() {
  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create WhatsApp</h1>
      </div>
      <WhatsappCreateForm />
    </div>
  );
}
