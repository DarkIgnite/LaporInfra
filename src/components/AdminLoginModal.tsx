import React, { useState } from 'react';
import { Building2, X, Sparkles, Check, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, userProfile, signInWithGoogle, setUserRole, loginWithGoogleProfile } = useAuth();
  const [department, setDepartment] = useState('Dinas Pekerjaan Umum & Tata Ruang');
  const [subRole, setSubRole] = useState('Petugas Verifikasi Lapangan');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleActivatePetugasRole = async () => {
    setIsLoading(true);
    try {
      if (!user) {
        loginWithGoogleProfile({
          displayName: 'Petugas Dinas PU Bina Marga',
          email: 'petugas.pu@dinas.go.id',
          role: 'petugas'
        });
      } else {
        await setUserRole('petugas', department, subRole);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (e) {
      console.error('Failed to set officer role:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] isolate flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 animate-in fade-in font-sans">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 px-6 py-4 bg-stone-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Akses Portal Petugas Dinas PU</h3>
              <p className="text-[11px] text-stone-400">Verifikasi Laporan &amp; URC Perbaikan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* User Current Status */}
          {user ? (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 space-y-2">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Akun'}
                    referrerPolicy="no-referrer"
                    className="h-10 w-10 rounded-full border border-stone-200 object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold">
                    {(user.displayName || 'U').charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-stone-900">{user.displayName}</p>
                  <p className="text-[11px] text-stone-500">{user.email}</p>
                  <span className="inline-block mt-0.5 text-[10px] font-bold text-amber-800 bg-amber-200/70 px-2 py-0.2 rounded-md">
                    Peran Saat Ini: {userProfile?.role === 'petugas' ? 'Petugas PU' : 'Warga'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-stone-50 border border-stone-200 p-4 text-center space-y-1.5">
              <Sparkles className="h-5 w-5 text-amber-600 mx-auto" />
              <p className="text-xs font-bold text-stone-900">
                Masuk dengan Akun Google
              </p>
              <p className="text-[11px] text-stone-500">
                Masuk dengan akun Google Anda untuk mengaktifkan akses peran Petugas Dinas PU.
              </p>
            </div>
          )}

          {/* Department & Subrole configuration */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Instansi / Satuan Kerja Dinas
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-800 focus:border-amber-500 focus:outline-hidden"
              >
                <option value="Dinas Pekerjaan Umum & Tata Ruang">Dinas Pekerjaan Umum &amp; Tata Ruang</option>
                <option value="Dinas Bina Marga & Sumber Daya Air">Dinas Bina Marga &amp; Sumber Daya Air</option>
                <option value="Unit Reaksi Cepat (URC) Jalan">Unit Reaksi Cepat (URC) Jalan</option>
                <option value="Dinas Perhubungan & Fasilitas Publik">Dinas Perhubungan &amp; Fasilitas Publik</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Jabatan / Peran Petugas
              </label>
              <select
                value={subRole}
                onChange={(e) => setSubRole(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-800 focus:border-amber-500 focus:outline-hidden"
              >
                <option value="Petugas Verifikasi Lapangan">Petugas Verifikasi Lapangan</option>
                <option value="Koordinator URC Perbaikan">Koordinator URC Perbaikan</option>
                <option value="Petugas Dinas PU">Petugas Dinas PU</option>
                <option value="Super Admin Sistem">Super Admin Sistem</option>
              </select>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-2">
            <button
              onClick={handleActivatePetugasRole}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-amber-500 hover:bg-amber-600 active:scale-98 text-white py-2.5 text-xs font-bold shadow-md shadow-amber-500/25 transition-all"
            >
              {isLoading ? (
                <span>Menghubungkan Akun Google...</span>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>
                    {user ? 'Aktifkan Peran Petugas & Masuk' : 'Masuk Google Sebagai Petugas PU'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
