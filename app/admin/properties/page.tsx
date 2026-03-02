import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import PropertiesDataTable from "@/components/admin/properties/data-table";

export default function PropertyPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Properties</h1>
        </div>
        <Link href="/admin/properties/create">
          <Button className="w-full md:w-auto shadow-sm">
            <Plus className="h-4 w-4" /> Add Property
          </Button>
        </Link>
      </div>

      <PropertiesDataTable />
    </div>
  );
}
