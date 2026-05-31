import { analyzeTranscript } from "@/lib/gemini";

export async function POST(request: Request) {
  const { videoId, title, transcript } = await request.json();

  if (!videoId || !title || !transcript) {
    return Response.json(
      { error: "Missing videoId, title, or transcript" },
      { status: 400 }
    );
  }

  try {
    const analysis = await analyzeTranscript(videoId, title, transcript);
    return Response.json({ videoId, ...analysis });
  } catch (error) {
    console.error("Analyze API error:", error);
    return Response.json(
      { error: "Failed to analyze transcript" },
      { status: 500 }
    );
  }
}
