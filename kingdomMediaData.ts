import type { VideoMediaItem, KingdomMedia } from '../types';

export type { VideoMediaItem, KingdomMedia };

export const cleanYouTubeId = (urlOrId: string): string => {
  if (!urlOrId) return '';
  let id = urlOrId.trim();
  if (id.includes('v=')) {
    id = id.split('v=')[1]?.split('&')[0]?.split('?')[0] || id;
  } else if (id.includes('youtu.be/')) {
    id = id.split('youtu.be/')[1]?.split('&')[0]?.split('?')[0] || id;
  } else if (id.includes('embed/')) {
    id = id.split('embed/')[1]?.split('&')[0]?.split('?')[0] || id;
  }
  id = id.split('&')[0].split('?')[0];
  return id.substring(0, 11);
};

export const getYouTubeThumbnail = (id: string, quality: 'hq' | 'mq' | 'default' = 'hq'): string => {
  const cleanId = cleanYouTubeId(id);
  if (!cleanId) return '/favicon.png';
  return `https://img.youtube.com/vi/${cleanId}/${quality}default.jpg`;
};

export const parseScriptureRefToNav = (ref?: string): { bookId: string; chapter: number } | null => {
  if (!ref) return null;
  const normalized = ref.trim().toUpperCase();

  const bookMap: Record<string, string> = {
    'GENESIS': 'GEN', 'EXODUS': 'EXO', 'LEVITICUS': 'LEV', 'NUMBERS': 'NUM', 'DEUTERONOMY': 'DEU',
    'JOSHUA': 'JOS', 'JUDGES': 'JDG', 'RUTH': 'RUT', '1 SAMUEL': '1SA', '2 SAMUEL': '2SA',
    '1 KINGS': '1KI', '2 KINGS': '2KI', '1 CHRONICLES': '1CH', '2 CHRONICLES': '2CH',
    'EZRA': 'EZR', 'NEHEMIAH': 'NEH', 'ESTHER': 'EST', 'JOB': 'JOB', 'PSALMS': 'PSA', 'PSALM': 'PSA',
    'PROVERBS': 'PRO', 'ECCLESIASTES': 'ECC', 'SONG OF SOLOMON': 'SNG', 'ISAIAH': 'ISA', 'JEREMIAH': 'JER',
    'LAMENTATIONS': 'LAM', 'EZEKIEL': 'EZK', 'DANIEL': 'DAN', 'HOSEA': 'HOS', 'JOEL': 'JOL',
    'AMOS': 'AMO', 'OBADIAH': 'OBA', 'JONAH': 'JON', 'MICAH': 'MIC', 'NAHUM': 'NAM',
    'HABAKKUK': 'HAB', 'ZEPHANIAH': 'ZEP', 'HAGGAI': 'HAG', 'ZECHARIAH': 'ZEC', 'MALACHI': 'MAL',
    'MATTHEW': 'MAT', 'MARK': 'MRK', 'LUKE': 'LUK', 'JOHN': 'JHN', 'ACTS': 'ACT',
    'ROMANS': 'ROM', '1 CORINTHIANS': '1CO', '2 CORINTHIANS': '2CO', 'GALATIANS': 'GAL',
    'EPHESIANS': 'EPH', 'PHILIPPIANS': 'PHP', 'COLOSSIANS': 'COL', '1 THESSALONIANS': '1TH',
    '2 THESSALONIANS': '2TH', '1 TIMOTHY': '1TI', '2 TIMOTHY': '2TI', 'TITUS': 'TIT',
    'PHILEMON': 'PHM', 'HEBREWS': 'HEB', 'JAMES': 'JAS', '1 PETER': '1PE', '2 PETER': '2PE',
    '1 JOHN': '1JN', '2 JOHN': '2JN', '3 JOHN': '3JN', 'JUDE': 'JUD', 'REVELATION': 'REV'
  };

  // Match e.g. "Ephesians 4:16" or "1 Corinthians 13:4" or "Psalms 23"
  const match = normalized.match(/^((?:[1-3]\s+)?[A-Z\s]+?)\s+(\d+)(?::(\d+))?/);
  if (!match) return null;

  const bookName = match[1].trim();
  const chapter = parseInt(match[2], 10) || 1;
  const bookId = bookMap[bookName] || 'EPH';

  return { bookId, chapter };
};

export const KINGDOM_MEDIA_CATEGORIES = [
  'All',
  'JHOW Sermons & Live',
  'High Praise & Worship',
  'Youth Ignition Praise',
  'Urban Gospel & Classics',
  'Deliverance & Warfare',
  'Bible Book Overviews'
] as const;

export const CANONICAL_MEDIA_VAULT: VideoMediaItem[] = [
  {
    id: 'jhow_annual_celebration',
    youtubeId: 'rCSwaCZsAHg',
    title: 'Rebuilding Better Together — 2026 Annual Theme Celebration',
    speaker: 'Joshua House of Worship (San Antonio)',
    artist: 'Joshua House of Worship',
    category: 'JHOW Sermons & Live',
    duration: '1:12:45',
    thematicFocus: 'Ephesians 4:16 — Every joint supplying growth and edifying the body in love.',
    scriptureRef: 'Ephesians 4:16',
    isJhowOfficial: true,
    lyricsSnippet: 'From whom the whole body fitly joined together and compacted by that which every joint supplieth.',
    description: 'The definitive kickoff message for 2026 at Joshua House of Worship, outlining our apostolic mandate to rebuild the youth and young adult discipleship altar.'
  },
  {
    id: 'jhow_sermon_relaunch',
    youtubeId: 'jD36AIKAqp4',
    title: 'Welcome to The Relaunch — Stepping Into Divine Momentum',
    speaker: 'Joshua House of Worship',
    artist: 'Joshua House of Worship',
    category: 'JHOW Sermons & Live',
    duration: '58:30',
    thematicFocus: 'Isaiah 43:19 — Behold, I will do a new thing; now it shall spring forth.',
    scriptureRef: 'Isaiah 43:19',
    isJhowOfficial: true,
    lyricsSnippet: 'Remember ye not the former things, neither consider the things of old.',
    description: 'Pastor and facilitators declaring the season of acceleration and renewed momentum for young disciples.'
  },
  {
    id: 'jhow_sunday_worship',
    youtubeId: 'C5q1LSCTD88',
    title: 'Sunday Worship Encounter & Word of Truth',
    speaker: 'Joshua House of Worship',
    artist: 'Joshua House Worship Collective',
    category: 'JHOW Sermons & Live',
    duration: '1:25:10',
    thematicFocus: 'John 4:24 — God is a Spirit: and they that worship Him must worship in spirit and truth.',
    scriptureRef: 'John 4:24',
    isJhowOfficial: true,
    description: 'Consecrated live worship, spontaneous altar adoration, and deep systematic teaching.'
  },
  {
    id: 'jhow_altar_fire',
    youtubeId: 'v8P20q9Z14A',
    title: 'Altar Fire: The Power of Persistent Intercession',
    speaker: 'Joshua House of Worship',
    artist: 'Joshua House of Worship',
    category: 'JHOW Sermons & Live',
    duration: '1:18:40',
    thematicFocus: 'Leviticus 6:13 — The fire shall ever be burning upon the altar; it shall never go out.',
    scriptureRef: 'Leviticus 6:13',
    isJhowOfficial: true,
    description: 'A clarion call to holy prayer, spiritual discipline, and uncompromising faith in daily devotion.'
  },
  {
    id: 'mcreynolds_not_lucky',
    youtubeId: 'bB4oZlDau4g',
    title: 'Not Lucky, I’m Loved — Worship & Testimony',
    artist: 'Jonathan McReynolds',
    speaker: 'Jonathan McReynolds',
    category: 'High Praise & Worship',
    duration: '4:25',
    thematicFocus: 'Romans 8:38-39 — Nor height nor depth shall be able to separate us from the love of God.',
    scriptureRef: 'Romans 8:38',
    lyricsSnippet: 'I’m not lucky, I am loved. Hands down, grace has found me.',
    lyricsText: `I’m not lucky, I am loved\nHands down, grace has found me\nI am not lucky, I am loved by the King of Kings\nGrace found me in the valley; mercy pulled me into His light\nEvery joint supplies, the body fitly joined together\nRebuilding better together, rooted in holy love and apostolic truth\nGlory in the church throughout all ages, world without end\nHoly fire ignited in our hearts; we will not grow cold`
  },
  {
    id: 'elevation_goodbye_yesterday',
    youtubeId: 'I41mcfilEKQ',
    title: 'Goodbye Yesterday — High Energy Praise',
    artist: 'ELEVATION RHYTHM',
    speaker: 'ELEVATION RHYTHM',
    category: 'Youth Ignition Praise',
    duration: '3:40',
    thematicFocus: '2 Corinthians 5:17 — Old things are passed away; behold, all things are become new.',
    scriptureRef: '2 Corinthians 5:17',
    lyricsSnippet: 'Goodbye yesterday, you can’t hold me back no more. I am alive in Christ!',
    lyricsText: `Goodbye yesterday, you can’t hold me back no more\nI am alive in Christ, walking in the light of His glory\nThe old has passed away, behold all things are become new\nWalking in kingdom authority and Holy Ghost power\nJesus broke the chains, now I am free indeed`
  },
  {
    id: 'bibleproject_ephesians',
    youtubeId: '1O4bT3Zt7sM',
    title: 'Ephesians Visual Guide: One New Humanity',
    speaker: 'BibleProject',
    category: 'Bible Book Overviews',
    duration: '8:45',
    thematicFocus: 'Ephesians 4:1-16 — Walking worthy of the calling, unity in the body, armor of God.',
    scriptureRef: 'Ephesians 4:1',
    description: 'Visual theology unfolding Paul’s message of reconciliation, unity, and the whole armor of God.'
  },
  {
    id: 'bibleproject_daniel',
    youtubeId: 'm8m6A9bMfq4',
    title: 'Daniel Visual Guide: God Rules the Nations',
    speaker: 'BibleProject',
    category: 'Bible Book Overviews',
    duration: '8:50',
    thematicFocus: 'Daniel 2:44 — The God of heaven shall set up a kingdom which shall never be destroyed.',
    scriptureRef: 'Daniel 2:44',
    description: 'Prophetic succession, Babylonian exile, and the Everlasting Stone Kingdom.'
  },
  {
    id: 'forrest_frank_god_is_good',
    youtubeId: 'q5m09rqOoxE',
    title: 'GOD IS GOOD — Joy in the Lord',
    artist: 'Forrest Frank',
    speaker: 'Forrest Frank',
    category: 'High Praise & Worship',
    duration: '3:15',
    thematicFocus: 'Psalm 100:5 — For the Lord is good; his mercy is everlasting.',
    scriptureRef: 'Psalms 100:5',
    lyricsSnippet: 'God is good all the time, and all the time God is good.'
  },
  {
    id: 'chandler_moore_jireh',
    youtubeId: 'mC-zw0zCCtg',
    title: 'Jireh — More Than Enough',
    artist: 'Elevation Worship & Maverick City Music',
    speaker: 'Chandler Moore & Naomi Raine',
    category: 'High Praise & Worship',
    duration: '9:58',
    thematicFocus: 'Philippians 4:19 — But my God shall supply all your need according to his riches in glory.',
    scriptureRef: 'Philippians 4:19',
    lyricsSnippet: 'I will be content in every circumstance, You are Jireh, You are enough.'
  },
  {
    id: 'tasha_cobbs_break_every_chain',
    youtubeId: 'E_kUuC2Bv2Y',
    title: 'Break Every Chain — Altar Warfare Praise',
    artist: 'Tasha Cobbs Leonard',
    speaker: 'Tasha Cobbs Leonard',
    category: 'Deliverance & Warfare',
    duration: '8:19',
    thematicFocus: 'Acts 16:26 — And immediately all the doors were opened, and every one’s bands were loosed.',
    scriptureRef: 'Acts 16:26',
    lyricsSnippet: 'There is power in the name of Jesus to break every chain, break every chain.'
  },
  {
    id: 'cece_winans_goodness_of_god',
    youtubeId: '9sE5kEnitqE',
    title: 'Goodness of God — Live Worship',
    artist: 'CeCe Winans',
    speaker: 'CeCe Winans',
    category: 'High Praise & Worship',
    duration: '4:56',
    thematicFocus: 'Psalm 23:6 — Surely goodness and mercy shall follow me all the days of my life.',
    scriptureRef: 'Psalms 23:6',
    lyricsSnippet: 'With every breath that I am able, I will sing of the goodness of God.'
  },
  {
    id: 'pastor_mike_jr_bigness',
    youtubeId: 'L8g3TqA6Dfg',
    title: 'BIGNESS OF GOD — Praise Celebration',
    artist: 'Pastor Mike Jr.',
    speaker: 'Pastor Mike Jr.',
    category: 'Urban Gospel & Classics',
    duration: '4:12',
    thematicFocus: 'Psalm 145:3 — Great is the Lord, and greatly to be praised.',
    scriptureRef: 'Psalms 145:3'
  },
  {
    id: 'brandon_lake_gratitude',
    youtubeId: 'dQw3eYx3fP8',
    title: 'Gratitude — Halleluiah Song',
    artist: 'Brandon Lake',
    speaker: 'Brandon Lake',
    category: 'High Praise & Worship',
    duration: '5:37',
    thematicFocus: 'Psalm 103:1 — Bless the Lord, O my soul: and all that is within me, bless his holy name.',
    scriptureRef: 'Psalms 103:1'
  },
  {
    id: 'toby_mac_help_is_on_way',
    youtubeId: 'U2eU8_L4Qzg',
    title: 'Help Is On The Way (Maybe Midnight)',
    artist: 'TobyMac',
    speaker: 'TobyMac',
    category: 'Youth Ignition Praise',
    duration: '3:30',
    thematicFocus: 'Psalm 121:2 — My help cometh from the Lord, which made heaven and earth.',
    scriptureRef: 'Psalms 121:2'
  }
];

export const KINGDOM_MEDIA_ITEMS = CANONICAL_MEDIA_VAULT;
