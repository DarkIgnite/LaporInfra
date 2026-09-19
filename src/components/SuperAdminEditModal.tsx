import React, { useState } from 'react';
import {
  X,
  Save,
  Trash2,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
  Crown,
  Upload,
  RefreshCw,
  MapPin
} from 'lucide-react';
import { InfrastructureReport, DamageCategory, SeverityLevel, ReportStatus } from '../types';
import { updateFullReport, deleteReport } from '../services/api';

interface SuperAdminEditModalProps {
  report: InfrastructureReport | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedReport: InfrastructureReport) => void;
  onDeleted?: (deletedReportId: string) => void;
}

const CATEGORY_OPTIONS: DamageCategory[] = [
  'Jalan Berlubang',
  'Jembatan Retak',
  'Trotoar Rusak',
  'Lampu Jalan Mati',
  'Saluran Air Tersumbat',
  'Fasilitas Publik Lainnya',
];

const SEVERITY_OPTIONS: SeverityLevel[] = ['Ringan', 'Sedang', 'Berat'];
const STATUS_OPTIONS: ReportStatus[] = ['Baru', 'Diproses', 'Selesai'];

export const SuperAdminEditModal: React.FC<SuperAdminEditModalProps> = ({
  report,
  isOpen,
  onClose,
  onSaved,
  onDeleted,
}) => {
  if (!isOpen || !report) return null;

  const [kategori, setKategori] = useState<DamageCategory>(report.kategori);
  const [imageUrl, setImageUrl] = useState<string>(report.imageUrl);
  const [tingkatKeparahan, setTingkatKeparahan] = useState<SeverityLevel>(report.tingkat_keparahan);
  const [status, setStatus] = useState<ReportStatus>(report.status);
  const [deskripsiOtomatis, setDeskripsiOtomatis] = useState<string>(report.deskripsi_otomatis || '');
  const [deskripsiManual, setDeskripsiManual] = useState<string>(report.deskripsi_manual || '');
  const [rekomendasiPrioritas, setRekomendasiPrioritas] = useState<string>(report.rekomendasi_prioritas || '');
  const [dinasNotes, setDinasNotes] = useState<string>(report.dinasNotes || '');
  const [address, setAddress] = useState<string>(report.location.address || '');
  const [city, setCity] = useState<string>(report.location.city || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await updateFullReport(report.id, {
        kategori,
        imageUrl,
        tingkat_keparahan: tingkatKeparahan,
        status,
        deskripsi_otomatis: deskripsiOtomatis,
        deskripsi_manual: deskripsiManual,
        rekomendasi_prioritas: rekomendasiPrioritas,
        dinasNotes,
        location: {
          ...report.location,
          address,
          city,
        },
      });

      if (updated) {
        onSaved(updated);
        onClose();
      } else {
        alert('Gagal menyimpan perubahan.');
      }
    } catch (err) {
      console.error('Super Admin edit error:', err);
      alert('Terjadi kesalahan saat menyimpan laporan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Yakin ingin MENGHAPUS laporan ${report.ticketNumber}? Tindakan ini permanen.`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteReport(report.id);
      if (onDeleted) onDeleted(report.id);
      onClose();
    } catch (err) {
      console.error('Delete report error:', err);
      alert('Gagal menghapus laporan.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10001] isolate flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs font-sans animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Super Admin */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-sm shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs border border-white/30 text-amber-100">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-wide uppercase">Editor Super Admin</h3>
                <span className="text-[10px] font-bold bg-white/20 border border-white/30 px-2 py-0.5 rounded-full">
                  {report.ticketNumber}
                </span>
              </div>
              <p className="text-[11px] text-amber-100">Ubah judul, foto, status, atau hapus laporan kerusakan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Photo Section: URL + File Upload */}
          <div className="space-y-2">
            <label className="block font-bold text-gray-800">
              Foto Laporan (URL Gambar atau Unggah Baru)
            </label>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Image Preview */}
              <div className="relative w-full sm:w-44 h-32 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100 shrink-0">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80';
                  }}
                />
                <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">
                  Live Preview
                </span>
              </div>

              {/* Photo Input Controls */}
              <div className="flex-1 w-full space-y-2">
                <div>
                  <label className="text-[11px] text-gray-500 mb-1 block">Tautan URL Gambar:</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors">
                    <Upload className="h-3.5 w-3.5 text-gray-500" />
                    <span>Unggah File dari Komputer</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setImageUrl(
                        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80'
                      )
                    }
                    className="text-[11px] text-blue-600 hover:text-blue-800"
                  >
                    Pakai Foto Standar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Category & Severity & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Kategori / Judul</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as DamageCategory)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-800 focus:border-amber-500 focus:outline-none"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Tingkat Keparahan</label>
              <select
                value={tingkatKeparahan}
                onChange={(e) => setTingkatKeparahan(e.target.value as SeverityLevel)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-800 focus:border-amber-500 focus:outline-none"
              >
                {SEVERITY_OPTIONS.map((sev) => (
                  <option key={sev} value={sev}>
                    {sev}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Status Penanganan</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ReportStatus)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-800 focus:border-amber-500 focus:outline-none"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Address & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Alamat Lengkap</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
                placeholder="Jl. Nama Jalan No. ..."
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Kota / Wilayah</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
                placeholder="Jakarta Selatan, Bandung, dll"
              />
            </div>
          </div>

          {/* Descriptions */}
          <div className="space-y-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Deskripsi Otomatis / Ringkasan Kerusakan
              </label>
              <textarea
                rows={2}
                value={deskripsiOtomatis}
                onChange={(e) => setDeskripsiOtomatis(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
                placeholder="Penjelasan kerusakan teknis..."
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Catatan Pelapor / Deskripsi Tambahan
              </label>
              <textarea
                rows={2}
                value={deskripsiManual}
                onChange={(e) => setDeskripsiManual(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
                placeholder="Catatan dari warga..."
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Catatan Tindak Lanjut Dinas PU
              </label>
              <textarea
                rows={2}
                value={dinasNotes}
                onChange={(e) => setDinasNotes(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
                placeholder="Contoh: Jadwal pengaspalan URC pada 20 September 2026..."
              />
            </div>
          </div>

          {/* Modal Action Bar */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{isDeleting ? 'Menghapus...' : 'Hapus Laporan'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving || isDeleting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold shadow-md shadow-amber-500/25 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
