import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  MapPin,
  ListFilter,
  LogOut,
  User,
  Plus,
  ChevronDown,
  Building2,
  Check,
  Sparkles,
  Home,
  Map,
  LayoutGrid,
  Bell,
  Crown,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
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
  const { theme, isDark, toggleTheme } = useTheme();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isPetugas = userProfile?.role === 'petugas';
  const isSuperAdmin = userProfile?.role === 'super_admin';
  const canAccessAdmin = isPetugas || isSuperAdmin;

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
    let agency = 'Masyarakat Umum';
    let rank = 'Warga Terverifikasi';
    if (role === 'petugas') {
      agency = 'Dinas Pekerjaan Umum & Tata Kota';
      rank = 'Petugas Dinas';
    } else if (role === 'super_admin') {
      agency = 'Kementerian PUPR / Pusat Pengendali';
      rank = 'Super Administrator';
    }
    await setUserRole(role, agency, rank);
    if (role === 'petugas' || role === 'super_admin') {
      onNavigate('admin');
    }
  };

  const navItems: Array<{
    id: 'beranda' | 'laporan' | 'peta' | 'asisten' | 'admin';
    label: string;
    icon?: React.ReactNode;
  }> = [
    { id: 'beranda', label: 'Beranda' },
    { id: 'laporan', label: 'Laporan Publik' },
    { id: 'peta', label: 'Peta Radar' },
    { id: 'asisten', label: 'Tanya AI', icon: <Sparkles className="h-3.5 w-3.5 text-amber-500" /> },
    ...(canAccessAdmin
      ? [{
          id: 'admin' as const,
          label: isSuperAdmin ? 'Super Admin' : 'Dashboard PU',
          icon: isSuperAdmin ? <Crown className="h-3.5 w-3.5 text-amber-500" /> : <Building2 className="h-3.5 w-3.5 text-amber-600" />
        }]
      : [])
  ];

  return (
    <>
      {/* ===== TOP HEADER ===== */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-sm font-sans">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 gap-4">

          {/* Left: Brand Logo */}
          <button
            id="brand-logo-btn"
            onClick={() => onNavigate('beranda')}
            className="flex items-center gap-2 text-left shrink-0 group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm group-hover:bg-amber-600 transition-colors">
              <MapPin className="h-4 w-4 fill-white stroke-white stroke-0" />
            </div>
            <span className="font-black text-lg tracking-tight text-gray-900 leading-none">
              Lapor<span className="text-amber-600">Infra</span>
            </span>
          </button>

          {/* Center: Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                    isActive
                      ? 'nav-tab-active font-bold'
                      : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100/70 dark:hover:bg-white/5'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Theme Toggle Button (Google Dark Grey) */}
            <button
              id="theme-toggle-nav-btn"
              type="button"
              onClick={toggleTheme}
              title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Google Dark Mode (Dark Grey)'}
              aria-label="Toggle dark mode"
              className="flex items-center justify-center h-9 w-9 rounded-full border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 transition-all shadow-xs active:scale-90"
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-stone-600" />
              )}
            </button>

            {/* Report Button */}
            <button
              id="create-report-nav-btn"
              onClick={onOpenReportModal}
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 text-sm font-bold shadow-sm shadow-amber-500/20 active:scale-95 transition-all"
            >
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Lapor</span>
            </button>

            {/* Auth / User */}
            {!user ? (
              <button
                id="google-login-nav-btn"
                onClick={handleGoogleLogin}
                disabled={isSigningIn}
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white hover:bg-gray-50 px-3.5 py-2 text-sm font-semibold text-gray-700 transition-colors shadow-sm active:scale-95"
              >
                {/* Google G Icon */}
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="hidden sm:inline">{isSigningIn ? 'Masuk...' : 'Masuk'}</span>
              </button>
            ) : (
              <div className="relative" ref={dropdownRef}>
                {/* Profile Avatar Button */}
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 pl-1 pr-3 py-1 transition-all shadow-sm"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-xs">
                      {(user.displayName || 'U').charAt(0)}
                    </div>
                  )}
                  <div className="hidden sm:flex items-center gap-1">
                    <span className="text-sm font-semibold text-gray-800 max-w-[80px] truncate">
                      {user.displayName?.split(' ')[0] || 'Akun'}
                    </span>
                    {isSuperAdmin ? (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Crown className="h-2.5 w-2.5 text-amber-600" />
                        Admin
                      </span>
                    ) : isPetugas ? (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                        Petugas
                      </span>
                    ) : null}
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                </button>

                {/* Dropdown */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-white shadow-xl border border-gray-200 z-50 overflow-hidden animate-apple-dialog">

                    {/* User Header */}
                    <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 bg-gray-50">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'User'}
                          referrerPolicy="no-referrer"
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm">
                          {(user.displayName || 'U').charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {user.displayName || 'Pengguna LaporInfra'}
                          </p>
                          {isSuperAdmin && (
                            <span className="shrink-0 inline-flex items-center gap-0.5 text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 rounded px-1 py-0.2">
                              <Crown className="h-2.5 w-2.5 text-amber-600" />
                              SUPER
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* Role Selector */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Pilih Peran Akun</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleRoleChange('warga')}
                          className={`flex flex-col items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
                            userProfile?.role === 'warga' || (!userProfile?.role && !isPetugas && !isSuperAdmin)
                              ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <User className="h-3.5 w-3.5" />
                          <span>Warga</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRoleChange('petugas')}
                          className={`flex flex-col items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
                            userProfile?.role === 'petugas'
                              ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <Building2 className="h-3.5 w-3.5" />
                          <span>Petugas PU</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRoleChange('super_admin')}
                          className={`flex flex-col items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                            userProfile?.role === 'super_admin'
                              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-500 shadow-xs'
                              : 'bg-amber-50/70 text-amber-800 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          <Crown className="h-3.5 w-3.5 text-amber-500 group-hover:text-amber-600" />
                          <span>Super Admin</span>
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="py-2">
                      {canAccessAdmin && (
                        <button
                          onClick={() => { setIsDropdownOpen(false); onNavigate('admin'); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {isSuperAdmin ? (
                            <Crown className="h-4 w-4 text-amber-600" />
                          ) : (
                            <Building2 className="h-4 w-4 text-amber-600" />
                          )}
                          <span>{isSuperAdmin ? 'Dashboard Super Admin' : 'Dashboard Dinas PU'}</span>
                        </button>
                      )}
                      <button
                        onClick={() => { setIsDropdownOpen(false); onOpenSDGModal(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Bell className="h-4 w-4 text-amber-600" />
                        Info SDG 9 & Inovasi
                      </button>
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isDark ? (
                            <Sun className="h-4 w-4 text-amber-500" />
                          ) : (
                            <Moon className="h-4 w-4 text-stone-600" />
                          )}
                          <span>Mode Tampilan</span>
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          {isDark ? 'Dark Grey' : 'Terang'}
                        </span>
                      </button>
                      <div className="mx-4 my-1 border-t border-gray-100" />
                      <button
                        onClick={() => { setIsDropdownOpen(false); signOut(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Keluar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ===== MOBILE BOTTOM NAVIGATION ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 md:hidden px-2 py-1 flex items-center justify-around shadow-[0_-2px_16px_rgba(0,0,0,0.06)]">
        {/* Beranda */}
        <button
          onClick={() => onNavigate('beranda')}
          className={`flex flex-col items-center justify-center min-h-[48px] min-w-[56px] py-1 px-2 rounded-xl text-[10px] font-semibold transition-all relative ${
            activeTab === 'beranda' ? 'text-amber-600' : 'text-gray-400'
          }`}
        >
          <Home className={`h-5 w-5 ${activeTab === 'beranda' ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
          <span className="mt-0.5">Beranda</span>
          {activeTab === 'beranda' && (
            <span className="absolute bottom-0.5 h-0.5 w-5 rounded-full bg-amber-500" />
          )}
        </button>

        {/* Laporan */}
        <button
          onClick={() => onNavigate('laporan')}
          className={`flex flex-col items-center justify-center min-h-[48px] min-w-[56px] py-1 px-2 rounded-xl text-[10px] font-semibold transition-all relative ${
            activeTab === 'laporan' ? 'text-amber-600' : 'text-gray-400'
          }`}
        >
          <ListFilter className={`h-5 w-5 ${activeTab === 'laporan' ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
          <span className="mt-0.5">Laporan</span>
          {activeTab === 'laporan' && (
            <span className="absolute bottom-0.5 h-0.5 w-5 rounded-full bg-amber-500" />
          )}
        </button>

        {/* Center Report FAB */}
        <button
          onClick={onOpenReportModal}
          className="flex flex-col items-center justify-center -mt-5 h-14 w-14 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
        >
          <Plus className="h-6 w-6 stroke-[2.5]" />
        </button>

        {/* Peta */}
        <button
          onClick={() => onNavigate('peta')}
          className={`flex flex-col items-center justify-center min-h-[48px] min-w-[56px] py-1 px-2 rounded-xl text-[10px] font-semibold transition-all relative ${
            activeTab === 'peta' ? 'text-amber-600' : 'text-gray-400'
          }`}
        >
          <Map className={`h-5 w-5 ${activeTab === 'peta' ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
          <span className="mt-0.5">Peta</span>
          {activeTab === 'peta' && (
            <span className="absolute bottom-0.5 h-0.5 w-5 rounded-full bg-amber-500" />
          )}
        </button>

        {/* AI / Admin */}
        {canAccessAdmin ? (
          <button
            onClick={() => onNavigate('admin')}
            className={`flex flex-col items-center justify-center min-h-[48px] min-w-[56px] py-1 px-2 rounded-xl text-[10px] font-semibold transition-all relative ${
              activeTab === 'admin' ? 'text-amber-600' : 'text-gray-400'
            }`}
          >
            {isSuperAdmin ? (
              <Crown className={`h-5 w-5 ${activeTab === 'admin' ? 'stroke-[2.5] text-amber-600' : 'stroke-[1.5]'}`} />
            ) : (
              <LayoutGrid className={`h-5 w-5 ${activeTab === 'admin' ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
            )}
            <span className="mt-0.5">{isSuperAdmin ? 'Admin' : 'Dinas PU'}</span>
            {activeTab === 'admin' && (
              <span className="absolute bottom-0.5 h-0.5 w-5 rounded-full bg-amber-500" />
            )}
          </button>
        ) : (
          <button
            onClick={() => onNavigate('asisten')}
            className={`flex flex-col items-center justify-center min-h-[48px] min-w-[56px] py-1 px-2 rounded-xl text-[10px] font-semibold transition-all relative ${
              activeTab === 'asisten' ? 'text-amber-600' : 'text-gray-400'
            }`}
          >
            <Sparkles className={`h-5 w-5 ${activeTab === 'asisten' ? 'stroke-[2.5] text-amber-600' : 'stroke-[1.5]'}`} />
            <span className="mt-0.5">Tanya AI</span>
            {activeTab === 'asisten' && (
              <span className="absolute bottom-0.5 h-0.5 w-5 rounded-full bg-amber-500" />
            )}
          </button>
        )}
      </div>
    </>
  );
};
