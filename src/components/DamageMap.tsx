import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  MapPin,
  Filter,
  Layers,
  Crosshair,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Eye,
  Camera,
  Navigation,
  Share2,
  Search,
  CheckCircle2,
  List,
  Flame,
  ChevronRight,
  ChevronDown,
  Check,
  Radio,
  SlidersHorizontal,
  Compass
} from 'lucide-react';
import { InfrastructureReport, SeverityLevel, DamageCategory } from '../types';
import { GoogleInfrastructureMap } from './GoogleInfrastructureMap';
import {
  getSeverityStyle,
  getStatusStyle,
  calculateDistanceKm,
  formatDistance,
  formatTimeAgo,
  shareReport
} from '../utils/helpers';
import {
  detectPreciseUserLocation,
  UserLocationData,
  INDONESIA_CITY_PRESETS,
  CityPreset,
  getReadableAddress
} from '../utils/locationService';

interface DamageMapProps {
  reports: InfrastructureReport[];
  onSelectReport: (reportId: string) => void;
  onOpenReportModal: () => void;
}

export const DamageMap: React.FC<DamageMapProps> = ({
  reports,
  onSelectReport,
  onOpenReportModal,
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('Semua');
  const [categoryFilter, setCategoryFilter] = useState<string>('Semua');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [selectedRadiusKm, setSelectedRadiusKm] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReportOnMap, setSelectedReportOnMap] = useState<InfrastructureReport | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocationData | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [showCityPicker, setShowCityPicker] = useState<boolean>(false);
  const [locationToast, setLocationToast] = useState<string | null>(null);

  // Detect user geolocation with high accuracy
  const handleDetectLocation = useCallback(async (isManual = false) => {
    setIsLocating(true);
    try {
      const loc = await detectPreciseUserLocation();
      setUserLocation(loc);
      if (isManual) {
        setLocationToast(loc.isGps ? `GPS Terdeteksi: ${loc.city}` : `Pusat Wilayah: ${loc.city}`);
        setTimeout(() => setLocationToast(null), 3000);
      }
    } catch (e) {
      console.warn('Geolocation failed', e);
    } finally {
      setIsLocating(false);
    }
  }, []);

  useEffect(() => {
    handleDetectLocation(false);
  }, [handleDetectLocation]);

  const handleSelectCityPreset = async (city: CityPreset) => {
    setShowCityPicker(false);
    setIsLocating(true);
    const addr = await getReadableAddress(city.lat, city.lng);
    setUserLocation({
      lat: city.lat,
      lng: city.lng,
      address: addr.address,
      city: city.name,
      district: addr.district,
      isGps: false
    });
    setIsLocating(false);
    setLocationToast(`Pusat peta diubah ke: ${city.name}`);
    setTimeout(() => setLocationToast(null), 3000);
  };

  // Compute distances
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
      const matchSev = severityFilter === 'Semua' || r.tingkat_keparahan === severityFilter;
      const matchCat = categoryFilter === 'Semua' || r.kategori === categoryFilter;
      const matchStatus = statusFilter === 'Semua' || r.status === statusFilter;
      const matchRadius = selectedRadiusKm === 'all' || (r.distanceKm !== null && r.distanceKm <= selectedRadiusKm);
      const matchSearch =
        searchQuery.trim() === '' ||
        r.kategori.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.location.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSev && matchCat && matchStatus && matchRadius && matchSearch;
    });
  }, [reportsWithDistance, severityFilter, categoryFilter, statusFilter, selectedRadiusKm, searchQuery]);

  const radiusMeters = selectedRadiusKm === 'all' ? 1500 : selectedRadiusKm * 1000;

  return (
    <div className="relative flex h-[calc(100vh-4rem)] w-full bg-[#fafaf9] overflow-hidden font-sans">
      {/* Toast Alert */}
      {locationToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-stone-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg border border-stone-700 animate-in fade-in slide-in-from-top-3 duration-300">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping"></span>
          <span>{locationToast}</span>
        </div>
      )}

      {/* LEFT DRAWER / LIST PANEL */}
      <div
        className={`${
          isSidebarOpen ? 'w-full md:w-96 lg:w-[420px]' : 'w-0'
        } transition-all duration-300 ease-in-out bg-white border-r border-stone-200/80 flex flex-col z-20 overflow-hidden shadow-xs`}
      >
        {/* Panel Header */}
        <div className="p-4 border-b border-stone-200/80 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
                <MapPin className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-extrabold text-stone-900 tracking-tight">
                Peta Titik Kerusakan
              </h2>
            </div>
            <span className="text-xs font-bold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full">
              {filteredReports.length} Titik
            </span>
          </div>

          {/* Location & GPS Switcher Pill */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDetectLocation(true)}
              disabled={isLocating}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                userLocation?.isGps
                  ? 'bg-amber-500 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <Crosshair className={`h-3.5 w-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'GPS...' : userLocation?.isGps ? 'GPS Aktif' : 'GPS'}</span>
            </button>

            <div className="relative flex-1">
              <button
                onClick={() => setShowCityPicker(!showCityPicker)}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-full bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-800 hover:bg-stone-100"
              >
                <span className="truncate">{userLocation?.city || 'Pilih Kota'}</span>
                <ChevronDown className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              </button>

              {showCityPicker && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white rounded-2xl border border-stone-200 shadow-xl p-2 max-h-56 overflow-y-auto">
                  {INDONESIA_CITY_PRESETS.map((city) => (
                    <button
                      key={city.name}
                      onClick={() => handleSelectCityPreset(city)}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs hover:bg-amber-50 hover:text-amber-800 flex items-center justify-between transition-colors"
                    >
                      <span className="font-semibold">{city.name}</span>
                      {userLocation?.city === city.name && <Check className="h-3.5 w-3.5 text-amber-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari jalan, kategori, nomor tiket..."
              className="w-full rounded-xl bg-stone-50 border border-stone-200 pl-9 pr-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Filter Pills Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            {['Semua', 'Berat', 'Sedang', 'Ringan'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1 rounded-full font-bold text-[11px] shrink-0 transition-all ${
                  severityFilter === sev
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {sev === 'Semua' ? 'Semua Keparahan' : sev}
              </button>
            ))}
          </div>
        </div>

        {/* List of Incidents */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100 p-2 space-y-1 scrollbar-thin scrollbar-thumb-stone-200">
          {filteredReports.length === 0 ? (
            <div className="p-8 text-center text-stone-400 text-xs">
              Tidak ada kerusakan yang cocok dengan filter saat ini.
            </div>
          ) : (
            filteredReports.map((report) => {
              const isSelected = selectedReportOnMap?.id === report.id;
              const isResolved = report.status === 'Selesai';
              const isCritical = report.tingkat_keparahan === 'Berat';

              return (
                <div
                  key={report.id}
                  onClick={() => {
                    setSelectedReportOnMap(report);
                  }}
                  className={`p-3 rounded-2xl cursor-pointer transition-all duration-200 flex gap-3 ${
                    isSelected
                      ? 'bg-amber-50/80 border border-amber-300 ring-1 ring-amber-300/40'
                      : 'hover:bg-stone-50 border border-transparent'
                  }`}
                >
                  <img
                    src={report.imageUrl}
                    alt={report.kategori}
                    className="h-16 w-16 rounded-xl object-cover shrink-0 border border-stone-200"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-stone-900 truncate">
                          {report.kategori}
                        </span>
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            isResolved
                              ? 'bg-emerald-100 text-emerald-700'
                              : isCritical
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 truncate mt-0.5">
                        {report.location.address}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1">
                      <span>{report.distanceKm !== null ? `${formatDistance(report.distanceKm)} dari Anda` : formatTimeAgo(report.createdAt)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectReport(report.id);
                        }}
                        className="text-amber-700 font-bold hover:underline"
                      >
                        Detail AI &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Quick Report Trigger */}
        <div className="p-3 border-t border-stone-200/80 bg-stone-50 shrink-0">
          <button
            onClick={onOpenReportModal}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-stone-900 hover:bg-stone-800 py-2.5 text-xs font-bold text-white shadow-xs transition-all active:scale-98"
          >
            <Camera className="h-4 w-4 text-amber-400" />
            <span>Lapor Kerusakan Baru</span>
          </button>
        </div>
      </div>

      {/* RIGHT FULL MAP CONTAINER */}
      <div className="relative flex-1 h-full">
        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-4 left-4 z-10 hidden md:flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-full border border-stone-200/80 shadow-xs text-xs font-bold text-stone-700 hover:bg-stone-50 transition-colors"
        >
          <List className="h-4 w-4 text-stone-500" />
          <span>{isSidebarOpen ? 'Sembunyikan Panel' : 'Buka Daftar'}</span>
        </button>

        {/* Map Component */}
        <GoogleInfrastructureMap
          reports={filteredReports}
          selectedReport={selectedReportOnMap}
          onSelectReport={(r) => setSelectedReportOnMap(r)}
          userLocation={userLocation}
          isLocating={isLocating}
          onLocateMe={() => handleDetectLocation(true)}
          heightClass="h-full"
          radarRadiusMeters={radiusMeters}
        />
      </div>
    </div>
  );
};
