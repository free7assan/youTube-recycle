import { fetchTranscript } from "youtube-transcript";

export async function getTranscript(videoId: string): Promise<string | null> {
  try {
    const transcriptItems = await fetchTranscript(videoId);
    if (!transcriptItems || transcriptItems.length === 0) return null;
    return transcriptItems.map((item) => item.text).join(" ");
  } catch {
    return null;
  }
}
