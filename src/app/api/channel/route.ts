import { google } from "googleapis";

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
  }

  const accessToken = authHeader.slice(7);

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const youtube = google.youtube({ version: "v3", auth });

    const response = await youtube.channels.list({
      part: ["snippet", "contentDetails"],
      mine: true,
    });

    const channel = response.data.items?.[0];
    if (!channel) {
      return Response.json({ error: "No channel found" }, { status: 404 });
    }

    return Response.json({
      id: channel.id,
      title: channel.snippet?.title,
      thumbnail: channel.snippet?.thumbnails?.high?.url,
      uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads,
    });
  } catch (error) {
    console.error("Channel API error:", error);
    return Response.json({ error: "Failed to fetch channel information" }, { status: 500 });
  }
}
