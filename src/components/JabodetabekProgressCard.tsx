import React, { useState } from 'react';
import { 
  School, 
  Users, 
  UserCheck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Plus, 
  Sparkles,
  Award,
  TrendingUp,
  Compass,
  Layers,
  ChevronRight,
  Filter,
  User
} from 'lucide-react';
import { 
  SosialisasiReport, 
  TARGET_TOTAL_ROADSHOW, 
  TARGET_ROADSHOW_PER_TIM, 
  TOTAL_TIM_ROADSHOW, 
  DAFTAR_DEFAULT_TIM_ROADSHOW,
  DAFTAR_DAERAH_JABODETABEK,
  getTeamInfo
} from '../types';

interface JabodetabekProgressCardProps {
  reports: SosialisasiReport[];
  onAddReportClick: () => void;
  onFilterTeam?: (team: string) => void;
}

export const JabodetabekProgressCard: React.FC<JabodetabekProgressCardProps> = ({
  reports,
  onAddReportClick,
  onFilterTeam,
}) => {
  const [activeTab, setActiveTab] = useState<'tim' | 'daerah'>('tim');

  const totalSekolah = reports.length;
  const totalSD = reports.filter((r) => r.jenjang === 'SD').length;
  const totalSMP = reports.filter((r) => r.jenjang === 'SMP').length;
  const totalAudience = reports.reduce((sum, r) => sum + (Number(r.jumlahAudience) || 0), 0);
  const totalPendaftar = reports.reduce((sum, r) => sum + (Number(r.jumlahPendaftar) || 0), 0);
  const conversionRate = totalAudience > 0 ? ((totalPendaftar / totalAudience) * 100).toFixed(1) : '0';

  // Target: 19 Tim Roadshow, Maksimal 15 Sekolah per Tim, Total 285 Sekolah
  const targetTotal = TARGET_TOTAL_ROADSHOW; // 285
  const targetPerTim = TARGET_ROADSHOW_PER_TIM; // 15
  const totalTim = TOTAL_TIM_ROADSHOW; // 19

  const progressPercent = Math.min(100, Math.round((totalSekolah / targetTotal) * 100));
  const isTargetAchieved = totalSekolah >= targetTotal;
  const sisaTarget = Math.max(0, targetTotal - totalSekolah);

  // Grouping per Tim / PIC Roadshow
  const teamMap: Record<
    string,
    {
      name: string;
      total: number;
      sd: number;
      smp: number;
      audience: number;
      pendaftar: number;
      daerahList: string[];
    }
  > = {};

  reports.forEach((r) => {
    const info = getTeamInfo(r.picRoadshow);
    const teamKey = info ? info.fullName : (r.picRoadshow || 'Tim Lainnya').trim();
    if (!teamMap[teamKey]) {
      teamMap[teamKey] = {
        name: teamKey,
        total: 0,
        sd: 0,
        smp: 0,
        audience: 0,
        pendaftar: 0,
        daerahList: [],
      };
    }
    teamMap[teamKey].total += 1;
    if (r.jenjang === 'SD') teamMap[teamKey].sd += 1;
    else teamMap[teamKey].smp += 1;
    teamMap[teamKey].audience += Number(r.jumlahAudience) || 0;
    teamMap[teamKey].pendaftar += Number(r.jumlahPendaftar) || 0;
    if (r.daerahRoadshow && !teamMap[teamKey].daerahList.includes(r.daerahRoadshow)) {
      teamMap[teamKey].daerahList.push(r.daerahRoadshow);
    }
  });

  const recordedTeams = Object.values(teamMap).sort((a, b) => b.total - a.total);
  const activeTeamCount = recordedTeams.length;
  const completedTeamCount = recordedTeams.filter((t) => t.total >= targetPerTim).length;

  // Sebaran daerah roadshow Jabodetabek
  const daerahMap: Record<string, { total: number; sd: number; smp: number; audience: number; pendaftar: number }> = {};
  reports.forEach((r) => {
    const daerah = (r.daerahRoadshow || r.kabupatenKota || 'Lainnya').trim();
    if (!daerahMap[daerah]) {
      daerahMap[daerah] = { total: 0, sd: 0, smp: 0, audience: 0, pendaftar: 0 };
    }
    daerahMap[daerah].total += 1;
    if (r.jenjang === 'SD') daerahMap[daerah].sd += 1;
    else daerahMap[daerah].smp += 1;
    daerahMap[daerah].audience += Number(r.jumlahAudience) || 0;
    daerahMap[daerah].pendaftar += Number(r.jumlahPendaftar) || 0;
  });

  const daerahList = Object.entries(daerahMap).sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-teal-950 p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold border border-sky-500/30">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>Tim Sosialisasi Roadshow Panitia Pusat ({totalTim} Tim)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center space-x-2">
              <span>Progres Roadshow Jabodetabek</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Monitoring sosialisasi langsung panitia pusat ke sekolah sasaran di wilayah Jakarta, Bogor, Depok, Tangerang, dan Bekasi. 
              Target per tim: <strong>maksimal {targetPerTim} sekolah</strong>. Total <strong>{totalTim} tim roadshow</strong> dengan target kumulatif <strong>{targetTotal} sekolah</strong> (SD dan SMP).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              onClick={onAddReportClick}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-900/30 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>+ Input Laporan Roadshow</span>
            </button>
          </div>
        </div>

        {/* Kumulatif Progress Bar Section */}
        <div className="mt-6 pt-6 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Total Capaian Kumulatif:
              </span>
              <span className="text-sm font-extrabold text-white">
                {totalSekolah} dari {targetTotal} Sekolah
              </span>
              <span className="text-xs text-sky-400 font-mono font-bold">({progressPercent}%)</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">
                Status Tim: <strong className="text-white">{completedTeamCount}</strong>/{totalTim} Tim Tuntas Kuota ({targetPerTim} Sek)
              </span>
              {isTargetAchieved ? (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Target 285 Sekolah Tuntas!</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-bold">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>Kurang {sisaTarget} Sekolah Lagi</span>
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden p-0.5 border border-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                isTargetAchieved
                  ? 'from-emerald-500 to-teal-400'
                  : 'from-sky-500 via-teal-400 to-emerald-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* KPI 4 Cards Grid */}
      <div className="p-6 bg-slate-50 border-b border-slate-200">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Card 1: Total Sekolah */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Total Sekolah</span>
              <School className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              {totalSekolah} <span className="text-sm font-semibold text-slate-400">/ {targetTotal}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center space-x-1.5 font-medium">
              <span className="text-emerald-700 font-bold">{totalSD} SD</span>
              <span>•</span>
              <span className="text-teal-700 font-bold">{totalSMP} SMP</span>
            </div>
          </div>

          {/* Card 2: Status 19 Tim */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Tim Roadshow</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              {activeTeamCount} <span className="text-sm font-semibold text-slate-400">/ {totalTim} Tim Aktif</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              <span className="text-emerald-700 font-bold">{completedTeamCount} tim</span> tuntas kuota 15 sekolah
            </div>
          </div>

          {/* Card 3: Total Audience */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Audience Siswa</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-900 mt-2">
              {totalAudience.toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Siswa & Guru Terjangkau
            </div>
          </div>

          {/* Card 4: Calon Pendaftar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Calon Pendaftar</span>
              <UserCheck className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-900 mt-2">
              {totalPendaftar.toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Konversi: <strong className="text-amber-800">{conversionRate}%</strong>
            </div>
          </div>
        </div>

        {/* Tab Toggle: Rincian 19 Tim vs Sebaran Daerah */}
        <div className="mt-6 pt-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('tim')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'tim'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Matriks Capaian Tim ({activeTeamCount}/{totalTim} Tim)</span>
            </button>

            <button
              onClick={() => setActiveTab('daerah')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'daerah'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Sebaran Daerah Jabodetabek ({daerahList.length} Daerah)</span>
            </button>
          </div>

          <div className="text-xs text-slate-500">
            {activeTab === 'tim' ? (
              <span>Target per tim: <strong>maks. 15 sekolah</strong></span>
            ) : (
              <span>Wilayah Jabodetabek dan sekitarnya</span>
            )}
          </div>
        </div>

        {/* TAB 1: Matriks Capaian Tim Roadshow */}
        {activeTab === 'tim' && (
          <div className="mt-4 space-y-3">
            {recordedTeams.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
                Belum ada laporan roadshow yang masuk. Klik tombol <strong>"+ Input Laporan Roadshow"</strong> untuk memulai input laporan tim panitia pusat.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {recordedTeams.map((team) => {
                  const teamPercent = Math.min(100, Math.round((team.total / targetPerTim) * 100));
                  const isMet = team.total >= targetPerTim;
                  const sisaTim = Math.max(0, targetPerTim - team.total);

                  return (
                    <div
                      key={team.name}
                      onClick={() => onFilterTeam && onFilterTeam(team.name)}
                      className={`p-4 rounded-xl border transition-all ${
                        isMet
                          ? 'bg-emerald-50/70 border-emerald-300 hover:border-emerald-400'
                          : 'bg-white border-slate-200 hover:border-sky-300'
                      } ${onFilterTeam ? 'cursor-pointer' : ''}`}
                    >
                      {(() => {
                        const info = getTeamInfo(team.name);
                        return (
                          <div className="flex items-center justify-between gap-2">
                            <div className="truncate">
                              <div className="font-bold text-sm text-slate-900 truncate">
                                {info ? info.tim : team.name}
                              </div>
                              {info && (
                                <div className="text-[11px] text-sky-700 font-semibold flex items-center space-x-1 truncate mt-0.5">
                                  <User className="w-3 h-3 text-sky-500 shrink-0" />
                                  <span className="truncate">{info.namaAnggota}</span>
                                </div>
                              )}
                            </div>
                            {isMet ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Tuntas 15</span>
                              </span>
                            ) : (
                              <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                                {team.total} / {targetPerTim}
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {/* Mini Progress Bar */}
                      <div className="mt-2.5 w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isMet ? 'bg-emerald-500' : 'bg-sky-500'
                          }`}
                          style={{ width: `${teamPercent}%` }}
                        />
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          {team.sd} SD • {team.smp} SMP
                        </span>
                        <span className="font-semibold text-slate-700">
                          {team.audience} audiens ({team.pendaftar} daftar)
                        </span>
                      </div>

                      {team.daerahList.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex items-center space-x-1 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{team.daerahList.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Sebaran Kunjungan per Daerah */}
        {activeTab === 'daerah' && (
          <div className="mt-4">
            {daerahList.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
                Belum ada data kunjungan daerah.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {daerahList.map(([daerah, stat]) => (
                  <div
                    key={daerah}
                    className="p-3 rounded-xl bg-white border border-slate-200 text-xs shadow-xs space-y-1 min-w-[180px]"
                  >
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span>{daerah}</span>
                      <span className="bg-sky-50 text-sky-800 font-mono font-bold px-2 py-0.5 rounded text-[11px]">
                        {stat.total} Sekolah
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>{stat.sd} SD • {stat.smp} SMP</span>
                      <span className="text-amber-700 font-bold">{stat.pendaftar} Pendaftar</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
