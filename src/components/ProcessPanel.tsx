"use client";

import { useState } from "react";
import type { YouTubeVideo } from "@/types/youtube";
import type { AnalysisResult, CalendarPlan } from "@/types/clipgenie";
import CalendarView from "./CalendarView";

interface ProcessPanelProps {
  accessToken: string;
  videos: YouTubeVideo[];
}

export default function ProcessPanel({ videos }: ProcessPanelProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<"select" | "transcribing" | "analyzing" | "generating" | "done">("select");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [calendarPlan, setCalendarPlan] = useState<CalendarPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleVideo = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === videos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(videos.map((v) => v.id)));
    }
  };

  const handleAnalyze = async () => {
    const selected = videos.filter((v) => selectedIds.has(v.id));
    if (selected.length === 0) return;
    setError(null);

    setStep("transcribing");
    setProgress({ current: 0, total: selected.length });

    const transcripts: { videoId: string; title: string; transcript: string }[] = [];

    for (let i = 0; i < selected.length; i++) {
      setProgress({ current: i + 1, total: selected.length });
      try {
        const res = await fetch("/api/transcript", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: selected[i].id }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(`${selected[i].title}: ${err.error}`);
        }
        const data = await res.json();
        transcripts.push({ videoId: data.videoId, title: selected[i].title, transcript: data.transcript });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Transcript fetch failed");
        setStep("select");
        return;
      }
    }

    setStep("analyzing");
    setProgress({ current: 0, total: transcripts.length });
    const results: AnalysisResult[] = [];

    for (let i = 0; i < transcripts.length; i++) {
      setProgress({ current: i + 1, total: transcripts.length });
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transcripts[i]),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(`${transcripts[i].title}: ${err.error}`);
        }
        const data = await res.json();
        results.push(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed");
        setStep("select");
        return;
      }
    }

    setStep("generating");
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analyses: results }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Calendar generation failed");
      }
      const calendar = await res.json();
      setCalendarPlan(calendar);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calendar generation failed");
      setStep("select");
    }
  };

  const handleReset = () => {
    setSelectedIds(new Set());
    setStep("select");
    setProgress({ current: 0, total: 0 });
    setCalendarPlan(null);
    setError(null);
  };

  if (step === "done" && calendarPlan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#e8e8e8]">30-Day Content Plan</h2>
            <p className="text-sm text-[#888888] mt-0.5">{selectedIds.size} videos processed</p>
          </div>
          <button
            onClick={handleReset}
            className="text-xs text-[#555555] hover:text-[#888888] transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.04]"
          >
            New plan
          </button>
        </div>
        <CalendarView plan={calendarPlan} />
      </div>
    );
  }

  if (step !== "select") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-8 h-8 relative">
          <div className="absolute inset-0 rounded-full border-2 border-white/8" />
          <div className="absolute inset-0 rounded-full border-2 border-t-blue-500 animate-spin" />
        </div>
        <p className="text-sm text-[#888888]">
          {step === "transcribing" && `Fetching transcripts (${progress.current}/${progress.total})...`}
          {step === "analyzing" && `Analyzing with AI (${progress.current}/${progress.total})...`}
          {step === "generating" && "Building your 30-day content plan..."}
        </p>
        {error && (
          <p className="text-sm text-blue-400/70 bg-blue-500/5 border border-blue-500/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <div className="w-40 h-1 bg-white/[0.04] rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500/50 rounded-full transition-all duration-500"
            style={{ width: `${(progress.current / progress.total) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#e8e8e8]">Archive Processor</h2>
          <p className="text-sm text-[#888888] mt-0.5">
            Select videos to analyze and generate a 30-day plan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAll}
            className="text-xs text-[#555555] hover:text-[#888888] transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.04]"
          >
            {selectedIds.size === videos.length ? "Deselect all" : "Select all"}
          </button>
          <button
            onClick={handleAnalyze}
            disabled={selectedIds.size === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#0d0d0d] text-sm font-semibold rounded-lg hover:bg-zinc-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.97]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            {selectedIds.size === 0 ? "Select videos" : `Process (${selectedIds.size})`}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg text-sm text-blue-400/70">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
        {videos.map((video) => {
          const selected = selectedIds.has(video.id);
          return (
            <button
              key={video.id}
              onClick={() => toggleVideo(video.id)}
              className={`group relative rounded-lg overflow-hidden border text-left transition-all ${
                selected
                  ? "border-blue-500/40 ring-1 ring-blue-500/20"
                  : "border-white/[0.04] hover:border-white/[0.1]"
              }`}
            >
              <div className="relative aspect-video bg-[#141414]">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                {selected && (
                  <div className="absolute inset-0 bg-blue-500/5 flex items-center justify-center">
                    <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-1.5">
                <p className="text-[11px] font-medium text-[#e8e8e8]/60 leading-tight line-clamp-2">
                  {video.title}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
