import { RoomStatus, TicketStatus } from "@/generated/prisma/enums";
import dayjs from "@/lib/dayjs";
import { prisma } from "@/lib/prisma";
import DashboardStats from "@/components/admin/dashboard/stats";
import DashboardTicketChart from "@/components/admin/dashboard/ticket-chart";
import DashboardMessageChart from "@/components/admin/dashboard/message-chart";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions } from "@/lib/utils";
import { forbidden, redirect, unauthorized } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (!hasPermissions(user, "dashboard:view")) {
    if (user.permissions.length === 0) {
      forbidden();
    } else {
      const permission = user.permissions[0].split(":")[0];
      redirect(`/admin/${permission}`);
    }
  }

  const startOfMonth = dayjs().startOf("month").toDate();
  const startOfLast14Days = dayjs().subtract(13, "day").startOf("day").toDate();

  const [
    activeRooms,
    propertiesAllTime,
    propertiesThisMonth,
    tenantsAllTime,
    tenantsThisMonth,
    employeesAllTime,
    employeesThisMonth,
  ] = await Promise.all([
    prisma.rooms.count({ where: { status: RoomStatus.active } }),
    prisma.properties.count(),
    prisma.properties.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.tenants.count(),
    prisma.tenants.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.employees.count(),
    prisma.employees.count({ where: { createdAt: { gte: startOfMonth } } }),
  ]);

  const [ticketsOpenNow, ticketsClosedNow, ticketsInProgressThisMonth] = await Promise.all([
    prisma.tickets.count({ where: { status: TicketStatus.open, createdAt: { gte: startOfMonth } } }),
    prisma.tickets.count({ where: { status: TicketStatus.closed, createdAt: { gte: startOfMonth } } }),
    prisma.tickets.count({ where: { status: TicketStatus.in_progress, createdAt: { gte: startOfMonth } } }),
  ]);

  const messagesLast14Days = await prisma.messages.findMany({
    where: { createdAt: { gte: startOfLast14Days } },
    select: { createdAt: true, senderType: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <DashboardStats
        activeRooms={activeRooms}
        propertiesAllTime={propertiesAllTime}
        propertiesThisMonth={propertiesThisMonth}
        tenantsAllTime={tenantsAllTime}
        tenantsThisMonth={tenantsThisMonth}
        employeesAllTime={employeesAllTime}
        employeesThisMonth={employeesThisMonth}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <DashboardTicketChart
            openNow={ticketsOpenNow}
            closedNow={ticketsClosedNow}
            inProgressThisMonth={ticketsInProgressThisMonth}
          />
        </div>

        <div className="lg:col-span-8">
          <DashboardMessageChart messages={messagesLast14Days} />
        </div>
      </div>
    </div>
  );
}
