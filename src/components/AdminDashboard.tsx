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
  Printer
} from 'lucide-react';
import { SosialisasiReport, WilayahName, DAFTAR_WILAYAH, TARGET_RULES } from '../types';
import { ReportTable } from './ReportTable';
import { StatsResponse } from '../services/api';

interface AdminDashboardProps {
  stats: StatsResponse | null;
  allReports: SosialisasiReport[];
  onSelectWilayah: (wilayah: WilayahName) => void;
  onEditReport: (report: SosialisasiReport) => void;
  onDeleteReport: (id: string, sekolah: string) => void;
  onBatchDeleteReport: (ids: string[]) => void;
  onAddNewReport: () => void;
  onSeedSample: () => void;
  onResetData: () => void;
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
  onSeedSample,
  onResetData,
  onPrintPreview,
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'all-reports'>('matrix');
  const [selectedDrillWilayah, setSelectedDrillWilayah] = useState<string | null>(null);

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
              Rekapitulasi dan evaluasi progres sosialisasi kunjungan sekolah di 14 wilayah mitra daerah secara real-time multi-device.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onPrintPreview}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-colors flex items-center space-x-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Cetak Laporan</span>
            </button>
            <button
              onClick={onSeedSample}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 transition-colors flex items-center space-x-1.5"
              title="Isi data simulasi contoh untuk uji coba target"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Isi Data Simulasi</span>
            </button>
            <button
              onClick={onAddNewReport}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all flex items-center space-x-1.5"
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

          {/* Card 4: Wilayah Memenuhi Target */}
          <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Wilayah Lolos Target</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2">
              {summary.wilayahTercapai} <span className="text-sm text-slate-400 font-normal">/ {summary.totalWilayah}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Target: min 2 Kab (15 SD & 5 SMP)
            </div>
          </div>

          {/* Card 5: Wilayah Belum Target */}
          <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-4 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Perlu Akselerasi</span>
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
      <div className="flex border-b border-slate-200 space-x-4">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'matrix'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Matriks Progres 14 Wilayah</span>
        </button>
        <button
          onClick={() => setActiveTab('all-reports')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'all-reports'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Seluruh Data Laporan ({allReports.length})</span>
        </button>
      </div>

      {/* Tab 1: 14 Wilayah Progress Matrix */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
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
                    <th className="py-3 px-4 text-center">Aksi</th>
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
                            onClick={() => onSelectWilayah(w.wilayah as WilayahName)}
                            className="text-emerald-700 hover:text-emerald-900 hover:underline flex items-center space-x-1.5"
                          >
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{w.wilayah}</span>
                          </button>
                        </td>

                        {/* Status Target */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          {w.isTargetSelesai ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                              Target Tercapai
                            </span>
                          ) : w.totalSekolah > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3 mr-1 text-amber-500" />
                              Sedang Berjalan
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-normal bg-slate-100 text-slate-500">
                              Belum Ada Data
                            </span>
                          )}
                        </td>

                        {/* Kab/Kota Lolos Kuota */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <span
                            className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                              w.qualifyingKabupatenCount >= 2
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {w.qualifyingKabupatenCount} / 2 Kab
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            ({w.kabupatenCount} dikunjungi)
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
                            onClick={() => onSelectWilayah(w.wilayah as WilayahName)}
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200 hover:border-emerald-300"
                          >
                            <span>Buka Wilayah</span>
                            <ChevronRight className="w-3 h-3" />
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

      {/* Tab 2: Seluruh Data Laporan */}
      {activeTab === 'all-reports' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-amber-200/80 rounded-lg text-amber-900 font-bold">
                Admin Pusat
              </span>
              <span>
                Anda memiliki hak akses penuh untuk <strong>memverifikasi, mengedit, melihat foto dokumentasi</strong>, serta <strong>menghapus laporan</strong> yang telah diinput oleh panitia daerah.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-lg">
              Semua Laporan Kunjungan Sosialisasi Sekolah Se-Indonesia ({allReports.length} Sekolah)
            </h3>
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
    </div>
  );
};
