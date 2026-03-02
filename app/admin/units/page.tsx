import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import UnitsDataTable from "@/components/admin/units/data-table";

export default function Units() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Units</h1>
        </div>
        <Link href="/admin/units/create">
          <Button className="w-full md:w-auto shadow-sm">
            <Plus className="h-4 w-4" /> Add Units
          </Button>
        </Link>
      </div>

      <UnitsDataTable />
    </div>
  );
}
