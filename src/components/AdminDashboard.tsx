import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Users, 
  UserCheck, 
  School, 
  Sparkles, 
  Download, 
  Search, 
  Filter, 
  ChevronRight, 
  BarChart3, 
  RefreshCw,
  Plus,
  AlertTriangle,
  RotateCcw,
  Printer,
  Trash2,
  KeyRound,
  ArrowLeft,
  Copy,
  Check,
  Compass,
  Layers
} from 'lucide-react';
import { SosialisasiReport, WilayahName, DAFTAR_WILAYAH, TARGET_RULES, DEFAULT_WILAYAH_PINS } from '../types';
import { ReportTable } from './ReportTable';
import { TargetProgressCard } from './TargetProgressCard';
import { JabodetabekRoadshowView } from './JabodetabekRoadshowView';
import { JabodetabekMatrixTable } from './JabodetabekMatrixTable';
import { StatsResponse } from '../services/api';

interface AdminDashboardProps {
  stats: StatsResponse | null;
  allReports: SosialisasiReport[];
  onSelectWilayah: (wilayah: WilayahName) => void;
  onEditReport: (report: SosialisasiReport) => void;
  onDeleteReport: (id: string, sekolah: string) => void;
  onBatchDeleteReport: (ids: string[]) => void;
  onAddNewReport: () => void;
  onAddNewJabodetabekReport?: (defaultTeam?: string) => void;
  onPrintPreview: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  allReports,
  onSelectWilayah,
  onEditReport,
  onDeleteReport,
  onBatchDeleteReport,
  onAddNewReport,
  onAddNewJabodetabekReport,
  onPrintPreview,
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'matrix-jabodetabek' | 'jabodetabek' | 'all-reports' | 'pins'>('matrix');
  const [selectedDrillWilayah, setSelectedDrillWilayah] = useState<WilayahName | null>(null);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);

  const summary = stats?.summary || {
    grandTotalSekolah: allReports.length,
    grandTotalSD: allReports.filter((r) => r.jenjang === 'SD').length,
    grandTotalSMP: allReports.filter((r) => r.jenjang === 'SMP').length,
    grandTotalAudience: allReports.reduce((sum, r) => sum + r.jumlahAudience, 0),
    grandTotalPendaftar: allReports.reduce((sum, r) => sum + r.jumlahPendaftar, 0),
    totalWilayah: DAFTAR_WILAYAH.length,
    wilayahTercapai: 0,
    wilayahBelumTercapai: DAFTAR_WILAYAH.length,
    conversionRate: '0',
  };

  const wilayahStats = stats?.wilayahStats || [];

  const jabodetabekReports = allReports.filter(
    (r) => r.isJabodetabek || r.wilayah === 'Jabodetabek' || (r.daerahRoadshow && r.daerahRoadshow.trim() !== '')
  );

  const handleCopyPin = (wilayah: string, pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(wilayah);
    setTimeout(() => {
      setCopiedPin(null);
    }, 2000);
  };

  // If drilling down into a single region inside Admin Dashboard
  if (selectedDrillWilayah) {
    const drillReports = allReports.filter(
      (r) => r.wilayah.toLowerCase() === selectedDrillWilayah.toLowerCase()
    );

    return (
      <div className="space-y-6">
        {/* Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <button
            onClick={() => setSelectedDrillWilayah(null)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>Kembali ke Matriks Ringkasan Nasional</span>
          </button>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg">
              Mode Admin Pusat: Memantau Wilayah {selectedDrillWilayah}
            </span>
            <button
              onClick={onAddNewReport}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Input Laporan</span>
            </button>
          </div>
        </div>

        {/* Target Progress Card for this Region */}
        <TargetProgressCard
          wilayah={selectedDrillWilayah}
          reports={drillReports}
          onAddReportClick={onAddNewReport}
        />

        {/* Reports Table with Admin Delete Functionality */}
        <div className="space-y-3">
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-950">
            <div className="flex items-center space-x-2">
              <span className="font-bold bg-amber-200 px-2 py-0.5 rounded text-[11px]">Akses Admin</span>
              <span>
                Sebagai Admin Pusat, Anda dapat <strong>mengedit</strong> dan <strong>menghapus</strong> laporan sosialisasi yang telah diinput untuk wilayah {selectedDrillWilayah}.
              </span>
            </div>
            <span className="font-bold text-amber-900">{drillReports.length} Sekolah Terdaftar</span>
          </div>

          <ReportTable
            reports={drillReports}
            onEdit={onEditReport}
            onDelete={onDeleteReport}
            onBatchDelete={onBatchDeleteReport}
            onAddNew={onAddNewReport}
            showWilayahColumn={false}
            isAdminView={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Admin Pusat Welcome & Action Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 rounded-2xl p-6 sm:p-8 text-white border border-slate-700 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                <span>🛡️ Koordinator Panitia Pusat</span>
              </span>
              <span className="text-xs text-slate-400">SMART Ekselensia Indonesia</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Dashboard Monitoring Nasional SENSEI 2027
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Rekapitulasi nasional, verifikasi data, dan kelola laporan sosialisasi dari 14 wilayah mitra daerah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onPrintPreview}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Cetak Laporan</span>
            </button>
            <button
              onClick={onAddNewReport}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Input Laporan</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mt-8">
          {/* Card 1: Total Sekolah */}
          <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Total Kunjungan</span>
              <School className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              {summary.grandTotalSekolah}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex space-x-1.5">
              <span className="text-emerald-400 font-semibold">{summary.grandTotalSD} SD</span>
              <span>•</span>
              <span className="text-teal-400 font-semibold">{summary.grandTotalSMP} SMP</span>
            </div>
          </div>

          {/* Card 2: Total Audience */}
          <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Total Audience</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              {summary.grandTotalAudience.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Siswa & Guru Terjangkau
            </div>
          </div>

          {/* Card 3: Total Pendaftar */}
          <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Calon Pendaftar</span>
              <UserCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 mt-2">
              {summary.grandTotalPendaftar.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Konversi: {summary.conversionRate}%
            </div>
          </div>

          {/* Card 4: Wilayah Tercapai */}
          <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Wilayah Tuntas</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2">
              {summary.wilayahTercapai} <span className="text-base text-slate-400">/ 14</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Memenuhi target 2 Kab.
            </div>
          </div>

          {/* Card 5: Wilayah Belum */}
          <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-4 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Proses Berjalan</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-2">
              {summary.wilayahBelumTercapai}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Wilayah dalam proses
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 space-x-2 sm:space-x-4 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer shrink-0 ${
            activeTab === 'matrix'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Matriks Progres 14 Wilayah</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix-jabodetabek')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer shrink-0 ${
            activeTab === 'matrix-jabodetabek'
              ? 'border-sky-600 text-sky-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Compass className="w-4 h-4 text-sky-600" />
          <span>Matriks Capaian Roadshow Jabodetabek</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ${
            activeTab === 'matrix-jabodetabek'
              ? 'bg-sky-100 text-sky-800'
              : 'bg-slate-100 text-slate-600'
          }`}>
            19 Tim • {jabodetabekReports.length}/285
          </span>
        </button>

        <button
          onClick={() => setActiveTab('jabodetabek')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer shrink-0 ${
            activeTab === 'jabodetabek'
              ? 'border-teal-600 text-teal-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 text-teal-600" />
          <span>Rincian Laporan Roadshow</span>
        </button>

        <button
          onClick={() => setActiveTab('all-reports')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer shrink-0 ${
            activeTab === 'all-reports'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Kelola & Hapus Laporan ({allReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pins')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer shrink-0 ${
            activeTab === 'pins'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>PIN Akses 14 Wilayah</span>
        </button>
      </div>

      {/* Tab 1: 14 Wilayah Progress Matrix */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Quick link banner to Roadshow Jabodetabek Matrix */}
          <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-sky-950 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-sky-100 text-sky-700 rounded-xl shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-sky-950 flex items-center space-x-1.5">
                  <span>Matriks Capaian Sosialisasi Roadshow Jabodetabek</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-200 text-sky-800">
                    19 Tim • Target 285 Sekolah
                  </span>
                </div>
                <p className="text-slate-600 text-xs mt-0.5">
                  Panitia pusat menyelenggarakan roadshow ke 19 tim wilayah Jabodetabek dengan kuota maksimal 15 sekolah per tim (kumulatif 285 sekolah).
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('matrix-jabodetabek')}
              className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <span>Buka Matriks Roadshow Jabodetabek</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Matriks Capaian Sosialisasi 14 Wilayah Nasional SENSEI 2027
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Syarat Target Selesai: Mengunjungi minimal 2 Kabupaten/Kota yang masing-masing memenuhi kuota minimal 15 SD & 5 SMP.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-3 w-12 text-center">No</th>
                    <th className="py-3 px-4">Wilayah Panitia Daerah</th>
                    <th className="py-3 px-3 text-center">Status Target</th>
                    <th className="py-3 px-3 text-center">Kab/Kota Lolos Kuota</th>
                    <th className="py-3 px-3 text-center">Total Sekolah</th>
                    <th className="py-3 px-3 text-right">Audience</th>
                    <th className="py-3 px-3 text-right">Pendaftar</th>
                    <th className="py-3 px-4 text-center">Progres</th>
                    <th className="py-3 px-4 text-center">Aksi Pengelolaan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-800">
                  {wilayahStats.map((w, idx) => {
                    return (
                      <tr key={w.wilayah} className="hover:bg-slate-50/80 transition-colors group">
                        {/* No */}
                        <td className="py-3.5 px-3 text-center font-mono text-slate-500 font-medium">
                          {idx + 1}
                        </td>

                        {/* Wilayah */}
                        <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedDrillWilayah(w.wilayah as WilayahName)}
                            className="text-emerald-700 hover:text-emerald-900 hover:underline flex items-center space-x-1.5 cursor-pointer text-left"
                          >
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{w.wilayah}</span>
                          </button>
                        </td>

                        {/* Status Target */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          {w.isTargetSelesai ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Tercapai</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              <span>{w.qualifyingKabupatenCount} / 2 Kab</span>
                            </span>
                          )}
                        </td>

                        {/* Kab/Kota Lolos */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap font-semibold">
                          <span className={w.qualifyingKabupatenCount >= 2 ? 'text-emerald-700 font-extrabold' : 'text-slate-700'}>
                            {w.qualifyingKabupatenCount} Kab/Kota
                          </span>
                        </td>

                        {/* Total Sekolah */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap font-medium">
                          <div className="font-bold text-slate-900">{w.totalSekolah}</div>
                          <div className="text-[10px] text-slate-500">
                            {w.totalSD} SD • {w.totalSMP} SMP
                          </div>
                        </td>

                        {/* Audience */}
                        <td className="py-3.5 px-3 text-right whitespace-nowrap font-medium text-slate-800">
                          {w.totalAudience.toLocaleString('id-ID')}
                        </td>

                        {/* Pendaftar */}
                        <td className="py-3.5 px-3 text-right whitespace-nowrap font-bold text-amber-800">
                          {w.totalPendaftar.toLocaleString('id-ID')}
                        </td>

                        {/* Progres Bar */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="w-28 mx-auto">
                            <div className="flex justify-between text-[10px] font-semibold text-slate-600 mb-1">
                              <span>{w.persentaseSelesai}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${
                                  w.isTargetSelesai ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                                style={{ width: `${w.persentaseSelesai}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => setSelectedDrillWilayah(w.wilayah as WilayahName)}
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition-colors border border-emerald-300 cursor-pointer"
                          >
                            <span>Kelola Laporan ({w.totalSekolah})</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Matriks Capaian Sosialisasi Roadshow Jabodetabek (19 Tim, Max 15 Sekolah/Tim, Total 285) */}
      {activeTab === 'matrix-jabodetabek' && (
        <JabodetabekMatrixTable
          reports={jabodetabekReports}
          onAddNewReport={(defaultTeam) => {
            if (onAddNewJabodetabekReport) {
              onAddNewJabodetabekReport(defaultTeam);
            } else {
              onAddNewReport();
            }
          }}
          onEditReport={onEditReport}
          onDeleteReport={onDeleteReport}
          onBatchDeleteReport={onBatchDeleteReport}
        />
      )}

      {/* Tab: Halaman Panitia Jabodetabek (Rincian & Filter Laporan) */}
      {activeTab === 'jabodetabek' && (
        <JabodetabekRoadshowView
          reports={jabodetabekReports}
          onAddNewReport={() => {
            if (onAddNewJabodetabekReport) {
              onAddNewJabodetabekReport();
            } else {
              onAddNewReport();
            }
          }}
          onEditReport={onEditReport}
          onDeleteReport={onDeleteReport}
          onBatchDeleteReport={onBatchDeleteReport}
        />
      )}

      {/* Tab 2: Seluruh Data Laporan with Direct Delete Buttons */}
      {activeTab === 'all-reports' && (
        <div className="space-y-4">
          <div className="p-4 bg-red-50/80 border border-red-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-red-950">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-red-100 text-red-700 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-red-900 block sm:inline">Hak Akses Penghapusan Admin Pusat:</span>{' '}
                <span>Gunakan tombol merah <strong>"Hapus"</strong> di setiap baris laporan atau centang beberapa baris untuk <strong>"Hapus Terpilih"</strong> sekaligus dari cloud database.</span>
              </div>
            </div>
            <span className="font-mono font-bold bg-white px-2.5 py-1 rounded-lg border border-red-200 text-red-800 shrink-0 self-start sm:self-auto">
              Total {allReports.length} Laporan
            </span>
          </div>

          <ReportTable
            reports={allReports}
            onEdit={onEditReport}
            onDelete={onDeleteReport}
            onBatchDelete={onBatchDeleteReport}
            onAddNew={onAddNewReport}
            showWilayahColumn={true}
            isAdminView={true}
          />
        </div>
      )}

      {/* Tab 3: Daftar PIN Akses Wilayah */}
      {activeTab === 'pins' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                  <KeyRound className="w-5 h-5 text-amber-500" />
                  <span>Daftar Kunci & PIN Akses Panitia 14 Wilayah</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Agar perolehan data masing-masing daerah terjaga kerahasiaannya, berikan PIN berikut secara tertutup kepada panitia daerah yang bersangkutan.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DAFTAR_WILAYAH.map((wilayah) => {
                const pin = DEFAULT_WILAYAH_PINS[wilayah];
                const isCopied = copiedPin === wilayah;

                return (
                  <div
                    key={wilayah}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-emerald-300 transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{wilayah}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center space-x-2">
                        <span>PIN Akses:</span>
                        <code className="font-mono font-bold bg-slate-200 px-2 py-0.5 rounded text-slate-800 text-xs">
                          {pin}
                        </code>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopyPin(wilayah, pin)}
                      className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                      title="Salin PIN ke clipboard"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-xl bg-slate-100 text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-800">Catatan Privasi & Keamanan:</div>
              <p>• Panitia daerah hanya bisa masuk ke wilayahnya sendiri menggunakan PIN masing-masing dan tidak dapat melihat data wilayah lain.</p>
              <p>• PIN master darurat untuk seluruh wilayah juga dapat menggunakan: <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-slate-900">sensei2027</code>.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
