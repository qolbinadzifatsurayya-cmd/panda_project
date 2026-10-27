import React, { useState, useMemo } from 'react';
import {
  Compass,
  School,
  MapPin,
  CheckCircle2,
  Clock,
  Users,
  UserCheck,
  User,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Eye,
  Calendar,
  Phone,
  Image as ImageIcon,
  Edit3,
  Trash2,
  X,
  TrendingUp,
  Award,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import {
  SosialisasiReport,
  TARGET_ROADSHOW_PER_TIM,
  TOTAL_TIM_ROADSHOW,
  TARGET_TOTAL_ROADSHOW,
  DAFTAR_DEFAULT_TIM_ROADSHOW,
  DAFTAR_DAERAH_JABODETABEK,
  LIST_TIM_ROADSHOW,
  getTeamInfo
} from '../types';

export interface RoadshowTeamRow {
  teamId?: number;
  teamShort: string; // e.g. "Tim 1"
  namaAnggota: string; // e.g. "Abdul & Teguh"
  teamName: string; // e.g. "Tim 1 (Abdul & Teguh)"
  totalSekolah: number;
  totalSD: number;
  totalSMP: number;
  totalAudience: number;
  totalPendaftar: number;
  daerahList: string[];
  isTargetSelesai: boolean; // >= 15 sekolah
  persentaseSelesai: number; // 0 - 100%
  sisaSekolah: number; // 15 - totalSekolah
  conversionRate: string;
  reports: SosialisasiReport[];
}

interface JabodetabekMatrixTableProps {
  reports: SosialisasiReport[];
  onAddNewReport?: (defaultTeam?: string) => void;
  onEditReport?: (report: SosialisasiReport) => void;
  onDeleteReport?: (id: string, sekolah: string) => void;
  onBatchDeleteReport?: (ids: string[]) => void;
}

export const JabodetabekMatrixTable: React.FC<JabodetabekMatrixTableProps> = ({
  reports,
  onAddNewReport,
  onEditReport,
  onDeleteReport,
  onBatchDeleteReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED'>('ALL');
  const [sortBy, setSortBy] = useState<'default' | 'total' | 'audience' | 'pendaftar'>('default');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTeam, setSelectedTeam] = useState<RoadshowTeamRow | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Group and compute metrics for all 19 teams (plus any custom team names in reports)
  const allTeamRows = useMemo<RoadshowTeamRow[]>(() => {
    // 1. Process all 19 defined teams with their assigned member names
    const defaultRows: RoadshowTeamRow[] = LIST_TIM_ROADSHOW.map((item) => {
      const teamReports = reports.filter((r) => {
        const info = getTeamInfo(r.picRoadshow);
        if (info) return info.id === item.id;
        const raw = (r.picRoadshow || '').trim().toLowerCase();
        return (
          raw === item.tim.toLowerCase() ||
          raw === item.fullName.toLowerCase() ||
          raw === item.namaAnggota.toLowerCase()
        );
      });

      const totalSekolah = teamReports.length;
      const totalSD = teamReports.filter((r) => r.jenjang === 'SD').length;
      const totalSMP = teamReports.filter((r) => r.jenjang === 'SMP').length;
      const totalAudience = teamReports.reduce((sum, r) => sum + (Number(r.jumlahAudience) || 0), 0);
      const totalPendaftar = teamReports.reduce((sum, r) => sum + (Number(r.jumlahPendaftar) || 0), 0);
      const conversionRate = totalAudience > 0 ? ((totalPendaftar / totalAudience) * 100).toFixed(1) : '0';

      const daerahSet = new Set<string>();
      teamReports.forEach((r) => {
        const d = (r.daerahRoadshow || r.kabupatenKota || '').trim();
        if (d) daerahSet.add(d);
      });

      const isTargetSelesai = totalSekolah >= TARGET_ROADSHOW_PER_TIM;
      const persentaseSelesai = Math.min(100, Math.round((totalSekolah / TARGET_ROADSHOW_PER_TIM) * 100));
      const sisaSekolah = Math.max(0, TARGET_ROADSHOW_PER_TIM - totalSekolah);

      return {
        teamId: item.id,
        teamShort: item.tim,
        namaAnggota: item.namaAnggota,
        teamName: item.fullName,
        totalSekolah,
        totalSD,
        totalSMP,
        totalAudience,
        totalPendaftar,
        daerahList: Array.from(daerahSet),
        isTargetSelesai,
        persentaseSelesai,
        sisaSekolah,
        conversionRate,
        reports: teamReports,
      };
    });

    // 2. Process any reports with custom team names not in LIST_TIM_ROADSHOW
    const customTeamMap: Record<string, SosialisasiReport[]> = {};
    reports.forEach((r) => {
      const info = getTeamInfo(r.picRoadshow);
      if (!info) {
        const raw = (r.picRoadshow || '').trim();
        if (
          raw &&
          !LIST_TIM_ROADSHOW.some(
            (t) =>
              t.tim.toLowerCase() === raw.toLowerCase() ||
              t.fullName.toLowerCase() === raw.toLowerCase()
          )
        ) {
          if (!customTeamMap[raw]) customTeamMap[raw] = [];
          customTeamMap[raw].push(r);
        }
      }
    });

    const customRows: RoadshowTeamRow[] = Object.entries(customTeamMap).map(
      ([rawName, teamReports], idx) => {
        const totalSekolah = teamReports.length;
        const totalSD = teamReports.filter((r) => r.jenjang === 'SD').length;
        const totalSMP = teamReports.filter((r) => r.jenjang === 'SMP').length;
        const totalAudience = teamReports.reduce(
          (sum, r) => sum + (Number(r.jumlahAudience) || 0),
          0
        );
        const totalPendaftar = teamReports.reduce(
          (sum, r) => sum + (Number(r.jumlahPendaftar) || 0),
          0
        );
        const conversionRate =
          totalAudience > 0
            ? ((totalPendaftar / totalAudience) * 100).toFixed(1)
            : '0';

        const daerahSet = new Set<string>();
        teamReports.forEach((r) => {
          const d = (r.daerahRoadshow || r.kabupatenKota || '').trim();
          if (d) daerahSet.add(d);
        });

        return {
          teamId: 19 + idx + 1,
          teamShort: rawName,
          namaAnggota: rawName,
          teamName: rawName,
          totalSekolah,
          totalSD,
          totalSMP,
          totalAudience,
          totalPendaftar,
          daerahList: Array.from(daerahSet),
          isTargetSelesai: totalSekolah >= TARGET_ROADSHOW_PER_TIM,
          persentaseSelesai: Math.min(
            100,
            Math.round((totalSekolah / TARGET_ROADSHOW_PER_TIM) * 100)
          ),
          sisaSekolah: Math.max(0, TARGET_ROADSHOW_PER_TIM - totalSekolah),
          conversionRate,
          reports: teamReports,
        };
      }
    );

    return [...defaultRows, ...customRows];
  }, [reports]);

  // Keep selected team synced if reports update
  const currentSelectedTeam = useMemo(() => {
    if (!selectedTeam) return null;
    return allTeamRows.find((t) => t.teamName === selectedTeam.teamName) || selectedTeam;
  }, [allTeamRows, selectedTeam]);

  // Filtered and Sorted rows
  const displayRows = useMemo(() => {
    return allTeamRows
      .filter((row) => {
        // Search filter
        const matchSearch =
          searchTerm === '' ||
          row.teamShort.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.namaAnggota.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.daerahList.some((d) => d.toLowerCase().includes(searchTerm.toLowerCase())) ||
          row.reports.some((r) => r.sekolah.toLowerCase().includes(searchTerm.toLowerCase()));

        // Status filter
        let matchStatus = true;
        if (statusFilter === 'COMPLETED') {
          matchStatus = row.isTargetSelesai;
        } else if (statusFilter === 'IN_PROGRESS') {
          matchStatus = row.totalSekolah > 0 && !row.isTargetSelesai;
        } else if (statusFilter === 'NOT_STARTED') {
          matchStatus = row.totalSekolah === 0;
        }

        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'default') {
          // Sort by natural numeric team ID: Tim 1, Tim 2, ... Tim 19
          const numA = a.teamId || parseInt(a.teamShort.replace(/\D/g, ''), 10) || 999;
          const numB = b.teamId || parseInt(b.teamShort.replace(/\D/g, ''), 10) || 999;
          return sortOrder === 'asc' ? numB - numA : numA - numB;
        }
        if (sortBy === 'total') {
          return sortOrder === 'asc' ? a.totalSekolah - b.totalSekolah : b.totalSekolah - a.totalSekolah;
        }
        if (sortBy === 'audience') {
          return sortOrder === 'asc' ? a.totalAudience - b.totalAudience : b.totalAudience - a.totalAudience;
        }
        if (sortBy === 'pendaftar') {
          return sortOrder === 'asc' ? a.totalPendaftar - b.totalPendaftar : b.totalPendaftar - a.totalPendaftar;
        }
        return 0;
      });
  }, [allTeamRows, searchTerm, statusFilter, sortBy, sortOrder]);

  // Cumulative totals
  const totalSekolahKumulatif = reports.length;
  const totalSDKumulatif = reports.filter((r) => r.jenjang === 'SD').length;
  const totalSMPKumulatif = reports.filter((r) => r.jenjang === 'SMP').length;
  const totalAudienceKumulatif = reports.reduce((sum, r) => sum + (Number(r.jumlahAudience) || 0), 0);
  const totalPendaftarKumulatif = reports.reduce((sum, r) => sum + (Number(r.jumlahPendaftar) || 0), 0);
  const cumulativeConversion = totalAudienceKumulatif > 0
    ? ((totalPendaftarKumulatif / totalAudienceKumulatif) * 100).toFixed(1)
    : '0';

  const completedTeamsCount = allTeamRows.filter((t) => t.isTargetSelesai).length;
  const inProgressTeamsCount = allTeamRows.filter((t) => t.totalSekolah > 0 && !t.isTargetSelesai).length;
  const notStartedTeamsCount = allTeamRows.filter((t) => t.totalSekolah === 0).length;
  const cumulativeProgressPercent = Math.min(
    100,
    Math.round((totalSekolahKumulatif / TARGET_TOTAL_ROADSHOW) * 100)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-7 text-white border border-sky-800/40 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center space-x-1.5">
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                <span>Roadshow Panitia Pusat</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {TOTAL_TIM_ROADSHOW} Tim • Target Maks. {TARGET_ROADSHOW_PER_TIM} Sekolah/Tim
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Matriks Capaian Sosialisasi Roadshow Jabodetabek
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Monitoring capaian target sosialisasi panitia pusat ke sekolah sasaran di DKI Jakarta, Bogor, Depok,
              Tangerang, dan Bekasi. Target masing-masing tim adalah <strong>maksimal {TARGET_ROADSHOW_PER_TIM} sekolah</strong>{' '}
              (SD dan SMP) dengan target kumulatif <strong>{TARGET_TOTAL_ROADSHOW} sekolah</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onAddNewReport && (
              <button
                onClick={() => onAddNewReport()}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-900/40 transition-all flex items-center space-x-1.5 cursor-pointer hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" />
                <span>+ Input Laporan Roadshow</span>
              </button>
            )}
          </div>
        </div>

        {/* Kumulatif Progress Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-300 uppercase tracking-wider">
                Total Capaian Kumulatif Nasional Roadshow:
              </span>
              <span className="font-extrabold text-white text-sm">
                {totalSekolahKumulatif} dari {TARGET_TOTAL_ROADSHOW} Sekolah
              </span>
              <span className="font-mono font-bold text-sky-400">({cumulativeProgressPercent}%)</span>
            </div>
            <div className="text-slate-300">
              <span className="text-emerald-400 font-bold">{completedTeamsCount}</span> Tim Tuntas •{' '}
              <span className="text-amber-400 font-bold">{inProgressTeamsCount}</span> Tim Berjalan •{' '}
              <span className="text-slate-400">{notStartedTeamsCount}</span> Tim Menunggu
            </div>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700/80">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                cumulativeProgressPercent >= 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-sky-500 via-teal-400 to-emerald-400'
              }`}
              style={{ width: `${cumulativeProgressPercent}%` }}
            />
          </div>
        </div>

        {/* 4 KPI Highlight Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6">
          {/* Card 1: Sekolah Kunjungan */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Total Sekolah</span>
              <School className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-extrabold text-white mt-1.5">
              {totalSekolahKumulatif}{' '}
              <span className="text-xs font-semibold text-slate-400">/ {TARGET_TOTAL_ROADSHOW}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex space-x-2">
              <span className="text-sky-300 font-semibold">{totalSDKumulatif} SD</span>
              <span>•</span>
              <span className="text-teal-300 font-semibold">{totalSMPKumulatif} SMP</span>
            </div>
          </div>

          {/* Card 2: Tim Tuntas */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Tim Tuntas Kuota</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-300 mt-1.5">
              {completedTeamsCount}{' '}
              <span className="text-xs font-semibold text-slate-400">/ {TOTAL_TIM_ROADSHOW} Tim</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Target: 15 sekolah / tim
            </div>
          </div>

          {/* Card 3: Total Audience */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Total Audience</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-extrabold text-white mt-1.5">
              {totalAudienceKumulatif.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Siswa & Guru Terjangkau
            </div>
          </div>

          {/* Card 4: Calon Pendaftar */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Calon Pendaftar</span>
              <UserCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-amber-300 mt-1.5">
              {totalPendaftarKumulatif.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Konversi: {cumulativeConversion}%
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari tim roadshow (contoh: Tim 1), daerah, atau sekolah..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({allTeamRows.length})
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === 'COMPLETED'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Tuntas ({completedTeamsCount})
            </button>
            <button
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === 'IN_PROGRESS'
                  ? 'bg-amber-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              Berjalan ({inProgressTeamsCount})
            </button>
            <button
              onClick={() => setStatusFilter('NOT_STARTED')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === 'NOT_STARTED'
                  ? 'bg-slate-700 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Belum Mulai ({notStartedTeamsCount})
            </button>
          </div>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="default">Urutkan: Nomor Tim (1 - 19)</option>
            <option value="total">Urutkan: Kunjungan Terbanyak</option>
            <option value="audience">Urutkan: Audience Terbanyak</option>
            <option value="pendaftar">Urutkan: Pendaftar Terbanyak</option>
          </select>

          <button
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="p-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            title={`Arah Urutan: ${sortOrder === 'asc' ? 'Menaik (Asc)' : 'Menurun (Desc)'}`}
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Matriks Capaian Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
              <Compass className="w-4 h-4 text-sky-600" />
              <span>Tabel Matriks Capaian 19 Tim Roadshow Jabodetabek</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Standar target per tim: <strong>15 sekolah</strong> kunjungan (SD dan SMP). Klik "Lihat Laporan" untuk
              melihat daftar rincian sekolah dan foto kegiatan masing-masing tim.
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-sky-100 text-sky-800 px-3 py-1 rounded-lg self-start sm:self-auto border border-sky-200">
            Menampilkan {displayRows.length} dari {allTeamRows.length} Tim
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Tim / PIC Roadshow</th>
                <th className="py-3 px-3 text-center">Status Target</th>
                <th className="py-3 px-4">Daerah Sasaran Kunjungan</th>
                <th className="py-3 px-3 text-center">Total Sekolah</th>
                <th className="py-3 px-3 text-right">Audience</th>
                <th className="py-3 px-3 text-right">Pendaftar</th>
                <th className="py-3 px-4 text-center">Progres (Max 15)</th>
                <th className="py-3 px-4 text-center">Aksi Pengelolaan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-800">
              {displayRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">
                    <Compass className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-sm">Tidak ada tim yang sesuai dengan pencarian / filter</p>
                    <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci pencarian atau reset filter status.</p>
                  </td>
                </tr>
              ) : (
                displayRows.map((row, idx) => {
                  return (
                    <tr
                      key={row.teamName}
                      className="hover:bg-sky-50/40 transition-colors group"
                    >
                      {/* No */}
                      <td className="py-3.5 px-3 text-center font-mono text-slate-500 font-medium">
                        {idx + 1}
                      </td>

                      {/* Tim Roadshow */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedTeam(row)}
                          className="text-left group/btn flex items-center space-x-2.5 cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center text-xs font-mono font-extrabold shrink-0 border border-sky-200 group-hover/btn:bg-sky-600 group-hover/btn:text-white transition-colors shadow-2xs">
                            {row.teamId || row.teamShort.replace(/\D/g, '') || idx + 1}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 group-hover/btn:text-sky-700 transition-colors flex items-center space-x-1.5">
                              <span>{row.teamShort}</span>
                            </div>
                            <div className="text-xs text-sky-800 font-semibold flex items-center space-x-1 mt-0.5">
                              <User className="w-3 h-3 text-sky-600 shrink-0" />
                              <span>{row.namaAnggota}</span>
                            </div>
                          </div>
                        </button>
                      </td>

                      {/* Status Target */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {row.isTargetSelesai ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Tuntas (15 Sek)</span>
                          </span>
                        ) : row.totalSekolah > 0 ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>Berjalan ({row.totalSekolah}/15)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <span>Belum Mulai (0/15)</span>
                          </span>
                        )}
                      </td>

                      {/* Daerah Sasaran */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {row.daerahList.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {row.daerahList.map((d) => (
                              <span
                                key={d}
                                className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                              >
                                <MapPin className="w-2.5 h-2.5 mr-1 text-slate-400" />
                                {d}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Belum ada kunjungan</span>
                        )}
                      </td>

                      {/* Total Sekolah */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap font-medium">
                        <div className="font-extrabold text-slate-900 text-sm">
                          {row.totalSekolah}{' '}
                          <span className="text-xs font-normal text-slate-400">/ 15</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {row.totalSD} SD • {row.totalSMP} SMP
                        </div>
                      </td>

                      {/* Audience */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap font-medium text-slate-800">
                        {row.totalAudience.toLocaleString('id-ID')}
                      </td>

                      {/* Pendaftar */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="font-bold text-amber-800">
                          {row.totalPendaftar.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {row.conversionRate}%
                        </div>
                      </td>

                      {/* Progres Bar */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="w-28 mx-auto">
                          <div className="flex justify-between text-[10px] font-semibold text-slate-600 mb-1">
                            <span>{row.totalSekolah}/15 Sek</span>
                            <span className="font-mono">{row.persentaseSelesai}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                row.isTargetSelesai
                                  ? 'bg-emerald-500'
                                  : row.totalSekolah > 0
                                  ? 'bg-sky-500'
                                  : 'bg-slate-300'
                              }`}
                              style={{ width: `${row.persentaseSelesai}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => setSelectedTeam(row)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-lg text-xs font-bold transition-colors border border-sky-300 cursor-pointer"
                            title="Lihat rincian sekolah dan dokumentasi"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-600" />
                            <span>Laporan ({row.totalSekolah})</span>
                          </button>
                          {onAddNewReport && (
                            <button
                              onClick={() => onAddNewReport(row.teamName)}
                              className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                              title={`Input laporan untuk ${row.teamName}`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Grand Total Footer */}
            <tfoot>
              <tr className="bg-slate-900 text-white text-xs sm:text-sm font-extrabold border-t-2 border-slate-700">
                <td colSpan={2} className="py-4 px-4 text-left">
                  <div className="flex items-center space-x-2">
                    <Compass className="w-4 h-4 text-sky-400" />
                    <span>Total Kumulatif {allTeamRows.length} Tim Roadshow Jabodetabek</span>
                  </div>
                </td>
                <td className="py-4 px-3 text-center whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                    {completedTeamsCount} / {TOTAL_TIM_ROADSHOW} Tuntas
                  </span>
                </td>
                <td className="py-4 px-4 text-xs text-slate-300">
                  Target: Maks. 15 Sekolah/Tim (Total: 285)
                </td>
                <td className="py-4 px-3 text-center whitespace-nowrap">
                  <div className="text-white font-extrabold text-sm">
                    {totalSekolahKumulatif}{' '}
                    <span className="text-slate-400 text-xs">/ {TARGET_TOTAL_ROADSHOW}</span>
                  </div>
                  <div className="text-[10px] text-sky-300 font-normal">
                    {totalSDKumulatif} SD • {totalSMPKumulatif} SMP
                  </div>
                </td>
                <td className="py-4 px-3 text-right whitespace-nowrap text-sky-300">
                  {totalAudienceKumulatif.toLocaleString('id-ID')}
                </td>
                <td className="py-4 px-3 text-right whitespace-nowrap">
                  <div className="text-amber-300">
                    {totalPendaftarKumulatif.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    {cumulativeConversion}%
                  </div>
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <div className="w-28 mx-auto">
                    <div className="text-right text-[10px] font-mono text-sky-300 mb-1">
                      {cumulativeProgressPercent}%
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
                        style={{ width: `${cumulativeProgressPercent}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  {onAddNewReport && (
                    <button
                      onClick={() => onAddNewReport()}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      + Input Laporan
                    </button>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal Slide-over / Popup: Detail Laporan Sekolah Tim Terpilih */}
      {currentSelectedTeam && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-sky-950 via-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sky-600/30 border border-sky-500/40 flex items-center justify-center text-sky-400 font-extrabold text-sm shrink-0">
                  {currentSelectedTeam.teamId || currentSelectedTeam.teamShort.replace(/\D/g, '') || '#'}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-extrabold text-white">
                      Rincian Laporan: {currentSelectedTeam.teamShort}
                    </h3>
                    {currentSelectedTeam.isTargetSelesai ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Target Tuntas (15 Sek)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Progres: {currentSelectedTeam.totalSekolah} / 15 Sekolah
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-sky-300 mt-1">
                    <User className="w-3.5 h-3.5 text-sky-400" />
                    <span className="font-semibold text-slate-200">PIC Roadshow: {currentSelectedTeam.namaAnggota}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {onAddNewReport && (
                  <button
                    onClick={() => {
                      onAddNewReport(currentSelectedTeam.teamName);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Sekolah</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedTeam(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mini Summary Stats for this team */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Sekolah Dikunjungi</div>
                <div className="text-xl font-extrabold text-slate-900 mt-1">
                  {currentSelectedTeam.totalSekolah}{' '}
                  <span className="text-xs font-normal text-slate-400">/ 15</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {currentSelectedTeam.totalSD} SD • {currentSelectedTeam.totalSMP} SMP
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Sisa Target</div>
                <div className="text-xl font-extrabold text-amber-600 mt-1">
                  {currentSelectedTeam.sisaSekolah} Sekolah
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Capaian: {currentSelectedTeam.persentaseSelesai}%
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Audience Terjangkau</div>
                <div className="text-xl font-extrabold text-indigo-600 mt-1">
                  {currentSelectedTeam.totalAudience.toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Siswa & Guru</div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Calon Pendaftar</div>
                <div className="text-xl font-extrabold text-emerald-600 mt-1">
                  {currentSelectedTeam.totalPendaftar.toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Konversi: {currentSelectedTeam.conversionRate}%
                </div>
              </div>
            </div>

            {/* School List Table */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {currentSelectedTeam.reports.length === 0 ? (
                <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <School className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-700">Belum Ada Laporan Sekolah untuk {currentSelectedTeam.teamName}</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Tim ini belum menginput laporan kunjungan ke sekolah sasaran di wilayah Jabodetabek.
                  </p>
                  {onAddNewReport && (
                    <button
                      onClick={() => {
                        onAddNewReport(currentSelectedTeam.teamName);
                      }}
                      className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition-all cursor-pointer inline-flex items-center space-x-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Input Laporan untuk {currentSelectedTeam.teamName}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Daftar {currentSelectedTeam.reports.length} Sekolah yang Telah Dikunjungi:</span>
                  </div>

                  <div className="space-y-2.5">
                    {currentSelectedTeam.reports.map((rep, rIdx) => {
                      const allPhotos = [
                        ...(rep.dokumentasiList || []),
                        ...(rep.dokumentasiUrl ? [rep.dokumentasiUrl] : []),
                      ].filter((url, i, self) => url && self.indexOf(url) === i);

                      return (
                        <div
                          key={rep.id}
                          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-sky-300 transition-all shadow-2xs space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                            <div className="flex items-center space-x-2">
                              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                                {rIdx + 1}
                              </span>
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                                  rep.jenjang === 'SD'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-teal-100 text-teal-900 border border-teal-300'
                                }`}
                              >
                                {rep.jenjang}
                              </span>
                              <h4 className="font-extrabold text-sm text-slate-900">
                                {rep.sekolah}
                              </h4>
                            </div>

                            <div className="flex items-center space-x-2">
                              <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>{rep.tanggalKunjungan}</span>
                              </span>

                              {/* Admin Action Buttons */}
                              {onEditReport && (
                                <button
                                  onClick={() => {
                                    onEditReport(rep);
                                  }}
                                  className="p-1 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors cursor-pointer"
                                  title="Edit laporan"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {onDeleteReport && (
                                <button
                                  onClick={() => {
                                    onDeleteReport(rep.id, rep.sekolah);
                                  }}
                                  className="p-1 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                  title="Hapus laporan ini"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600">
                            <div>
                              <span className="text-slate-400 block text-[10px]">Daerah Roadshow:</span>
                              <span className="font-semibold text-slate-800 flex items-center space-x-1">
                                <MapPin className="w-3 h-3 text-sky-600" />
                                <span>{rep.daerahRoadshow || rep.kabupatenKota || '-'}</span>
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">PIC Sekolah / Kontak:</span>
                              <span className="font-semibold text-slate-800">
                                {rep.pic} {rep.kontak ? `(${rep.kontak})` : ''}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Audience:</span>
                              <span className="font-bold text-slate-900">
                                {rep.jumlahAudience} Siswa
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Calon Pendaftar:</span>
                              <span className="font-bold text-emerald-700">
                                {rep.jumlahPendaftar} Siswa
                              </span>
                            </div>
                          </div>

                          {rep.catatan && (
                            <div className="p-2 bg-slate-50 rounded-lg text-xs text-slate-700 italic border border-slate-100">
                              "{rep.catatan}"
                            </div>
                          )}

                          {/* Photos Thumbnail Bar */}
                          {allPhotos.length > 0 && (
                            <div className="flex items-center space-x-2 pt-1 overflow-x-auto">
                              <span className="text-[10px] text-slate-400 uppercase font-semibold shrink-0">
                                Dokumentasi ({allPhotos.length}):
                              </span>
                              {allPhotos.map((photo, pIdx) => (
                                <button
                                  key={pIdx}
                                  onClick={() => setPreviewPhotoUrl(photo)}
                                  className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 hover:border-sky-500 transition-all shrink-0 cursor-pointer shadow-2xs group relative"
                                >
                                  <img
                                    src={photo}
                                    alt={`Foto ${pIdx + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-600">
                Total <strong>{currentSelectedTeam.totalSekolah}</strong> dari maksimal{' '}
                <strong>{TARGET_ROADSHOW_PER_TIM}</strong> sekolah sasaran
              </span>
              <button
                onClick={() => setSelectedTeam(null)}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Lightbox Preview */}
      {previewPhotoUrl && (
        <div
          onClick={() => setPreviewPhotoUrl(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={previewPhotoUrl}
              alt="Dokumentasi Roadshow Jabodetabek"
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 p-2 text-sm font-bold flex items-center space-x-1"
            >
              <X className="w-5 h-5" />
              <span>Tutup Preview</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
