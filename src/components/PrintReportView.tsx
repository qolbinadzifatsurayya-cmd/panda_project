import React from 'react';
import { X, Printer, Building2, CheckCircle2, Clock } from 'lucide-react';
import { SosialisasiReport, DAFTAR_WILAYAH } from '../types';
import { StatsResponse } from '../services/api';

interface PrintReportViewProps {
  isOpen: boolean;
  onClose: () => void;
  stats: StatsResponse | null;
  reports: SosialisasiReport[];
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({
  isOpen,
  onClose,
  stats,
  reports,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
  }).format(new Date());

  const wilayahStats = stats?.wilayahStats || [];
  const summary = stats?.summary;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6 flex items-start sm:items-center justify-center animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-auto overflow-hidden">
        
        {/* Modal Controls (Hidden in print) */}
        <div className="px-6 py-3 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="text-sm font-semibold flex items-center space-x-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Pratinjau Dokumen Cetak / Unduh Laporan Resmi</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="p-8 sm:p-12 text-slate-900 bg-white space-y-6 print:p-0">
          
          {/* Official Letterhead (Kop Surat) */}
          <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
            <div className="flex items-center justify-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold">
                SEI
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight uppercase text-slate-950">
                  SMART EKSELENSIA INDONESIA
                </h1>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest">
                  PANITIA PENERIMAAN SISWA BARU NASIONAL (PPDB) SENSEI 2027
                </p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Jl. Raya Parung - Bogor KM. 42, Jampang, Kec. Kemang, Kabupaten Bogor, Jawa Barat 16310
            </p>
          </div>

          {/* Title */}
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold uppercase underline tracking-wide">
              LAPORAN REKAPITULASI SOSIALISASI DAERAH PPDB SENSEI 2027
            </h2>
            <p className="text-xs text-slate-600">
              Per Tanggal Evaluasi: {todayStr}
            </p>
          </div>

          {/* Target Rules Summary */}
          <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs space-y-1">
            <div className="font-bold text-slate-800">
              Ketentuan Standar Target Kunjungan Panitia Daerah SENSEI 2027:
            </div>
            <ul className="list-disc list-inside text-slate-700 space-y-0.5 pl-1">
              <li>Minimal menjangkau <strong>2 Kabupaten atau Kota</strong> di setiap wilayah tugas.</li>
              <li>Minimal mengunjungi <strong>15 SD</strong> dan <strong>5 SMP</strong> di setiap kabupaten/kota sasaran.</li>
            </ul>
          </div>

          {/* Summary KPI Badges */}
          {summary && (
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 border border-slate-200 rounded bg-slate-50">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Kunjungan</div>
                <div className="font-extrabold text-base text-slate-900">{summary.grandTotalSekolah} Sekolah</div>
              </div>
              <div className="p-2 border border-slate-200 rounded bg-slate-50">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Audience</div>
                <div className="font-extrabold text-base text-slate-900">{summary.grandTotalAudience.toLocaleString('id-ID')} Orang</div>
              </div>
              <div className="p-2 border border-slate-200 rounded bg-slate-50">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Pendaftar</div>
                <div className="font-extrabold text-base text-amber-700">{summary.grandTotalPendaftar.toLocaleString('id-ID')} Siswa</div>
              </div>
              <div className="p-2 border border-slate-200 rounded bg-slate-50">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Target Terpenuhi</div>
                <div className="font-extrabold text-base text-emerald-700">{summary.wilayahTercapai} / {summary.totalWilayah} Wilayah</div>
              </div>
            </div>
          )}

          {/* Table 14 Wilayah */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs border border-slate-300">
              <thead>
                <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                  <th className="p-2 text-center border-r border-slate-300 w-10">No</th>
                  <th className="p-2 border-r border-slate-300">Wilayah</th>
                  <th className="p-2 text-center border-r border-slate-300">Kab/Kota Lolos</th>
                  <th className="p-2 text-center border-r border-slate-300">Total SD</th>
                  <th className="p-2 text-center border-r border-slate-300">Total SMP</th>
                  <th className="p-2 text-right border-r border-slate-300">Audience</th>
                  <th className="p-2 text-right border-r border-slate-300">Pendaftar</th>
                  <th className="p-2 text-center">Status Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {wilayahStats.map((w, index) => (
                  <tr key={w.wilayah} className="hover:bg-slate-50">
                    <td className="p-2 text-center font-mono border-r border-slate-200">{index + 1}</td>
                    <td className="p-2 font-semibold border-r border-slate-200">{w.wilayah}</td>
                    <td className="p-2 text-center border-r border-slate-200">
                      {w.qualifyingKabupatenCount} / 2 ({w.kabupatenCount} dikunjungi)
                    </td>
                    <td className="p-2 text-center border-r border-slate-200">{w.totalSD}</td>
                    <td className="p-2 text-center border-r border-slate-200">{w.totalSMP}</td>
                    <td className="p-2 text-right border-r border-slate-200">{w.totalAudience.toLocaleString('id-ID')}</td>
                    <td className="p-2 text-right font-bold border-r border-slate-200">{w.totalPendaftar.toLocaleString('id-ID')}</td>
                    <td className="p-2 text-center font-semibold">
                      {w.isTargetSelesai ? (
                        <span className="text-emerald-700">✓ TERCAPAI</span>
                      ) : w.totalSekolah > 0 ? (
                        <span className="text-amber-700">Berjalan</span>
                      ) : (
                        <span className="text-slate-400">Belum Ada</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signature Block */}
          <div className="pt-8 flex justify-between text-xs text-slate-800">
            <div>
              <p>Mengetahui,</p>
              <p className="font-bold">Penanggung Jawab Wilayah</p>
              <div className="h-16"></div>
              <p className="font-semibold underline">( ............................................ )</p>
              <p className="text-slate-500 text-[10px]">Koordinator Panitia Daerah</p>
            </div>
            <div className="text-right">
              <p>Bogor, {todayStr}</p>
              <p className="font-bold">Koordinator Panitia Pusat PPDB SENSEI 2027</p>
              <div className="h-16"></div>
              <p className="font-semibold underline">Drs. H. Mulyadi, M.Pd.</p>
              <p className="text-slate-500 text-[10px]">NIP. 2027.SEI.001</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
