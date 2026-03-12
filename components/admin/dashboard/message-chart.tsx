"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { SenderType } from "@/generated/prisma/enums";
import dayjs from "@/lib/dayjs";
import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

export type DashboardMessageChartProps = {
  messages: Array<{
    createdAt: Date | string;
    senderType: SenderType;
  }>;
};

const chartConfig = {
  tenant: { label: "Tenant", color: "var(--chart-1)" },
  employee: { label: "Employee", color: "var(--chart-2)" },
  bot: { label: "Bot", color: "var(--chart-3)" },
} satisfies ChartConfig;

export default function DashboardMessageChart({ messages }: DashboardMessageChartProps) {
  const data = React.useMemo(() => {
    const start = dayjs().subtract(13, "day").startOf("day");
    const days = Array.from({ length: 14 }, (_, i) => start.add(i, "day"));

    const initial = new Map<string, { tenant: number; employee: number; bot: number }>();
    for (const d of days) initial.set(d.format("YYYY-MM-DD"), { tenant: 0, employee: 0, bot: 0 });

    for (const m of messages) {
      const createdAt = typeof m.createdAt === "string" ? new Date(m.createdAt) : m.createdAt;
      const key = dayjs(createdAt).format("YYYY-MM-DD");
      const bucket = initial.get(key);
      if (!bucket) continue;

      if (m.senderType === SenderType.user) bucket.employee += 1;
      else bucket[m.senderType] += 1;
    }

    return days.map((d) => {
      const key = d.format("YYYY-MM-DD");
      const bucket = initial.get(key)!;
      return {
        day: d.format("DD MMM"),
        tenant: bucket.tenant,
        employee: bucket.employee,
        bot: bucket.bot,
      };
    });
  }, [messages]);

  return (
    <Card>
      <CardHeader className="gap-1">
        <CardTitle className="text-base">Messages</CardTitle>
        <CardDescription>Totals by sender type (last 14 days)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <LineChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
            <YAxis width={32} tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="tenant" stroke="var(--color-tenant)" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="employee" stroke="var(--color-employee)" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="bot" stroke="var(--color-bot)" strokeWidth={2} dot={{ r: 3 }} />
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
