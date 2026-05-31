import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_KEY!);

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const SYSTEM_PROMPT = `You are a YouTube content strategist and video editor.
Analyze video transcripts to find the best moments for short-form content (Shorts, clips).
Your goal is to identify moments that will drive engagement, shares, and watch time.

For each video, identify:
1. Key moments with timestamps (the most engaging/hookable parts)
2. Themes/topics discussed
3. Viral potential score (0-100)
4. Suggested short clips (max 15-60 seconds each) with catchy titles and hooks`;

export async function analyzeTranscript(
  videoId: string,
  title: string,
  transcriptText: string
) {
  const prompt = `${SYSTEM_PROMPT}\n\nVideo title: "${title}"\n\nTranscript:\n${transcriptText}\n\nRespond with valid JSON only (no markdown, no backticks):
{
  "keyMoments": [{ "timestamp": "0:00", "description": "...", "reason": "..." }],
  "themes": ["..."],
  "viralPotential": 0-100,
  "suggestedClips": [{ "title": "...", "start": "0:00", "end": "1:00", "hook": "..." }]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(clean) as {
    keyMoments: { timestamp: string; description: string; reason: string }[];
    themes: string[];
    viralPotential: number;
    suggestedClips: { title: string; start: string; end: string; hook: string }[];
  };
}

export async function generateCalendar(
  analyses: {
    videoId: string;
    title: string;
    themes: string[];
    viralPotential: number;
    suggestedClips: { title: string; start: string; end: string; hook: string }[];
  }[]
) {
  const analysesSummary = analyses
    .map(
      (a) =>
        `Video: "${a.title}"\nThemes: ${a.themes.join(", ")}\nViral Score: ${a.viralPotential}\nClips: ${a.suggestedClips.map((c) => `${c.title} (${c.start}-${c.end}): ${c.hook}`).join(" | ")}`
    )
    .join("\n\n");

  const prompt = `You are a YouTube content scheduling strategist.
Given the analyzed videos below, create a 30-day content calendar.
Mix high-potential clips early, vary themes, and include hooks optimized for each day.

${analysesSummary}

Respond with valid JSON only (no markdown, no backticks):
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "dayOfWeek": "Monday",
      "clips": [
        {
          "sourceVideo": "original video title",
          "sourceVideoId": "the video id",
          "title": "clip title for this day",
          "start": "0:00",
          "end": "1:00",
          "hook": "caption/hook for the post",
          "platform": "shorts" | "youtube"
        }
      ]
    }
  ],
  "strategy": "brief explanation of the posting strategy"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(clean) as {
    days: {
      date: string;
      dayOfWeek: string;
      clips: {
        sourceVideo: string;
        sourceVideoId: string;
        title: string;
        start: string;
        end: string;
        hook: string;
        platform: "shorts" | "youtube";
      }[];
    }[];
    strategy: string;
  };
}
