import type { MusicTrack } from '../types';
import rawTracks from './gospel_tracks_200.json';

export type { MusicTrack };

// 200+ Verified Gospel Tracks loaded from canonical repository dataset
export const VERIFIED_GOSPEL_TRACKS: MusicTrack[] = (rawTracks as any[]).map((t, idx) => ({
  id: t.id || `track_${idx + 1}`,
  title: t.title || 'Sacred Gospel Anthem',
  artist: t.artist || t.speaker || 'YoungFire Praise Collective',
  album: t.category || 'Kingdom Worship',
  duration: t.duration || '4:15',
  albumArt: t.albumArt || (t.youtubeId ? `https://img.youtube.com/vi/${t.youtubeId}/hqdefault.jpg` : '/image_4.png'),
  category: t.category || 'Contemporary Praise & Worship',
  audioUrl: t.streamUrl || (t.youtubeId ? `https://www.youtube.com/watch?v=${t.youtubeId}` : 'https://stream.0nlineradio.com/gospel?ref=radiobrowser'),
  streamUrl: t.streamUrl || 'https://stream.0nlineradio.com/gospel?ref=radiobrowser',
  youtubeId: t.youtubeId,
  thematicFocus: t.thematicFocus,
  lyricsSnippet: t.lyricsSnippet,
  isJhowOfficial: Boolean(t.isJhowOfficial),
  scriptureRef: t.thematicFocus?.match(/(?:[1-3]\s+)?[A-Z][a-z]+(?:\s+[A-Za-z]+)?\s+\d+(?::\d+)?/)?.[0]
}));

export const GOSPEL_TRACK_CATEGORIES = [
  'All',
  'Contemporary Praise & Worship',
  'JHOW Sermons & Live',
  'Elevation Rhythm & Youth Anthems',
  'Urban Gospel & Classics',
  'Deliverance & Warfare Sessions',
  'Instrumental & Saxophone Soaking',
  'Bible Book Overviews',
  'Christian Hip-Hop & R&B'
] as const;

export const getTracksByCategory = (category: string): MusicTrack[] => {
  if (!category || category === 'All') return VERIFIED_GOSPEL_TRACKS;
  return VERIFIED_GOSPEL_TRACKS.filter(t => t.category === category);
};

export const searchTracks = (query: string): MusicTrack[] => {
  if (!query.trim()) return VERIFIED_GOSPEL_TRACKS;
  const q = query.toLowerCase();
  return VERIFIED_GOSPEL_TRACKS.filter(t => 
    t.title.toLowerCase().includes(q) ||
    t.artist.toLowerCase().includes(q) ||
    (t.category && t.category.toLowerCase().includes(q)) ||
    (t.thematicFocus && t.thematicFocus.toLowerCase().includes(q))
  );
};
