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
  Compass,
  X,
  Crown,
  Maximize2,
  Copy
} from 'lucide-react';
import { InfrastructureReport, SeverityLevel, DamageCategory } from '../types';
import { GoogleInfrastructureMap } from './GoogleInfrastructureMap';
import { ReportStatusTracker } from './ReportStatusTracker';
import { SuperAdminEditModal } from './SuperAdminEditModal';
import { useAuth } from '../context/AuthContext';
import {
  getSeverityStyle,
  getStatusStyle,
  calculateDistanceKm,
  formatDistance,
  formatTimeAgo,
  shareReport,
  formatIndonesianDate,
  getReportShareUrl
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
  onReportsUpdated?: () => void;
}

export const DamageMap: React.FC<DamageMapProps> = ({
  reports,
  onSelectReport,
  onOpenReportModal,
  onReportsUpdated,
}) => {
  const { userProfile } = useAuth();
  const isSuperAdmin = userProfile?.role === 'super_admin';
  const [isSuperAdminEditOpen, setIsSuperAdminEditOpen] = useState(false);

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

  const handleShareReport = async (rep: InfrastructureReport) => {
    const url = getReportShareUrl(rep.id);
    await shareReport(
      `LaporInfra: ${rep.kategori} - ${rep.ticketNumber}`,
      `Laporan kerusakan di ${rep.location.address}`,
      url
    );
  };

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
    <div className="relative flex h-[calc(100vh-4rem)] w-full bg-[#fafaf9] dark:bg-[#18191a] overflow-hidden font-sans">
      {/* Toast Alert */}
      {locationToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-white dark:bg-[#303134] text-stone-800 dark:text-[#e8eaed] text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg border border-amber-300 dark:border-amber-500/40 animate-in fade-in slide-in-from-top-3 duration-300">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
          <span>{locationToast}</span>
        </div>
      )}

      {/* LEFT DRAWER / LIST PANEL */}
      <div
        className={`${
          isSidebarOpen ? 'w-full md:w-96 lg:w-[420px]' : 'w-0'
        } transition-all duration-300 ease-in-out bg-white dark:bg-[#202124] border-r border-stone-200/80 dark:border-[#3c4043] flex flex-col z-20 overflow-hidden shadow-xs`}
      >
        {/* Panel Header */}
        <div className="p-4 border-b border-stone-200/80 dark:border-[#3c4043] space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
                <MapPin className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-extrabold text-stone-900 dark:text-[#e8eaed] tracking-tight">
                Peta Titik Kerusakan
              </h2>
            </div>
            <span className="text-xs font-bold text-stone-600 dark:text-[#9aa0a6] bg-stone-100 dark:bg-[#303134] px-2.5 py-0.5 rounded-full">
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
                  : 'bg-stone-100 dark:bg-[#303134] text-stone-700 dark:text-[#e8eaed] hover:bg-stone-200 dark:hover:bg-[#3c4043]'
              }`}
            >
              <Crosshair className={`h-3.5 w-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'GPS...' : userLocation?.isGps ? 'GPS Aktif' : 'GPS'}</span>
            </button>

            <div className="relative flex-1">
              <button
                onClick={() => setShowCityPicker(!showCityPicker)}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-full bg-stone-50 dark:bg-[#303134] border border-stone-200 dark:border-[#3c4043] text-xs font-semibold text-stone-800 dark:text-[#e8eaed] hover:bg-stone-100 dark:hover:bg-[#3c4043]"
              >
                <span className="truncate">{userLocation?.city || 'Pilih Kota'}</span>
                <ChevronDown className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              </button>

              {showCityPicker && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-[#28292c] rounded-2xl border border-stone-200 dark:border-[#3c4043] shadow-xl p-2 max-h-56 overflow-y-auto">
                  {INDONESIA_CITY_PRESETS.map((city) => (
                    <button
                      key={city.name}
                      onClick={() => handleSelectCityPreset(city)}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-stone-700 dark:text-[#e8eaed] hover:bg-amber-50 dark:hover:bg-white/5 hover:text-amber-800 dark:hover:text-amber-400 flex items-center justify-between transition-colors"
                    >
                      <span className="font-semibold">{city.name}</span>
                      {userLocation?.city === city.name && <Check className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />}
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
              className="w-full rounded-xl bg-stone-50 dark:bg-[#303134] border border-stone-200 dark:border-[#3c4043] pl-9 pr-3 py-2 text-xs text-stone-900 dark:text-[#e8eaed] placeholder-stone-400 dark:placeholder-[#80868b] focus:bg-white dark:focus:bg-[#202124] focus:outline-hidden focus:ring-1 focus:ring-amber-500"
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
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-white dark:bg-[#303134] border border-stone-200 dark:border-[#3c4043] text-stone-700 dark:text-[#e8eaed] hover:bg-amber-50 dark:hover:bg-white/5 hover:text-amber-800 dark:hover:text-amber-400'
                }`}
              >
                {sev === 'Semua' ? 'Semua Keparahan' : sev}
              </button>
            ))}
          </div>
        </div>

        {/* List of Incidents */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-[#3c4043]/40 p-2 space-y-1 scrollbar-thin scrollbar-thumb-stone-200 dark:scrollbar-thumb-stone-700">
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
                      ? 'bg-amber-50/90 dark:bg-amber-950/30 border border-amber-400/80 dark:border-amber-500/40 shadow-xs'
                      : 'hover:bg-stone-50 dark:hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <img
                    src={report.imageUrl}
                    alt={report.kategori}
                    className="h-16 w-16 rounded-xl object-cover shrink-0 border border-stone-200 dark:border-[#3c4043]"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-stone-900 dark:text-[#e8eaed] truncate">
                          {report.title || report.kategori}
                        </span>
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            isResolved
                              ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                              : isCritical
                              ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                              : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-[#9aa0a6] truncate mt-0.5">
                        {report.location.address}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-stone-400 dark:text-[#80868b] mt-1">
                      <span>{report.distanceKm !== null ? `${formatDistance(report.distanceKm)} dari Anda` : formatTimeAgo(report.createdAt)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReportOnMap(report);
                        }}
                        className="text-amber-700 dark:text-amber-400 font-bold hover:underline"
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
        <div className="p-3 border-t border-stone-200/80 dark:border-[#3c4043] bg-white dark:bg-[#202124] shrink-0">
          <button
            onClick={onOpenReportModal}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-white dark:bg-[#303134] hover:bg-amber-50/70 dark:hover:bg-[#3c4043] py-2.5 text-xs font-bold text-stone-800 dark:text-amber-300 border border-amber-400/80 dark:border-amber-500/40 shadow-xs transition-all active:scale-98"
          >
            <Camera className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>Lapor Kerusakan Baru</span>
          </button>
        </div>
      </div>

      {/* RIGHT FULL MAP CONTAINER */}
      <div className="relative flex-1 h-full">
        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-4 left-4 z-10 hidden md:flex items-center gap-1.5 bg-white/95 dark:bg-[#303134]/95 backdrop-blur-md px-3.5 py-2 rounded-full border border-stone-200/80 dark:border-[#3c4043] shadow-xs text-xs font-bold text-stone-700 dark:text-[#e8eaed] hover:bg-stone-50 dark:hover:bg-[#3c4043] transition-colors"
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

        {/* RIGHT SIDE REPORT DETAIL POPUP DRAWER */}
        {selectedReportOnMap && (
          <div className="absolute top-0 right-0 bottom-0 z-30 w-full sm:w-[420px] md:w-[450px] bg-white dark:bg-[#202124] border-l border-stone-200 dark:border-[#3c4043] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-4 border-b border-stone-200 dark:border-[#3c4043] bg-stone-50/90 dark:bg-[#28292c] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-700/50">
                  {selectedReportOnMap.ticketNumber}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusStyle(selectedReportOnMap.status).badge}`}>
                  {selectedReportOnMap.status}
                </span>
                {isSuperAdmin && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/50 rounded px-1.5 py-0.2">
                    <Crown className="h-2.5 w-2.5 text-amber-600 dark:text-amber-400" />
                    ADMIN
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsSuperAdminEditOpen(true)}
                    className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-1 text-xs font-bold text-white shadow-xs hover:from-amber-600 hover:to-orange-700 transition-all"
                    title="Super Admin: Edit Laporan"
                  >
                    <Crown className="h-3 w-3 text-amber-100" />
                    <span>Edit</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedReportOnMap(null)}
                  className="rounded-full p-1.5 text-stone-400 hover:bg-stone-200 dark:hover:bg-white/10 hover:text-stone-700 dark:hover:text-white transition-colors"
                  title="Tutup Detail"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Photo Display */}
              <div className="relative rounded-2xl overflow-hidden bg-stone-100 dark:bg-[#28292c] border border-stone-200 dark:border-[#3c4043] group">
                <img
                  src={selectedReportOnMap.imageUrl}
                  alt={selectedReportOnMap.kategori}
                  className="w-full h-52 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2.5 left-2.5">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold text-white shadow-md"
                    style={{ backgroundColor: getSeverityStyle(selectedReportOnMap.tingkat_keparahan).colorHex }}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    <span>{selectedReportOnMap.tingkat_keparahan}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectReport(selectedReportOnMap.id)}
                  className="absolute bottom-2.5 right-2.5 rounded-full bg-white/90 dark:bg-[#303134]/90 backdrop-blur-xs p-1.5 text-stone-800 dark:text-white hover:bg-white border border-stone-200 dark:border-[#3c4043] shadow-xs transition-colors"
                  title="Buka Modal Penuh"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Title & Reporter */}
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-900 dark:text-[#e8eaed] leading-snug">
                  {selectedReportOnMap.title || selectedReportOnMap.kategori}
                </h3>
                <p className="text-xs text-stone-500 dark:text-[#9aa0a6]">
                  <span className="inline-block font-semibold text-amber-700 dark:text-amber-400 mr-1.5">{selectedReportOnMap.kategori}</span>
                  &bull; Dilaporkan oleh <span className="font-semibold text-stone-700 dark:text-stone-300">{selectedReportOnMap.reporterName || 'Warga'}</span> &bull; {formatIndonesianDate(selectedReportOnMap.createdAt)}
                </p>
              </div>

              {/* Location Details & Navigation */}
              <div className="rounded-2xl border border-stone-200 dark:border-[#3c4043] bg-stone-50 dark:bg-[#28292c] p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-stone-800 dark:text-[#e8eaed] leading-snug">{selectedReportOnMap.location.address}</p>
                    <p className="text-[10px] text-stone-500 dark:text-[#9aa0a6] font-mono mt-0.5">
                      {selectedReportOnMap.location.lat.toFixed(5)}, {selectedReportOnMap.location.lng.toFixed(5)}
                    </p>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedReportOnMap.location.lat},${selectedReportOnMap.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 hover:underline"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  <span>Petunjuk Rute Google Maps &rarr;</span>
                </a>
              </div>

              {/* AI Analysis Box */}
              <div className="rounded-2xl border border-amber-200/80 dark:border-amber-600/30 bg-gradient-to-br from-amber-50/50 via-white to-stone-50 dark:from-amber-950/20 dark:via-[#28292c] dark:to-[#28292c] p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>Analisis AI Gemini</span>
                </div>
                <p className="text-xs text-stone-700 dark:text-[#e8eaed] leading-relaxed bg-white dark:bg-[#202124] p-2.5 rounded-xl border border-stone-200/70 dark:border-[#3c4043]">
                  {selectedReportOnMap.deskripsi_otomatis}
                </p>
                <p className="text-[11px] text-stone-600 dark:text-stone-300 bg-amber-50/60 dark:bg-amber-950/30 p-2 rounded-xl border border-amber-200/50 dark:border-amber-700/40">
                  <span className="font-bold text-amber-900 dark:text-amber-300">Rekomendasi Tindakan: </span>
                  {selectedReportOnMap.rekomendasi_prioritas}
                </p>
              </div>

              {/* Citizen Note */}
              {selectedReportOnMap.deskripsi_manual && (
                <div className="rounded-2xl border border-stone-200 dark:border-[#3c4043] bg-white dark:bg-[#28292c] p-3 space-y-1">
                  <p className="text-xs font-bold text-stone-700 dark:text-stone-300">Catatan Pelapor:</p>
                  <p className="text-xs text-stone-600 dark:text-[#e8eaed] italic bg-stone-50 dark:bg-[#202124] p-2.5 rounded-xl border border-stone-200/50 dark:border-[#3c4043]">
                    &ldquo;{selectedReportOnMap.deskripsi_manual}&rdquo;
                  </p>
                </div>
              )}

              {/* Dinas PU Note */}
              {selectedReportOnMap.dinasNotes && (
                <div className="rounded-2xl border border-amber-200 dark:border-amber-700/50 bg-amber-50/60 dark:bg-amber-950/30 p-3 space-y-1">
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-300">Catatan Dinas PU:</p>
                  <p className="text-xs text-amber-800 dark:text-amber-200 bg-white dark:bg-[#202124] p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-700/50">
                    {selectedReportOnMap.dinasNotes}
                  </p>
                </div>
              )}

              {/* Status Timeline */}
              <div className="rounded-2xl border border-stone-200 dark:border-[#3c4043] bg-white dark:bg-[#28292c] p-3.5 space-y-2">
                <p className="text-xs font-bold text-stone-800 dark:text-[#e8eaed]">Alur Progres Penanganan:</p>
                <ReportStatusTracker report={selectedReportOnMap} />
              </div>
            </div>

            {/* Bottom Drawer Actions */}
            <div className="p-3 border-t border-stone-200 dark:border-[#3c4043] bg-stone-50 dark:bg-[#28292c] flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onSelectReport(selectedReportOnMap.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full bg-stone-900 dark:bg-amber-500 hover:bg-stone-800 dark:hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs"
              >
                <Eye className="h-3.5 w-3.5 text-amber-400 dark:text-white" />
                <span>Buka Detail Penuh</span>
              </button>
              <button
                type="button"
                onClick={() => handleShareReport(selectedReportOnMap)}
                className="flex items-center justify-center gap-1 py-2.5 px-4 rounded-full border border-stone-200 dark:border-[#3c4043] bg-white dark:bg-[#303134] text-stone-700 dark:text-[#e8eaed] hover:bg-stone-100 dark:hover:bg-[#3c4043] text-xs font-semibold transition-colors"
                title="Bagikan Tautan Laporan"
              >
                <Share2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>Bagikan</span>
              </button>
            </div>
          </div>
        )}

        {/* Super Admin Edit Modal if opened */}
        {isSuperAdmin && selectedReportOnMap && (
          <SuperAdminEditModal
            report={selectedReportOnMap}
            isOpen={isSuperAdminEditOpen}
            onClose={() => setIsSuperAdminEditOpen(false)}
            onSaved={(updated) => {
              setSelectedReportOnMap(updated);
              if (onReportsUpdated) onReportsUpdated();
            }}
            onDeleted={() => {
              setSelectedReportOnMap(null);
              if (onReportsUpdated) onReportsUpdated();
            }}
          />
        )}
      </div>
    </div>
  );
};
