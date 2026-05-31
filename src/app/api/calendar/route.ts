import { generateCalendar } from "@/lib/gemini";

export async function POST(request: Request) {
  const { analyses } = await request.json();

  if (!analyses || !Array.isArray(analyses) || analyses.length === 0) {
    return Response.json(
      { error: "Missing or empty analyses array" },
      { status: 400 }
    );
  }

  try {
    const calendar = await generateCalendar(analyses);
    return Response.json(calendar);
  } catch (error) {
    console.error("Calendar API error:", error);
    return Response.json(
      { error: "Failed to generate calendar" },
      { status: 500 }
    );
  }
}
