import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <main className="w-full h-full">
        <AdminHeader />
        <div className="p-4 lg:px-8 max-w-7xl mx-auto space-y-8">{children}</div>
      </main>
    </SidebarProvider>
  );
}
