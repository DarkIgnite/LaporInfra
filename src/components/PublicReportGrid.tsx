import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  SlidersHorizontal,
  MapPin,
  Calendar,
  AlertTriangle,
  Sparkles,
  ThumbsUp,
  ArrowUpDown,
  ChevronRight,
  Eye,
  CheckCircle2,
  Clock,
  Car,
  Milestone,
  Footprints,
  Lightbulb,
  Droplets,
  Construction,
  X,
  Share2,
  Check
} from 'lucide-react';
import { InfrastructureReport, DamageCategory, SeverityLevel, ReportStatus } from '../types';
import { getSeverityStyle, getStatusStyle, formatTimeAgo, shareReport, getReportShareUrl } from '../utils/helpers';
import { upvoteReport } from '../services/api';

interface PublicReportGridProps {
  reports: InfrastructureReport[];
  onSelectReport: (reportId: string) => void;
  onOpenReportModal: () => void;
  onReportsUpdated: () => void;
  initialCategoryFilter?: string;
}

export const PublicReportGrid: React.FC<PublicReportGridProps> = ({
  reports,
  onSelectReport,
  onOpenReportModal,
  onReportsUpdated,
  initialCategoryFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(initialCategoryFilter || 'Semua');
  const [severityFilter, setSeverityFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [sortBy, setSortBy] = useState<'terbaru' | 'terlama' | 'keparahan_tertinggi' | 'paling_banyak_dukungan'>('terbaru');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialCategoryFilter) {
      setCategoryFilter(initialCategoryFilter);
    }
  }, [initialCategoryFilter]);

  // Filter & sort logic
  const filteredReportsList = useMemo(() => {
    let list = [...reports];

    if (categoryFilter !== 'Semua') {
      list = list.filter((r) => r.kategori === categoryFilter);
    }
    if (severityFilter !== 'Semua') {
      list = list.filter((r) => r.tingkat_keparahan === severityFilter);
    }
    if (statusFilter !== 'Semua') {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          (r.title && r.title.toLowerCase().includes(q)) ||
          r.kategori.toLowerCase().includes(q) ||
          (r.deskripsi_otomatis && r.deskripsi_otomatis.toLowerCase().includes(q)) ||
          (r.deskripsi_manual && r.deskripsi_manual.toLowerCase().includes(q)) ||
          (r.location.address && r.location.address.toLowerCase().includes(q)) ||
          (r.location.city && r.location.city.toLowerCase().includes(q)) ||
          (r.location.province && r.location.province.toLowerCase().includes(q)) ||
          (r.ticketNumber && r.ticketNumber.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'keparahan_tertinggi') {
      const order: Record<string, number> = { Berat: 3, Sedang: 2, Ringan: 1 };
      list.sort((a, b) => (order[b.tingkat_keparahan] || 0) - (order[a.tingkat_keparahan] || 0));
    } else if (sortBy === 'terlama') {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'paling_banyak_dukungan') {
      list.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    } else {
      // 'terbaru'
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [reports, categoryFilter, severityFilter, statusFilter, searchQuery, sortBy]);

  const handleUpvote = async (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation();
    await upvoteReport(reportId);
    onReportsUpdated();
  };

  const handleShare = async (e: React.MouseEvent, report: InfrastructureReport) => {
    e.stopPropagation();
    const shareUrl = getReportShareUrl(report.id);
    const success = await shareReport(
      `LaporInfra: ${report.kategori} - ${report.ticketNumber}`,
      `Laporan kerusakan infrastruktur ${report.kategori} di ${report.location.address}`,
      shareUrl
    );
    if (success) {
      setCopiedId(report.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Jalan Berlubang':
        return <Car className="h-3.5 w-3.5" />;
      case 'Jembatan Retak':
        return <Milestone className="h-3.5 w-3.5" />;
      case 'Trotoar Rusak':
        return <Footprints className="h-3.5 w-3.5" />;
      case 'Lampu Jalan Mati':
        return <Lightbulb className="h-3.5 w-3.5" />;
      case 'Saluran Air Tersumbat':
        return <Droplets className="h-3.5 w-3.5" />;
      default:
        return <Construction className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#18191a] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="mx-auto max-w-[1360px] space-y-6">
        {/* Header & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/80 dark:border-white/[0.08] pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
                Daftar Laporan Publik
              </h1>
              <span className="rounded-full bg-stone-200 dark:bg-white/[0.08] px-3 py-0.5 text-xs font-bold text-stone-700 dark:text-stone-300">
                {filteredReportsList.length} Laporan
              </span>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-2xl leading-relaxed">
              Transparansi kondisi infrastruktur kota. Seluruh laporan diverifikasi otomatis oleh AI Vision Gemini dan diprioritaskan penanganannya oleh dinas terkait.
            </p>
          </div>

          <button
            onClick={onOpenReportModal}
            className="self-start md:self-auto inline-flex items-center gap-2 rounded-full bg-amber-500 hover:bg-amber-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/20 active:scale-98 transition-all"
          >
            <Sparkles className="h-4 w-4 text-white" />
            <span>+ Buat Laporan Baru</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-[#202124] rounded-2xl p-4 sm:p-5 shadow-xs border border-stone-200/80 dark:border-white/[0.08] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative sm:col-span-2 lg:col-span-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                id="public-search-report-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari lokasi jalan, kota, deskripsi kerusakan, atau tiket..."
                className="w-full rounded-xl border border-stone-200 dark:border-white/[0.1] bg-stone-50 dark:bg-[#28292c] pl-10 pr-9 py-2.5 text-xs text-stone-800 dark:text-white placeholder-stone-400 dark:placeholder-stone-500 focus:bg-white dark:focus:bg-[#202124] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 rounded-full"
                  title="Hapus pencarian"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-xl border border-stone-200 dark:border-white/[0.1] bg-stone-50 dark:bg-[#28292c] px-3 py-2.5 text-xs font-semibold text-stone-700 dark:text-stone-200 focus:bg-white dark:focus:bg-[#202124] focus:border-amber-500 focus:outline-hidden transition-colors cursor-pointer"
              >
                <option value="Semua">Semua Kategori</option>
                <option value="Jalan Berlubang">Jalan Berlubang</option>
                <option value="Jembatan Retak">Jembatan Retak</option>
                <option value="Trotoar Rusak">Trotoar Rusak</option>
                <option value="Lampu Jalan Mati">Lampu Jalan Mati</option>
                <option value="Saluran Air Tersumbat">Saluran Air Tersumbat</option>
                <option value="Fasilitas Publik Lainnya">Fasilitas Lainnya</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full rounded-xl border border-stone-200 dark:border-white/[0.1] bg-stone-50 dark:bg-[#28292c] px-3 py-2.5 text-xs font-semibold text-stone-700 dark:text-stone-200 focus:bg-white dark:focus:bg-[#202124] focus:border-amber-500 focus:outline-hidden transition-colors cursor-pointer"
              >
                <option value="Semua">Semua Keparahan</option>
                <option value="Berat">🔴 Tingkat Berat</option>
                <option value="Sedang">🟡 Tingkat Sedang</option>
                <option value="Ringan">🟢 Tingkat Ringan</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-stone-200 dark:border-white/[0.1] bg-stone-50 dark:bg-[#28292c] px-3 py-2.5 text-xs font-semibold text-stone-700 dark:text-stone-200 focus:bg-white dark:focus:bg-[#202124] focus:border-amber-500 focus:outline-hidden transition-colors cursor-pointer"
              >
                <option value="Semua">Semua Status</option>
                <option value="Baru">Baru (Antrean)</option>
                <option value="Diproses">Sedang Diproses</option>
                <option value="Selesai">Selesai Diperbaiki</option>
              </select>
            </div>
          </div>

          {/* Quick Sort Options */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-stone-100 dark:border-white/[0.08] text-xs">
            <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400">
              <ArrowUpDown className="h-3.5 w-3.5 text-stone-400" />
              <span className="font-semibold">Urutkan:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: 'terbaru', label: 'Laporan Terbaru' },
                { key: 'keparahan_tertinggi', label: 'Prioritas Keparahan' },
                { key: 'paling_banyak_dukungan', label: 'Dukungan Warga' },
                { key: 'terlama', label: 'Terlama' },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSortBy(s.key as any)}
                  className={`rounded-full px-3 py-1 font-semibold transition-colors ${
                    sortBy === s.key
                      ? 'bg-amber-500 text-white'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/5'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>


        {/* Active Search & Result Feedback Banner */}
        {searchQuery.trim() && (
          <div className="flex items-center justify-between bg-amber-50/90 border border-amber-200/80 rounded-2xl px-4 py-2.5 text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-amber-950">
              <Search className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                Hasil pencarian untuk: <strong className="font-bold">&ldquo;{searchQuery}&rdquo;</strong> ({filteredReportsList.length} laporan cocok)
              </span>
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 text-[11px] hover:underline"
            >
              <span>Reset Pencarian</span>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Reports Grid */}
        {filteredReportsList.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
              <Filter className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-stone-800">
              Tidak Ada Laporan yang Sesuai
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Coba sesuaikan kata kunci pencarian atau ubah filter kategori/keparahan di atas.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('Semua');
                setSeverityFilter('Semua');
                setStatusFilter('Semua');
              }}
              className="rounded-full bg-stone-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-stone-800"
            >
              Reset Semua Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReportsList.map((report) => {
              const sev = getSeverityStyle(report.tingkat_keparahan);
              const st = getStatusStyle(report.status);

              return (
                <div
                  key={report.id}
                  id={`report-card-${report.id}`}
                  onClick={() => onSelectReport(report.id)}
                  className="group flex flex-col justify-between rounded-3xl border border-stone-200/80 dark:border-white/[0.08] bg-white dark:bg-[#202124] shadow-2xs hover:shadow-lg hover:border-amber-300 dark:hover:border-amber-500/50 transition-all cursor-pointer overflow-hidden transform hover:-translate-y-1"
                >
                  {/* Card Media Header */}
                  <div className="relative aspect-16/10 w-full overflow-hidden bg-stone-950">
                    <img
                      src={report.imageUrl}
                      alt={report.kategori}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white shadow-xs">
                        {getCategoryIcon(report.kategori)}
                        <span>{report.kategori}</span>
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-md`}
                        style={{ backgroundColor: sev.colorHex }}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        <span>{report.tingkat_keparahan}</span>
                      </span>
                    </div>

                    {/* Bottom Floating Info on Image */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[11px]">
                      <span className="font-mono font-semibold tracking-wider opacity-90">
                        {report.ticketNumber}
                      </span>
                      <span className="flex items-center gap-1 opacity-80 text-[10px]">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(report.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      {/* Status indicator bar */}
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${st.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`}></span>
                          <span>{st.label}</span>
                        </span>

                        <div className="flex items-center gap-1 text-[11px] text-stone-400">
                          <span>{report.location.city || 'Indonesia'}</span>
                        </div>
                      </div>

                      {/* Report Title */}
                      <h3 className="text-sm font-bold text-stone-900 dark:text-white line-clamp-1 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                        {report.title || report.kategori}
                      </h3>

                      {/* AI Description summary */}
                      <p className="text-xs font-normal text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed">
                        {report.deskripsi_otomatis}
                      </p>

                      {/* Location snippet */}
                      <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
                        <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">{report.location.address}</span>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-3 border-t border-stone-100 dark:border-white/[0.08] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {/* Upvote support counter */}
                        <button
                          type="button"
                          onClick={(e) => handleUpvote(e, report.id)}
                          className="flex items-center gap-1.5 rounded-full bg-stone-50 dark:bg-white/[0.05] border border-stone-200/80 dark:border-white/[0.08] px-2.5 sm:px-3 py-1 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-amber-50 dark:hover:bg-white/[0.1] hover:text-amber-800 dark:hover:text-white hover:border-amber-300 transition-colors"
                          title="Dukung perbaikan laporan ini"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          <span>{report.upvotes || 1}</span>
                        </button>

                        {/* Quick Share Button */}
                        <button
                          type="button"
                          onClick={(e) => handleShare(e, report)}
                          className={`flex items-center gap-1 rounded-full border px-2.5 sm:px-3 py-1 text-xs font-bold transition-colors ${
                            copiedId === report.id
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/50'
                              : 'bg-stone-50 dark:bg-white/[0.05] border-stone-200/80 dark:border-white/[0.08] text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/[0.1] hover:text-stone-900 dark:hover:text-white'
                          }`}
                          title="Bagikan Tautan Laporan"
                        >
                          {copiedId === report.id ? (
                            <>
                              <Check className="h-3 w-3 stroke-[3]" />
                              <span className="text-[11px]">Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="h-3.5 w-3.5 text-amber-600" />
                              <span className="text-[11px] hidden xs:inline">Bagikan</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Click to details prompt */}
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
                        <span>Lihat Detail</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
