import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Zap,
  ChevronRight,
  Clock,
  Search,
  Building2,
  ThumbsUp,
  Star,
  TrendingUp,
  Shield,
  Smartphone,
  Users,
  BarChart3,
  Navigation2,
  CircleAlert,
  CircleCheck,
  Timer,
  Crown,
  Edit3
} from 'lucide-react';
import { InfrastructureReport } from '../types';
import { DEMO_PRESET_IMAGES } from '../data/seedReports';
import { formatTimeAgo } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { CategoryPhotoEditModal } from './CategoryPhotoEditModal';
import { fetchCategoryImages, DEFAULT_CATEGORY_IMAGES } from '../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LandingPageProps {
  reports: InfrastructureReport[];
  onOpenReportModal: () => void;
  onNavigateToRadar: () => void;
  onNavigateToList: (categoryFilter?: string) => void;
  onNavigateToMap: () => void;
  onSelectReport: (reportId: string) => void;
  onOpenSDGModal: () => void;
}

// --- Mini Map Preview Component with Pothole Pins ---
const MiniMapPreview: React.FC<{ reports: InfrastructureReport[]; onNavigateToMap: () => void }> = ({
  reports,
  onNavigateToMap
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    const map = L.map(mapRef.current, {
      center: [-6.2088, 106.8456],
      zoom: 12,
      zoomControl: false,
      scrollWheelZoom: false,
      dragging: false,
      doubleClickZoom: false,
      touchZoom: false,
      keyboard: false,
      attributionControl: false
    });

    // Standard OpenStreetMap tiles - free, stable, no watermark
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    leafletMapRef.current = map;

    // Add pothole damage pins
    const pinReports = reports.slice(0, 10);
    pinReports.forEach((report) => {
      const severityColor =
        report.tingkat_keparahan === 'Berat'
          ? '#ef4444'
          : report.tingkat_keparahan === 'Sedang'
          ? '#f59e0b'
          : '#22c55e';

      const isPothole = report.kategori.toLowerCase().includes('jalan') || report.kategori.toLowerCase().includes('lubang');

      const iconHtml = `
        <div class="cursor-pointer group flex flex-col items-center justify-end" style="width: 120px; height: 36px; user-select: none;">
          <div style="
            display: flex;
            align-items: center;
            gap: 4px;
            background: white;
            border: 1.5px solid ${severityColor};
            border-radius: 9999px;
            padding: 3px 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.18);
            white-space: nowrap;
          ">
            <span style="
              width: 8px;
              height: 8px;
              border-radius: 9999px;
              background: ${severityColor};
              display: inline-block;
            "></span>
            <span style="font-size: 10px; font-weight: 800; color: #1e293b;">${isPothole ? '⚠️ ' + report.kategori : report.kategori}</span>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 6px solid white;
            margin-top: -1px;
            filter: drop-shadow(0 2px 2px rgba(0,0,0,0.15));
          "></div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-pothole-pin',
        html: iconHtml,
        iconSize: [120, 36],
        iconAnchor: [60, 36]
      });

      L.marker([report.location.lat, report.location.lng], { icon })
        .addTo(map)
        .bindTooltip(
          `<div style="font-size:11px;font-weight:700;color:#1e293b;">${report.kategori}</div><div style="font-size:10px;color:#64748b;">${report.location.city || report.location.address || ''} • <b>${report.tingkat_keparahan}</b></div>`,
          { direction: 'top', offset: [0, -35] }
        );
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [reports]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
      {/* Map overlay gradient bottom */}
      <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white/70 to-transparent pointer-events-none z-[400]" />
      {/* Expand button */}
      <button
        onClick={onNavigateToMap}
        className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold shadow-md hover:bg-gray-50 transition-colors z-[500]"
      >
        <Navigation2 className="h-3.5 w-3.5 text-blue-600" />
        Buka Radar Penuh
      </button>
      {/* Live badge */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/95 border border-gray-200 rounded-full px-2.5 py-1 text-xs font-bold text-gray-800 shadow-sm z-[500]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        Live Radar Kerusakan
      </div>
    </div>
  );
};

// --- Stat Card ---
const StatCard: React.FC<{ icon: React.ReactNode; value: string; label: string; color: string }> = ({
  icon, value, label, color
}) => (
  <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm">
    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color} shrink-0`}>
      {icon}
    </div>
    <div>
      <div className="text-lg font-black text-gray-900 leading-none">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  </div>
);

// --- Recent Report Card ---
const RecentCard: React.FC<{ report: InfrastructureReport; onClick: () => void }> = ({ report, onClick }) => {
  const severityBadge = {
    Berat: 'bg-red-50 text-red-700 border-red-200',
    Sedang: 'bg-amber-50 text-amber-700 border-amber-200',
    Ringan: 'bg-green-50 text-green-700 border-green-200'
  }[report.tingkat_keparahan];

  const statusIcon = {
    Baru: <CircleAlert className="h-3 w-3 text-blue-500" />,
    Diproses: <Timer className="h-3 w-3 text-amber-500" />,
    Selesai: <CircleCheck className="h-3 w-3 text-green-500" />
  }[report.status];

  return (
    <button
      onClick={onClick}
      className="group flex items-start gap-3 p-3.5 rounded-xl hover:bg-gray-50 transition-colors text-left w-full border border-transparent hover:border-gray-200"
    >
      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-100">
        <img
          src={report.imageUrl}
          alt={report.kategori}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold border rounded-full px-2 py-0.5 ${severityBadge}`}>
            {report.tingkat_keparahan}
          </span>
          <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
            {statusIcon}
            {report.status}
          </span>
        </div>
        <p className="text-sm font-semibold text-gray-800 truncate leading-tight">{report.kategori}</p>
        <p className="text-xs text-gray-500 truncate mt-0.5 flex items-center gap-1">
          <MapPin className="h-3 w-3 shrink-0" />
          {report.location.city || report.location.address}
        </p>
        <p className="text-[10px] text-gray-400 mt-1">{formatTimeAgo(report.createdAt)}</p>
      </div>
    </button>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({
  reports,
  onOpenReportModal,
  onNavigateToRadar,
  onNavigateToList,
  onNavigateToMap,
  onSelectReport,
  onOpenSDGModal
}) => {
  const { userProfile } = useAuth();
  const isSuperAdmin = userProfile?.role === 'super_admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>(DEFAULT_CATEGORY_IMAGES);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedEditCategory, setSelectedEditCategory] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchCategoryImages().then((imgs) => {
      if (imgs) setCategoryImages(imgs);
    });
  }, []);

  const totalCount = reports.length;
  const criticalCount = reports.filter((r) => r.tingkat_keparahan === 'Berat').length;
  const resolvedCount = reports.filter((r) => r.status === 'Selesai').length;
  const processingCount = reports.filter((r) => r.status === 'Diproses').length;

  const recentReports = [...reports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);

  const categories = [
    {
      title: 'Jalan Berlubang',
      categoryValue: 'Jalan Berlubang',
      desc: 'Pothole & retakan aspal di badan jalan',
      image: categoryImages['Jalan Berlubang'] || DEFAULT_CATEGORY_IMAGES['Jalan Berlubang'],
      count: reports.filter(r => r.kategori === 'Jalan Berlubang').length || 480,
      sla: '< 24 Jam',
      color: 'bg-red-500'
    },
    {
      title: 'Jembatan Retak',
      categoryValue: 'Jembatan Retak',
      desc: 'Kerusakan struktur sambungan jembatan',
      image: categoryImages['Jembatan Retak'] || DEFAULT_CATEGORY_IMAGES['Jembatan Retak'],
      count: reports.filter(r => r.kategori === 'Jembatan Retak').length || 120,
      sla: '< 12 Jam',
      color: 'bg-orange-500'
    },
    {
      title: 'Trotoar Rusak',
      categoryValue: 'Trotoar Rusak',
      desc: 'Paving ambles & ubin difabel pecah',
      image: categoryImages['Trotoar Rusak'] || DEFAULT_CATEGORY_IMAGES['Trotoar Rusak'],
      count: reports.filter(r => r.kategori === 'Trotoar Rusak').length || 210,
      sla: '< 48 Jam',
      color: 'bg-amber-500'
    },
    {
      title: 'Lampu Jalan Mati',
      categoryValue: 'Lampu Jalan Mati',
      desc: 'PJU padam & kabel penerangan terbuka',
      image: categoryImages['Lampu Jalan Mati'] || DEFAULT_CATEGORY_IMAGES['Lampu Jalan Mati'],
      count: reports.filter(r => r.kategori === 'Lampu Jalan Mati').length || 340,
      sla: '< 24 Jam',
      color: 'bg-yellow-500'
    },
    {
      title: 'Saluran Air',
      categoryValue: 'Saluran Air Tersumbat',
      desc: 'Drainase tersumbat lumpur & meluap',
      image: categoryImages['Saluran Air Tersumbat'] || DEFAULT_CATEGORY_IMAGES['Saluran Air Tersumbat'],
      count: reports.filter(r => r.kategori === 'Saluran Air Tersumbat').length || 95,
      sla: '< 48 Jam',
      color: 'bg-blue-500'
    },
    {
      title: 'Fasilitas Publik',
      categoryValue: 'Fasilitas Publik Lainnya',
      desc: 'Halte bus, taman kota & marka jalan',
      image: categoryImages['Fasilitas Publik Lainnya'] || DEFAULT_CATEGORY_IMAGES['Fasilitas Publik Lainnya'],
      count: reports.filter(r => r.kategori === 'Fasilitas Publik Lainnya').length || 60,
      sla: '< 72 Jam',
      color: 'bg-purple-500'
    }
  ];

  const steps = [
    {
      num: '1',
      icon: <Smartphone className="h-6 w-6 text-blue-600" />,
      title: 'Foto & Lokasi GPS',
      desc: 'Ambil foto kerusakan infrastruktur. Koordinat GPS terkunci otomatis.',
      color: 'bg-blue-50 border-blue-200'
    },
    {
      num: '2',
      icon: <Zap className="h-6 w-6 text-amber-600" />,
      title: 'AI Gemini Menganalisis',
      desc: 'Model AI mengklasifikasi jenis kerusakan, skor bahaya, dan mengarahkan ke dinas terkait.',
      color: 'bg-amber-50 border-amber-200'
    },
    {
      num: '3',
      icon: <CheckCircle2 className="h-6 w-6 text-green-600" />,
      title: 'Dinas Eksekusi & Update',
      desc: 'Tim Unit Reaksi Cepat diterjunkan dan memperbarui status perbaikan secara transparan.',
      color: 'bg-green-50 border-green-200'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">

      {/* ===== HERO SECTION ===== */}
      <section className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* Left: Copy */}
            <div className="space-y-6">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
                Platform Pelaporan Infrastruktur Berbasis AI
              </div>

              <div>
                <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight tracking-tight">
                  Laporkan Kerusakan
                  <br />
                  <span className="text-blue-600">Infrastruktur Kota</span>
                  <br />
                  dengan Mudah
                </h1>
                <p className="mt-4 text-base text-gray-600 leading-relaxed max-w-lg">
                  Foto jalan berlubang, jembatan retak, atau lampu padam — <strong>AI Gemini</strong> langsung menganalisis dan meneruskan laporan ke dinas terkait.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={onOpenReportModal}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-sm font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all"
                >
                  <Camera className="h-4 w-4" />
                  Lapor Sekarang
                </button>
                <button
                  onClick={onNavigateToMap}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 text-sm font-semibold active:scale-95 transition-all"
                >
                  <MapPin className="h-4 w-4 text-blue-500" />
                  Lihat Peta Radar
                </button>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <StatCard
                  icon={<BarChart3 className="h-4 w-4 text-blue-600" />}
                  value={String(totalCount || '1.1K+')}
                  label="Total Laporan"
                  color="bg-blue-50"
                />
                <StatCard
                  icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
                  value={String(criticalCount || '240+')}
                  label="Kritis / Berat"
                  color="bg-red-50"
                />
                <StatCard
                  icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
                  value={String(resolvedCount || '680+')}
                  label="Selesai Diperbaiki"
                  color="bg-green-50"
                />
                <StatCard
                  icon={<Clock className="h-4 w-4 text-amber-600" />}
                  value={String(processingCount || '180+')}
                  label="Sedang Diproses"
                  color="bg-amber-50"
                />
              </div>
            </div>

            {/* Right: Mini Map Preview */}
            <div>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
                {/* Map header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-semibold text-gray-800">Peta Kerusakan Real-Time</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500 font-medium">{reports.length} titik terdeteksi</span>
                  </div>
                </div>

                {/* Map */}
                <div className="h-64 sm:h-80 relative">
                  <MiniMapPreview reports={reports} onNavigateToMap={onNavigateToMap} />
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-5 px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-xs text-gray-600 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />Kritis / Berat
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />Sedang
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500 shrink-0" />Ringan
                  </span>
                </div>
              </div>

              {/* Verified Recent Reports Strip */}
              <div className="mt-3 bg-white border border-gray-200 rounded-xl p-3 shadow-xs flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 shrink-0">
                  <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                  <span>Terbaru:</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {recentReports.slice(0, 3).map((r) => (
                    <button
                      key={r.id}
                      onClick={() => onSelectReport(r.id)}
                      className="flex items-center gap-2 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200/80 rounded-lg px-2.5 py-1.5 text-left shrink-0 transition-all"
                    >
                      <img
                        src={r.imageUrl}
                        alt={r.kategori}
                        className="h-6 w-6 rounded object-cover shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-[10px] leading-tight">
                        <p className="font-bold text-gray-800 truncate max-w-[90px]">{r.kategori}</p>
                        <p className="text-gray-400 truncate max-w-[90px]">{r.location.city || 'Indonesia'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ===== SEARCH BAR ===== */}
      <section className="bg-white border-b border-gray-100 sticky top-16 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari laporan: jalan berlubang, Semarang, dll…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') onNavigateToList(); }}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-full border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
              />
            </div>
            <button
              onClick={() => onNavigateToList()}
              className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors whitespace-nowrap"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cari</span>
            </button>
          </div>
        </div>
      </section>


      {/* ===== RECENT REPORTS + CATEGORIES ===== */}
      <section className="py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left: Recent Reports */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h2 className="text-base font-bold text-gray-900">Laporan Terbaru</h2>
                  <button
                    onClick={() => onNavigateToList()}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    Lihat semua <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="divide-y divide-gray-50 px-2 py-1">
                  {recentReports.map((report) => (
                    <RecentCard
                      key={report.id}
                      report={report}
                      onClick={() => onSelectReport(report.id)}
                    />
                  ))}
                </div>
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
                  <button
                    onClick={() => onNavigateToList()}
                    className="w-full text-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Lihat semua laporan →
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Category Cards */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-gray-900">Kategori Kerusakan</h2>
                  {isSuperAdmin && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 rounded-full px-2 py-0.5">
                      <Crown className="h-2.5 w-2.5 text-amber-600" />
                      Super Admin Mode
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isSuperAdmin && (
                    <button
                      type="button"
                      id="edit-category-photos-superadmin-btn"
                      onClick={() => {
                        setSelectedEditCategory(undefined);
                        setIsCategoryModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-xs active:scale-95 transition-all"
                      title="Super Admin: Kelola dan ganti foto semua kategori"
                    >
                      <Crown className="h-3.5 w-3.5 text-amber-100" />
                      <span>Edit Foto Kategori</span>
                    </button>
                  )}
                  <button
                    onClick={onOpenReportModal}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    + Buat Laporan Baru
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {categories.map((cat) => (
                  <div
                    key={cat.title}
                    className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 transition-all text-left flex flex-col"
                  >
                    <div
                      onClick={() => onNavigateToList(cat.categoryValue || cat.title)}
                      className="aspect-video relative overflow-hidden cursor-pointer bg-gray-900"
                    >
                      <img
                        src={cat.image}
                        alt={cat.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      
                      {/* Super Admin Quick Edit Button */}
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEditCategory(cat.categoryValue || cat.title);
                            setIsCategoryModalOpen(true);
                          }}
                          className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-full bg-black/75 hover:bg-black text-white px-2.5 py-1 text-[10px] font-bold shadow-md backdrop-blur-xs active:scale-95 transition-all"
                          title={`Ganti foto untuk kategori ${cat.title}`}
                        >
                          <Crown className="h-3 w-3 text-amber-400" />
                          <span>Ganti Foto</span>
                        </button>
                      )}

                      <span className={`absolute top-2 right-2 ${cat.color} text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full`}>
                        SLA {cat.sla}
                      </span>
                    </div>

                    <div
                      onClick={() => onNavigateToList(cat.categoryValue || cat.title)}
                      className="p-3 flex-1 flex flex-col justify-between cursor-pointer"
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">{cat.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{cat.desc}</p>
                      </div>
                      <p className="text-xs font-semibold text-blue-600 mt-2">{cat.count}+ laporan</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ===== HOW IT WORKS ===== */}
      <section className="py-12 sm:py-16 bg-white border-t border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-black tracking-widest uppercase text-blue-600 mb-2">Cara Kerja</p>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Pelaporan Semudah 1-2-3</h2>
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">Dari jalan rusak hingga selesai diperbaiki, tanpa birokrasi manual.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, idx) => (
              <div key={step.num} className="relative">
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gray-200 z-0 -translate-x-1/2" />
                )}
                <div className={`relative bg-white rounded-2xl border ${step.color} p-6 space-y-4 z-10`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${step.color}`}>
                      {step.icon}
                    </div>
                    <span className="text-3xl font-black text-gray-200">{step.num}</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{step.title}</h3>
                    <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={onOpenReportModal}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 text-sm font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all"
            >
              <Camera className="h-4 w-4" />
              Mulai Lapor Sekarang — Gratis
            </button>
          </div>
        </div>
      </section>


      {/* ===== TRUST / SOCIAL PROOF ===== */}
      <section className="py-12 bg-gray-50 border-t border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 shrink-0">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Data Transparan</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">Semua laporan publik dan terverifikasi. Status update dari dinas secara real-time.</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 shrink-0">
                <Zap className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">AI Vision Instan</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">Gemini AI menganalisis foto dalam detik — mengklasifikasi jenis dan tingkat bahaya.</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 shrink-0">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Komunitas Aktif</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">Ribuan warga dan petugas dinas berkolaborasi memperbaiki infrastruktur kota.</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ===== CTA BOTTOM BANNER ===== */}
      <section className="bg-blue-600 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
            Ada jalan berlubang di dekat kamu?
          </h2>
          <p className="text-blue-100 text-sm mb-8 max-w-md mx-auto">
            Laporkan sekarang. Butuh waktu kurang dari 1 menit. AI kami langsung menangani sisanya.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onOpenReportModal}
              className="inline-flex items-center gap-2 rounded-full bg-white text-blue-700 hover:bg-blue-50 px-8 py-3.5 text-sm font-bold shadow-lg active:scale-95 transition-all"
            >
              <Camera className="h-4 w-4" />
              Lapor dengan Kamera
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onNavigateToMap}
              className="inline-flex items-center gap-2 rounded-full border border-blue-400 bg-transparent hover:bg-blue-700 text-white px-7 py-3.5 text-sm font-semibold active:scale-95 transition-all"
            >
              <MapPin className="h-4 w-4" />
              Buka Peta Radar
            </button>
          </div>
        </div>
      </section>

      {/* Super Admin Category Photo Edit Modal */}
      {isSuperAdmin && (
        <CategoryPhotoEditModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          initialCategory={selectedEditCategory}
          currentImages={categoryImages}
          onSaved={(updated) => {
            setCategoryImages(updated);
          }}
        />
      )}

    </div>
  );
};
