import { google } from "googleapis";

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
  }

  const accessToken = authHeader.slice(7);
  const { searchParams } = new URL(request.url);
  const playlistId = searchParams.get("playlistId");
  const pageToken = searchParams.get("pageToken") || undefined;

  if (!playlistId) {
    return Response.json({ error: "Missing playlistId parameter" }, { status: 400 });
  }

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const youtube = google.youtube({ version: "v3", auth });

    const playlistResponse = await youtube.playlistItems.list({
      part: ["snippet", "contentDetails"],
      playlistId,
      maxResults: 50,
      pageToken,
    });

    const items = playlistResponse.data.items || [];
    const videoIds = items
      .map((item) => item.contentDetails?.videoId)
      .filter((id): id is string => !!id);

    let videoStatsMap: Record<string, { viewCount?: string | null; likeCount?: string | null; commentCount?: string | null; duration?: string | null }> = {};

    if (videoIds.length > 0) {
      const videosResponse = await youtube.videos.list({
        part: ["statistics", "contentDetails"],
        id: videoIds,
      });

      for (const video of videosResponse.data.items || []) {
        videoStatsMap[video.id!] = {
          viewCount: video.statistics?.viewCount,
          likeCount: video.statistics?.likeCount,
          commentCount: video.statistics?.commentCount,
          duration: video.contentDetails?.duration,
        };
      }
    }

    const videos = items.map((item) => {
      const videoId = item.contentDetails?.videoId;
      const stats = videoId ? videoStatsMap[videoId] : {};
      return {
        id: videoId,
        title: item.snippet?.title,
        description: item.snippet?.description,
        thumbnail: item.snippet?.thumbnails?.high?.url,
        publishedAt: item.snippet?.publishedAt,
        viewCount: stats.viewCount || "0",
        likeCount: stats.likeCount || "0",
        commentCount: stats.commentCount || "0",
        duration: stats.duration || "PT0S",
      };
    });

    return Response.json({
      videos,
      nextPageToken: playlistResponse.data.nextPageToken || null,
      pageInfo: playlistResponse.data.pageInfo,
    });
  } catch (error) {
    console.error("Videos API error:", error);
    return Response.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}
