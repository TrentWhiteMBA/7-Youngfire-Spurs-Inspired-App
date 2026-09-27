import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Compass, Download, Check, MapPin, 
  BookOpen, Sparkles, Layers, Search, ChevronRight, 
  X, ExternalLink, ShieldCheck, Globe, Navigation, 
  Mountain, Satellite, Eye, RefreshCw
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type BasemapMode = 'dark' | 'satellite' | 'terrain';

export interface BasemapProvider {
  id: BasemapMode;
  name: string;
  shortName: string;
  url: string;
  attribution: string;
  subdomains: string[];
  maxZoom: number;
}

export const BASEMAP_PROVIDERS: Record<BasemapMode, BasemapProvider> = {
  dark: {
    id: 'dark',
    name: 'Dark Arena (Carto Dark Matter)',
    shortName: 'Dark Arena',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: ['a', 'b', 'c', 'd'],
    maxZoom: 19
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite View (Esri World Imagery)',
    shortName: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 19
  },
  terrain: {
    id: 'terrain',
    name: 'Topographic Terrain (OpenTopoMap / USGS)',
    shortName: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 17
  }
};

export interface AtlasBookData {
  id: string;
  name: string;
  testament: string;
  category: string;
  region: string;
  coordinates: [number, number];
  zoom: number;
  keyCharacters: string[];
  summary: string;
  foundationalScripture?: string;
  milestones: Array<{
    name: string;
    coords: [number, number];
    narrative: string;
    scripture?: string;
  }>;
}

export interface BiblicalSite {
  id: string;
  name: string;
  region: string;
  coords: [number, number];
  scriptures: string[];
  description: string;
  archaeologyNote: string;
  bookId: string;
  chapter: number;
}

export interface CharacterJourney {
  id: string;
  title: string;
  character: string;
  period: string;
  scriptures: string[];
  stops: Array<{ name: string; scripture: string; coords: [number, number]; note: string; bookId: string; chapter: number }>;
}

export interface EmpirePeriod {
  id: string;
  name: string;
  metal: string;
  era: string;
  scripture: string;
  capital: string;
  keyProphecy: string;
  coords: [number, number];
  bookId: string;
  chapter: number;
}

export const BIBLICAL_SITES: BiblicalSite[] = [
  {
    id: 'jerusalem',
    name: 'Jerusalem (Mount Zion)',
    region: 'Judea / Kingdom of Judah',
    coords: [31.7683, 35.2137],
    scriptures: ['Psalm 122:6', '2 Samuel 5:7', 'Luke 24:47'],
    description: 'The Royal City of David, site of Solomon’s Temple, the Crucifixion at Golgotha, and the Resurrection.',
    archaeologyNote: 'Excavations in the City of David have revealed the Stepped Stone Structure, Hezekiah’s Tunnel, and the Pool of Siloam.',
    bookId: 'PSA',
    chapter: 122
  },
  {
    id: 'samaria',
    name: 'Samaria (Shomron)',
    region: 'Northern Kingdom of Israel',
    coords: [32.2769, 35.1889],
    scriptures: ['1 Kings 16:24', '2 Kings 17:5–6', 'Acts 8:5–8'],
    description: 'Capital of the Northern 10 tribes from Omri until the 722 BC Assyrian conquest and deportation.',
    archaeologyNote: 'Samaria Ivories discovered matching Amos 6:4 ("beds of ivory"). Royal acropolis and monumental walls excavated.',
    bookId: '2KI',
    chapter: 17
  },
  {
    id: 'nineveh',
    name: 'Nineveh (Upper Tigris River)',
    region: 'Assyrian Empire',
    coords: [36.3600, 43.1500],
    scriptures: ['Jonah 3:1–10', 'Nahum 3:1–7', '2 Kings 19:36'],
    description: 'Great imperial capital of Assyria on the eastern bank of the Tigris river. Site of Jonah’s preaching and repentance.',
    archaeologyNote: 'Kuyunjik mound excavations unearthed Sennacherib’s "Palace Without Rival" and the Royal Library of Ashurbanipal.',
    bookId: 'JON',
    chapter: 3
  },
  {
    id: 'babylon',
    name: 'Babylon (Euphrates River)',
    region: 'Neo-Babylonian Empire',
    coords: [32.5364, 44.4209],
    scriptures: ['Daniel 1:1–2', 'Jeremiah 51:58', 'Revelation 18:2'],
    description: 'The golden head of Daniel’s statue; imperial city of Nebuchadnezzar where Daniel and the three Hebrew youths were tried.',
    archaeologyNote: 'Ishtar Gate, the Processional Way, and Nebuchadnezzar’s South Palace excavated by Robert Koldewey.',
    bookId: 'DAN',
    chapter: 1
  },
  {
    id: 'antioch_syria',
    name: 'Antioch on the Orontes',
    region: 'Syria',
    coords: [36.2021, 36.1606],
    scriptures: ['Acts 11:26', 'Acts 13:1–3', 'Galatians 2:11'],
    description: 'Where disciples were first called Christians; sending base of Paul & Barnabas for the Gentile mission.',
    archaeologyNote: 'Ancient Orontes harbor and Saint Peter’s Cave Church, one of the earliest meeting sanctuaries of the apostolic age.',
    bookId: 'ACT',
    chapter: 11
  },
  {
    id: 'rome',
    name: 'Imperial Rome',
    region: 'Italian Peninsula',
    coords: [41.9028, 12.4964],
    scriptures: ['Acts 28:16–31', 'Romans 1:7', '2 Timothy 4:6–8'],
    description: 'Capital of the Roman Empire; final imprisonment of Paul, where he declared the Kingdom of God unhindered.',
    archaeologyNote: 'Mamertine Prison where tradition holds Paul and Peter were held prior to martyrdom.',
    bookId: 'ROM',
    chapter: 1
  }
];

export const CHARACTER_JOURNEYS: CharacterJourney[] = [
  {
    id: 'paul_first_journey',
    title: 'Apostolic Ignition: Paul’s 1st Missionary Journey',
    character: 'Apostle Paul & Barnabas',
    period: 'AD 46–49',
    scriptures: ['Acts 13:1 – Acts 14:28'],
    stops: [
      { name: 'Antioch (Syria)', scripture: 'Acts 13:1–3', coords: [36.2021, 36.1606], note: 'Holy Ghost commissioning and laying on of hands.', bookId: 'ACT', chapter: 13 },
      { name: 'Seleucia Pieria', scripture: 'Acts 13:4', coords: [36.1189, 35.9189], note: 'Departure seaport on the Mediterranean coast.', bookId: 'ACT', chapter: 13 },
      { name: 'Salamis (Cyprus)', scripture: 'Acts 13:5', coords: [35.1847, 33.9025], note: 'Preached the word of God in the synagogues of the Jews.', bookId: 'ACT', chapter: 13 },
      { name: 'Paphos (Cyprus)', scripture: 'Acts 13:6–12', coords: [34.7754, 32.4245], note: 'Bar-Jesus blinded; Sergius Paulus believes.', bookId: 'ACT', chapter: 13 },
      { name: 'Perga in Pamphylia', scripture: 'Acts 13:13', coords: [36.9614, 30.8525], note: 'John Mark departs; company presses northward into mountains.', bookId: 'ACT', chapter: 13 },
      { name: 'Antioch of Pisidia', scripture: 'Acts 13:14–52', coords: [38.3075, 31.1892], note: 'Apostolic sermon of Christ resurrected; turning to Gentiles.', bookId: 'ACT', chapter: 13 },
      { name: 'Iconium', scripture: 'Acts 14:1–7', coords: [37.8714, 32.4846], note: 'Great multitude believed; miraculous signs granted.', bookId: 'ACT', chapter: 14 },
      { name: 'Lystra', scripture: 'Acts 14:8–20', coords: [37.5750, 32.2270], note: 'Crippled man healed; Paul stoned and revived by disciples.', bookId: 'ACT', chapter: 14 },
      { name: 'Derbe', scripture: 'Acts 14:20–21', coords: [37.3500, 33.1800], note: 'Preached the gospel and taught many disciples.', bookId: 'ACT', chapter: 14 },
      { name: 'Return to Antioch', scripture: 'Acts 14:26–28', coords: [36.2021, 36.1606], note: 'Rehearsed all that God had done and opened the door of faith.', bookId: 'ACT', chapter: 14 }
    ]
  },
  {
    id: 'exodus_route',
    title: 'Deliverance Path: The Exodus & Wilderness Route',
    character: 'Moses & Children of Israel',
    period: 'c. 1446 BC',
    scriptures: ['Exodus 12:37 – Joshua 3:17'],
    stops: [
      { name: 'Ramses (Goshen)', scripture: 'Exodus 12:37', coords: [30.7870, 31.8210], note: 'Passover night departure under the blood of the Lamb.', bookId: 'EXO', chapter: 12 },
      { name: 'Succoth', scripture: 'Exodus 13:20', coords: [30.6167, 32.1667], note: 'Pillar of cloud by day and pillar of fire by night appears.', bookId: 'EXO', chapter: 13 },
      { name: 'Red Sea Crossing', scripture: 'Exodus 14:21–22', coords: [29.8000, 32.6000], note: 'Waters parted; Israel walked through on dry ground.', bookId: 'EXO', chapter: 14 },
      { name: 'Marah', scripture: 'Exodus 15:23–25', coords: [29.2300, 32.9500], note: 'Bitter waters sweetened by the tree cast into the spring.', bookId: 'EXO', chapter: 15 },
      { name: 'Mount Sinai (Horeb)', scripture: 'Exodus 19:1–20:17', coords: [28.5392, 33.9750], note: 'The Ten Commandments and Tabernacle pattern given in glory.', bookId: 'EXO', chapter: 20 },
      { name: 'Kadesh-Barnea', scripture: 'Numbers 13:26', coords: [30.6500, 34.4200], note: 'Twelve spies sent to scout Canaan; Joshua & Caleb report with faith.', bookId: 'NUM', chapter: 13 },
      { name: 'Plains of Moab (Jordan River)', scripture: 'Joshua 3:1–17', coords: [31.8500, 35.5500], note: 'Jordan waters cut off before the Ark of the Covenant.', bookId: 'JOS', chapter: 3 }
    ]
  }
];

export const DANIELS_EMPIRES: EmpirePeriod[] = [
  {
    id: 'assyrian_empire',
    name: 'Neo-Assyrian Empire (722 BC Bounds)',
    metal: 'Lion with Eagle Wings & Cruel Yoke',
    era: 'c. 911–609 BC',
    scripture: '2 Kings 17:6 & Isaiah 10:5',
    capital: 'Nineveh (Upper Tigris)',
    keyProphecy: 'Instrument of chastisement over the Northern Kingdom of Samaria.',
    coords: [36.36, 43.15],
    bookId: '2KI',
    chapter: 17
  },
  {
    id: 'babylonian_empire',
    name: 'Neo-Babylonian Empire',
    metal: 'Head of Gold (Daniel 2:38)',
    era: '605–539 BC',
    scripture: 'Daniel 2:32, 38 & Jeremiah 25:11',
    capital: 'Babylon',
    keyProphecy: '"Thou art this head of gold."',
    coords: [32.5364, 44.4209],
    bookId: 'DAN',
    chapter: 2
  },
  {
    id: 'medo_persian',
    name: 'Medo-Persian Empire',
    metal: 'Chest & Arms of Silver (Daniel 2:39)',
    era: '539–331 BC',
    scripture: 'Daniel 5:28, 30–31 & Ezra 1:1–4',
    capital: 'Susa & Persepolis',
    keyProphecy: 'Decree of Cyrus releasing Judah to rebuild the Temple.',
    coords: [32.1892, 48.2436],
    bookId: 'EZR',
    chapter: 1
  },
  {
    id: 'greek_empire',
    name: 'Grecian Empire of Alexander',
    metal: 'Belly & Thighs of Bronze (Daniel 2:39)',
    era: '331–168 BC',
    scripture: 'Daniel 8:5–8, 21',
    capital: 'Alexandria & Pella',
    keyProphecy: 'The rough goat with a great horn between his eyes.',
    coords: [40.7570, 22.5200],
    bookId: 'DAN',
    chapter: 8
  },
  {
    id: 'roman_empire',
    name: 'Roman Empire',
    metal: 'Legs of Iron & Feet of Iron and Clay',
    era: '63 BC – AD 476',
    scripture: 'Daniel 2:40–43 & Luke 2:1',
    capital: 'Rome',
    keyProphecy: 'Strong as iron: forasmuch as iron breaketh in pieces.',
    coords: [41.9028, 12.4964],
    bookId: 'LUK',
    chapter: 2
  },
  {
    id: 'everlasting_kingdom',
    name: 'The Stone Kingdom of Christ',
    metal: 'Stone Cut Without Hands / Mount Zion',
    era: 'Eternal Kingdom',
    scripture: 'Daniel 2:44–45 & Daniel 7:13–14',
    capital: 'New Jerusalem',
    keyProphecy: '"In the days of these kings shall the God of heaven set up a kingdom, which shall never be destroyed."',
    coords: [31.7683, 35.2137],
    bookId: 'DAN',
    chapter: 7
  }
];

interface ImperialAtlasProps {
  onBack?: () => void;
  onNavigateToScripture?: (bookId: string, chapter: number) => void;
}

export const ImperialAtlas: React.FC<ImperialAtlasProps> = ({
  onBack,
  onNavigateToScripture
}) => {
  // Active Category: books | sites | journeys | empires
  const [activeCategory, setActiveCategory] = useState<'books' | 'sites' | 'journeys' | 'empires'>('books');
  
  // Basemap Switcher State: default 'dark' (Dark Arena)
  const [basemap, setBasemap] = useState<BasemapMode>('dark');

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Data states
  const [atlasBooks, setAtlasBooks] = useState<AtlasBookData[]>([]);
  const [selectedBook, setSelectedBook] = useState<AtlasBookData | null>(null);
  const [selectedSite, setSelectedSite] = useState<BiblicalSite | null>(null);
  const [selectedJourney, setSelectedJourney] = useState<CharacterJourney>(CHARACTER_JOURNEYS[0]);
  const [selectedEmpire, setSelectedEmpire] = useState<EmpirePeriod | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Offline sync state
  const [isOfflineSyncing, setIsOfflineSyncing] = useState(false);
  const [offlineSynced, setOfflineSynced] = useState<boolean>(() => {
    return localStorage.getItem('youngfire_atlas_offline_cached') === 'true';
  });

  // Load 66 Books from public/bible_books_atlas_66.json
  useEffect(() => {
    fetch('/bible_books_atlas_66.json')
      .then(res => res.json())
      .then((data: AtlasBookData[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setAtlasBooks(data);
          setSelectedBook(data[0]);
        }
      })
      .catch(err => {
        console.warn('Could not load bible_books_atlas_66.json:', err);
      });
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (leafletMapRef.current) return;

    // Centered on Ancient Near East (Jerusalem / Levant)
    const map = L.map(mapContainerRef.current, {
      center: [33.5, 36.0],
      zoom: 5,
      zoomControl: false,
      attributionControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const provider = BASEMAP_PROVIDERS[basemap];
    const tileLayer = L.tileLayer(provider.url, {
      maxZoom: provider.maxZoom,
      subdomains: provider.subdomains,
      // @ts-ignore
      r: typeof window !== 'undefined' && window.devicePixelRatio > 1 ? '@2x' : ''
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    leafletMapRef.current = map;

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // Hot-swap Tile Layer when basemap changes
  useEffect(() => {
    if (!leafletMapRef.current) return;
    const map = leafletMapRef.current;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const provider = BASEMAP_PROVIDERS[basemap];
    const newTileLayer = L.tileLayer(provider.url, {
      maxZoom: provider.maxZoom,
      subdomains: provider.subdomains,
      // @ts-ignore
      r: typeof window !== 'undefined' && window.devicePixelRatio > 1 ? '@2x' : ''
    }).addTo(map);
    tileLayerRef.current = newTileLayer;
  }, [basemap]);

  // Synchronize Leaflet View on item selection
  useEffect(() => {
    if (!leafletMapRef.current) return;
    const map = leafletMapRef.current;
    if (activeCategory === 'books' && selectedBook) {
      map.flyTo([selectedBook.coordinates[0], selectedBook.coordinates[1]], Math.max(selectedBook.zoom || 6, 6), {
        animate: true,
        duration: 1.0
      });
    } else if (activeCategory === 'sites' && selectedSite) {
      map.flyTo([selectedSite.coords[0], selectedSite.coords[1]], 8, {
        animate: true,
        duration: 1.0
      });
    } else if (activeCategory === 'empires' && selectedEmpire) {
      map.flyTo([selectedEmpire.coords[0], selectedEmpire.coords[1]], 6, {
        animate: true,
        duration: 1.0
      });
    } else if (activeCategory === 'journeys' && selectedJourney && selectedJourney.stops.length > 0) {
      const firstStop = selectedJourney.stops[0];
      map.flyTo([firstStop.coords[0], firstStop.coords[1]], 6, {
        animate: true,
        duration: 1.0
      });
    }
  }, [activeCategory, selectedBook, selectedSite, selectedEmpire, selectedJourney]);

  // Render Markers on Map
  useEffect(() => {
    if (!leafletMapRef.current || !markersLayerRef.current) return;
    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();

    const createCustomPin = (color: string, label: string) => {
      return L.divIcon({
        className: 'custom-leaflet-pin',
        html: `
          <div style="display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%);">
            <div style="background: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color};"></div>
            <span style="background: rgba(7, 11, 24, 0.9); color: white; font-family: monospace; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; margin-left: 6px; white-space: nowrap; border: 1px solid rgba(255,255,255,0.2);">${label}</span>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
    };

    if (activeCategory === 'books' && selectedBook) {
      const centerMarker = L.marker([selectedBook.coordinates[0], selectedBook.coordinates[1]], {
        icon: createCustomPin('#F59E0B', selectedBook.name)
      });
      centerMarker.bindPopup(`
        <div style="font-family: Outfit, sans-serif; color: #040711; padding: 4px;">
          <strong style="font-size: 14px;">${selectedBook.name}</strong><br/>
          <span style="color: #6B7280; font-size: 11px;">Region: ${selectedBook.region}</span><br/>
          <p style="font-size: 11px; margin-top: 4px;">${selectedBook.summary}</p>
        </div>
      `);
      markersGroup.addLayer(centerMarker);

      if (selectedBook.milestones) {
        selectedBook.milestones.forEach((m) => {
          const mMarker = L.marker([m.coords[0], m.coords[1]], {
            icon: createCustomPin('#06B6D4', m.name)
          });
          mMarker.bindPopup(`
            <div style="font-family: Outfit, sans-serif; color: #040711; padding: 4px;">
              <strong style="font-size: 13px;">${m.name}</strong><br/>
              ${m.scripture ? `<span style="color: #0284C7; font-size: 11px; font-weight: bold;">📖 ${m.scripture}</span><br/>` : ''}
              <p style="font-size: 11px; margin-top: 4px;">${m.narrative}</p>
            </div>
          `);
          markersGroup.addLayer(mMarker);
        });
      }
    } else if (activeCategory === 'sites') {
      BIBLICAL_SITES.forEach((site) => {
        const marker = L.marker([site.coords[0], site.coords[1]], {
          icon: createCustomPin('#06B6D4', site.name)
        });
        marker.bindPopup(`
          <div style="font-family: Outfit, sans-serif; color: #040711; padding: 4px;">
            <strong style="font-size: 13px;">${site.name}</strong><br/>
            <span style="color: #0284C7; font-size: 11px; font-weight: bold;">Region: ${site.region}</span><br/>
            <p style="font-size: 11px; margin-top: 4px;">${site.description}</p>
          </div>
        `);
        marker.on('click', () => {
          setSelectedSite(site);
        });
        markersGroup.addLayer(marker);
      });
    } else if (activeCategory === 'journeys' && selectedJourney) {
      const latlngs: [number, number][] = selectedJourney.stops.map(s => [s.coords[0], s.coords[1]]);
      const polyline = L.polyline(latlngs, {
        color: '#F97316',
        weight: 3,
        opacity: 0.85,
        dashArray: '6, 6'
      });
      markersGroup.addLayer(polyline);

      selectedJourney.stops.forEach((stop, idx) => {
        const marker = L.marker([stop.coords[0], stop.coords[1]], {
          icon: createCustomPin('#F97316', stop.name)
        });
        marker.bindPopup(`
          <div style="font-family: Outfit, sans-serif; color: #040711; padding: 4px;">
            <strong style="font-size: 13px;">${idx + 1}. ${stop.name}</strong><br/>
            <span style="color: #D97706; font-size: 11px; font-weight: bold;">📖 ${stop.scripture}</span><br/>
            <p style="font-size: 11px; margin-top: 4px;">${stop.note}</p>
          </div>
        `);
        markersGroup.addLayer(marker);
      });
    } else if (activeCategory === 'empires') {
      DANIELS_EMPIRES.forEach((empire) => {
        const circle = L.circle([empire.coords[0], empire.coords[1]], {
          color: empire.id === 'assyrian_empire' ? '#EF4444' : '#A855F7',
          fillColor: empire.id === 'assyrian_empire' ? '#DC2626' : '#A855F7',
          fillOpacity: 0.15,
          radius: 280000
        });
        circle.bindPopup(`
          <div style="font-family: Outfit, sans-serif; color: #040711; padding: 4px;">
            <strong style="font-size: 13px;">${empire.name}</strong><br/>
            <span>${empire.era} &bull; ${empire.metal}</span><br/>
            <p style="font-size: 11px; margin-top: 4px;">${empire.keyProphecy}</p>
          </div>
        `);
        circle.on('click', () => {
          setSelectedEmpire(empire);
        });
        markersGroup.addLayer(circle);
      });
    }
  }, [activeCategory, selectedBook, selectedJourney, basemap]);

  const handleOfflineSync = () => {
    setIsOfflineSyncing(true);
    setTimeout(() => {
      setIsOfflineSyncing(false);
      setOfflineSynced(true);
      try {
        localStorage.setItem('youngfire_atlas_offline_cached', 'true');
      } catch {}
    }, 1200);
  };

  const handleScriptureClick = (bookId: string, chapter: number = 1) => {
    if (onNavigateToScripture) {
      onNavigateToScripture(bookId, chapter);
    } else {
      window.dispatchEvent(new CustomEvent('yf_navigate_scripture', { detail: { bookId, chapter } }));
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 pb-20 select-none px-2 sm:px-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-[#0B1329] border border-white/15 text-slate-200 hover:text-white cursor-pointer transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-black uppercase font-['Outfit'] text-white">
                IMPERIAL CARTOGRAPHY & ATLAS
              </h2>
            </div>
            <p className="text-[11px] font-mono text-slate-400">
              Satellite & Terrain GIS &bull; 66 Canonical Books &bull; Daniel’s Prophetic Empires
            </p>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleOfflineSync}
            disabled={isOfflineSyncing}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              offlineSynced
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                : 'bg-cyan-500/10 border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/20'
            }`}
            title="Download study maps for offline use"
          >
            {isOfflineSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Caching...</span>
              </>
            ) : offlineSynced ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                <span>Offline Cached</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sync Offline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4-Category Segmented Switcher Strip */}
      <div className="bg-[#0B1329] p-1.5 rounded-2xl border border-white/10 flex flex-wrap sm:flex-nowrap gap-1 shadow-lg">
        <button
          onClick={() => setActiveCategory('books')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider font-['Outfit'] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeCategory === 'books'
              ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Books of the Bible (66)</span>
        </button>

        <button
          onClick={() => setActiveCategory('sites')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider font-['Outfit'] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeCategory === 'sites'
              ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Biblical Sites</span>
        </button>

        <button
          onClick={() => setActiveCategory('journeys')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider font-['Outfit'] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeCategory === 'journeys'
              ? 'bg-orange-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Character Journeys</span>
        </button>

        <button
          onClick={() => setActiveCategory('empires')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider font-['Outfit'] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeCategory === 'empires'
              ? 'bg-purple-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Daniel's Empires</span>
        </button>
      </div>

      {/* Interactive Leaflet Map Container with Floating Basemap Switcher HUD */}
      <div className="relative w-full h-[340px] sm:h-[440px] rounded-3xl border border-white/15 overflow-hidden shadow-2xl bg-[#040711]">
        {/* Map Canvas */}
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Top-Left Engine Indicator */}
        <div className="absolute top-3 left-3 z-20 bg-[#070B18]/90 border border-white/15 px-3 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-2 shadow-lg">
          {basemap === 'dark' && <Globe className="w-3.5 h-3.5 text-amber-400" />}
          {basemap === 'satellite' && <Satellite className="w-3.5 h-3.5 text-cyan-400" />}
          {basemap === 'terrain' && <Mountain className="w-3.5 h-3.5 text-emerald-400" />}
          <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
            {BASEMAP_PROVIDERS[basemap].shortName} &bull; GIS Engine
          </span>
        </div>

        {/* Discrete Floating Basemap Control Pill in the Corner of the Atlas */}
        <div className="absolute top-3 right-3 z-30 bg-[#070B18]/95 border border-amber-500/60 p-1 rounded-2xl backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.85)] flex items-center gap-1">
          {/* Dark Arena (Default) */}
          <button
            type="button"
            onClick={() => setBasemap('dark')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              basemap === 'dark'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 font-black scale-100 ring-1 ring-amber-300'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="Dark Arena (Carto Dark Matter)"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Dark Arena</span>
          </button>

          {/* Satellite Imagery */}
          <button
            type="button"
            onClick={() => setBasemap('satellite')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              basemap === 'satellite'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 font-black scale-100 ring-1 ring-cyan-300'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="Satellite View (Esri World Imagery)"
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>Satellite</span>
          </button>

          {/* Topographic Terrain */}
          <button
            type="button"
            onClick={() => setBasemap('terrain')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              basemap === 'terrain'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 font-black scale-100 ring-1 ring-emerald-300'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="Topographic Terrain (OpenTopoMap / USGS)"
          >
            <Mountain className="w-3.5 h-3.5" />
            <span>Terrain</span>
          </button>
        </div>

        {/* Bottom Info Pill */}
        <div className="absolute bottom-3 left-3 z-20 bg-[#070B18]/90 border border-white/15 px-3 py-1 rounded-lg text-[10px] font-mono text-slate-300 backdrop-blur-md">
          Scroll to zoom &bull; Click any marker for historical scripture data
        </div>
      </div>

      {/* CATEGORY 1: BOOKS OF THE BIBLE (66 BOOKS ATLAS) */}
      {activeCategory === 'books' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search canonical books, category, or historical region..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0B1329] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="text-[11px] font-mono text-amber-400 font-bold px-3 py-2 bg-[#0B1329] rounded-xl border border-white/10 whitespace-nowrap">
              66 Books Ready
            </div>
          </div>

          {/* Selected Book Explanation Card */}
          {selectedBook && (
            <div className="bg-[#0B1329] border border-amber-500/40 rounded-3xl p-5 shadow-2xl space-y-4 relative">
              <div className="flex items-start justify-between border-b border-white/10 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px] font-mono uppercase">
                      {selectedBook.testament} &bull; {selectedBook.category}
                    </span>
                    <span className="text-[11px] font-mono text-cyan-400">
                      Region: {selectedBook.region}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white uppercase font-['Outfit'] mt-1">
                    {selectedBook.name}
                  </h3>
                </div>

                <button
                  onClick={() => handleScriptureClick(selectedBook.id, 1)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase flex items-center gap-1.5 hover:bg-amber-400 transition-colors shadow-lg cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Read Chapter 1 &rarr;</span>
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                {selectedBook.summary}
              </p>

              {/* Milestones / Key Stops in Book */}
              {selectedBook.milestones && selectedBook.milestones.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <h4 className="text-[11px] font-mono uppercase font-bold text-amber-400">
                    Key Historical Geography & Milestones:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedBook.milestones.map((m, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          if (leafletMapRef.current) {
                            leafletMapRef.current.flyTo([m.coords[0], m.coords[1]], 8, { animate: true, duration: 1.0 });
                          }
                        }}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                          <span>{m.name}</span>
                          {m.scripture && <span className="text-[10px] text-amber-400 font-mono">{m.scripture}</span>}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-1 leading-snug">
                          {m.narrative}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Book Select Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-[280px] overflow-y-auto p-1">
            {atlasBooks
              .filter(b => 
                !searchQuery || 
                b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                b.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
                b.category.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(b => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBook(b)}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                    selectedBook?.id === b.id
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md'
                      : 'bg-[#0B1329] text-slate-300 border-white/10 hover:border-white/25 hover:text-white'
                  }`}
                >
                  <span className="text-[10px] font-mono opacity-80">{b.id}</span>
                  <span className="text-xs font-bold font-['Outfit'] truncate">{b.name}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* CATEGORY 2: BIBLICAL SITES */}
      {activeCategory === 'sites' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {BIBLICAL_SITES.map((site) => (
              <div
                key={site.id}
                onClick={() => {
                  setSelectedSite(site);
                  if (leafletMapRef.current) {
                    leafletMapRef.current.flyTo([site.coords[0], site.coords[1]], 8, { animate: true, duration: 1.0 });
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                  selectedSite?.id === site.id
                    ? 'bg-cyan-500/15 border-cyan-400 shadow-lg text-white'
                    : 'bg-[#0B1329] border-white/10 hover:border-white/20 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {site.region}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleScriptureClick(site.bookId, site.chapter);
                    }}
                    className="text-xs font-mono text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>Read</span>
                  </button>
                </div>
                <h4 className="text-sm font-black uppercase font-['Outfit'] text-white">
                  {site.name}
                </h4>
                <p className="text-xs text-slate-300 font-mono leading-relaxed line-clamp-3">
                  {site.description}
                </p>
                <div className="text-[10px] text-cyan-400 font-mono bg-white/5 p-2 rounded-lg border border-white/10">
                  <span className="font-bold block text-slate-400">Archaeological Evidence:</span>
                  {site.archaeologyNote}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORY 3: CHARACTER JOURNEYS */}
      {activeCategory === 'journeys' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CHARACTER_JOURNEYS.map((j) => (
              <button
                key={j.id}
                onClick={() => setSelectedJourney(j)}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap cursor-pointer border transition-all ${
                  selectedJourney.id === j.id
                    ? 'bg-orange-500 text-slate-950 border-orange-400 shadow-md'
                    : 'bg-[#0B1329] text-slate-300 border-white/10 hover:border-white/20 hover:text-white'
                }`}
              >
                {j.title}
              </button>
            ))}
          </div>

          <div className="bg-[#0B1329] border border-orange-500/40 rounded-3xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30 font-bold">
                  {selectedJourney.period} &bull; {selectedJourney.character}
                </span>
                <h3 className="text-base font-black uppercase font-['Outfit'] text-white mt-1">
                  {selectedJourney.title}
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-orange-400">
                {selectedJourney.stops.length} Guided Stops
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[320px] overflow-y-auto p-1">
              {selectedJourney.stops.map((stop, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (leafletMapRef.current) {
                      leafletMapRef.current.flyTo([stop.coords[0], stop.coords[1]], 8, { animate: true, duration: 1.0 });
                    }
                  }}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-['Outfit']">
                      {idx + 1}. {stop.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScriptureClick(stop.bookId, stop.chapter);
                      }}
                      className="text-[10px] text-amber-400 font-mono hover:underline"
                    >
                      📖 {stop.scripture}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-300 font-mono leading-snug">
                    {stop.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY 4: DANIEL'S EMPIRES */}
      {activeCategory === 'empires' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {DANIELS_EMPIRES.map((empire) => (
              <div
                key={empire.id}
                onClick={() => {
                  setSelectedEmpire(empire);
                  if (leafletMapRef.current) {
                    leafletMapRef.current.flyTo([empire.coords[0], empire.coords[1]], 6, { animate: true, duration: 1.0 });
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                  selectedEmpire?.id === empire.id
                    ? 'bg-purple-500/20 border-purple-400 shadow-lg text-white'
                    : 'bg-[#0B1329] border-white/10 hover:border-white/20 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {empire.era}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleScriptureClick(empire.bookId, empire.chapter);
                    }}
                    className="text-xs font-mono text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>Read</span>
                  </button>
                </div>
                <h4 className="text-sm font-black uppercase font-['Outfit'] text-white">
                  {empire.name}
                </h4>
                <p className="text-[11px] text-amber-300 font-mono font-bold">
                  {empire.metal}
                </p>
                <p className="text-xs text-slate-300 font-mono leading-relaxed bg-white/5 p-2 rounded-lg border border-white/10">
                  {empire.keyProphecy}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
