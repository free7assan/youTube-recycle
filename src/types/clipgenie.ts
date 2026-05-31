export interface VideoForAnalysis {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: string;
}

export interface KeyMoment {
  timestamp: string;
  description: string;
  reason: string;
}

export interface SuggestedClip {
  title: string;
  start: string;
  end: string;
  hook: string;
}

export interface AnalysisResult {
  videoId: string;
  title: string;
  keyMoments: KeyMoment[];
  themes: string[];
  viralPotential: number;
  suggestedClips: SuggestedClip[];
}

export interface CalendarClip {
  sourceVideo: string;
  sourceVideoId: string;
  title: string;
  start: string;
  end: string;
  hook: string;
  platform: "youtube" | "shorts";
}

export interface CalendarDay {
  date: string;
  dayOfWeek: string;
  clips: CalendarClip[];
}

export interface CalendarPlan {
  days: CalendarDay[];
  strategy: string;
}
