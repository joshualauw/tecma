import PropertyCreateForm from "@/components/admin/properties/create-form";

export default function PropertyCreatePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Property</h1>
      </div>
      <PropertyCreateForm />
    </div>
  );
}
