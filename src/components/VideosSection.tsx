"use client";

import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import VideoCard from "./VideoCard";
import type { ChannelInfo, YouTubeVideo } from "@/types/youtube";

export default function VideosSection() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "views">("newest");

  const login = useGoogleLogin({
    flow: "implicit",
    scope: "https://www.googleapis.com/auth/youtube.readonly",
    onSuccess: async (tokenResponse) => {
      const token = tokenResponse.access_token;
      if (!token) return;
      setAccessToken(token);
      setInitialLoading(true);
      setError(null);

      try {
        const channelRes = await fetch("/api/channel", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!channelRes.ok) {
          const errData = await channelRes.json();
          throw new Error(errData.error || "Failed to fetch channel");
        }
        const channelData: ChannelInfo = await channelRes.json();
        setChannel(channelData);
        await fetchVideos(token, channelData.uploadsPlaylistId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setInitialLoading(false);
      }
    },
    onError: () => {
      setError("Sign in failed. Please try again.");
    },
  });

  const fetchVideos = async (
    token: string,
    playlistId: string,
    pageToken?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ playlistId });
      if (pageToken) params.set("pageToken", pageToken);

      const res = await fetch(`/api/videos?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to fetch videos");
      }
      const data = await res.json();

      if (pageToken) {
        setVideos((prev) => [...prev, ...data.videos]);
      } else {
        setVideos(data.videos);
      }
      setNextPageToken(data.nextPageToken ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (accessToken && channel && nextPageToken) {
      fetchVideos(accessToken, channel.uploadsPlaylistId, nextPageToken);
    }
  };

  const handleSignOut = async () => {
    if (accessToken) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
          method: "POST",
        });
      } catch {
        // ignore revoke errors
      }
    }
    setAccessToken(null);
    setChannel(null);
    setVideos([]);
    setNextPageToken(null);
    setError(null);
    setSearchQuery("");
  };

  const filteredVideos = videos
    .filter((v) =>
      v.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "newest")
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      if (sortBy === "oldest")
        return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
      if (sortBy === "views")
        return parseInt(b.viewCount) - parseInt(a.viewCount);
      return 0;
    });

  if (!accessToken) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0d0d0d]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.04),transparent_70%)]" />
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-blue-500/2 rounded-full blur-[120px]" />

        <div className="relative z-10 text-center px-6 max-w-md">
          <div className="relative w-20 h-20 mx-auto mb-10">
            <div className="absolute inset-0 rounded-full bg-blue-500/8 animate-pulse-ring" />
            <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/15 animate-float rotate-12">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-[#e8e8e8] mb-3">
            Your Archive
          </h1>
          <p className="text-[#888888] text-sm mb-10 leading-relaxed">
            Sign in to transform your YouTube library into a 30-day content plan.
          </p>

          <button
            onClick={() => login()}
            className="group relative inline-flex items-center gap-3 px-8 py-3.5 bg-white text-[#0d0d0d] rounded-xl text-sm font-semibold hover:bg-zinc-100 transition-all duration-300 active:scale-[0.97]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 relative">
            <div className="absolute inset-0 rounded-full border-2 border-white/8" />
            <div className="absolute inset-0 rounded-full border-2 border-t-blue-500 animate-spin" />
          </div>
          <p className="text-sm text-[#888888]">Loading your library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <header className="sticky top-0 z-50 bg-[#0d0d0d]/80 backdrop-blur-lg border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3 min-w-0">
              {channel && (
                <>
                  <img
                    src={channel.thumbnail}
                    alt=""
                    className="w-7 h-7 rounded-full ring-1 ring-white/[0.08]"
                  />
                  <div className="truncate">
                    <h1 className="text-sm font-semibold text-[#e8e8e8] truncate leading-tight">
                      {channel.title}
                    </h1>
                    <p className="text-[11px] text-[#888888]">
                      {videos.length > 0
                        ? `${videos.length} video${videos.length !== 1 ? "s" : ""}`
                        : "Loading..."}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-1">
              <a
                href="/dashboard"
                className="text-xs text-[#888888] hover:text-[#e8e8e8] transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.04]"
              >
                ClipGenie
              </a>
              <button
                onClick={handleSignOut}
                className="text-xs text-[#555555] hover:text-[#888888] transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.04]"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {videos.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555] pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white/[0.03] border border-white/[0.06] rounded-lg text-[#e8e8e8] placeholder-[#555555] focus:outline-none focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 text-sm bg-white/[0.03] border border-white/[0.06] rounded-lg text-[#888888] focus:outline-none focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
            >
              <option value="newest" className="bg-[#141414]">Newest</option>
              <option value="oldest" className="bg-[#141414]">Oldest</option>
              <option value="views" className="bg-[#141414]">Most views</option>
            </select>
          </div>
        )}

        {error && (
          <div className="mb-8 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg text-sm text-blue-400/70">
            {error}
          </div>
        )}

        {filteredVideos.length === 0 && !loading && videos.length > 0 && (
          <div className="text-center py-20">
            <svg className="w-10 h-10 mx-auto mb-3 text-[#555555]" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <p className="text-[#555555] text-sm">No videos match your search.</p>
          </div>
        )}

        {loading && filteredVideos.length === 0 && videos.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="aspect-video rounded-lg skeleton" />
                <div className="mt-2.5 space-y-2 px-0.5">
                  <div className="h-3 w-3/4 rounded skeleton" />
                  <div className="h-3 w-1/2 rounded skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredVideos.map((video, i) => (
                <div
                  key={video.id}
                  className="animate-fade-up"
                  style={{
                    animationDelay: `${i * 0.04}s`,
                    opacity: 0,
                    animationFillMode: "forwards",
                  }}
                >
                  <VideoCard
                    title={video.title}
                    thumbnail={video.thumbnail}
                    viewCount={video.viewCount}
                    likeCount={video.likeCount}
                    duration={video.duration}
                    publishedAt={video.publishedAt}
                  />
                </div>
              ))}
            </div>

            {nextPageToken && (
              <div className="mt-10 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-[#888888] hover:bg-white/[0.06] hover:text-[#e8e8e8] transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.97]"
                >
                  {loading ? (
                    <>
                      <div className="w-3 h-3 rounded-full border border-white/30 border-t-transparent animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load more"
                  )}
                </button>
              </div>
            )}

            {loading && nextPageToken && (
              <div className="mt-6 flex justify-center">
                <div className="w-4 h-4 rounded-full border-2 border-white/8 border-t-blue-500/40 animate-spin" />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
