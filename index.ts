/**
 * Oath & Cross / YoungFire Sanctuary Core Types
 */

export interface VideoMediaItem {
  id: string;
  youtubeId: string;
  title: string;
  artist?: string;
  speaker?: string;
  category: string;
  duration: string;
  albumArt?: string;
  description?: string;
  thematicFocus?: string;
  lyricsSnippet?: string;
  lyricsText?: string;
  isJhowOfficial?: boolean;
  scriptureRef?: string;
  tags?: string[];
  streamUrl?: string;
}

export interface KingdomMedia extends VideoMediaItem {}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: string;
  albumArt?: string;
  category?: string;
  audioUrl?: string;
  streamUrl?: string;
  youtubeId?: string;
  spotifyId?: string;
  thematicFocus?: string;
  lyricsSnippet?: string;
  lyricsText?: string;
  scriptureRef?: string;
  isJhowOfficial?: boolean;
  tags?: string[];
}

export * from './lesson';
export * from './scripture';
