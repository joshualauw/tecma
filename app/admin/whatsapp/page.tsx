import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import WhatsappDataTable from "@/components/admin/whatsapp/data-table";

export default async function WhatsappPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">WhatsApp</h1>
        </div>
        <Link href="/admin/whatsapp/create">
          <Button className="w-full md:w-auto shadow-sm">
            <Plus className="h-4 w-4" /> Add WhatsApp
          </Button>
        </Link>
      </div>

      <WhatsappDataTable />
    </div>
  );
}
