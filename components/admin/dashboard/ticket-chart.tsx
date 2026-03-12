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
import { TicketStatus } from "@/generated/prisma/enums";
import * as React from "react";
import { Pie, PieChart } from "recharts";

export type DashboardTicketChartProps = {
  openNow: number;
  closedNow: number;
  inProgressThisMonth: number;
};

const chartConfig = {
  open: { label: "Open", color: "var(--chart-1)" },
  in_progress: { label: "In progress", color: "var(--chart-2)" },
  closed: { label: "Closed", color: "var(--chart-3)" },
} satisfies ChartConfig;

export default function DashboardTicketChart({ openNow, closedNow, inProgressThisMonth }: DashboardTicketChartProps) {
  const data = React.useMemo(
    () => [
      { status: TicketStatus.open, value: openNow, fill: "var(--color-open)" },
      { status: TicketStatus.in_progress, value: inProgressThisMonth, fill: "var(--color-in_progress)" },
      { status: TicketStatus.closed, value: closedNow, fill: "var(--color-closed)" },
    ],
    [openNow, closedNow, inProgressThisMonth],
  );

  return (
    <Card>
      <CardHeader className="gap-1">
        <CardTitle className="text-base">Tickets</CardTitle>
        <CardDescription>Open / closed now, and in progress this month</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[260px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="status" />} />
            <Pie data={data} dataKey="value" nameKey="status" innerRadius={60} strokeWidth={2} />
            <ChartLegend content={<ChartLegendContent nameKey="status" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
