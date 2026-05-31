"use client";

import type { CalendarPlan } from "@/types/clipgenie";
import DayCard from "./DayCard";
import { useState } from "react";

interface CalendarViewProps {
  plan: CalendarPlan;
}

export default function CalendarView({ plan }: CalendarViewProps) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="p-4 bg-[#141414] border border-white/[0.04] rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
          </svg>
          <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-widest">Strategy</span>
        </div>
        <p className="text-sm text-[#888888] leading-relaxed">{plan.strategy}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
        {plan.days.map((day) => (
          <DayCard
            key={day.date}
            day={day}
            expanded={expandedDay === day.date}
            onToggle={() =>
              setExpandedDay(expandedDay === day.date ? null : day.date)
            }
          />
        ))}
      </div>
    </div>
  );
}
