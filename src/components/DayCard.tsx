"use client";

import type { CalendarDay } from "@/types/clipgenie";

interface DayCardProps {
  day: CalendarDay;
  expanded: boolean;
  onToggle: () => void;
}

export default function DayCard({ day, expanded, onToggle }: DayCardProps) {
  const dateObj = new Date(day.date + "T00:00:00");
  const formatted = dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <button
      onClick={onToggle}
      className={`text-left rounded-lg border transition-all ${
        expanded
          ? "border-blue-500/25 bg-[#141414]"
          : "border-white/[0.04] bg-white/[0.015] hover:border-white/[0.1] hover:bg-white/[0.025]"
      }`}
    >
      <div className="p-2.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-[#888888] uppercase tracking-widest">
            {day.dayOfWeek.slice(0, 3)}
          </span>
          <span className="text-[11px] text-[#555555]">{formatted}</span>
        </div>
        <div className="space-y-1">
          {day.clips.map((clip) => (
            <div
              key={`${clip.sourceVideoId}-${clip.start}`}
              className="text-[11px] px-1.5 py-1 rounded bg-blue-500/5 border border-blue-500/10 text-blue-300/80"
            >
              <span className="font-medium">{clip.title}</span>
            </div>
          ))}
        </div>
        {expanded && (
          <div className="mt-2.5 pt-2.5 border-t border-white/[0.04] space-y-2.5 animate-slide-up">
            {day.clips.map((clip) => (
              <div key={`${clip.sourceVideoId}-${clip.start}-detail`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-medium uppercase tracking-wider px-1 py-0.5 rounded bg-blue-500/8 border border-blue-500/15 text-blue-400/80">
                    {clip.platform}
                  </span>
                  <span className="text-[11px] text-[#555555]">
                    {clip.start} – {clip.end}
                  </span>
                </div>
                <p className="text-[12px] text-[#e8e8e8]/70 font-medium mb-0.5">
                  {clip.title}
                </p>
                <p className="text-[11px] text-[#555555] leading-relaxed">
                  {clip.hook}
                </p>
                <p className="text-[10px] text-[#555555]/60 mt-0.5 truncate">
                  {clip.sourceVideo}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
