import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Crosshair,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Camera,
  Compass,
  Navigation,
  RefreshCw,
  Search,
  Eye,
  SlidersHorizontal,
  Share2,
  Sun,
  Moon,
  Globe
} from 'lucide-react';
import { InfrastructureReport } from '../types';
import {
  getSeverityStyle,
  getStatusStyle,
  calculateDistanceKm,
  formatDistance,
  formatTimeAgo,
  shareReport
} from '../utils/helpers';
import {
  INDONESIA_CITY_PRESETS,
  CityPreset,
  detectPreciseUserLocation,
  UserLocationData,
  getReadableAddress
} from '../utils/locationService';

type MapTileStyle = 'standard' | 'dark' | 'light' | 'satellite';

const TILE_PROVIDERS: Record<MapTileStyle, { url: string; attribution: string; label: string }> = {
  standard: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    label: 'Peta Jalan'
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB & OpenStreetMap',
    label: 'Radar Gelap'
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB & OpenStreetMap',
    label: 'Minimalis'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri & Maxar',
    label: 'Citra Satelit'
  }
};

interface InteractiveLandingMapProps {
  reports: InfrastructureReport[];
  onSelectReport: (reportId: string) => void;
  onNavigateToMap: () => void;
  onOpenReportModal: () => void;
  initialCity?: string;
  initialCategory?: string;
  initialSeverity?: string;
}

export const InteractiveLandingMap: React.FC<InteractiveLandingMapProps> = ({
  reports,
  onSelectReport,
  onNavigateToMap,
  onOpenReportModal,
  initialCity = 'Semua Kota',
  initialCategory = 'Semua Fasilitas',
  initialSeverity = 'Semua Tingkat'
}) => {
  // Filter States
  const [selectedCity, setSelectedCity] = useState<string>(initialCity);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedSeverity, setSelectedSeverity] = useState<string>(initialSeverity);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Map & Location States
  const [mapStyle, setMapStyle] = useState<MapTileStyle>('standard');
  const [userLocation, setUserLocation] = useState<UserLocationData | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [activeReport, setActiveReport] = useState<InfrastructureReport | null>(null);
  const [locationToast, setLocationToast] = useState<string | null>(null);
  const [showIncidentList, setShowIncidentList] = useState<boolean>(true);

  // Leaflet refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);

  // Synchronize with parent props when changed (e.g. from Hero search capsule)
  useEffect(() => {
    if (initialCity && initialCity !== 'Semua Kota') {
      setSelectedCity(initialCity);
    }
  }, [initialCity]);

  useEffect(() => {
    if (initialCategory && initialCategory !== 'Semua Fasilitas') {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    if (initialSeverity && initialSeverity !== 'Semua Tingkat') {
      setSelectedSeverity(initialSeverity);
    }
  }, [initialSeverity]);

  // Compute reports with distance from user
  const reportsWithDistance = useMemo(() => {
    return reports.map((r) => {
      let distanceKm: number | null = null;
      if (userLocation && typeof r.location?.lat === 'number' && typeof r.location?.lng === 'number') {
        distanceKm = calculateDistanceKm(userLocation.lat, userLocation.lng, r.location.lat, r.location.lng);
      }
      return { ...r, distanceKm };
    });
  }, [reports, userLocation]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reportsWithDistance.filter((r) => {
      // Category filter
      if (selectedCategory !== 'Semua Fasilitas' && selectedCategory !== 'Semua' && r.kategori !== selectedCategory) {
        return false;
      }
      // Severity filter
      if (selectedSeverity !== 'Semua Tingkat' && selectedSeverity !== 'Semua' && r.tingkat_keparahan !== selectedSeverity) {
        return false;
      }
      // City filter
      if (selectedCity !== 'Semua Kota' && selectedCity !== 'Semua') {
        const textToSearch = `${r.location.address || ''} ${r.location.city || ''} ${r.kategori}`.toLowerCase();
        if (!textToSearch.includes(selectedCity.toLowerCase())) {
          return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullMatch = `${r.kategori} ${r.deskripsi_otomatis || ''} ${r.deskripsi_manual || ''} ${r.location.address || ''} ${r.ticketNumber}`.toLowerCase();
        if (!fullMatch.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [reportsWithDistance, selectedCategory, selectedSeverity, selectedCity, searchQuery]);

  // Stats
  const criticalCount = useMemo(() => filteredReports.filter(r => r.tingkat_keparahan === 'Berat').length, [filteredReports]);
  const resolvedCount = useMemo(() => filteredReports.filter(r => r.status === 'Selesai').length, [filteredReports]);

  // Handle GPS detection
  const handleDetectGPS = useCallback(async () => {
    setIsLocating(true);
    try {
      const loc = await detectPreciseUserLocation();
      setUserLocation(loc);
      setLocationToast(`GPS Terdeteksi: ${loc.city || 'Koordinat Anda'}`);
      setTimeout(() => setLocationToast(null), 3500);

      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([loc.lat, loc.lng], 14, { animate: true, duration: 1.2 });
      }
    } catch (e) {
      console.warn('GPS Detection error:', e);
      setLocationToast('Gagal mendeteksi GPS. Periksa izin lokasi browser.');
      setTimeout(() => setLocationToast(null), 3500);
    } finally {
      setIsLocating(false);
    }
  }, []);

  // Jump to City preset
  const handleJumpToCity = (city: CityPreset) => {
    setSelectedCity(city.name);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([city.lat, city.lng], 13, {
        animate: true,
        duration: 1.2
      });
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default to Semarang / Jakarta / first report
      const initialLat = reports.length > 0 && reports[0].location?.lat ? reports[0].location.lat : -6.9666;
      const initialLng = reports.length > 0 && reports[0].location?.lng ? reports[0].location.lng : 110.4381;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true
      });

      const provider = TILE_PROVIDERS[mapStyle];
      const tileLayer = L.tileLayer(provider.url, {
        maxZoom: 19,
        attribution: provider.attribution
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Invalidate size after layout mounts
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }
  }, [reports, mapStyle]);

  // Switch Tile Layer when mapStyle changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const provider = TILE_PROVIDERS[mapStyle];
    const newTileLayer = L.tileLayer(provider.url, {
      maxZoom: 19,
      attribution: provider.attribution
    }).addTo(map);
    tileLayerRef.current = newTileLayer;
  }, [mapStyle]);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    group.clearLayers();

    filteredReports.forEach((report) => {
      if (!report.location?.lat || !report.location?.lng) return;
      const { lat, lng } = report.location;
      const isSelected = activeReport?.id === report.id;
      const sev = getSeverityStyle(report.tingkat_keparahan);

      // Custom pulsing interactive HTML pin
      const markerHtml = `
        <div class="cursor-pointer transition-all duration-300 ${isSelected ? 'scale-115 z-50' : 'hover:scale-110'}" style="transform: translate(-50%, -100%);">
          <div class="relative flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-1.5 border-2 ${
            isSelected ? 'border-amber-500 ring-4 ring-amber-500/30' : 'border-stone-200 hover:border-amber-500'
          }">
            <div class="relative w-8 h-8 rounded-xl overflow-hidden shrink-0 bg-stone-100">
              <img src="${report.imageUrl}" alt="${report.kategori}" class="w-full h-full object-cover" crossOrigin="anonymous" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <span class="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full ${sev.dot} ring-1 ring-white"></span>
            </div>
            <div class="pr-2 min-w-0">
              <div class="flex items-center gap-1">
                <span class="text-[10px] font-black tracking-tight text-stone-900 truncate max-w-[120px]">${report.title || report.kategori}</span>
              </div>
              <div class="flex items-center gap-1 text-[9px] font-bold ${
                report.tingkat_keparahan === 'Berat' ? 'text-rose-600' : 'text-amber-600'
              }">
                <span>${report.tingkat_keparahan}</span>
                <span class="text-stone-400">&bull;</span>
                <span class="text-stone-500 truncate max-w-[70px]">${report.ticketNumber}</span>
              </div>
            </div>
          </div>
          <!-- Pointer Pin Arrow -->
          <div class="w-3 h-3 bg-white rotate-45 mx-auto -mt-1.5 border-r-2 border-b-2 ${
            isSelected ? 'border-amber-500' : 'border-stone-800/80'
          }"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-interactive-marker',
        iconSize: [160, 52],
        iconAnchor: [80, 52]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });
      marker.on('click', () => {
        setActiveReport(report);
        map.flyTo([lat, lng], 15, { animate: true, duration: 0.8 });
      });

      group.addLayer(marker);
    });
  }, [filteredReports, activeReport]);

  // Update User Location Dot
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;
    const map = mapInstanceRef.current;
    const { lat, lng } = userLocation;

    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
    if (userCircleRef.current) map.removeLayer(userCircleRef.current);

    // Radar scan circle around user
    const circle = L.circle([lat, lng], {
      radius: 2000,
      color: '#f59e0b',
      fillColor: '#fbbf24',
      fillOpacity: 0.12,
      weight: 1.5,
      dashArray: '6, 6'
    }).addTo(map);
    userCircleRef.current = circle;

    // Pulse GPS Pin
    const userHtml = `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%);">
        <div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background-color: rgba(245, 158, 11, 0.25); animation: ping 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; width: 24px; height: 24px; border-radius: 9999px; background-color: rgba(245, 158, 11, 0.4);"></div>
        <div style="width: 14px; height: 14px; border-radius: 9999px; background-color: #d97706; border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);"></div>
      </div>
    `;

    const userIcon = L.divIcon({
      html: userHtml,
      className: 'gps-user-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker([lat, lng], { icon: userIcon }).addTo(map);
    userMarkerRef.current = marker;
  }, [userLocation]);

  // Center on report when clicked from list
  const handleSelectReportFromList = (report: InfrastructureReport) => {
    setActiveReport(report);
    if (mapInstanceRef.current && report.location?.lat && report.location?.lng) {
      mapInstanceRef.current.flyTo([report.location.lat, report.location.lng], 15, {
        animate: true,
        duration: 0.9
      });
    }
  };

  return (
    <div id="radar-map-section" className="relative w-full rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden bg-stone-900 border border-stone-800 shadow-2xl text-white">
      
      {/* =========================================================
          MAP TOP CONTROL BAR & BRANDING
         ========================================================= */}
      <div className="p-4 sm:p-6 bg-stone-950/80 backdrop-blur-xl border-b border-stone-800/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Title & Live Status */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-black tracking-widest uppercase text-amber-400">
                RADAR SPASIAL INFRASTRUKTUR &bull; PEMANTAUAN REAL-TIME
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Peta Interaktif Kerusakan Jalan &amp; Fasilitas</span>
              <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                {filteredReports.length} Titik
              </span>
            </h3>
            <p className="text-xs text-stone-400 max-w-xl">
              Klik pin kerusakan untuk melihat diagnosa AI, foto asli, tingkat urgensi, serta estimasi rute penanganan dinas.
            </p>
          </div>

          {/* Quick Actions & View Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Tile Layer Selector */}
            <div className="flex items-center bg-stone-900 p-1 rounded-xl border border-stone-800">
              {(['standard', 'dark', 'satellite', 'light'] as MapTileStyle[]).map((style) => (
                <button
                  key={style}
                  onClick={() => setMapStyle(style)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    mapStyle === style
                      ? 'bg-amber-500 text-stone-950 shadow-xs'
                      : 'text-stone-400 hover:text-white'
                  }`}
                  title={TILE_PROVIDERS[style].label}
                >
                  {TILE_PROVIDERS[style].label}
                </button>
              ))}
            </div>

            {/* Locate Me Button */}
            <button
              id="landing-map-gps-btn"
              onClick={handleDetectGPS}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700/80 text-xs font-bold text-stone-200 transition-all active:scale-95 disabled:opacity-50"
              title="Deteksi Lokasi Saya (GPS)"
            >
              <Crosshair className={`h-3.5 w-3.5 text-amber-400 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Mencari...' : 'GPS Saya'}</span>
            </button>

            {/* Toggle Side List */}
            <button
              onClick={() => setShowIncidentList(!showIncidentList)}
              className={`hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                showIncidentList
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-stone-900 border-stone-700/80 text-stone-400'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>{showIncidentList ? 'Tutup Daftar' : 'Daftar Titik'}</span>
            </button>

            {/* Fullscreen Map Route Button */}
            <button
              onClick={onNavigateToMap}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs shadow-md transition-all active:scale-95"
            >
              <Maximize2 className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Buka Layar Penuh</span>
            </button>
          </div>

        </div>

        {/* =========================================================
            CITY QUICK JUMP CHIPS
           ========================================================= */}
        <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 shrink-0 flex items-center gap-1">
            <Compass className="h-3.5 w-3.5 text-amber-400" />
            Lompat Kota:
          </span>
          <button
            onClick={() => setSelectedCity('Semua Kota')}
            className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all ${
              selectedCity === 'Semua Kota'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
            }`}
          >
            Semua Wilayah
          </button>
          {INDONESIA_CITY_PRESETS.slice(0, 6).map((city) => (
            <button
              key={city.name}
              onClick={() => handleJumpToCity(city)}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
                selectedCity === city.name
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                  : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
              }`}
            >
              {city.name}
            </button>
          ))}
        </div>

      </div>

      {/* =========================================================
          MAIN MAP CANVAS & SIDE INCIDENT DRAWER
         ========================================================= */}
      <div className="relative h-[480px] sm:h-[560px] lg:h-[620px] w-full flex overflow-hidden">
        
        {/* Leaflet Map Box */}
        <div className="relative flex-1 h-full w-full">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Floating Zoom Controls on Top-Right */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
            <button
              onClick={() => mapInstanceRef.current?.zoomIn()}
              className="w-8 h-8 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-white flex items-center justify-center font-bold text-base border border-stone-700 shadow-md backdrop-blur-md active:scale-95"
              title="Perbesar"
            >
              +
            </button>
            <button
              onClick={() => mapInstanceRef.current?.zoomOut()}
              className="w-8 h-8 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-white flex items-center justify-center font-bold text-base border border-stone-700 shadow-md backdrop-blur-md active:scale-95"
              title="Perkecil"
            >
              -
            </button>
          </div>

          {/* Toast Notification */}
          {locationToast && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-stone-900/95 text-white px-4 py-2 rounded-full border border-amber-500/50 shadow-2xl text-xs font-bold flex items-center gap-2 backdrop-blur-md animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span>{locationToast}</span>
            </div>
          )}

          {/* Map Overlay Badge: Active City & GPS */}
          <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-2.5 bg-stone-950/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-stone-800 text-xs text-stone-300 shadow-xl">
            <MapPin className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-bold text-white">{selectedCity}</span>
            <span className="text-stone-500">&bull;</span>
            <span className="text-[11px] text-stone-400 font-mono">
              {filteredReports.length} laporan terpantau
            </span>
          </div>

          {/* =========================================================
              FLOATING POPUP CARD FOR SELECTED REPORT
             ========================================================= */}
          {activeReport && (
            <div className="absolute bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-20 bg-stone-950/95 backdrop-blur-xl rounded-3xl p-4 border-2 border-amber-500/70 shadow-2xl text-white space-y-3 animate-fade-in">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-stone-800 shrink-0 border border-stone-700">
                    <img
                      src={activeReport.imageUrl}
                      alt={activeReport.kategori}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        activeReport.tingkat_keparahan === 'Berat'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {activeReport.tingkat_keparahan}
                      </span>
                      <span className="text-[10px] font-mono text-stone-400">{activeReport.ticketNumber}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white truncate mt-0.5">
                      {activeReport.kategori}
                    </h4>
                  </div>
                </div>

                <button
                  onClick={() => setActiveReport(null)}
                  className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors"
                  title="Tutup"
                >
                  &times;
                </button>
              </div>

              {/* Address & AI Summary */}
              <div className="space-y-1.5 text-xs text-stone-300">
                <div className="flex items-center gap-1.5 text-stone-400 text-[11px] truncate">
                  <MapPin className="h-3 w-3 text-rose-400 shrink-0" />
                  <span className="truncate">{activeReport.location.address}</span>
                </div>
                {activeReport.deskripsi_otomatis && (
                  <p className="text-[11px] text-stone-300 line-clamp-2 italic bg-stone-900/90 p-2 rounded-xl border border-stone-800">
                    "{activeReport.deskripsi_otomatis}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => onSelectReport(activeReport.id)}
                  className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Detail Tiket</span>
                </button>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${activeReport.location.lat},${activeReport.location.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-stone-700 transition-all active:scale-95 text-center"
                >
                  <Navigation className="h-3.5 w-3.5 text-blue-400" />
                  <span>Petunjuk Arah</span>
                </a>
              </div>
            </div>
          )}

        </div>

        {/* =========================================================
            COLLAPSIBLE SIDE INCIDENTS DRAWER
           ========================================================= */}
        {showIncidentList && (
          <div className="hidden md:flex flex-col w-80 lg:w-96 bg-stone-950/95 backdrop-blur-xl border-l border-stone-800/90 h-full z-10">
            
            {/* Drawer Header */}
            <div className="p-3.5 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Daftar Titik Pantau ({filteredReports.length})
                </span>
              </div>
              <button
                onClick={onOpenReportModal}
                className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <Camera className="h-3 w-3" />
                <span>+ Lapor Baru</span>
              </button>
            </div>

            {/* Quick Search */}
            <div className="p-2.5 border-b border-stone-800/80">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari jalan, tiket, atau tipe..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            {/* Scrollable Incidents List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2 no-scrollbar">
              {filteredReports.length === 0 ? (
                <div className="text-center py-12 text-stone-500 text-xs space-y-2">
                  <AlertTriangle className="h-8 w-8 text-stone-600 mx-auto" />
                  <p>Tidak ada laporan yang sesuai dengan filter.</p>
                  <button
                    onClick={() => {
                      setSelectedCategory('Semua Fasilitas');
                      setSelectedSeverity('Semua Tingkat');
                      setSelectedCity('Semua Kota');
                      setSearchQuery('');
                    }}
                    className="text-amber-400 font-bold hover:underline"
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                filteredReports.map((report) => {
                  const isSelected = activeReport?.id === report.id;
                  const sev = getSeverityStyle(report.tingkat_keparahan);

                  return (
                    <div
                      key={report.id}
                      onClick={() => handleSelectReportFromList(report)}
                      className={`group p-2.5 rounded-2xl border transition-all cursor-pointer flex gap-3 ${
                        isSelected
                          ? 'bg-stone-900 border-amber-500 shadow-md ring-1 ring-amber-500/40'
                          : 'bg-stone-900/60 hover:bg-stone-900 border-stone-800/80 hover:border-stone-700'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-800 shrink-0 relative">
                        <img
                          src={report.imageUrl}
                          alt={report.kategori}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          crossOrigin="anonymous"
                        />
                        <span className={`absolute top-1 left-1 w-2 h-2 rounded-full ${sev.dot}`}></span>
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-mono font-semibold text-amber-400 truncate">
                              {report.ticketNumber}
                            </span>
                            <span className="text-[9px] text-stone-400 shrink-0">
                              {formatTimeAgo(report.createdAt)}
                            </span>
                          </div>
                          <h5 className="text-xs font-bold text-white truncate mt-0.5">
                            {report.kategori}
                          </h5>
                          <p className="text-[11px] text-stone-400 truncate">
                            {report.location.address?.split(',')[0]}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] pt-1">
                          <span className={`font-bold ${
                            report.tingkat_keparahan === 'Berat' ? 'text-rose-400' : 'text-amber-400'
                          }`}>
                            {report.tingkat_keparahan}
                          </span>
                          {report.distanceKm !== null && (
                            <span className="text-stone-400 font-mono">
                              {formatDistance(report.distanceKm)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

      </div>

      {/* =========================================================
          BOTTOM COMMAND STRIP & REAL-TIME STATS
         ========================================================= */}
      <div className="p-4 sm:p-5 bg-stone-950 border-t border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-[10px] text-stone-400 font-bold uppercase">Prioritas Kritis</span>
              <span className="text-sm font-black text-white">{criticalCount} Titik</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-[10px] text-stone-400 font-bold uppercase">Selesai Diperbaiki</span>
              <span className="text-sm font-black text-white">{resolvedCount} Titik</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-[10px] text-stone-400 font-bold uppercase">AI Auto-Triage</span>
              <span className="text-sm font-black text-white">Gemini Multimodal</span>
            </div>
          </div>
        </div>

        {/* Call to Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenReportModal}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            <Camera className="h-4 w-4" />
            <span>Laporkan Kerusakan</span>
          </button>

          <button
            onClick={onNavigateToMap}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700/80 font-bold text-xs transition-all active:scale-95"
          >
            <span>Buka Layar Penuh</span>
            <ChevronRight className="h-4 w-4 text-amber-400" />
          </button>
        </div>

      </div>

    </div>
  );
};
