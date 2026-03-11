import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Contact2Icon, MailOpenIcon, MapPinIcon, Users2Icon } from "lucide-react";

export type DashboardStatsProps = {
  activeRooms: number;
  propertiesAllTime: number;
  propertiesThisMonth: number;
  tenantsAllTime: number;
  tenantsThisMonth: number;
  employeesAllTime: number;
  employeesThisMonth: number;
};

export default function DashboardStats({
  activeRooms,
  propertiesAllTime,
  propertiesThisMonth,
  tenantsAllTime,
  tenantsThisMonth,
  employeesAllTime,
  employeesThisMonth,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Active rooms"
        value={activeRooms}
        icon={<MailOpenIcon />}
        accent={{
          iconBg: "bg-emerald-500/10 dark:bg-emerald-500/15",
          iconFg: "text-emerald-700 dark:text-emerald-300",
        }}
        subtitle={
          <div className="flex items-center justify-between gap-3">
            <span>Open right now</span>
            <span className="rounded-full border bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              Active
            </span>
          </div>
        }
      />

      <StatCard
        title="Properties"
        value={propertiesAllTime}
        icon={<MapPinIcon />}
        accent={{
          iconBg: "bg-sky-500/10 dark:bg-sky-500/15",
          iconFg: "text-sky-700 dark:text-sky-300",
        }}
        subtitle={
          <div className="flex items-center justify-between gap-3">
            <span>All time</span>
            <span className="tabular-nums text-sky-700 dark:text-sky-300">+{propertiesThisMonth} this month</span>
          </div>
        }
      />

      <StatCard
        title="Tenants"
        value={tenantsAllTime}
        icon={<Contact2Icon />}
        accent={{
          iconBg: "bg-violet-500/10 dark:bg-violet-500/15",
          iconFg: "text-violet-700 dark:text-violet-300",
        }}
        subtitle={
          <div className="flex items-center justify-between gap-3">
            <span>All time</span>
            <span className="tabular-nums text-violet-700 dark:text-violet-300">+{tenantsThisMonth} this month</span>
          </div>
        }
      />

      <StatCard
        title="Employees"
        value={employeesAllTime}
        icon={<Users2Icon />}
        accent={{
          iconBg: "bg-amber-500/10 dark:bg-amber-500/15",
          iconFg: "text-amber-700 dark:text-amber-300",
        }}
        subtitle={
          <div className="flex items-center justify-between gap-3">
            <span>All time</span>
            <span className="tabular-nums text-amber-700 dark:text-amber-300">+{employeesThisMonth} this month</span>
          </div>
        }
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent,
}: {
  title: string;
  value: number | string;
  subtitle?: React.ReactNode;
  icon: React.ReactNode;
  accent: {
    iconBg: string;
    iconFg: string;
  };
}) {
  return (
    <Card className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-2xl" />
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardDescription className="text-xs font-medium tracking-wide uppercase">{title}</CardDescription>
            <CardTitle className="text-3xl tabular-nums tracking-tight">{value}</CardTitle>
          </div>

          <div className={cn("rounded-xl border p-2.5", accent.iconBg)}>
            <div className={cn("[&>svg]:h-5 [&>svg]:w-5", accent.iconFg)}>{icon}</div>
          </div>
        </div>
      </CardHeader>
      {subtitle ? <CardContent className="text-muted-foreground text-sm">{subtitle}</CardContent> : null}
    </Card>
  );
}
