"use client";

import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import ProcessPanel from "@/components/ProcessPanel";
import type { ChannelInfo, YouTubeVideo } from "@/types/youtube";

export default function DashboardPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useGoogleLogin({
    flow: "implicit",
    scope: "https://www.googleapis.com/auth/youtube.readonly",
    onSuccess: async (tokenResponse) => {
      const token = tokenResponse.access_token;
      if (!token) return;
      setAccessToken(token);
      setLoading(true);
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

        const params = new URLSearchParams({ playlistId: channelData.uploadsPlaylistId });
        const res = await fetch(`/api/videos?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to fetch videos");
        }
        const data = await res.json();
        setVideos(data.videos);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError("Sign in failed. Please try again.");
    },
  });

  const handleSignOut = async () => {
    if (accessToken) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
          method: "POST",
        });
      } catch {
        // ignore
      }
    }
    setAccessToken(null);
    setChannel(null);
    setVideos([]);
    setError(null);
  };

  if (!accessToken) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0d0d0d]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.04),transparent_70%)]" />
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-blue-500/2 rounded-full blur-[120px]" />

        <div className="relative z-10 text-center px-6 max-w-md">
          <div className="relative w-16 h-16 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-blue-500/8 animate-pulse-ring" />
            <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/15 animate-float rotate-12">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#e8e8e8] mb-2">
            ClipGenie
          </h1>
          <p className="text-[#888888] text-sm mb-8 leading-relaxed">
            Turn your YouTube archive into a 30-day content plan.
          </p>
          <button
            onClick={() => login()}
            className="group inline-flex items-center gap-3 px-8 py-3.5 bg-white text-[#0d0d0d] rounded-xl text-sm font-semibold hover:bg-zinc-100 transition-all duration-300 active:scale-[0.97]"
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

  if (loading) {
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
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm shadow-blue-500/20">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-[#e8e8e8]">ClipGenie</span>
              {channel && (
                <>
                  <span className="text-[#555555]">/</span>
                  <img
                    src={channel.thumbnail}
                    alt=""
                    className="w-5 h-5 rounded-full ring-1 ring-white/[0.06]"
                  />
                  <span className="text-sm text-[#888888]">{channel.title}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              <a
                href="/"
                className="text-xs text-[#888888] hover:text-[#e8e8e8] transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.04]"
              >
                Library
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
        {error && (
          <div className="mb-8 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg text-sm text-blue-400/70">
            {error}
          </div>
        )}
        <ProcessPanel accessToken={accessToken} videos={videos} />
      </main>
    </div>
  );
}
