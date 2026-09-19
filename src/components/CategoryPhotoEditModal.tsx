import React, { useState, useEffect } from 'react';
import {
  X,
  Crown,
  Upload,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Sparkles,
  Link2,
  Undo2,
  FolderSync
} from 'lucide-react';
import { updateCategoryImage, resetCategoryImages, DEFAULT_CATEGORY_IMAGES } from '../services/api';

interface CategoryPhotoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
  currentImages: Record<string, string>;
  onSaved: (updatedImages: Record<string, string>) => void;
}

interface CategoryMeta {
  key: string;
  label: string;
  desc: string;
  defaultUrl: string;
  presets: Array<{ label: string; url: string }>;
}

const CATEGORY_META_LIST: CategoryMeta[] = [
  {
    key: 'Jalan Berlubang',
    label: 'Jalan Berlubang',
    desc: 'Pothole & retakan aspal di badan jalan',
    defaultUrl: DEFAULT_CATEGORY_IMAGES['Jalan Berlubang'],
    presets: [
      { label: 'Pothole Close-up', url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80' },
      { label: 'Jalan Aspal Retak', url: 'https://images.unsplash.com/photo-1578873375973-2e02a9018e6e?auto=format&fit=crop&w=600&q=80' },
      { label: 'Lubang Basah Hujan', url: 'https://images.unsplash.com/photo-1599818816934-8c859d04261e?auto=format&fit=crop&w=600&q=80' },
      { label: 'Jalanan Kota Berlubang', url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80' },
    ]
  },
  {
    key: 'Jembatan Retak',
    label: 'Jembatan Retak',
    desc: 'Kerusakan struktur sambungan jembatan',
    defaultUrl: DEFAULT_CATEGORY_IMAGES['Jembatan Retak'],
    presets: [
      { label: 'Struktur Jembatan Beton', url: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&w=600&q=80' },
      { label: 'Pilar Jembatan Retak', url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=600&q=80' },
      { label: 'Jembatan Logam Berkarat', url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80' },
      { label: 'Overpass Jembatan Layang', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80' },
    ]
  },
  {
    key: 'Trotoar Rusak',
    label: 'Trotoar Rusak',
    desc: 'Paving ambles & ubin difabel pecah',
    defaultUrl: DEFAULT_CATEGORY_IMAGES['Trotoar Rusak'],
    presets: [
      { label: 'Paving Block Pecah', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80' },
      { label: 'Jalur Difabel Rusak', url: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80' },
      { label: 'Trotoar Ambles', url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80' },
      { label: 'Pedestrian Berbatu', url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80' },
    ]
  },
  {
    key: 'Lampu Jalan Mati',
    label: 'Lampu Jalan Mati',
    desc: 'PJU padam & kabel penerangan terbuka',
    defaultUrl: DEFAULT_CATEGORY_IMAGES['Lampu Jalan Mati'],
    presets: [
      { label: 'Tiang Lampu Malam', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80' },
      { label: 'Lampu Jalanan Redup', url: 'https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?auto=format&fit=crop&w=600&q=80' },
      { label: 'Tiang PJU Kota', url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=600&q=80' },
      { label: 'Penerangan Gelap', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80' },
    ]
  },
  {
    key: 'Saluran Air Tersumbat',
    label: 'Saluran Air',
    desc: 'Drainase tersumbat lumpur & meluap',
    defaultUrl: DEFAULT_CATEGORY_IMAGES['Saluran Air Tersumbat'],
    presets: [
      { label: 'Drainase Penuh Air', url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=600&q=80' },
      { label: 'Got Gorong-gorong', url: 'https://images.unsplash.com/photo-1527030280862-64139fba04ca?auto=format&fit=crop&w=600&q=80' },
      { label: 'Genangan Banjir Jalan', url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80' },
      { label: 'Saluran Limbah Tersumbat', url: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=600&q=80' },
    ]
  },
  {
    key: 'Fasilitas Publik Lainnya',
    label: 'Fasilitas Publik',
    desc: 'Halte bus, taman kota & marka jalan',
    defaultUrl: DEFAULT_CATEGORY_IMAGES['Fasilitas Publik Lainnya'],
    presets: [
      { label: 'Halte Bus Kota', url: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=600&q=80' },
      { label: 'Taman Publik Rusak', url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=600&q=80' },
      { label: 'Pagar Pembatas Jalan', url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80' },
      { label: 'Fasilitas Kursi Publik', url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=600&q=80' },
    ]
  },
];

export const CategoryPhotoEditModal: React.FC<CategoryPhotoEditModalProps> = ({
  isOpen,
  onClose,
  initialCategory,
  currentImages,
  onSaved,
}) => {
  const [selectedKey, setSelectedKey] = useState<string>(
    initialCategory || CATEGORY_META_LIST[0].key
  );
  const [localImages, setLocalImages] = useState<Record<string, string>>({
    ...DEFAULT_CATEGORY_IMAGES,
    ...currentImages,
  });
  const [inputUrl, setInputUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialCategory) {
      // Find matching meta by key or label
      const found = CATEGORY_META_LIST.find(
        (m) => m.key === initialCategory || m.label === initialCategory
      );
      if (found) {
        setSelectedKey(found.key);
      }
    }
  }, [initialCategory, isOpen]);

  useEffect(() => {
    setLocalImages({ ...DEFAULT_CATEGORY_IMAGES, ...currentImages });
  }, [currentImages, isOpen]);

  const activeMeta =
    CATEGORY_META_LIST.find((m) => m.key === selectedKey) || CATEGORY_META_LIST[0];
  const activeImageUrl = localImages[activeMeta.key] || activeMeta.defaultUrl;

  useEffect(() => {
    setInputUrl(activeImageUrl);
    setSaveSuccessMessage(null);
  }, [selectedKey, activeImageUrl]);

  if (!isOpen) return null;

  // Handle URL input apply
  const handleApplyUrl = () => {
    if (!inputUrl.trim()) return;
    setLocalImages((prev) => ({
      ...prev,
      [activeMeta.key]: inputUrl.trim(),
    }));
  };

  // Handle Preset Click
  const handleSelectPreset = (url: string) => {
    setInputUrl(url);
    setLocalImages((prev) => ({
      ...prev,
      [activeMeta.key]: url,
    }));
  };

  // Handle Local File Upload (Base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setInputUrl(base64);
      setLocalImages((prev) => ({
        ...prev,
        [activeMeta.key]: base64,
      }));
    };
    reader.readAsDataURL(file);
  };

  // Reset current category to default photo
  const handleResetCurrentCategory = () => {
    const defaultUrl = activeMeta.defaultUrl;
    setInputUrl(defaultUrl);
    setLocalImages((prev) => ({
      ...prev,
      [activeMeta.key]: defaultUrl,
    }));
  };

  // Reset all categories to default
  const handleResetAllToDefault = async () => {
    if (!confirm('Kembalikan SEMUA foto kategori beranda ke foto bawaan awal?')) return;
    setIsSaving(true);
    try {
      const resetMap = await resetCategoryImages();
      setLocalImages(resetMap);
      setInputUrl(resetMap[activeMeta.key] || activeMeta.defaultUrl);
      onSaved(resetMap);
      setSaveSuccessMessage('Semua foto berhasil dikembalikan ke bawaan!');
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save current category image
      const updated = await updateCategoryImage(activeMeta.key, localImages[activeMeta.key]);
      onSaved(updated);
      setSaveSuccessMessage(`Foto kategori "${activeMeta.label}" berhasil disimpan!`);
      setTimeout(() => {
        setSaveSuccessMessage(null);
        onClose();
      }, 1200);
    } catch (e) {
      alert('Gagal menyimpan foto kategori.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] isolate flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs font-sans animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900">Edit Foto Kategori Beranda</h3>
                <span className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 rounded px-1.5 py-0.2">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Pilih kategori dan tentukan gambar tampilan depan yang sesuai
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Category Horizontal Selector Tabs */}
        <div className="px-6 pt-4 pb-2 border-b border-gray-100 bg-gray-50/70 overflow-x-auto flex items-center gap-2 no-scrollbar">
          {CATEGORY_META_LIST.map((cat) => {
            const isSelected = cat.key === selectedKey;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedKey(cat.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {saveSuccessMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-2xl text-xs font-bold text-green-800 flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600 stroke-[3]" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {/* Grid Preview & Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
            {/* Left: Card Preview (5 cols) */}
            <div className="sm:col-span-5 space-y-2">
              <p className="text-xs font-bold text-gray-700">Preview Tampilan di Beranda:</p>
              <div className="relative rounded-2xl border border-gray-200 overflow-hidden shadow-sm bg-white">
                <div className="aspect-video relative overflow-hidden bg-gray-900">
                  <img
                    src={activeImageUrl}
                    alt={activeMeta.label}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute top-2 right-2 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    SLA Standar
                  </span>
                  <span className="absolute bottom-2 left-2 text-[10px] text-white/90 font-medium truncate max-w-[85%]">
                    Live Preview
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-sm font-bold text-gray-900">{activeMeta.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{activeMeta.desc}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetCurrentCategory}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Undo2 className="h-3.5 w-3.5 text-gray-500" />
                <span>Reset ke Foto Bawaan</span>
              </button>
            </div>

            {/* Right: Change Photo Options (7 cols) */}
            <div className="sm:col-span-7 space-y-4">
              {/* Option 1: URL Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5 text-blue-600" />
                  <span>URL Gambar Langsung</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="rounded-xl bg-gray-900 hover:bg-black text-white px-3.5 py-2 text-xs font-bold shrink-0 transition-colors"
                  >
                    Terapkan
                  </button>
                </div>
                <p className="text-[10px] text-gray-400">
                  Mendukung gambar dari Unsplash, Pexels, Google, atau CDN hosting apa pun.
                </p>
              </div>

              {/* Option 2: Upload File */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5 text-amber-600" />
                  <span>Atau Unggah Foto dari File</span>
                </label>
                <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50/40 cursor-pointer transition-all">
                  <ImageIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-xs font-semibold text-gray-700">
                    Pilih File Foto (JPG, PNG, WebP)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Option 3: Presets Gallery */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>Pilihan Foto Rekomendasi (1-Klik)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {activeMeta.presets.map((preset) => {
                    const isCurrent = activeImageUrl === preset.url;
                    return (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => handleSelectPreset(preset.url)}
                        className={`group relative flex items-center gap-2 p-2 rounded-xl border text-left transition-all overflow-hidden ${
                          isCurrent
                            ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/20'
                            : 'border-gray-200 hover:border-blue-300 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="h-10 w-10 rounded-lg object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-gray-800 truncate leading-tight">
                            {preset.label}
                          </p>
                          <p className="text-[9px] text-gray-400">Pilih foto ini</p>
                        </div>
                        {isCurrent && (
                          <div className="h-4 w-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetAllToDefault}
            disabled={isSaving}
            className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors flex items-center gap-1"
          >
            <FolderSync className="h-3.5 w-3.5" />
            <span>Reset Semua Kategori</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
