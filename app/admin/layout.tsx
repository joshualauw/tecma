import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { AuthProvider } from "@/components/admin/providers/auth-context";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { auth } from "@/lib/auth";
import { unauthorized } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  return (
    <AuthProvider user={user}>
      <SidebarProvider>
        <AdminSidebar />
        <main className="w-full h-full">
          <AdminHeader />
          <div className="p-4 lg:px-8 max-w-7xl mx-auto space-y-8">{children}</div>
        </main>
      </SidebarProvider>
    </AuthProvider>
  );
}
