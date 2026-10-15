import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  School, 
  User, 
  Phone, 
  Users, 
  UserCheck, 
  Calendar, 
  MapPin, 
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  Loader2,
  Database,
  Plus,
  Table as TableIcon,
  LayoutList,
  Copy,
  ChevronDown
} from 'lucide-react';
import { JenjangSekolah, SosialisasiReport, WilayahName, DAFTAR_WILAYAH } from '../types';
import { api } from '../services/api';

interface MultiSchoolRow {
  id: string;
  kabupatenKota: string;
  jenjang: JenjangSekolah;
  sekolah: string;
  pic: string;
  kontak: string;
  jumlahAudience: number | '';
  jumlahPendaftar: number | '';
  tanggalKunjungan: string;
  catatan?: string;
  dokumentasiList: string[];
}

interface ReportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data:
      | Omit<SosialisasiReport, 'id' | 'createdAt' | 'updatedAt'>
      | Omit<SosialisasiReport, 'id' | 'createdAt' | 'updatedAt'>[]
  ) => Promise<void>;
  initialData?: SosialisasiReport | null;
  defaultWilayah?: WilayahName;
  existingKabupatenList?: string[];
}

// Client-side helper to compress image to keep cloud database fast & light
const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressedDataUrl);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const ReportFormModal: React.FC<ReportFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  defaultWilayah,
  existingKabupatenList = [],
}) => {
  // Mode: 'table' (multi-sekolah sekaligus) vs 'single' (satu per satu)
  const [inputMode, setInputMode] = useState<'table' | 'single'>(initialData ? 'single' : 'table');

  // Common Header State
  const [wilayah, setWilayah] = useState<string>(defaultWilayah || DAFTAR_WILAYAH[0]);
  const [defaultKabupaten, setDefaultKabupaten] = useState<string>('');
  const [defaultTanggal, setDefaultTanggal] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Single form mode state
  const [singleKabupaten, setSingleKabupaten] = useState('');
  const [singleJenjang, setSingleJenjang] = useState<JenjangSekolah>('SD');
  const [singleSekolah, setSingleSekolah] = useState('');
  const [singlePic, setSinglePic] = useState('');
  const [singleKontak, setSingleKontak] = useState('');
  const [singleAudience, setSingleAudience] = useState<number | ''>('');
  const [singlePendaftar, setSinglePendaftar] = useState<number | ''>('');
  const [singleTanggal, setSingleTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [singleCatatan, setSingleCatatan] = useState('');
  const [singleDokumentasiList, setSingleDokumentasiList] = useState<string[]>([]);

  // Multi-school table rows
  const [tableRows, setTableRows] = useState<MultiSchoolRow[]>([]);

  // Row image upload active tracker
  const [activeUploadRowId, setActiveUploadRowId] = useState<string | null>(null);
  const rowFileInputRef = useRef<HTMLInputElement>(null);
  const singleFileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Initializing state
  useEffect(() => {
    if (initialData) {
      setInputMode('single');
      setWilayah(initialData.wilayah);
      setSingleKabupaten(initialData.kabupatenKota);
      setSingleJenjang(initialData.jenjang);
      setSingleSekolah(initialData.sekolah);
      setSinglePic(initialData.pic);
      setSingleKontak(initialData.kontak);
      setSingleAudience(initialData.jumlahAudience);
      setSinglePendaftar(initialData.jumlahPendaftar);
      setSingleTanggal(initialData.tanggalKunjungan);
      setSingleCatatan(initialData.catatan || '');
      setSingleDokumentasiList(
        initialData.dokumentasiList && initialData.dokumentasiList.length > 0
          ? initialData.dokumentasiList
          : initialData.dokumentasiUrl
          ? [initialData.dokumentasiUrl]
          : []
      );
    } else {
      setInputMode('table');
      if (defaultWilayah) setWilayah(defaultWilayah);
      const initKab = existingKabupatenList.length > 0 ? existingKabupatenList[0] : '';
      setDefaultKabupaten(initKab);
      setSingleKabupaten(initKab);
      setDefaultTanggal(new Date().toISOString().split('T')[0]);
      
      // Initialize with 3 empty rows for quick batch input
      setTableRows([
        createEmptyRow(initKab, 'SD'),
        createEmptyRow(initKab, 'SD'),
        createEmptyRow(initKab, 'SMP'),
      ]);

      setSingleJenjang('SD');
      setSingleSekolah('');
      setSinglePic('');
      setSingleKontak('');
      setSingleAudience('');
      setSinglePendaftar('');
      setSingleTanggal(new Date().toISOString().split('T')[0]);
      setSingleCatatan('');
      setSingleDokumentasiList([]);
    }
    setErrorMsg('');
  }, [initialData, defaultWilayah, isOpen]);

  function createEmptyRow(kab: string, jenjang: JenjangSekolah = 'SD'): MultiSchoolRow {
    return {
      id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      kabupatenKota: kab,
      jenjang,
      sekolah: '',
      pic: '',
      kontak: '',
      jumlahAudience: '',
      jumlahPendaftar: '',
      tanggalKunjungan: defaultTanggal,
      catatan: '',
      dokumentasiList: [],
    };
  }

  if (!isOpen) return null;

  // Add 1 or multiple rows
  const handleAddRow = (count = 1) => {
    const newRows: MultiSchoolRow[] = [];
    for (let i = 0; i < count; i++) {
      newRows.push(createEmptyRow(defaultKabupaten, i % 2 === 0 ? 'SD' : 'SMP'));
    }
    setTableRows((prev) => [...prev, ...newRows]);
  };

  const handleDuplicateRow = (idx: number) => {
    const target = tableRows[idx];
    const cloned: MultiSchoolRow = {
      ...target,
      id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sekolah: '', // reset school name for new entry
    };
    setTableRows((prev) => {
      const copy = [...prev];
      copy.splice(idx + 1, 0, cloned);
      return copy;
    });
  };

  const handleRemoveRow = (id: string) => {
    if (tableRows.length <= 1) {
      setErrorMsg('Minimal harus ada 1 baris sekolah');
      return;
    }
    setTableRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRow = (id: string, field: keyof MultiSchoolRow, value: any) => {
    setTableRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // Apply default Kabupaten/Kota to all rows
  const handleApplyKabupatenToAll = () => {
    if (!defaultKabupaten.trim()) return;
    setTableRows((prev) =>
      prev.map((r) => ({ ...r, kabupatenKota: defaultKabupaten.trim() }))
    );
  };

  // Handle single photo upload
  const handleSinglePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploadingPhoto(true);
      setErrorMsg('');
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const compressed = await compressImageFile(file);
        try {
          const serverUrl = await api.uploadDocumentation(compressed, file.name);
          newUrls.push(serverUrl);
        } catch {
          newUrls.push(compressed);
        }
      }
      setSingleDokumentasiList((prev) => [...prev, ...newUrls]);
    } catch (err: any) {
      setErrorMsg('Gagal mengunggah foto: ' + (err.message || 'Error'));
    } finally {
      setIsUploadingPhoto(false);
      if (singleFileInputRef.current) singleFileInputRef.current.value = '';
    }
  };

  // Handle row photo upload
  const handleRowPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeUploadRowId) return;

    try {
      setIsUploadingPhoto(true);
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const compressed = await compressImageFile(file);
        try {
          const serverUrl = await api.uploadDocumentation(compressed, file.name);
          newUrls.push(serverUrl);
        } catch {
          newUrls.push(compressed);
        }
      }

      setTableRows((prev) =>
        prev.map((r) =>
          r.id === activeUploadRowId
            ? { ...r, dokumentasiList: [...r.dokumentasiList, ...newUrls] }
            : r
        )
      );
    } catch (err: any) {
      setErrorMsg('Gagal mengunggah foto baris: ' + (err.message || 'Error'));
    } finally {
      setIsUploadingPhoto(false);
      setActiveUploadRowId(null);
      if (rowFileInputRef.current) rowFileInputRef.current.value = '';
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (inputMode === 'single') {
      // Single Mode Validation
      if (!singleSekolah.trim()) {
        setErrorMsg('Nama sekolah wajib diisi');
        return;
      }
      if (!singleKabupaten.trim()) {
        setErrorMsg('Kabupaten/Kota kunjungan wajib diisi');
        return;
      }
      if (!singlePic.trim()) {
        setErrorMsg('PIC sekolah/panitia wajib diisi');
        return;
      }
      if (!singleKontak.trim()) {
        setErrorMsg('Nomor kontak wajib diisi');
        return;
      }

      try {
        setIsSubmitting(true);
        await onSubmit({
          wilayah,
          kabupatenKota: singleKabupaten.trim(),
          jenjang: singleJenjang,
          sekolah: singleSekolah.trim(),
          pic: singlePic.trim(),
          kontak: singleKontak.trim(),
          jumlahAudience: Number(singleAudience) || 0,
          jumlahPendaftar: Number(singlePendaftar) || 0,
          tanggalKunjungan: singleTanggal,
          catatan: singleCatatan.trim(),
          dokumentasiUrl: singleDokumentasiList.length > 0 ? singleDokumentasiList[0] : undefined,
          dokumentasiList: singleDokumentasiList,
        });
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal menyimpan laporan');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Table Mode Validation
      const validRows = tableRows.filter((r) => r.sekolah.trim().length > 0);

      if (validRows.length === 0) {
        setErrorMsg('Mohon isi minimal 1 baris Nama Sekolah yang valid pada tabel.');
        return;
      }

      // Check if any valid row misses kabupaten
      const missingKab = validRows.find((r) => !r.kabupatenKota.trim());
      if (missingKab) {
        setErrorMsg(`Kabupaten/Kota belum diisi untuk sekolah "${missingKab.sekolah}".`);
        return;
      }

      const payloadList = validRows.map((r) => ({
        wilayah,
        kabupatenKota: r.kabupatenKota.trim() || defaultKabupaten.trim(),
        jenjang: r.jenjang,
        sekolah: r.sekolah.trim(),
        pic: r.pic.trim() || '-',
        kontak: r.kontak.trim() || '-',
        jumlahAudience: Number(r.jumlahAudience) || 0,
        jumlahPendaftar: Number(r.jumlahPendaftar) || 0,
        tanggalKunjungan: r.tanggalKunjungan || defaultTanggal,
        catatan: r.catatan ? r.catatan.trim() : '',
        dokumentasiUrl: r.dokumentasiList.length > 0 ? r.dokumentasiList[0] : undefined,
        dokumentasiList: r.dokumentasiList,
      }));

      try {
        setIsSubmitting(true);
        await onSubmit(payloadList);
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal menyimpan daftar laporan');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Table summary counts
  const filledRowsCount = tableRows.filter((r) => r.sekolah.trim().length > 0).length;
  const tableTotalAudience = tableRows.reduce(
    (sum, r) => sum + (Number(r.jumlahAudience) || 0),
    0
  );
  const tableTotalPendaftar = tableRows.reduce(
    (sum, r) => sum + (Number(r.jumlahPendaftar) || 0),
    0
  );
  const tableTotalSD = tableRows.filter((r) => r.sekolah.trim() && r.jenjang === 'SD').length;
  const tableTotalSMP = tableRows.filter((r) => r.sekolah.trim() && r.jenjang === 'SMP').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 md:p-6 flex items-start sm:items-center justify-center animate-in fade-in duration-200">
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-h-[94vh] flex flex-col overflow-hidden my-auto transition-all ${
          inputMode === 'table' ? 'max-w-6xl' : 'max-w-2xl'
        }`}
      >
        {/* Sticky Fixed Header - Always visible at top */}
        <div className="px-5 sm:px-6 py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 shadow-sm border-b border-slate-800 z-10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
              {inputMode === 'table' ? <TableIcon className="w-5 h-5" /> : <School className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  {initialData
                    ? 'Edit Laporan Kunjungan Sosialisasi'
                    : inputMode === 'table'
                    ? 'Input Laporan Multi-Sekolah (Tabel Cepat)'
                    : 'Input Laporan Sekolah (Formulir Satuan)'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {wilayah}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {inputMode === 'table'
                  ? 'Input beberapa kunjungan sekolah sekaligus dalam satu tabel praktis'
                  : 'Sistem PPDB SENSEI 2027 • SMART Ekselensia Indonesia'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            {/* Mode Toggle Button (Only when not editing an existing single report) */}
            {!initialData && (
              <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setInputMode('table')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all ${
                    inputMode === 'table'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Tabel Multi-Sekolah</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('single')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all ${
                    inputMode === 'single'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span>Formulir Satuan</span>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hidden inputs for image uploads */}
        <input
          type="file"
          ref={singleFileInputRef}
          onChange={handleSinglePhotoChange}
          accept="image/*"
          multiple
          className="hidden"
        />
        <input
          type="file"
          ref={rowFileInputRef}
          onChange={handleRowPhotoChange}
          accept="image/*"
          multiple
          className="hidden"
        />

        {/* Form Body with scrollable content & sticky footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          
          {/* Scrollable Container */}
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 overscroll-contain">
            
            {errorMsg && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            {/* TABEL MULTI-SEKOLAH MODE */}
            {inputMode === 'table' ? (
              <div className="space-y-4">
                
                {/* Global Defaults Bar */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Wilayah Panitia Daerah
                    </label>
                    <select
                      value={wilayah}
                      onChange={(e) => setWilayah(e.target.value)}
                      disabled={Boolean(defaultWilayah)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none disabled:bg-slate-100"
                    >
                      {DAFTAR_WILAYAH.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Kabupaten / Kota Utama
                      </label>
                      <button
                        type="button"
                        onClick={handleApplyKabupatenToAll}
                        className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold underline"
                      >
                        Terapkan ke Semua Baris
                      </button>
                    </div>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={defaultKabupaten}
                        onChange={(e) => {
                          setDefaultKabupaten(e.target.value);
                        }}
                        placeholder="Contoh: Kab. Bogor / Kota Bandung"
                        list="kabupaten-list-multi"
                        className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                      />
                      <datalist id="kabupaten-list-multi">
                        {existingKabupatenList.map((k) => (
                          <option key={k} value={k} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tanggal Kunjungan Default
                    </label>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="date"
                        value={defaultTanggal}
                        onChange={(e) => {
                          setDefaultTanggal(e.target.value);
                          setTableRows((prev) =>
                            prev.map((r) => ({ ...r, tanggalKunjungan: e.target.value }))
                          );
                        }}
                        className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Spreadsheet Table Grid */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                          <th className="py-2.5 px-2 w-10 text-center">No</th>
                          <th className="py-2.5 px-2 w-28">Jenjang</th>
                          <th className="py-2.5 px-3 min-w-[200px]">Nama Sekolah *</th>
                          <th className="py-2.5 px-3 min-w-[140px]">Kab/Kota</th>
                          <th className="py-2.5 px-2 min-w-[120px]">PIC Sekolah</th>
                          <th className="py-2.5 px-2 min-w-[110px]">Kontak / WA</th>
                          <th className="py-2.5 px-2 w-24 text-right">Audience</th>
                          <th className="py-2.5 px-2 w-24 text-right">Daftar</th>
                          <th className="py-2.5 px-2 w-24 text-center">Foto Dok.</th>
                          <th className="py-2.5 px-2 min-w-[130px]">Catatan</th>
                          <th className="py-2.5 px-2 w-16 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {tableRows.map((row, index) => (
                          <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* No */}
                            <td className="py-2 px-2 text-center font-mono text-slate-400 font-medium">
                              {index + 1}
                            </td>

                            {/* Jenjang */}
                            <td className="py-2 px-2">
                              <div className="flex rounded-lg overflow-hidden border border-slate-300">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateRow(row.id, 'jenjang', 'SD')}
                                  className={`flex-1 py-1 text-[11px] font-extrabold transition-colors ${
                                    row.jenjang === 'SD'
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-white text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  SD
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateRow(row.id, 'jenjang', 'SMP')}
                                  className={`flex-1 py-1 text-[11px] font-extrabold transition-colors ${
                                    row.jenjang === 'SMP'
                                      ? 'bg-teal-600 text-white'
                                      : 'bg-white text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  SMP
                                </button>
                              </div>
                            </td>

                            {/* Nama Sekolah */}
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={row.sekolah}
                                onChange={(e) => handleUpdateRow(row.id, 'sekolah', e.target.value)}
                                placeholder="Contoh: SDIT Al-Ihsan / SMPN 1"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                              />
                            </td>

                            {/* Kab/Kota */}
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={row.kabupatenKota}
                                onChange={(e) => handleUpdateRow(row.id, 'kabupatenKota', e.target.value)}
                                placeholder="Kabupaten/Kota"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                              />
                            </td>

                            {/* PIC */}
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={row.pic}
                                onChange={(e) => handleUpdateRow(row.id, 'pic', e.target.value)}
                                placeholder="PIC / Guru"
                                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                              />
                            </td>

                            {/* Kontak */}
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={row.kontak}
                                onChange={(e) => handleUpdateRow(row.id, 'kontak', e.target.value)}
                                placeholder="08..."
                                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                              />
                            </td>

                            {/* Audience */}
                            <td className="py-2 px-2 text-right">
                              <input
                                type="number"
                                min="0"
                                value={row.jumlahAudience}
                                onChange={(e) =>
                                  handleUpdateRow(
                                    row.id,
                                    'jumlahAudience',
                                    e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0)
                                  )
                                }
                                placeholder="0"
                                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-right font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                              />
                            </td>

                            {/* Siswa Daftar */}
                            <td className="py-2 px-2 text-right">
                              <input
                                type="number"
                                min="0"
                                value={row.jumlahPendaftar}
                                onChange={(e) =>
                                  handleUpdateRow(
                                    row.id,
                                    'jumlahPendaftar',
                                    e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0)
                                  )
                                }
                                placeholder="0"
                                className="w-full px-2 py-1.5 bg-amber-50/50 border border-amber-300 rounded-lg text-xs text-right font-bold text-amber-800 focus:ring-2 focus:ring-amber-500/20 outline-none"
                              />
                            </td>

                            {/* Foto Dokumentasi */}
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveUploadRowId(row.id);
                                  rowFileInputRef.current?.click();
                                }}
                                className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center justify-center space-x-1 mx-auto transition-colors border ${
                                  row.dokumentasiList.length > 0
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                                }`}
                                title="Unggah foto kegiatan untuk sekolah ini"
                              >
                                <Camera className="w-3 h-3 text-emerald-600" />
                                <span>{row.dokumentasiList.length > 0 ? `${row.dokumentasiList.length} Foto` : '+ Foto'}</span>
                              </button>
                            </td>

                            {/* Catatan */}
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={row.catatan || ''}
                                onChange={(e) => handleUpdateRow(row.id, 'catatan', e.target.value)}
                                placeholder="Ket / hasil..."
                                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 outline-none focus:border-slate-400"
                              />
                            </td>

                            {/* Aksi Baris */}
                            <td className="py-2 px-2 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateRow(index)}
                                  title="Salin data baris ini"
                                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRow(row.id)}
                                  title="Hapus baris ini"
                                  className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Rows Button Row */}
                  <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleAddRow(1)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                        <span>+ Tambah 1 Baris Sekolah</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddRow(3)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors"
                      >
                        <Plus className="w-3 h-3 text-slate-400" />
                        <span>+ 3 Baris</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddRow(5)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors"
                      >
                        <Plus className="w-3 h-3 text-slate-400" />
                        <span>+ 5 Baris</span>
                      </button>
                    </div>

                    {/* Table live summary pill */}
                    <div className="flex items-center space-x-3 text-xs bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                      <span className="font-semibold text-slate-700">
                        Total {filledRowsCount} Sekolah Terisi:
                      </span>
                      <span className="text-emerald-700 font-bold">{tableTotalSD} SD</span>
                      <span>•</span>
                      <span className="text-teal-700 font-bold">{tableTotalSMP} SMP</span>
                      <span>•</span>
                      <span className="text-slate-800 font-bold">{tableTotalAudience.toLocaleString('id-ID')} Audience</span>
                      <span>•</span>
                      <span className="text-amber-800 font-extrabold">{tableTotalPendaftar.toLocaleString('id-ID')} Siswa Daftar</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center space-x-2">
                  <Database className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Semua sekolah pada baris di atas akan otomatis disimpan ke database cloud secara bersamaan saat Anda menekan tombol <strong>Simpan Semua Laporan Sekolah</strong>.
                  </span>
                </div>
              </div>
            ) : (
              /* FORMULIR SATUAN (SINGLE SCHOOL) MODE */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Wilayah */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Wilayah Panitia Daerah <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={wilayah}
                      onChange={(e) => setWilayah(e.target.value)}
                      disabled={Boolean(defaultWilayah)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none disabled:bg-slate-100 disabled:text-slate-600"
                    >
                      {DAFTAR_WILAYAH.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Jenjang Sekolah (SD / SMP) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Jenjang Sekolah <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSingleJenjang('SD')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center space-x-1.5 ${
                          singleJenjang === 'SD'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span>SD (Target: 15/kab)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSingleJenjang('SMP')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center space-x-1.5 ${
                          singleJenjang === 'SMP'
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span>SMP (Target: 5/kab)</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Kabupaten / Kota */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Kabupaten / Kota Lokasi Sekolah <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={singleKabupaten}
                        onChange={(e) => setSingleKabupaten(e.target.value)}
                        placeholder="Contoh: Kab. Bogor / Kota Bandung"
                        list="kabupaten-suggestions-single"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                      />
                      <datalist id="kabupaten-suggestions-single">
                        {existingKabupatenList.map((k) => (
                          <option key={k} value={k} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {/* Tanggal Kunjungan */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Tanggal Kunjungan Sosialisasi <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="date"
                        value={singleTanggal}
                        onChange={(e) => setSingleTanggal(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Nama Sekolah */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Sekolah yang Dikunjungi <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={singleSekolah}
                      onChange={(e) => setSingleSekolah(e.target.value)}
                      placeholder="Contoh: SD Negeri 1 Cibinong / SMP IT Bina Insani"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* PIC */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      PIC Sekolah / Panitia Sosialisasi <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={singlePic}
                        onChange={(e) => setSinglePic(e.target.value)}
                        placeholder="Contoh: Bpk. Ahmad Yani S.Pd"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                      />
                    </div>
                  </div>

                  {/* Kontak */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Kontak (No. HP / WhatsApp) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={singleKontak}
                        onChange={(e) => setSingleKontak(e.target.value)}
                        placeholder="Contoh: 081234567890"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Jumlah Audience */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Jumlah Audience Sosialisasi (Orang) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        min="0"
                        value={singleAudience}
                        onChange={(e) =>
                          setSingleAudience(
                            e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0)
                          )
                        }
                        placeholder="Jumlah siswa & guru hadir"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                      />
                    </div>
                  </div>

                  {/* Jumlah Siswa yang Daftar */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Jumlah Siswa yang Daftar (Orang) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        min="0"
                        value={singlePendaftar}
                        onChange={(e) =>
                          setSinglePendaftar(
                            e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0)
                          )
                        }
                        placeholder="Jumlah siswa mendaftar SENSEI"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Single Mode Upload Dokumentasi */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                        <Camera className="w-4 h-4 text-emerald-600" />
                        <span>Unggah Dokumentasi Kegiatan Sosialisasi</span>
                      </label>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Foto kunjungan sekolah, foto audiens, atau penyerahan berkas
                      </p>
                    </div>
                    <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300">
                      <Database className="w-3 h-3 text-emerald-600" />
                      <span>Cloud DB</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => singleFileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="px-4 py-2 rounded-xl border border-dashed border-emerald-400 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800 text-xs font-bold transition-colors flex items-center space-x-2"
                    >
                      {isUploadingPhoto ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                          <span>Mengunggah foto...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-emerald-600" />
                          <span>Pilih Foto dari Galeri / Kamera</span>
                        </>
                      )}
                    </button>
                    <span className="text-[11px] text-slate-400">
                      Otomatis dikompresi agar hemat data dan cepat tersimpan
                    </span>
                  </div>

                  {singleDokumentasiList.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      {singleDokumentasiList.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-video shadow-sm"
                        >
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() =>
                                setSingleDokumentasiList((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                )
                              }
                              className="p-1.5 bg-red-600 text-white rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Catatan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Catatan Kunjungan / Ringkasan Hasil Sosialisasi (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={singleCatatan}
                    onChange={(e) => setSingleCatatan(e.target.value)}
                    placeholder="Keterangan respons sekolah atau catatan tindak lanjut..."
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sticky Fixed Action Buttons Footer */}
          <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 shadow-inner z-10">
            <div className="text-xs text-slate-500">
              {inputMode === 'table' ? (
                <span>
                  Siap disimpan: <strong>{filledRowsCount}</strong> sekolah
                </span>
              ) : (
                <span>Mode Input Tunggal</span>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isUploadingPhoto}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isUploadingPhoto}
                className="px-6 py-2.5 text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Menyimpan...'
                    : inputMode === 'table'
                    ? `Simpan Semua (${filledRowsCount}) Laporan Sekolah`
                    : initialData
                    ? 'Perbarui Laporan'
                    : 'Simpan Laporan & Foto'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
