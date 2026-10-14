import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  GraduationCap, 
  Users, 
  UserCheck, 
  Award,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { SosialisasiReport, TARGET_RULES } from '../types';

interface TargetProgressCardProps {
  wilayah: string;
  reports: SosialisasiReport[];
  onAddReportClick?: () => void;
}

export const TargetProgressCard: React.FC<TargetProgressCardProps> = ({
  wilayah,
  reports,
  onAddReportClick,
}) => {
  // Aggregate stats per kabupaten/kota
  const kabMap: Record<
    string,
    {
      nama: string;
      sdCount: number;
      smpCount: number;
      totalSekolah: number;
      audience: number;
      pendaftar: number;
    }
  > = {};

  reports.forEach((r) => {
    const kab = r.kabupatenKota.trim();
    if (!kabMap[kab]) {
      kabMap[kab] = {
        nama: kab,
        sdCount: 0,
        smpCount: 0,
        totalSekolah: 0,
        audience: 0,
        pendaftar: 0,
      };
    }
    kabMap[kab].totalSekolah += 1;
    kabMap[kab].audience += r.jumlahAudience;
    kabMap[kab].pendaftar += r.jumlahPendaftar;
    if (r.jenjang === 'SD') kabMap[kab].sdCount += 1;
    if (r.jenjang === 'SMP') kabMap[kab].smpCount += 1;
  });

  const kabList = Object.values(kabMap);
  const totalKabVisited = kabList.length;

  // A kabupaten qualifies if it has >= 15 SD AND >= 5 SMP
  const qualifyingKabList = kabList.filter(
    (k) => k.sdCount >= TARGET_RULES.MIN_SD_PER_KAB && k.smpCount >= TARGET_RULES.MIN_SMP_PER_KAB
  );
  const qualifyingKabCount = qualifyingKabList.length;
  const isTargetAchieved = qualifyingKabCount >= TARGET_RULES.MIN_KAB_KOTA;

  const totalAudience = reports.reduce((acc, r) => acc + r.jumlahAudience, 0);
  const totalPendaftar = reports.reduce((acc, r) => acc + r.jumlahPendaftar, 0);
  const totalSD = reports.filter((r) => r.jenjang === 'SD').length;
  const totalSMP = reports.filter((r) => r.jenjang === 'SMP').length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden mb-8">
      {/* Top Banner */}
      <div className={`p-6 border-b transition-colors ${
        isTargetAchieved 
          ? 'bg-gradient-to-r from-emerald-900 to-teal-900 text-white border-emerald-800' 
          : 'bg-gradient-to-r from-slate-900 to-slate-800 text-white border-slate-700'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Laporan Wilayah
              </span>
              <span className="text-xs text-slate-300">PPDB SENSEI 2027</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center space-x-3">
              <span>Wilayah {wilayah}</span>
              {isTargetAchieved && (
                <span className="inline-flex items-center space-x-1 text-xs font-bold bg-amber-400 text-slate-950 px-2.5 py-1 rounded-full shadow-md animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>TARGET TERCAPAI!</span>
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Target Nasional: Kunjungan langsung minimal <strong>15 SD</strong> dan <strong>5 SMP</strong> di setiap kabupaten/kota, dengan minimal menjangkau <strong>2 kabupaten/kota</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onAddReportClick && (
              <button
                onClick={onAddReportClick}
                className="px-4 py-2.5 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-2 shrink-0"
              >
                <span>+ Input Laporan Sekolah</span>
              </button>
            )}
          </div>
        </div>

        {/* Target Milestone Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {/* Milestone 1: Kab/Kota Memenuhi Kuota */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <div className="text-[11px] font-medium text-slate-300 uppercase tracking-wide">
              Kab/Kota Lulus Kuota
            </div>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-2xl font-extrabold text-white">
                {qualifyingKabCount}
              </span>
              <span className="text-xs text-slate-300 font-medium">/ 2 Kab/Kota</span>
            </div>
            <div className="mt-2 text-[11px] flex items-center space-x-1">
              {qualifyingKabCount >= 2 ? (
                <span className="text-emerald-300 font-semibold flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Kuota 2 Kab Terpenuhi
                </span>
              ) : (
                <span className="text-amber-300 flex items-center">
                  <Clock className="w-3 h-3 mr-1" /> Kurang {2 - qualifyingKabCount} kab/kota
                </span>
              )}
            </div>
          </div>

          {/* Milestone 2: Total Sekolah Dikunjungi */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <div className="text-[11px] font-medium text-slate-300 uppercase tracking-wide">
              Total Sekolah Dikunjungi
            </div>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-2xl font-extrabold text-white">
                {reports.length}
              </span>
              <span className="text-xs text-slate-300">Sekolah</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-300 flex space-x-2">
              <span className="text-emerald-300 font-medium">{totalSD} SD</span>
              <span>•</span>
              <span className="text-teal-300 font-medium">{totalSMP} SMP</span>
            </div>
          </div>

          {/* Milestone 3: Total Audience */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <div className="text-[11px] font-medium text-slate-300 uppercase tracking-wide">
              Total Audience Sosialisasi
            </div>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-2xl font-extrabold text-white">
                {totalAudience.toLocaleString('id-ID')}
              </span>
              <span className="text-xs text-slate-300">Orang</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-300">
              Siswa & Dewan Guru
            </div>
          </div>

          {/* Milestone 4: Total Pendaftar */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <div className="text-[11px] font-medium text-slate-300 uppercase tracking-wide">
              Calon Siswa Mendaftar
            </div>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-2xl font-extrabold text-amber-300">
                {totalPendaftar.toLocaleString('id-ID')}
              </span>
              <span className="text-xs text-slate-300">Siswa</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-300">
              Konversi: {totalAudience > 0 ? ((totalPendaftar / totalAudience) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Kabupaten/Kota Status Breakdown */}
      <div className="p-6 bg-slate-50/60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">
              Status Capaian Per Kabupaten / Kota ({kabList.length} Dikunjungi)
            </h3>
          </div>
          <div className="text-xs text-slate-500 flex items-center space-x-1">
            <Info className="w-3.5 h-3.5" />
            <span>Target per Kab/Kota: Min. 15 SD & 5 SMP</span>
          </div>
        </div>

        {kabList.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
            <MapPin className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Belum ada kabupaten/kota yang diinput</p>
            <p className="text-xs text-slate-500 mt-1">
              Klik tombol "+ Input Laporan Sekolah" untuk mencatat kunjungan sosialisasi pertama Anda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kabList.map((kab) => {
              const isSdDone = kab.sdCount >= TARGET_RULES.MIN_SD_PER_KAB;
              const isSmpDone = kab.smpCount >= TARGET_RULES.MIN_SMP_PER_KAB;
              const isComplete = isSdDone && isSmpDone;

              const sdPercent = Math.min(100, Math.round((kab.sdCount / TARGET_RULES.MIN_SD_PER_KAB) * 100));
              const smpPercent = Math.min(100, Math.round((kab.smpCount / TARGET_RULES.MIN_SMP_PER_KAB) * 100));

              return (
                <div
                  key={kab.nama}
                  className={`bg-white rounded-xl p-4 border transition-all ${
                    isComplete
                      ? 'border-emerald-300 shadow-sm shadow-emerald-100 ring-1 ring-emerald-200'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base flex items-center space-x-1.5">
                        <span>{kab.nama}</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Total {kab.totalSekolah} sekolah • {kab.audience} audience • {kab.pendaftar} daftar
                      </p>
                    </div>

                    {isComplete ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                        Target Lulus
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3 mr-1 text-amber-500" />
                        Dalam Proses
                      </span>
                    )}
                  </div>

                  {/* SD Progress Bar */}
                  <div className="space-y-1 mb-2.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700 flex items-center">
                        <GraduationCap className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Jenjang SD
                      </span>
                      <span className={`font-mono text-xs font-bold ${isSdDone ? 'text-emerald-600' : 'text-slate-600'}`}>
                        {kab.sdCount} / 15 {isSdDone ? '✓' : ''}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isSdDone ? 'bg-emerald-500' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${sdPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* SMP Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700 flex items-center">
                        <GraduationCap className="w-3.5 h-3.5 mr-1 text-teal-600" /> Jenjang SMP
                      </span>
                      <span className={`font-mono text-xs font-bold ${isSmpDone ? 'text-teal-600' : 'text-slate-600'}`}>
                        {kab.smpCount} / 5 {isSmpDone ? '✓' : ''}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isSmpDone ? 'bg-teal-500' : 'bg-teal-400'
                        }`}
                        style={{ width: `${smpPercent}%` }}
                      ></div>
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
