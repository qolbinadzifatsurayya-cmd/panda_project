import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  MapPin, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { DAFTAR_WILAYAH, WilayahName } from '../types';

interface LoginModalProps {
  onLoginAdmin: (user: string, pass: string) => boolean;
  onSelectWilayah: (wilayah: WilayahName) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onLoginAdmin,
  onSelectWilayah,
}) => {
  const [activeTab, setActiveTab] = useState<'wilayah' | 'admin'>('wilayah');
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<WilayahName | null>(null);

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const success = onLoginAdmin(adminUser.trim(), adminPass.trim());
    if (!success) {
      setLoginError('Username atau Password admin salah. Gunakan user: admin dan pass: Sensei2027');
    }
  };

  const handleFillDemoAdmin = () => {
    setAdminUser('admin');
    setAdminPass('Sensei2027');
    setLoginError('');
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 text-slate-100">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        
        {/* Top Hero Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PPDB Nasional 2027 SMART Ekselensia Indonesia</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Sistem Informasi <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">SENSEI 2027</span>
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Portal input laporan sosialisasi kunjungan sekolah daerah untuk 14 wilayah mitra dan monitoring terpadu panitia pusat.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center">
          <div className="bg-slate-800/90 p-1.5 rounded-xl border border-slate-700/80 shadow-inner flex space-x-2">
            <button
              onClick={() => setActiveTab('wilayah')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'wilayah'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Halaman Wilayah (14 Daerah)</span>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Pusat</span>
            </button>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-slate-900/90 border border-slate-700/70 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
          {activeTab === 'wilayah' ? (
            /* Regional Selection Mode */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                    <span>Pilih Wilayah Kerja Panitia Daerah</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                    Akses langsung tanpa password sesuai arahan sistem. Silakan klik wilayah Anda untuk mulai input laporan.
                  </p>
                </div>
                <span className="inline-flex items-center text-xs font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded-full self-start sm:self-auto">
                  14 Wilayah Terdaftar
                </span>
              </div>

              {/* 14 Regions Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
                {DAFTAR_WILAYAH.map((wilayah, index) => {
                  const isSelected = selectedRegion === wilayah;
                  return (
                    <button
                      key={wilayah}
                      onClick={() => onSelectWilayah(wilayah)}
                      onMouseEnter={() => setSelectedRegion(wilayah)}
                      onMouseLeave={() => setSelectedRegion(null)}
                      className={`group relative text-left p-3.5 sm:p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-950/70 border-emerald-400/80 shadow-lg shadow-emerald-950/50 scale-[1.02]'
                          : 'bg-slate-800/70 border-slate-700/70 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-mono text-slate-400 group-hover:text-emerald-300">
                          #{String(index + 1).padStart(2, '0')}
                        </span>
                        <MapPin className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                      </div>
                      <div className="font-bold text-sm sm:text-base text-slate-100 group-hover:text-emerald-200 line-clamp-1">
                        {wilayah}
                      </div>
                      <div className="mt-2 text-[11px] text-slate-400 flex items-center space-x-1 group-hover:text-emerald-400">
                        <span>Masuk Laporan</span>
                        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs text-slate-300 flex items-start space-x-3">
                <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Target Sosialisasi Daerah:</span>
                  <span className="ml-1 text-slate-300">
                    Setiap wilayah wajib berkunjung langsung ke minimal <strong>2 kabupaten/kota</strong>, dengan minimal <strong>15 SD</strong> dan <strong>5 SMP</strong> di setiap kabupaten/kota.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Central Admin Login Mode */
            <div className="max-w-md mx-auto space-y-6">
              <div className="text-center space-y-1">
                <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-2">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-white">Login Admin Pusat</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Akses monitoring rekapitulasi nasional untuk Koordinator Panitia Pusat.
                </p>
              </div>

              {loginError && (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-200 text-xs flex items-center space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Username Admin
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={adminUser}
                      onChange={(e) => setAdminUser(e.target.value)}
                      placeholder="Masukkan user admin"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Password Admin
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                      placeholder="Masukkan password admin"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-950" />
                  <span>Masuk ke Dashboard Admin Pusat</span>
                </button>
              </form>

              {/* Quick Fill Button for testing convenience */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleFillDemoAdmin}
                  className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-4 font-medium"
                >
                  Isi otomatis kredensial (admin / Sensei2027)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-400">
          SMART Ekselensia Indonesia • PPDB SENSEI 2027 • Sistem Online Multi-Device
        </div>
      </div>
    </div>
  );
};
