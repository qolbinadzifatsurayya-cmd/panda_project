import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Phone, 
  Calendar, 
  Users, 
  UserCheck, 
  School, 
  MapPin, 
  ArrowUpDown, 
  Download,
  Plus,
  Camera,
  Eye,
  CheckSquare,
  Square
} from 'lucide-react';
import { SosialisasiReport } from '../types';
import { ImagePreviewModal } from './ImagePreviewModal';

interface ReportTableProps {
  reports: SosialisasiReport[];
  onEdit: (report: SosialisasiReport) => void;
  onDelete: (id: string, sekolah: string) => void;
  onBatchDelete?: (ids: string[]) => void;
  onAddNew?: () => void;
  showWilayahColumn?: boolean;
  isAdminView?: boolean;
}

export const ReportTable: React.FC<ReportTableProps> = ({
  reports,
  onEdit,
  onDelete,
  onBatchDelete,
  onAddNew,
  showWilayahColumn = false,
  isAdminView = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJenjang, setFilterJenjang] = useState<'ALL' | 'SD' | 'SMP'>('ALL');
  const [filterKabupaten, setFilterKabupaten] = useState<string>('ALL');
  const [filterHasPhoto, setFilterHasPhoto] = useState<boolean>(false);
  const [sortField, setSortField] = useState<'tanggal' | 'sekolah' | 'audience' | 'pendaftar'>('tanggal');
  const [sortAsc, setSortAsc] = useState(false);

  // Selected IDs for batch delete in admin view
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Image preview modal state
  const [previewReport, setPreviewReport] = useState<SosialisasiReport | null>(null);

  // Extract unique kabupaten list for filtering
  const kabupatenList = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      if (r.kabupatenKota) set.add(r.kabupatenKota);
    });
    return Array.from(set).sort();
  }, [reports]);

  // Filtered & sorted reports
  const filteredReports = useMemo(() => {
    return reports
      .filter((item) => {
        const matchesSearch =
          item.sekolah.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.pic.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.kontak.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.kabupatenKota.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (showWilayahColumn && item.wilayah.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesJenjang =
          filterJenjang === 'ALL' ? true : item.jenjang === filterJenjang;

        const matchesKabupaten =
          filterKabupaten === 'ALL' ? true : item.kabupatenKota === filterKabupaten;

        const hasPhoto = Boolean(
          (item.dokumentasiList && item.dokumentasiList.length > 0) || item.dokumentasiUrl
        );
        const matchesPhoto = filterHasPhoto ? hasPhoto : true;

        return matchesSearch && matchesJenjang && matchesKabupaten && matchesPhoto;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'tanggal') {
          cmp = new Date(a.tanggalKunjungan).getTime() - new Date(b.tanggalKunjungan).getTime();
        } else if (sortField === 'sekolah') {
          cmp = a.sekolah.localeCompare(b.sekolah);
        } else if (sortField === 'audience') {
          cmp = a.jumlahAudience - b.jumlahAudience;
        } else if (sortField === 'pendaftar') {
          cmp = a.jumlahPendaftar - b.jumlahPendaftar;
        }
        return sortAsc ? cmp : -cmp;
      });
  }, [reports, searchQuery, filterJenjang, filterKabupaten, filterHasPhoto, sortField, sortAsc, showWilayahColumn]);

  // Calculate totals
  const totalAudience = filteredReports.reduce((sum, r) => sum + r.jumlahAudience, 0);
  const totalPendaftar = filteredReports.reduce((sum, r) => sum + r.jumlahPendaftar, 0);
  const totalSD = filteredReports.filter((r) => r.jenjang === 'SD').length;
  const totalSMP = filteredReports.filter((r) => r.jenjang === 'SMP').length;

  const toggleSort = (field: 'tanggal' | 'sekolah' | 'audience' | 'pendaftar') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredReports.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredReports.map((r) => r.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    const headers = [
      'No',
      'Wilayah',
      'Kabupaten/Kota',
      'Jenjang',
      'Sekolah',
      'PIC',
      'Kontak',
      'Jumlah Audience Sosialisasi',
      'Jumlah Siswa yang Daftar',
      'Tanggal Kunjungan',
      'Catatan',
      'Dokumentasi Terlampir',
    ];

    const rows = filteredReports.map((r, i) => [
      i + 1,
      `"${r.wilayah}"`,
      `"${r.kabupatenKota}"`,
      `"${r.jenjang}"`,
      `"${r.sekolah.replace(/"/g, '""')}"`,
      `"${r.pic.replace(/"/g, '""')}"`,
      `"${r.kontak}"`,
      r.jumlahAudience,
      r.jumlahPendaftar,
      `"${r.tanggalKunjungan}"`,
      `"${(r.catatan || '').replace(/"/g, '""')}"`,
      (r.dokumentasiList && r.dokumentasiList.length > 0) || r.dokumentasiUrl ? 'Ada' : 'Tidak',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan_sosialisasi_sensei2027_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      
      {/* Table Action Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama sekolah, PIC, kontak, kab/kota..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Jenjang Filter */}
          <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setFilterJenjang('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterJenjang === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({reports.length})
            </button>
            <button
              onClick={() => setFilterJenjang('SD')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterJenjang === 'SD'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              SD ({reports.filter((r) => r.jenjang === 'SD').length})
            </button>
            <button
              onClick={() => setFilterJenjang('SMP')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterJenjang === 'SMP'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-600 hover:text-teal-700'
              }`}
            >
              SMP ({reports.filter((r) => r.jenjang === 'SMP').length})
            </button>
          </div>

          {/* Photo Filter Toggle */}
          <button
            onClick={() => setFilterHasPhoto(!filterHasPhoto)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              filterHasPhoto
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ada Foto</span>
          </button>

          {/* Kabupaten Filter */}
          {kabupatenList.length > 0 && (
            <select
              value={filterKabupaten}
              onChange={(e) => setFilterKabupaten(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">Semua Kab/Kota ({kabupatenList.length})</option>
              {kabupatenList.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          )}

          {/* Batch Delete Action (Available for Admin Pusat) */}
          {isAdminView && selectedIds.length > 0 && onBatchDelete && (
            <button
              onClick={() => onBatchDelete(selectedIds)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-colors animate-in fade-in"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus {selectedIds.length} Laporan Terpilih</span>
            </button>
          )}

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            title="Download CSV / Excel"
            className="p-2 sm:px-3 sm:py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Add New Button */}
          {onAddNew && (
            <button
              onClick={onAddNew}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/80 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              {isAdminView && (
                <th className="py-3 px-3 w-10 text-center">
                  <button
                    onClick={toggleSelectAll}
                    title="Pilih semua laporan"
                    className="text-slate-500 hover:text-slate-800"
                  >
                    {selectedIds.length > 0 && selectedIds.length === filteredReports.length ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
              )}
              <th className="py-3 px-3 w-12 text-center">No</th>
              {showWilayahColumn && <th className="py-3 px-3">Wilayah</th>}
              <th className="py-3 px-3">Kab/Kota</th>
              <th className="py-3 px-2 text-center">Jenjang</th>
              <th 
                onClick={() => toggleSort('sekolah')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Sekolah</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">Dokumentasi</th>
              <th className="py-3 px-3">PIC</th>
              <th className="py-3 px-3">Kontak</th>
              <th 
                onClick={() => toggleSort('audience')}
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/60 transition-colors"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Audience</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th 
                onClick={() => toggleSort('pendaftar')}
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/60 transition-colors"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Siswa Daftar</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th 
                onClick={() => toggleSort('tanggal')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Tanggal</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-center w-28">
                {isAdminView ? 'Aksi Admin' : 'Aksi'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-800">
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={showWilayahColumn ? 12 : 11} className="py-12 text-center text-slate-400">
                  <School className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600">Tidak ada data laporan yang cocok</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {searchQuery ? 'Coba ubah kata kunci pencarian Anda.' : 'Belum ada laporan sosialisasi yang diinput.'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredReports.map((report, index) => {
                // Phone sanitization for WhatsApp link
                const cleanPhone = report.kontak.replace(/[^0-9]/g, '');
                const waPhone = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;

                const photos = (report.dokumentasiList && report.dokumentasiList.length > 0)
                  ? report.dokumentasiList
                  : report.dokumentasiUrl
                  ? [report.dokumentasiUrl]
                  : [];

                const isSelected = selectedIds.includes(report.id);

                return (
                  <tr
                    key={report.id}
                    className={`transition-colors group ${
                      isSelected ? 'bg-red-50/50' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Checkbox for Admin batch actions */}
                    {isAdminView && (
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(report.id)}
                          className="rounded text-red-600 focus:ring-red-500 cursor-pointer"
                        />
                      </td>
                    )}

                    {/* No */}
                    <td className="py-3.5 px-3 text-center font-mono text-slate-500 font-medium">
                      {index + 1}
                    </td>

                    {/* Wilayah (if in Admin Pusat view) */}
                    {showWilayahColumn && (
                      <td className="py-3.5 px-3 font-semibold text-emerald-800 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                          {report.wilayah}
                        </span>
                      </td>
                    )}

                    {/* Kabupaten / Kota */}
                    <td className="py-3.5 px-3 font-medium text-slate-700 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{report.kabupatenKota}</span>
                      </div>
                    </td>

                    {/* Jenjang (SD / SMP) */}
                    <td className="py-3.5 px-2 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                          report.jenjang === 'SD'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-teal-100 text-teal-800 border border-teal-300'
                        }`}
                      >
                        {report.jenjang}
                      </span>
                    </td>

                    {/* Sekolah */}
                    <td className="py-3.5 px-3 font-bold text-slate-900 max-w-[200px] truncate" title={report.sekolah}>
                      <div>{report.sekolah}</div>
                      {report.catatan && (
                        <div className="text-[11px] font-normal text-slate-500 truncate" title={report.catatan}>
                          Catatan: {report.catatan}
                        </div>
                      )}
                    </td>

                    {/* Dokumentasi Thumbnail Column */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {photos.length > 0 ? (
                        <button
                          onClick={() => setPreviewReport(report)}
                          className="inline-flex items-center space-x-1.5 p-1 bg-slate-100 hover:bg-emerald-100 rounded-lg border border-slate-300 hover:border-emerald-400 transition-all group/btn"
                          title="Lihat foto dokumentasi kegiatan"
                        >
                          <div className="w-7 h-7 rounded overflow-hidden bg-slate-200 flex-shrink-0">
                            <img
                              src={photos[0]}
                              alt="Dokumentasi"
                              className="w-full h-full object-cover group-hover/btn:scale-110 transition-transform"
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-700 group-hover/btn:text-emerald-800 px-1">
                            {photos.length} Foto
                          </span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          -
                        </span>
                      )}
                    </td>

                    {/* PIC */}
                    <td className="py-3.5 px-3 text-slate-700 max-w-[150px] truncate" title={report.pic}>
                      {report.pic}
                    </td>

                    {/* Kontak */}
                    <td className="py-3.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      <a
                        href={`https://wa.me/${waPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-emerald-600 hover:text-emerald-700 hover:underline"
                        title="Chat WhatsApp"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{report.kontak}</span>
                      </a>
                    </td>

                    {/* Jumlah Audience */}
                    <td className="py-3.5 px-3 text-right whitespace-nowrap font-medium text-slate-800">
                      <span className="inline-flex items-center space-x-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Users className="w-3 h-3 text-slate-500" />
                        <span className="font-bold">{report.jumlahAudience.toLocaleString('id-ID')}</span>
                      </span>
                    </td>

                    {/* Jumlah Siswa Daftar */}
                    <td className="py-3.5 px-3 text-right whitespace-nowrap font-medium text-amber-900">
                      <span className="inline-flex items-center space-x-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                        <UserCheck className="w-3 h-3 text-amber-600" />
                        <span className="font-extrabold text-amber-700">{report.jumlahPendaftar.toLocaleString('id-ID')}</span>
                      </span>
                    </td>

                    {/* Tanggal */}
                    <td className="py-3.5 px-3 text-slate-500 text-xs whitespace-nowrap">
                      {report.tanggalKunjungan}
                    </td>

                    {/* Aksi (Edit, Hapus) */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => onEdit(report)}
                          title="Edit Laporan"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        
                        {/* Hapus Laporan: Highlighted for Admin Pusat and Region */}
                        <button
                          onClick={() => onDelete(report.id, report.sekolah)}
                          title={isAdminView ? "Hapus Laporan Ini (Admin Pusat)" : "Hapus Laporan"}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isAdminView
                              ? 'text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600'
                              : 'text-slate-500 hover:text-red-700 hover:bg-red-50'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Footer with Summaries */}
          {filteredReports.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100 text-xs font-bold text-slate-900 border-t-2 border-slate-300">
                <td colSpan={showWilayahColumn ? (isAdminView ? 8 : 7) : (isAdminView ? 7 : 6)} className="py-3.5 px-4 text-right uppercase tracking-wider">
                  Total Rekapitulasi ({filteredReports.length} Sekolah • {totalSD} SD • {totalSMP} SMP):
                </td>
                <td className="py-3.5 px-3 text-right font-extrabold text-slate-950">
                  <span className="bg-white border border-slate-300 px-2.5 py-1 rounded-lg">
                    {totalAudience.toLocaleString('id-ID')} Orang
                  </span>
                </td>
                <td className="py-3.5 px-3 text-right font-extrabold text-amber-800">
                  <span className="bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg">
                    {totalPendaftar.toLocaleString('id-ID')} Siswa
                  </span>
                </td>
                <td colSpan={2} className="py-3.5 px-3 text-slate-500 font-normal text-right">
                  Konversi: {totalAudience > 0 ? ((totalPendaftar / totalAudience) * 100).toFixed(1) : 0}%
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Image Preview Lightbox */}
      <ImagePreviewModal
        isOpen={Boolean(previewReport)}
        onClose={() => setPreviewReport(null)}
        report={previewReport}
      />
    </div>
  );
};
