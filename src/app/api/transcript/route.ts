import { getTranscript } from "@/lib/youtube";

export async function POST(request: Request) {
  const { videoId } = await request.json();

  if (!videoId || typeof videoId !== "string") {
    return Response.json({ error: "Missing videoId" }, { status: 400 });
  }

  try {
    const transcript = await getTranscript(videoId);
    if (!transcript) {
      return Response.json(
        { error: "No captions available for this video" },
        { status: 404 }
      );
    }
    return Response.json({ videoId, transcript });
  } catch (error) {
    console.error("Transcript API error:", error);
    return Response.json(
      { error: "Failed to fetch transcript" },
      { status: 500 }
    );
  }
}
