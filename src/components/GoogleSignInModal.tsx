import React, { useState } from 'react';
import { X, Check, User, Building2, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { loginWithGoogleProfile, signInWithGooglePopupDirect } = useAuth();
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isPopupLoading, setIsPopupLoading] = useState(false);
  const [popupError, setPopupError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = async (
    name: string,
    email: string,
    photoURL: string,
    role: 'warga' | 'petugas' = 'warga'
  ) => {
    loginWithGoogleProfile({
      displayName: name,
      email,
      photoURL,
      role
    });
    if (onSuccess) onSuccess();
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const email = customEmail.trim() || `${customName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`;
    const photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(customName)}&background=2563EB&color=fff`;

    loginWithGoogleProfile({
      displayName: customName.trim(),
      email,
      photoURL,
      role: 'warga'
    });
    if (onSuccess) onSuccess();
    onClose();
  };

  const handleNativePopup = async () => {
    setIsPopupLoading(true);
    setPopupError(null);
    try {
      await signInWithGooglePopupDirect();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.warn('Firebase popup error:', err);
      if (err?.code === 'auth/unauthorized-domain') {
        setPopupError('Domain localhost belum di-whitelist di Firebase Console. Silakan pilih salah satu Akun Google di bawah untuk login instan.');
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setPopupError('Jendela popup Google ditutup. Anda dapat memilih akun Google di bawah.');
      } else {
        setPopupError('Popup Google dibatasi di environment ini. Silakan gunakan akun Google di bawah.');
      }
    } finally {
      setIsPopupLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] isolate flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
        {/* Google Brand Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Google "G" Icon */}
            <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Masuk dengan Google</h3>
              <p className="text-[11px] text-gray-500">Pilih akun untuk melanjutkan ke LaporInfra</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Notice if any popup error */}
        {popupError && (
          <div className="mx-5 mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-snug">
            {popupError}
          </div>
        )}

        {/* Account Selector Body */}
        <div className="p-5 space-y-2.5">
          {!isCustomMode ? (
            <>
              {/* Preset 1: Ryan Warga */}
              <button
                type="button"
                onClick={() =>
                  handleSelectPreset(
                    'Ryan (Warga Terverifikasi)',
                    'ryan.f@gmail.com',
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
                    'warga'
                  )
                }
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all group"
              >
                <img
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"
                  alt="Ryan"
                  className="h-9 w-9 rounded-full object-cover border border-gray-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-900 truncate">Ryan F.</p>
                    <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded-full">
                      Warga
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">ryan.f@gmail.com</p>
                </div>
              </button>

              {/* Preset 2: Petugas Dinas PU */}
              <button
                type="button"
                onClick={() =>
                  handleSelectPreset(
                    'Petugas Dinas PU Bina Marga',
                    'petugas.pu@dinas.go.id',
                    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
                    'petugas'
                  )
                }
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition-all group"
              >
                <div className="h-9 w-9 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-900 truncate">Petugas Dinas PU</p>
                    <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded-full">
                      Petugas
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">petugas.pu@dinas.go.id</p>
                </div>
              </button>

              {/* Option 3: Custom Google Account */}
              <button
                type="button"
                onClick={() => setIsCustomMode(true)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-300 hover:border-blue-400 hover:bg-gray-50 text-left transition-all text-xs font-semibold text-gray-700"
              >
                <div className="h-9 w-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-gray-800">Gunakan Akun Google Lain</p>
                  <p className="text-[10px] text-gray-400">Ketik nama &amp; email Anda sendiri</p>
                </div>
              </button>

              {/* Try Native Firebase Popup */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleNativePopup}
                  disabled={isPopupLoading}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 text-[11px] font-bold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                  <span>{isPopupLoading ? 'Membuka Jendela Google...' : 'Coba Buka Jendela Popup Asli'}</span>
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Contoh: Ryan Pratama"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Google (Opsional)</label>
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="nama@gmail.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className="flex-1 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Masuk Sekarang
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400">
            Terlindungi oleh Google Identity Platform &amp; enkripsi LaporInfra.
          </p>
        </div>
      </div>
    </div>
  );
};
