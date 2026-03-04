import TicketCategoryCreateForm from "@/components/admin/tickets/categories/create-form";

export default function TicketCategoryCreatePage() {
  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Ticket Category</h1>
      </div>
      <TicketCategoryCreateForm />
    </div>
  );
}
