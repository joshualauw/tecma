"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import dayjs from "@/lib/dayjs";

export interface DatePickerProps {
  date: Date;
  setDate: (_date: Date) => void;
}

export function DatePicker({ date, setDate }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!date}
          className="w-[280px] justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
        >
          <CalendarIcon />
          {date ? dayjs(date).format("DD/MM/YYYY") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar mode="single" selected={date} onSelect={setDate} required />
      </PopoverContent>
    </Popover>
  );
}
