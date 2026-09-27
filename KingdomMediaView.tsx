import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Play, Film, Sparkles, Video, ExternalLink, 
  Search, Bookmark, Check, Music, Heart, Flame, BookOpen, Volume2
} from 'lucide-react';
import { 
  type VideoMediaItem,
  CANONICAL_MEDIA_VAULT, 
  cleanYouTubeId, 
  getYouTubeThumbnail,
  parseScriptureRefToNav,
  KINGDOM_MEDIA_CATEGORIES
} from '../data/kingdomMediaData';

export const getYouTubeThumb = (id: string) => getYouTubeThumbnail(id, 'hq');

interface KingdomMediaViewProps {
  onBack?: () => void;
  onAudioDucking?: (shouldDuck: boolean) => void;
  onFloatVideo?: (video: VideoMediaItem) => void;
  onNavigateToScripture?: (bookId: string, chapter: number) => void;
  onPlayTrackInDock?: (track: VideoMediaItem) => void;
}

export const KingdomMediaView: React.FC<KingdomMediaViewProps> = ({ 
  onBack, 
  onAudioDucking, 
  onFloatVideo,
  onNavigateToScripture,
  onPlayTrackInDock
}) => {
  const [videos, setVideos] = useState<VideoMediaItem[]>(CANONICAL_MEDIA_VAULT);
  const [activeVideo, setActiveVideo] = useState<VideoMediaItem>(CANONICAL_MEDIA_VAULT[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [savedFavorites, setSavedFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('youngfire_video_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load items from verified 200+ dataset
  useEffect(() => {
    fetch('/gospel_tracks_200.json')
      .then(res => res.json())
      .then((data: VideoMediaItem[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const normalized = data.map(item => {
            const canonicalMatch = CANONICAL_MEDIA_VAULT.find(c => 
              c.id === item.id || cleanYouTubeId(c.youtubeId) === cleanYouTubeId(item.youtubeId)
            );
            return {
              ...item,
              title: canonicalMatch ? canonicalMatch.title : item.title,
              speaker: canonicalMatch ? (canonicalMatch.speaker || canonicalMatch.artist) : (item.speaker || item.artist || 'YoungFire Praise'),
              description: canonicalMatch ? canonicalMatch.thematicFocus : (item.thematicFocus || item.description || ''),
              thematicFocus: canonicalMatch ? canonicalMatch.thematicFocus : item.thematicFocus,
              scriptureRef: canonicalMatch?.scriptureRef || item.scriptureRef || item.thematicFocus?.match(/(?:[1-3]\s+)?[A-Z][a-z]+(?:\s+[A-Za-z]+)?\s+\d+(?::\d+)?/)?.[0],
              lyricsText: canonicalMatch ? canonicalMatch.lyricsText : undefined,
              isJhowOfficial: canonicalMatch ? canonicalMatch.isJhowOfficial : item.isJhowOfficial
            };
          });

          // Prepend canonical highlights if missing
          const combined = [...CANONICAL_MEDIA_VAULT];
          normalized.forEach(n => {
            if (!combined.some(c => cleanYouTubeId(c.youtubeId) === cleanYouTubeId(n.youtubeId))) {
              combined.push(n);
            }
          });
          setVideos(combined);
        }
      })
      .catch(err => {
        console.warn('Could not load gospel_tracks_200.json, using fallback tracks:', err);
      });
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated: string[];
    if (savedFavorites.includes(id)) {
      updated = savedFavorites.filter(fav => fav !== id);
    } else {
      updated = [...savedFavorites, id];
    }
    setSavedFavorites(updated);
    try {
      localStorage.setItem('youngfire_video_favorites', JSON.stringify(updated));
    } catch {}
  };

  const handleSelectVideo = (v: VideoMediaItem) => {
    setActiveVideo(v);
    if (onAudioDucking) onAudioDucking(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScriptureNavigation = (refText?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!refText) return;
    const nav = parseScriptureRefToNav(refText);
    if (nav) {
      if (onNavigateToScripture) {
        onNavigateToScripture(nav.bookId, nav.chapter);
      } else {
        window.dispatchEvent(new CustomEvent('yf_navigate_scripture', { 
          detail: { bookId: nav.bookId, chapter: nav.chapter } 
        }));
      }
    }
  };

  const dynamicCategories = React.useMemo(() => {
    const set = new Set<string>(['All']);
    KINGDOM_MEDIA_CATEGORIES.forEach(c => set.add(c));
    videos.forEach(v => {
      if (v.category) set.add(v.category);
    });
    return Array.from(set);
  }, [videos]);

  const filteredVideos = videos.filter(v => {
    if (showOnlyFavorites && !savedFavorites.includes(v.id)) return false;
    const matchesCategory = selectedCategory === 'All' || v.category?.toLowerCase() === selectedCategory.toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      (v.title || '').toLowerCase().includes(q) ||
      (v.speaker || v.artist || '').toLowerCase().includes(q) ||
      (v.thematicFocus || '').toLowerCase().includes(q) ||
      (v.scriptureRef || '').toLowerCase().includes(q) ||
      (v.lyricsSnippet || '').toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const activeCleanId = cleanYouTubeId(activeVideo.youtubeId);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 pb-24 select-none px-2 sm:px-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={() => {
                if (onAudioDucking) onAudioDucking(false);
                onBack();
              }}
              className="p-2 rounded-xl bg-[#0B1329] border border-white/15 text-slate-200 hover:text-white cursor-pointer transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-rose-400" />
              <h2 className="text-lg font-black uppercase font-['Outfit'] text-white">
                OATH & CROSS WORSHIP TV
              </h2>
            </div>
            <p className="text-[11px] font-mono text-slate-400">
              200+ Praise Anthems &bull; JHOW Live Sermons &bull; Direct Scripture Links
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOnlyFavorites(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              showOnlyFavorites
                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-rose-400 text-rose-400' : 'text-slate-400'}`} />
            <span>Saved ({savedFavorites.length})</span>
          </button>
          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300">
            {videos.length} Videos
          </span>
        </div>
      </div>

      {/* Official JHOW Links Banner */}
      <div className="p-3 rounded-2xl bg-[#070C1C] border border-white/10 flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono border-t border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 font-bold uppercase text-[10px]">Joshua House of Worship Official:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="https://joshuahouseofworship.org/"
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3 h-3 text-cyan-400" />
            <span>JHOW Website</span>
          </a>
          <a
            href="https://www.youtube.com/@JoshuaHouseOfWorshipSanAntonio"
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3 h-3 text-rose-400" />
            <span>JHOW YouTube Channel</span>
          </a>
        </div>
      </div>

      {/* 1. Main Theater Screen (Active Video) */}
      <div className="rounded-3xl overflow-hidden bg-[#070B18] border border-white/10 shadow-2xl">
        <div className="relative aspect-video w-full bg-black">
          {activeCleanId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${activeCleanId}?autoplay=1&rel=0&modestbranding=1`}
              title={activeVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-xs">
              No video stream available
            </div>
          )}
        </div>

        {/* Video Metadata Panel */}
        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {activeVideo.category}
                </span>
                {activeVideo.isJhowOfficial && (
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-rose-400" />
                    Official JHOW Stream
                  </span>
                )}
                {activeVideo.scriptureRef && (
                  <button
                    onClick={(e) => handleScriptureNavigation(activeVideo.scriptureRef, e)}
                    className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 hover:bg-cyan-500/30 cursor-pointer transition-colors"
                    title="Direct Scripture Deep Link"
                  >
                    <BookOpen className="w-3 h-3 text-cyan-400" />
                    <span>📖 {activeVideo.scriptureRef}</span>
                  </button>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-black text-white font-['Outfit']">
                {activeVideo.title}
              </h3>
              <p className="text-xs text-slate-300 font-mono">
                {activeVideo.speaker || activeVideo.artist || 'Joshua House of Worship'} &bull; {activeVideo.duration}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {onFloatVideo && (
                <button
                  onClick={() => onFloatVideo(activeVideo)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-mono font-bold text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Float Video (Picture-in-Picture)"
                >
                  <Video className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Float Mini</span>
                </button>
              )}
              {onPlayTrackInDock && (
                <button
                  onClick={() => onPlayTrackInDock(activeVideo)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Send Audio to Persistent Dock"
                >
                  <Music className="w-3.5 h-3.5 text-amber-400" />
                  <span>Listen in Dock</span>
                </button>
              )}
              <button
                onClick={(e) => toggleFavorite(activeVideo.id, e)}
                className={`p-2 rounded-xl border cursor-pointer transition-colors ${
                  savedFavorites.includes(activeVideo.id)
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
                title="Favorite this sermon or anthem"
              >
                <Heart className={`w-4 h-4 ${savedFavorites.includes(activeVideo.id) ? 'fill-rose-400' : ''}`} />
              </button>
            </div>
          </div>

          {activeVideo.thematicFocus && (
            <p className="text-xs text-slate-300 leading-relaxed font-mono bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-amber-400 font-bold block mb-1 uppercase text-[10px] tracking-wider">
                Thematic Apostolic Focus:
              </span>
              {activeVideo.thematicFocus}
            </p>
          )}

          {activeVideo.lyricsText && (
            <details className="mt-2 text-xs font-mono bg-[#0B1329] border border-amber-500/30 rounded-xl p-3 cursor-pointer">
              <summary className="font-bold text-amber-400 uppercase text-[11px] flex items-center gap-1.5 select-none">
                <Music className="w-3.5 h-3.5 text-amber-400" />
                View Consecrated Lyrics & Declaration
              </summary>
              <pre className="mt-2 text-[11px] text-slate-200 whitespace-pre-wrap font-mono leading-relaxed pl-2 border-l border-amber-500/40">
                {activeVideo.lyricsText}
              </pre>
            </details>
          )}
        </div>
      </div>

      {/* 2. Search & Category Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, artist, scripture, or theme..."
              className="w-full bg-[#0B1329] border border-white/10 focus:border-amber-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-400 font-mono outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {dynamicCategories.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                    : 'bg-[#0B1329] text-slate-300 border-white/10 hover:border-white/20 hover:text-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredVideos.map((video) => {
          const isCurrent = activeVideo.id === video.id;
          const cleanId = cleanYouTubeId(video.youtubeId);
          const thumb = video.albumArt || getYouTubeThumbnail(cleanId);
          const isFav = savedFavorites.includes(video.id);

          return (
            <div
              key={video.id}
              onClick={() => handleSelectVideo(video)}
              className={`group relative rounded-2xl overflow-hidden bg-[#0B1329] border transition-all cursor-pointer flex flex-col justify-between hover:scale-[1.01] ${
                isCurrent 
                  ? 'border-amber-500 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500' 
                  : 'border-white/10 hover:border-white/25'
              }`}
            >
              {/* Thumbnail with Overlays */}
              <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                <img
                  src={thumb}
                  alt={video.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/image_4.png';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                {/* Duration Badge */}
                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono font-bold text-white border border-white/10">
                  {video.duration}
                </span>

                {/* Favorite Button */}
                <button
                  onClick={(e) => toggleFavorite(video.id, e)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 border border-white/15 text-white transition-colors cursor-pointer"
                  title="Favorite"
                >
                  <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-400 text-rose-400' : 'text-slate-300'}`} />
                </button>

                {/* Category tag */}
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 text-[9px] font-mono font-bold text-amber-300 border border-amber-500/30 uppercase">
                  {video.category}
                </span>

                {/* Play Button Indicator */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/40">
                    <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Text Info */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2 font-['Outfit'] group-hover:text-amber-300 transition-colors">
                    {video.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">
                    {video.speaker || video.artist || 'Joshua House of Worship'}
                  </p>
                </div>

                {/* Direct Scripture Link or Thematic Line */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono gap-1">
                  {video.scriptureRef ? (
                    <button
                      onClick={(e) => handleScriptureNavigation(video.scriptureRef, e)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold underline cursor-pointer"
                      title="Read scripture chapter in Word view"
                    >
                      <BookOpen className="w-3 h-3 text-cyan-400" />
                      <span>{video.scriptureRef}</span>
                    </button>
                  ) : (
                    <span className="text-slate-500 truncate">
                      {video.thematicFocus ? video.thematicFocus.substring(0, 32) + '...' : 'Worship & Truth'}
                    </span>
                  )}

                  {video.isJhowOfficial && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/25 flex-shrink-0">
                      JHOW
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredVideos.length === 0 && (
        <div className="p-12 text-center bg-[#0B1329] rounded-2xl border border-white/10 space-y-2">
          <Film className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-xs font-mono text-slate-400">
            No videos match "{searchQuery}" in category "{selectedCategory}".
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setShowOnlyFavorites(false);
            }}
            className="text-xs font-mono font-bold text-amber-400 underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
