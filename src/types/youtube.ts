export interface ChannelInfo {
  id: string;
  title: string;
  thumbnail: string;
  uploadsPlaylistId: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
  duration: string;
}

export interface VideosResponse {
  videos: YouTubeVideo[];
  nextPageToken: string | null;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

export interface ChannelResponse {
  id: string;
  title: string;
  thumbnail: string;
  uploadsPlaylistId: string;
}
