import React, { useState, useMemo } from 'react';
import { 
  Compass, 
  School, 
  MapPin, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Edit3, 
  Image as ImageIcon, 
  Calendar, 
  User, 
  Phone, 
  Users, 
  UserCheck, 
  ArrowLeft,
  X,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';
import { SosialisasiReport, DAFTAR_DAERAH_JABODETABEK, TARGET_JABODETABEK } from '../types';
import { JabodetabekProgressCard } from './JabodetabekProgressCard';

interface JabodetabekRoadshowViewProps {
  reports: SosialisasiReport[];
  onAddNewReport: () => void;
  onEditReport: (report: SosialisasiReport) => void;
  onDeleteReport: (id: string, sekolah: string) => void;
  onBatchDeleteReport: (ids: string[]) => void;
  isStandalonePage?: boolean;
  onBackToAdmin?: () => void;
}

export const JabodetabekRoadshowView: React.FC<JabodetabekRoadshowViewProps> = ({
  reports,
  onAddNewReport,
  onEditReport,
  onDeleteReport,
  onBatchDeleteReport,
  isStandalonePage = false,
  onBackToAdmin,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenjang, setFilterJenjang] = useState<'ALL' | 'SD' | 'SMP'>('ALL');
  const [filterDaerah, setFilterDaerah] = useState<string>('ALL');
  const [filterTeam, setFilterTeam] = useState<string>('ALL');
  const [filterHasPhoto, setFilterHasPhoto] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Extract distinct daerah for filter
  const existingDaerahList = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      const d = (r.daerahRoadshow || r.kabupatenKota || '').trim();
      if (d) set.add(d);
    });
    return Array.from(set).sort();
  }, [reports]);

  // Extract distinct tim/pic for filter
  const existingTeamList = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      const t = (r.picRoadshow || '').trim();
      if (t) set.add(t);
    });
    return Array.from(set).sort();
  }, [reports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesSearch =
        searchTerm === '' ||
        r.sekolah.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.picRoadshow && r.picRoadshow.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.daerahRoadshow && r.daerahRoadshow.toLowerCase().includes(searchTerm.toLowerCase())) ||
        r.pic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.kabupatenKota.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesJenjang = filterJenjang === 'ALL' || r.jenjang === filterJenjang;
      const rDaerah = (r.daerahRoadshow || r.kabupatenKota || '').trim().toLowerCase();
      const matchesDaerah = filterDaerah === 'ALL' || rDaerah === filterDaerah.toLowerCase();
      const rTeam = (r.picRoadshow || '').trim().toLowerCase();
      const matchesTeam = filterTeam === 'ALL' || rTeam === filterTeam.toLowerCase();
      const matchesPhoto =
        !filterHasPhoto ||
        (r.dokumentasiUrl && r.dokumentasiUrl.length > 0) ||
        (r.dokumentasiList && r.dokumentasiList.length > 0);

      return matchesSearch && matchesJenjang && matchesDaerah && matchesTeam && matchesPhoto;
    });
  }, [reports, searchTerm, filterJenjang, filterDaerah, filterTeam, filterHasPhoto]);

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredReports.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleTriggerBatchDelete = () => {
    if (selectedIds.length === 0) return;
    onBatchDeleteReport(selectedIds);
    setSelectedIds([]);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredReports.length === 0) return;
    const headers = [
      'ID',
      'Wilayah',
      'Daerah Roadshow',
      'PIC Roadshow Pusat',
      'Jenjang',
      'Nama Sekolah',
      'PIC Sekolah',
      'Kontak/WA',
      'Jumlah Audience',
      'Jumlah Pendaftar',
      'Tanggal Kunjungan',
      'Catatan',
    ];

    const rows = filteredReports.map((r) => [
      `"${r.id}"`,
      `"${r.wilayah}"`,
      `"${r.daerahRoadshow || r.kabupatenKota}"`,
      `"${r.picRoadshow || '-'}"`,
      `"${r.jenjang}"`,
      `"${r.sekolah}"`,
      `"${r.pic}"`,
      `"${r.kontak}"`,
      r.jumlahAudience,
      r.jumlahPendaftar,
      `"${r.tanggalKunjungan}"`,
      `"${(r.catatan || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan-roadshow-jabodetabek-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalFilteredAudience = filteredReports.reduce((s, r) => s + (Number(r.jumlahAudience) || 0), 0);
  const totalFilteredPendaftar = filteredReports.reduce((s, r) => s + (Number(r.jumlahPendaftar) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Photo Preview Modal */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col">
            <div className="p-3 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <span className="text-xs font-semibold">Foto Dokumentasi Roadshow Jabodetabek</span>
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center overflow-auto flex-1">
              <img
                src={previewPhotoUrl}
                alt="Dokumentasi Roadshow"
                className="max-h-[75vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Standalone Navigation Bar (if accessed as full page) */}
      {isStandalonePage && (
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <button
            onClick={onBackToAdmin}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Dashboard Admin Pusat</span>
          </button>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2.5 py-1 bg-teal-100 text-teal-800 border border-teal-300 rounded-lg">
              Mode Panitia Roadshow Jabodetabek Aktif
            </span>
          </div>
        </div>
      )}

      {/* Target Progress Card (Target: 19 Tim x 15 Sekolah = 285 Sekolah) */}
      <JabodetabekProgressCard
        reports={reports}
        onAddReportClick={onAddNewReport}
        onFilterTeam={(team) => setFilterTeam(team)}
      />

      {/* Table Section */}
      <div className="space-y-4">
        {/* Table Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <School className="w-5 h-5 text-teal-600" />
              <span>Daftar Kunjungan Roadshow Sekolah Jabodetabek</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-mono font-bold border border-sky-200">
                {reports.length} / 285 Sekolah
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Target per tim: <strong>maks. 15 sekolah</strong> • Total <strong>19 tim roadshow</strong> (Target kumulatif: <strong>285 sekolah</strong>).
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>

            <button
              onClick={onAddNewReport}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-teal-900/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Input Laporan</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama sekolah, PIC roadshow, daerah..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-teal-500 outline-none"
              />
            </div>

            {/* Filter Jenjang */}
            <div className="flex rounded-lg overflow-hidden border border-slate-300 text-xs">
              {(['ALL', 'SD', 'SMP'] as const).map((j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => setFilterJenjang(j)}
                  className={`px-2.5 py-1 font-bold transition-colors ${
                    filterJenjang === j
                      ? 'bg-teal-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {j === 'ALL' ? 'Semua Jenjang' : j}
                </button>
              ))}
            </div>

            {/* Filter Tim / PIC Roadshow */}
            <select
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none"
            >
              <option value="ALL">Semua Tim Roadshow</option>
              {existingTeamList.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* Filter Daerah Roadshow */}
            <select
              value={filterDaerah}
              onChange={(e) => setFilterDaerah(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none"
            >
              <option value="ALL">Semua Daerah Jabodetabek</option>
              {existingDaerahList.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Delete Action Button */}
          {selectedIds.length > 0 && (
            <button
              onClick={handleTriggerBatchDelete}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer animate-in fade-in"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus ({selectedIds.length}) Terpilih</span>
            </button>
          )}
        </div>

        {/* Table Grid */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <th className="py-3 px-2 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredReports.length > 0 && selectedIds.length === filteredReports.length
                      }
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-2 w-10 text-center">No</th>
                  <th className="py-3 px-3 w-24">Tanggal</th>
                  <th className="py-3 px-4 min-w-[200px]">Nama Sekolah</th>
                  <th className="py-3 px-2 w-16 text-center">Jenjang</th>
                  <th className="py-3 px-3 min-w-[130px]">Daerah Roadshow</th>
                  <th className="py-3 px-3 min-w-[130px]">PIC Roadshow Pusat</th>
                  <th className="py-3 px-3 min-w-[140px]">PIC Sekolah & Kontak</th>
                  <th className="py-3 px-2 w-20 text-right">Audience</th>
                  <th className="py-3 px-2 w-20 text-right">Daftar</th>
                  <th className="py-3 px-2 w-16 text-center">Foto</th>
                  <th className="py-3 px-3 min-w-[140px]">Catatan</th>
                  <th className="py-3 px-3 w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Compass className="w-8 h-8 text-slate-300" />
                        <p className="text-sm font-semibold text-slate-600">
                          Belum ada laporan roadshow Jabodetabek yang cocok.
                        </p>
                        <p className="text-xs text-slate-400">
                          Klik tombol "+ Input Laporan" di atas untuk menambahkan laporan roadshow sekolah pertama.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report, idx) => (
                    <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Checkbox */}
                      <td className="py-3 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(report.id)}
                          onChange={() => handleToggleRow(report.id)}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                      </td>

                      {/* No */}
                      <td className="py-3 px-2 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Tanggal */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600 text-[11px]">
                        {report.tanggalKunjungan}
                      </td>

                      {/* Sekolah */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center space-x-1.5">
                          <School className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>{report.sekolah}</span>
                        </div>
                      </td>

                      {/* Jenjang */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            report.jenjang === 'SD'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-teal-100 text-teal-800 border border-teal-300'
                          }`}
                        >
                          {report.jenjang}
                        </span>
                      </td>

                      {/* Daerah Roadshow */}
                      <td className="py-3 px-3 font-medium text-slate-800 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          <span>{report.daerahRoadshow || report.kabupatenKota}</span>
                        </div>
                      </td>

                      {/* PIC Roadshow Pusat */}
                      <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <Compass className="w-3 h-3 text-teal-600 shrink-0" />
                          <span>{report.picRoadshow || 'Tim Pusat'}</span>
                        </div>
                      </td>

                      {/* PIC Sekolah & Kontak */}
                      <td className="py-3 px-3">
                        <div className="text-slate-800 font-medium">{report.pic}</div>
                        <div className="text-[11px] font-mono text-slate-500">{report.kontak}</div>
                      </td>

                      {/* Audience */}
                      <td className="py-3 px-2 text-right font-mono text-slate-700">
                        {report.jumlahAudience.toLocaleString('id-ID')}
                      </td>

                      {/* Pendaftar */}
                      <td className="py-3 px-2 text-right font-mono font-bold text-amber-700">
                        {report.jumlahPendaftar.toLocaleString('id-ID')}
                      </td>

                      {/* Foto */}
                      <td className="py-3 px-2 text-center">
                        {report.dokumentasiList && report.dokumentasiList.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setPreviewPhotoUrl(report.dokumentasiList![0])}
                            className="p-1 rounded bg-teal-50 text-teal-700 hover:bg-teal-100 cursor-pointer inline-flex items-center space-x-1 border border-teal-300"
                            title="Lihat foto kegiatan"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">{report.dokumentasiList.length}</span>
                          </button>
                        ) : report.dokumentasiUrl ? (
                          <button
                            type="button"
                            onClick={() => setPreviewPhotoUrl(report.dokumentasiUrl!)}
                            className="p-1 rounded bg-teal-50 text-teal-700 hover:bg-teal-100 cursor-pointer border border-teal-300"
                            title="Lihat foto kegiatan"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-slate-300 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Catatan */}
                      <td className="py-3 px-3 text-slate-600 text-[11px] max-w-[180px] truncate" title={report.catatan}>
                        {report.catatan || '-'}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => onEditReport(report)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit Laporan"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteReport(report.id, report.sekolah)}
                            className="px-2 py-1 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors flex items-center space-x-1 cursor-pointer"
                            title="Hapus Laporan Ini"
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Summary Footer */}
          {filteredReports.length > 0 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
              <div>
                Menampilkan <strong>{filteredReports.length}</strong> sekolah roadshow
                {filteredReports.length !== reports.length && (
                  <span> (difilter dari total {reports.length} sekolah)</span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <span>
                  Total Audience: <strong>{totalFilteredAudience.toLocaleString('id-ID')} Siswa</strong>
                </span>
                <span>•</span>
                <span>
                  Total Pendaftar: <strong className="text-amber-800 font-extrabold">{totalFilteredPendaftar.toLocaleString('id-ID')} Siswa</strong>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
