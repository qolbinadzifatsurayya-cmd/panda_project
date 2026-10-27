import React from 'react';
import { 
  Building2, 
  LogOut, 
  Wifi, 
  MapPin, 
  ShieldCheck, 
  RefreshCw,
  Database
} from 'lucide-react';
import { WilayahName } from '../types';

interface HeaderProps {
  currentUser: {
    role: 'admin' | 'wilayah' | 'jabodetabek' | null;
    wilayah?: WilayahName;
  };
  onLogout: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-lg backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & School Branding */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="h-full w-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Building2 className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white">
                  SENSEI <span className="text-emerald-400">2027</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PPDB Nasional
                </span>
              </div>
              <p className="text-xs text-slate-300 hidden md:block">
                Sistem Monitoring & Pelaporan Sosialisasi SMART Ekselensia Indonesia
              </p>
            </div>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Refresh Data Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Segarkan Data Real-Time"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* User Session Info & Logout */}
            {currentUser.role && (
              <div className="flex items-center space-x-2 border-l border-slate-700 pl-2 sm:pl-3">
                <div className="flex flex-col items-end">
                  {currentUser.role === 'admin' ? (
                    <div className="flex items-center space-x-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-md text-xs font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Admin Pusat</span>
                    </div>
                  ) : currentUser.role === 'jabodetabek' ? (
                    <div className="flex items-center space-x-1.5 bg-teal-500/10 text-teal-300 border border-teal-500/30 px-2.5 py-1 rounded-md text-xs font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-teal-400" />
                      <span>Roadshow Jabodetabek</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-md text-xs font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="truncate max-w-[120px] sm:max-w-none">{currentUser.wilayah}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={onLogout}
                  title="Keluar / Ganti Akun"
                  className="p-2 rounded-lg bg-red-950/40 text-red-300 hover:bg-red-900/60 hover:text-white transition-colors border border-red-800/40 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
