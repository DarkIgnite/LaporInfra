import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  Search,
  Filter,
  Download,
  Eye,
  Edit3,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpDown,
  Crown
} from 'lucide-react';
import { InfrastructureReport, AdminUser, ReportStatus, DamageCategory, SeverityLevel } from '../types';
import { getSeverityStyle, getStatusStyle, formatIndonesianDate } from '../utils/helpers';
import { updateReportStatus, resetReportsToSeed } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SuperAdminEditModal } from './SuperAdminEditModal';

interface AdminDashboardProps {
  reports: InfrastructureReport[];
  adminUser: AdminUser;
  onSelectReport: (reportId: string) => void;
  onReportsUpdated: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  reports,
  adminUser,
  onSelectReport,
  onReportsUpdated,
}) => {
  const { userProfile } = useAuth();
  const isSuperAdmin = userProfile?.role === 'super_admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [severityFilter, setSeverityFilter] = useState('Semua');
  const [sortBy, setSortBy] = useState<'keparahan' | 'terbaru' | 'terlama'>('keparahan');

  // Super Admin Edit Modal State
  const [superAdminEditingReport, setSuperAdminEditingReport] = useState<InfrastructureReport | null>(null);

  // Quick Status Edit Modal State
  const [editingReport, setEditingReport] = useState<InfrastructureReport | null>(null);
  const [newStatus, setNewStatus] = useState<ReportStatus>('Diproses');
  const [dinasNoteInput, setDinasNoteInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = reports.length;
    const berat = reports.filter((r) => r.tingkat_keparahan === 'Berat').length;
    const sedang = reports.filter((r) => r.tingkat_keparahan === 'Sedang').length;
    const ringan = reports.filter((r) => r.tingkat_keparahan === 'Ringan').length;

    const baru = reports.filter((r) => r.status === 'Baru').length;
    const diproses = reports.filter((r) => r.status === 'Diproses').length;
    const selesai = reports.filter((r) => r.status === 'Selesai').length;

    const resolutionRate = total > 0 ? Math.round((selesai / total) * 100) : 0;

    // Categories count
    const catMap: Record<string, number> = {};
    reports.forEach((r) => {
      catMap[r.kategori] = (catMap[r.kategori] || 0) + 1;
    });

    return { total, berat, sedang, ringan, baru, diproses, selesai, resolutionRate, catMap };
  }, [reports]);

  // Filtered and sorted reports
  const filteredReports = useMemo(() => {
    let list = [...reports];

    if (categoryFilter !== 'Semua') {
      list = list.filter((r) => r.kategori === categoryFilter);
    }
    if (statusFilter !== 'Semua') {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (severityFilter !== 'Semua') {
      list = list.filter((r) => r.tingkat_keparahan === severityFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.ticketNumber.toLowerCase().includes(q) ||
          r.kategori.toLowerCase().includes(q) ||
          r.deskripsi_otomatis.toLowerCase().includes(q) ||
          (r.location.address && r.location.address.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'keparahan') {
      const order: Record<string, number> = { Berat: 3, Sedang: 2, Ringan: 1 };
      list.sort((a, b) => {
        const diff = (order[b.tingkat_keparahan] || 0) - (order[a.tingkat_keparahan] || 0);
        if (diff !== 0) return diff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else if (sortBy === 'terlama') {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      // terbaru
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [reports, categoryFilter, statusFilter, severityFilter, searchQuery, sortBy]);

  const handleOpenStatusEdit = (report: InfrastructureReport) => {
    setEditingReport(report);
    setNewStatus(report.status);
    setDinasNoteInput(report.dinasNotes || '');
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport) return;

    setIsUpdating(true);
    try {
      await updateReportStatus(
        editingReport.id,
        newStatus,
        dinasNoteInput.trim() || undefined,
        `${adminUser.name} (${adminUser.role})`
      );
      onReportsUpdated();
      setEditingReport(null);
    } catch (err) {
      console.error('Update status failed:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Nomor Tiket',
      'Kategori',
      'Tingkat Keparahan',
      'Status',
      'Alamat',
      'Lintang',
      'Bujur',
      'Pelapor',
      'Dukungan Warga',
      'Tanggal Dibuat',
      'Catatan Dinas'
    ];

    const rows = reports.map((r) => [
      r.ticketNumber,
      `"${r.kategori}"`,
      r.tingkat_keparahan,
      r.status,
      `"${r.location.address || ''}"`,
      r.location.lat,
      r.location.lng,
      `"${r.reporterName || 'Warga'}"`,
      r.upvotes || 1,
      r.createdAt,
      `"${r.dinasNotes || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LaporInfra_Rekap_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] py-8 px-4 sm:px-6 lg:px-8 space-y-6 font-sans">
      <div className="mx-auto max-w-[1360px] space-y-6">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-stone-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${isSuperAdmin ? 'bg-gradient-to-tr from-amber-500 to-orange-500' : 'bg-blue-600'} text-white shadow-md`}>
                {isSuperAdmin ? <Crown className="h-5 w-5 text-white" /> : <Building2 className="h-5 w-5 stroke-[2.2]" />}
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {isSuperAdmin ? 'Dashboard Pengendali Super Admin' : 'Dashboard Dinas Pekerjaan Umum & Tata Ruang'}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-stone-300">
              Pengelola: <span className="font-bold text-amber-400">{userProfile?.displayName || adminUser.name}</span> &bull; {isSuperAdmin ? 'Kementerian PUPR / Super Administrator' : `${adminUser.department} (${adminUser.role})`}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 rounded-full bg-stone-800 px-4 py-2 text-xs font-bold text-stone-200 border border-stone-700 hover:bg-stone-700 hover:text-white transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-amber-400" />
              <span>Ekspor Rekap (CSV)</span>
            </button>

            <button
              onClick={async () => {
                if (confirm('Kembalikan database laporan ke data demo awal?')) {
                  await resetReportsToSeed();
                  onReportsUpdated();
                }
              }}
              title="Reset Demo Data"
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Demo</span>
            </button>
          </div>
        </div>

        {/* Top 4 KPI Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Reports */}
          <div className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                Total Laporan Masuk
              </p>
              <h3 className="text-2xl font-black text-stone-900 mt-1">
                {stats.total}
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Dari seluruh warga terlapor
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
              <Layers className="h-6 w-6" />
            </div>
          </div>

          {/* Card 2: Urgent Severity (Berat) */}
          <div className="rounded-3xl border border-rose-200 bg-rose-50/50 p-5 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                Prioritas Kritis (Berat)
              </p>
              <h3 className="text-2xl font-black text-rose-700 mt-1">
                {stats.berat}
              </h3>
              <p className="text-[11px] text-rose-600 mt-0.5 font-semibold">
                SLA Penanganan &lt; 24 Jam
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>

          {/* Card 3: In Progress (Diproses) */}
          <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-5 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                Sedang Dikerjakan
              </p>
              <h3 className="text-2xl font-black text-amber-800 mt-1">
                {stats.diproses}
              </h3>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Tim URC &amp; Material di Lapangan
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
              <Wrench className="h-6 w-6" />
            </div>
          </div>

          {/* Card 4: Resolved (Selesai) */}
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Selesai Diperbaiki
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-black text-emerald-800">
                  {stats.selesai}
                </h3>
                <span className="text-xs font-bold text-emerald-700">
                  ({stats.resolutionRate}%)
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Target SDG 9 Tercapai
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Analytics Breakdown Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Severity Breakdown Bar */}
          <div className="rounded-3xl border border-stone-200/80 bg-white p-6 space-y-4 shadow-2xs">
            <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-amber-600" />
              <span>Distribusi Tingkat Keparahan</span>
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold text-stone-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-600"></span>
                    <span>Tingkat Berat (Bahaya Kritis)</span>
                  </span>
                  <span>{stats.berat} ({stats.total > 0 ? Math.round((stats.berat / stats.total) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-600 h-full rounded-full"
                    style={{ width: `${stats.total > 0 ? (stats.berat / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-stone-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                    <span>Tingkat Sedang (Aksesibilitas)</span>
                  </span>
                  <span>{stats.sedang} ({stats.total > 0 ? Math.round((stats.sedang / stats.total) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${stats.total > 0 ? (stats.sedang / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-stone-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                    <span>Tingkat Ringan (Pemeliharaan)</span>
                  </span>
                  <span>{stats.ringan} ({stats.total > 0 ? Math.round((stats.ringan / stats.total) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full"
                    style={{ width: `${stats.total > 0 ? (stats.ringan / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown (2 cols) */}
          <div className="lg:col-span-2 rounded-3xl border border-stone-200/80 bg-white p-6 space-y-4 shadow-2xs">
            <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-amber-600" />
              <span>Rekap per Kategori Fasilitas Publik</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { name: 'Jalan Berlubang', count: stats.catMap['Jalan Berlubang'] || 0, color: 'bg-stone-50 text-stone-800 border-stone-200' },
                { name: 'Jembatan Retak', count: stats.catMap['Jembatan Retak'] || 0, color: 'bg-rose-50 text-rose-800 border-rose-200' },
                { name: 'Trotoar Rusak', count: stats.catMap['Trotoar Rusak'] || 0, color: 'bg-amber-50 text-amber-900 border-amber-200' },
                { name: 'Lampu Jalan Mati', count: stats.catMap['Lampu Jalan Mati'] || 0, color: 'bg-stone-50 text-stone-800 border-stone-200' },
                { name: 'Saluran Air Tersumbat', count: stats.catMap['Saluran Air Tersumbat'] || 0, color: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
                { name: 'Fasilitas Lainnya', count: stats.catMap['Fasilitas Publik Lainnya'] || 0, color: 'bg-stone-50 text-stone-700 border-stone-200' },
              ].map((cat) => (
                <div key={cat.name} className={`p-3.5 rounded-2xl border ${cat.color} space-y-1`}>
                  <p className="text-[11px] font-medium truncate">{cat.name}</p>
                  <p className="text-xl font-black">{cat.count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Reports Table Card */}
        <div className="rounded-3xl border border-stone-200/80 bg-white shadow-2xs overflow-hidden">
          {/* Table Control & Filter Bar */}
          <div className="p-5 sm:p-6 border-b border-stone-200/80 space-y-3 bg-stone-50/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Antrean &amp; Prioritas Laporan Kerusakan
                </h3>
                <p className="text-xs text-stone-500">
                  Secara bawaan diurutkan dari tingkat keparahan tertinggi untuk respon cepat dinas.
                </p>
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-stone-500 font-semibold">Urutkan:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-bold text-stone-700 focus:outline-hidden cursor-pointer"
                >
                  <option value="keparahan">Prioritas Keparahan (Berat &rarr; Ringan)</option>
                  <option value="terbaru">Terbaru Masuk</option>
                  <option value="terlama">Terlama</option>
                </select>
              </div>
            </div>

            {/* Filter inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari tiket, lokasi, kata kunci..."
                  className="w-full rounded-xl border border-stone-200 bg-white pl-10 pr-3.5 py-2 text-xs text-stone-800 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Category */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 focus:outline-hidden cursor-pointer"
              >
                <option value="Semua">Semua Kategori</option>
                <option value="Jalan Berlubang">Jalan Berlubang</option>
                <option value="Jembatan Retak">Jembatan Retak</option>
                <option value="Trotoar Rusak">Trotoar Rusak</option>
                <option value="Lampu Jalan Mati">Lampu Jalan Mati</option>
                <option value="Saluran Air Tersumbat">Saluran Air Tersumbat</option>
              </select>

              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 focus:outline-hidden cursor-pointer"
              >
                <option value="Semua">Semua Status</option>
                <option value="Baru">Baru (Antrean)</option>
                <option value="Diproses">Sedang Diproses</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-100/80 text-[11px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="px-5 py-3.5">No. Tiket &amp; Tanggal</th>
                  <th className="px-4 py-3.5">Foto &amp; Kategori</th>
                  <th className="px-4 py-3.5">Keparahan AI</th>
                  <th className="px-4 py-3.5">Lokasi &amp; Ringkasan</th>
                  <th className="px-4 py-3.5">Status Penanganan</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/80 font-medium">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-stone-400">
                      Tidak ada data laporan yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => {
                    const sev = getSeverityStyle(report.tingkat_keparahan);
                    const st = getStatusStyle(report.status);

                    return (
                      <tr key={report.id} className="hover:bg-stone-50/80 transition-colors">
                        {/* Ticket & Date */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-amber-700 block">
                            {report.ticketNumber}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {formatIndonesianDate(report.createdAt)}
                          </span>
                        </td>

                        {/* Photo & Category */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={report.imageUrl}
                              alt={report.kategori}
                              className="h-10 w-10 rounded-xl object-cover bg-stone-900 shrink-0 border border-stone-200"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <span className="font-bold text-stone-900 block">
                                {report.kategori}
                              </span>
                              <span className="text-[10px] text-stone-400">
                                Pelapor: {report.reporterName || 'Warga'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Severity */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs"
                            style={{ backgroundColor: sev.colorHex }}
                          >
                            <AlertTriangle className="h-3 w-3" />
                            <span>{report.tingkat_keparahan}</span>
                          </span>
                        </td>

                        {/* Location & Summary */}
                        <td className="px-4 py-4 max-w-xs">
                          <p className="font-bold text-stone-800 truncate">
                            {report.location.address}
                          </p>
                          <p className="text-[11px] text-stone-500 line-clamp-1">
                            {report.deskripsi_otomatis}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${st.badge}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`}></span>
                            <span>{report.status}</span>
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="px-5 py-4 whitespace-nowrap text-right space-x-1.5">
                          <button
                            onClick={() => onSelectReport(report.id)}
                            title="Lihat Detail"
                            className="rounded-full border border-stone-200 bg-white p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenStatusEdit(report)}
                            title="Perbarui Status Dinas"
                            className="inline-flex items-center gap-1 rounded-full bg-stone-900 hover:bg-stone-800 px-3.5 py-1.5 text-xs font-bold text-white transition-colors"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-amber-400" />
                            <span>Ubah Status</span>
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => setSuperAdminEditingReport(report)}
                              title="Super Admin: Edit Judul, Foto, Kategori & Hapus"
                              className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 px-3.5 py-1.5 text-xs font-bold text-white transition-all shadow-xs active:scale-95"
                            >
                              <Crown className="h-3.5 w-3.5 text-amber-100" />
                              <span>Edit Penuh</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Status Update Modal */}
      {editingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-stone-200">
            <div className="border-b border-stone-200 px-6 py-4 bg-stone-50 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-stone-900">
                  Ubah Status Penanganan Dinas
                </h4>
                <p className="text-xs text-stone-500 font-mono">
                  {editingReport.ticketNumber} — {editingReport.kategori}
                </p>
              </div>
              <button
                onClick={() => setEditingReport(null)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Pilih Status Baru
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Baru', 'Diproses', 'Selesai'] as ReportStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewStatus(st)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        newStatus === st
                          ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-xs ring-2 ring-amber-500/20'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Catatan Tindak Lanjut Dinas (Publik &amp; Transparan)
                </label>
                <textarea
                  rows={3}
                  value={dinasNoteInput}
                  onChange={(e) => setDinasNoteInput(e.target.value)}
                  placeholder="Contoh: Material aspal hotmix dan tim URC telah diberangkatkan ke lokasi..."
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-stone-800 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingReport(null)}
                  className="rounded-full border border-stone-200 px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="rounded-full bg-stone-900 px-5 py-2 text-xs font-bold text-white hover:bg-stone-800 shadow-md"
                >
                  {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Super Admin Edit Modal */}
      {isSuperAdmin && superAdminEditingReport && (
        <SuperAdminEditModal
          report={superAdminEditingReport}
          isOpen={!!superAdminEditingReport}
          onClose={() => setSuperAdminEditingReport(null)}
          onSaved={() => {
            setSuperAdminEditingReport(null);
            onReportsUpdated();
          }}
          onDeleted={() => {
            setSuperAdminEditingReport(null);
            onReportsUpdated();
          }}
        />
      )}
    </div>
  );
};
