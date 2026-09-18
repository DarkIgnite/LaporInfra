import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldAlert,
  Camera,
  MapPin,
  ListFilter,
  LogOut,
  Navigation,
  User,
  Plus,
  Award,
  ChevronDown,
  Building2,
  Check,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface NavbarProps {
  activeTab: 'beranda' | 'radar' | 'peta' | 'laporan' | 'admin' | 'asisten';
  onNavigate: (tab: 'beranda' | 'radar' | 'peta' | 'laporan' | 'admin' | 'asisten') => void;
  onOpenReportModal: () => void;
  onOpenSDGModal: () => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onNavigate,
  onOpenReportModal,
  onOpenSDGModal,
}) => {
  const { user, userProfile, signInWithGoogle, signOut, setUserRole } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isPetugas = userProfile?.role === 'petugas';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (e) {
      console.error('Google Sign-In failed:', e);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleRoleChange = async (role: UserRole) => {
    await setUserRole(
      role,
      role === 'petugas' ? 'Dinas Pekerjaan Umum & Tata Kota' : 'Masyarakat Umum',
      role === 'petugas' ? 'Petugas Dinas' : 'Warga Terverifikasi'
    );
    if (role === 'petugas') {
      onNavigate('admin');
    }
  };

  return (
    <>
      {/* Top Header - Apple Glass Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 bg-white/80 backdrop-blur-2xl transition-all font-sans">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6">
          
          {/* Left: Brand Logo with Tactile Apple Press */}
          <button
            id="brand-logo-btn"
            onClick={() => onNavigate('beranda')}
            className="flex items-center gap-2.5 text-left group focus:outline-hidden apple-press"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs border-t border-white/30 group-hover:scale-105 transition-transform">
              <ShieldAlert className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight text-stone-900 leading-none">
                Lapor<span className="text-amber-600">Infra</span>
              </span>
              <span className="text-[10px] font-semibold text-stone-400 tracking-wider uppercase mt-0.5">
                Civic Vision AI
              </span>
            </div>
          </button>

          {/* Center: Apple-style Frosted Segmented Navigation Capsule */}
          <nav className="hidden md:flex items-center gap-1 bg-stone-100/85 p-1 rounded-full border border-stone-200/70 shadow-2xs backdrop-blur-md">
            <button
              id="nav-tab-beranda"
              onClick={() => onNavigate('beranda')}
              className={`apple-press px-4 py-1.5 text-xs rounded-full transition-all ${
                activeTab === 'beranda'
                  ? 'bg-white text-stone-950 font-bold shadow-xs border border-stone-200/50'
                  : 'text-stone-500 hover:text-stone-900 font-medium hover:bg-white/40'
              }`}
            >
              Beranda
            </button>

            <button
              id="nav-tab-laporan"
              onClick={() => onNavigate('laporan')}
              className={`apple-press px-4 py-1.5 text-xs rounded-full transition-all ${
                activeTab === 'laporan'
                  ? 'bg-white text-stone-950 font-bold shadow-xs border border-stone-200/50'
                  : 'text-stone-500 hover:text-stone-900 font-medium hover:bg-white/40'
              }`}
            >
              Laporan Publik
            </button>

            <button
              id="nav-tab-peta"
              onClick={() => onNavigate('peta')}
              className={`apple-press px-4 py-1.5 text-xs rounded-full transition-all ${
                activeTab === 'peta'
                  ? 'bg-white text-stone-950 font-bold shadow-xs border border-stone-200/50'
                  : 'text-stone-500 hover:text-stone-900 font-medium hover:bg-white/40'
              }`}
            >
              Peta Radar
            </button>

            <button
              id="nav-tab-asisten"
              onClick={() => onNavigate('asisten')}
              className={`apple-press px-4 py-1.5 text-xs rounded-full transition-all flex items-center gap-1.5 ${
                activeTab === 'asisten'
                  ? 'bg-white text-amber-900 font-bold shadow-xs border border-amber-200/60'
                  : 'text-stone-600 hover:text-amber-800 font-medium hover:bg-white/40'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Tanya AI &amp; Peta</span>
            </button>

            {/* If user is officer (Petugas), show direct Dashboard tab */}
            {isPetugas && (
              <button
                id="nav-tab-admin"
                onClick={() => onNavigate('admin')}
                className={`apple-press px-4 py-1.5 text-xs rounded-full transition-all flex items-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-amber-500 text-white font-bold shadow-xs'
                    : 'text-amber-700 hover:text-amber-900 font-semibold hover:bg-amber-100/50'
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>Dashboard PU</span>
              </button>
            )}
          </nav>

          {/* Right: + Lapor Action & Unified Google User Dropdown */}
          <div className="flex items-center gap-2.5">
            {/* Quick Report Button */}
            <button
              id="create-report-nav-btn"
              onClick={onOpenReportModal}
              className="apple-press inline-flex items-center gap-1.5 rounded-full bg-stone-900 hover:bg-stone-800 px-4 py-2 text-xs font-bold text-white shadow-xs border-t border-white/20 active:scale-95 transition-all"
            >
              <Plus className="h-3.5 w-3.5 text-amber-400 stroke-[3]" />
              <span className="hidden xs:inline">Lapor</span>
              <span className="xs:hidden">+</span>
            </button>

            {/* UNIFIED GOOGLE AUTH / USER PROFILE */}
            {!user ? (
              <button
                id="google-login-nav-btn"
                onClick={handleGoogleLogin}
                disabled={isSigningIn}
                className="apple-press inline-flex items-center gap-1.5 rounded-full border border-stone-300/90 bg-white hover:bg-stone-50 px-3.5 py-2 text-xs font-bold text-stone-700 transition-colors shadow-2xs active:scale-95"
              >
                <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isSigningIn ? 'Masuk...' : 'Masuk'}</span>
              </button>
            ) : (
              <div className="relative" ref={dropdownRef}>
                {/* Profile Pill Trigger */}
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`apple-press flex items-center gap-2 rounded-full border p-1 sm:pr-2.5 transition-all ${
                    isPetugas
                      ? 'border-amber-400 bg-amber-50/80 hover:bg-amber-100 text-amber-950 shadow-2xs'
                      : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-800 shadow-2xs'
                  }`}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="h-7 w-7 rounded-full object-cover border border-stone-200"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-white font-bold text-xs">
                      {(user.displayName || 'U').charAt(0)}
                    </div>
                  )}

                  <div className="hidden sm:flex items-center gap-1.5">
                    <span className="text-xs font-bold truncate max-w-[90px]">
                      {user.displayName?.split(' ')[0] || 'Akun'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isPetugas
                          ? 'bg-amber-500 text-white'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {isPetugas ? 'Petugas' : 'Warga'}
                    </span>
                    <ChevronDown className="h-3 w-3 text-stone-400" />
                  </div>
                </button>

                {/* Dropdown Popover */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white/95 backdrop-blur-2xl p-3.5 shadow-2xl border border-stone-200/90 z-50 animate-apple-dialog text-stone-800">
                    {/* User Info Header */}
                    <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'User'}
                          referrerPolicy="no-referrer"
                          className="h-10 w-10 rounded-full object-cover border border-stone-200"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 text-white font-bold text-sm">
                          {(user.displayName || 'U').charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-stone-900 truncate">
                          {user.displayName || 'Pengguna LaporInfra'}
                        </p>
                        <p className="text-[11px] text-stone-400 truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* MANUAL ROLE SELECTOR */}
                    <div className="my-3 rounded-xl bg-stone-50/90 p-2.5 border border-stone-200/80">
                      <p className="text-[11px] font-bold text-stone-600 mb-2">
                        Pilih Peran Akun:
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {/* Warga Role Button */}
                        <button
                          type="button"
                          onClick={() => handleRoleChange('warga')}
                          className={`apple-press flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                            !isPetugas
                              ? 'bg-stone-900 text-white shadow-xs'
                              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          <User className="h-3.5 w-3.5" />
                          <span>Warga</span>
                          {!isPetugas && <Check className="h-3 w-3 text-amber-400 stroke-[3]" />}
                        </button>

                        {/* Petugas PU Role Button */}
                        <button
                          type="button"
                          onClick={() => handleRoleChange('petugas')}
                          className={`apple-press flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                            isPetugas
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-50'
                          }`}
                        >
                          <Building2 className="h-3.5 w-3.5" />
                          <span>Petugas PU</span>
                          {isPetugas && <Check className="h-3 w-3 text-white stroke-[3]" />}
                        </button>
                      </div>

                      {isPetugas ? (
                        <p className="text-[10px] text-amber-800 mt-2 font-medium">
                          ✓ Akses aktif: Verifikasi &amp; update status dinas PU.
                        </p>
                      ) : (
                        <p className="text-[10px] text-stone-500 mt-2">
                          Akses warga: Lapor temuan &amp; pantau perbaikan.
                        </p>
                      )}
                    </div>

                    {/* Navigation Actions within dropdown */}
                    <div className="space-y-1 pt-1">
                      {isPetugas && (
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            onNavigate('admin');
                          }}
                          className="apple-press w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-50/70 hover:bg-amber-100 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-amber-600" />
                            Buka Dashboard Dinas PU
                          </span>
                          <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                            Masuk
                          </span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onOpenSDGModal();
                        }}
                        className="apple-press w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
                      >
                        <Award className="h-4 w-4 text-amber-600" />
                        <span>Info SDG 9 &amp; Inovasi</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          signOut();
                        }}
                        className="apple-press w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Keluar Akun Google</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </header>

      {/* Mobile Bottom Navigation - Apple Frosted Dock */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-2xl border-t border-stone-200/80 md:hidden px-3 py-1 flex items-center justify-around shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <button
          onClick={() => onNavigate('beranda')}
          className={`apple-press flex flex-col items-center justify-center min-h-[44px] min-w-[52px] py-1 px-2 rounded-xl text-[10px] font-bold transition-all relative ${
            activeTab === 'beranda' ? 'text-amber-600' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <Navigation className="h-4 w-4" />
          <span className="mt-0.5">Beranda</span>
          {activeTab === 'beranda' && (
            <span className="absolute bottom-0.5 h-1 w-4 rounded-full bg-amber-500" />
          )}
        </button>

        <button
          onClick={() => onNavigate('laporan')}
          className={`apple-press flex flex-col items-center justify-center min-h-[44px] min-w-[52px] py-1 px-2 rounded-xl text-[10px] font-bold transition-all relative ${
            activeTab === 'laporan' ? 'text-amber-600' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <ListFilter className="h-4 w-4" />
          <span className="mt-0.5">Laporan</span>
          {activeTab === 'laporan' && (
            <span className="absolute bottom-0.5 h-1 w-4 rounded-full bg-amber-500" />
          )}
        </button>

        {/* Center Report Button - Tactile Floating Capsule */}
        <button
          onClick={onOpenReportModal}
          className="apple-press flex flex-col items-center justify-center -mt-5 h-12 w-12 rounded-full bg-linear-to-b from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-600/30 border-t border-white/40 active:scale-95 transition-all"
        >
          <Plus className="h-6 w-6 stroke-[2.8]" />
        </button>

        <button
          onClick={() => onNavigate('peta')}
          className={`apple-press flex flex-col items-center justify-center min-h-[44px] min-w-[52px] py-1 px-2 rounded-xl text-[10px] font-bold transition-all relative ${
            activeTab === 'peta' ? 'text-amber-600' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <MapPin className="h-4 w-4" />
          <span className="mt-0.5">Peta</span>
          {activeTab === 'peta' && (
            <span className="absolute bottom-0.5 h-1 w-4 rounded-full bg-amber-500" />
          )}
        </button>

        {/* If petugas, show Dashboard PU, else show Tanya AI */}
        {isPetugas ? (
          <button
            onClick={() => onNavigate('admin')}
            className={`apple-press flex flex-col items-center justify-center min-h-[44px] min-w-[52px] py-1 px-2 rounded-xl text-[10px] font-bold transition-all relative ${
              activeTab === 'admin' ? 'text-amber-600' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span className="mt-0.5">Dinas PU</span>
            {activeTab === 'admin' && (
              <span className="absolute bottom-0.5 h-1 w-4 rounded-full bg-amber-500" />
            )}
          </button>
        ) : (
          <button
            onClick={() => onNavigate('asisten')}
            className={`apple-press flex flex-col items-center justify-center min-h-[44px] min-w-[52px] py-1 px-2 rounded-xl text-[10px] font-bold transition-all relative ${
              activeTab === 'asisten' ? 'text-amber-600' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span className="mt-0.5">Tanya AI</span>
            {activeTab === 'asisten' && (
              <span className="absolute bottom-0.5 h-1 w-4 rounded-full bg-amber-500" />
            )}
          </button>
        )}
      </div>
    </>
  );
};
