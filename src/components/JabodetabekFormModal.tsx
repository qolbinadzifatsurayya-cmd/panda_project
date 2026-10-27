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
  Plus,
  Table as TableIcon,
  LayoutList,
  Copy,
  Compass
} from 'lucide-react';
import { JenjangSekolah, SosialisasiReport, DAFTAR_DAERAH_JABODETABEK, DAFTAR_DEFAULT_TIM_ROADSHOW } from '../types';
import { api } from '../services/api';

interface MultiRoadshowRow {
  id: string;
  daerahRoadshow: string;
  picRoadshow: string;
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

interface JabodetabekFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data:
      | Omit<SosialisasiReport, 'id' | 'createdAt' | 'updatedAt'>
      | Omit<SosialisasiReport, 'id' | 'createdAt' | 'updatedAt'>[]
  ) => Promise<void>;
  initialData?: SosialisasiReport | null;
  existingDaerahList?: string[];
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

export const JabodetabekFormModal: React.FC<JabodetabekFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  existingDaerahList = [],
}) => {
  // Mode: 'table' (multi-sekolah sekaligus) vs 'single' (satu per satu)
  const [inputMode, setInputMode] = useState<'table' | 'single'>(initialData ? 'single' : 'table');

  // Common Header State for Multi-school mode
  const [defaultDaerah, setDefaultDaerah] = useState<string>(DAFTAR_DAERAH_JABODETABEK[0]);
  const [defaultPicRoadshow, setDefaultPicRoadshow] = useState<string>('Tim Roadshow Pusat');
  const [defaultTanggal, setDefaultTanggal] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Single form mode state
  const [singleDaerah, setSingleDaerah] = useState<string>(DAFTAR_DAERAH_JABODETABEK[0]);
  const [singlePicRoadshow, setSinglePicRoadshow] = useState('');
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
  const [tableRows, setTableRows] = useState<MultiRoadshowRow[]>([]);

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
      setSingleDaerah(initialData.daerahRoadshow || initialData.kabupatenKota || DAFTAR_DAERAH_JABODETABEK[0]);
      setSinglePicRoadshow(initialData.picRoadshow || '');
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
      const initDaerah = existingDaerahList.length > 0 ? existingDaerahList[0] : DAFTAR_DAERAH_JABODETABEK[0];
      setDefaultDaerah(initDaerah);
      setSingleDaerah(initDaerah);
      setDefaultPicRoadshow('Tim Roadshow Pusat');
      setSinglePicRoadshow('Tim Roadshow Pusat');
      setDefaultTanggal(new Date().toISOString().split('T')[0]);
      
      // Initialize with 3 empty rows for quick batch input
      setTableRows([
        createEmptyRow(initDaerah, 'Tim Roadshow Pusat', 'SD'),
        createEmptyRow(initDaerah, 'Tim Roadshow Pusat', 'SD'),
        createEmptyRow(initDaerah, 'Tim Roadshow Pusat', 'SMP'),
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
  }, [initialData, isOpen]);

  function createEmptyRow(
    daerah: string,
    picRoadshow: string,
    jenjang: JenjangSekolah = 'SD'
  ): MultiRoadshowRow {
    return {
      id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      daerahRoadshow: daerah,
      picRoadshow,
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
    const newRows: MultiRoadshowRow[] = [];
    for (let i = 0; i < count; i++) {
      newRows.push(createEmptyRow(defaultDaerah, defaultPicRoadshow, i % 2 === 0 ? 'SD' : 'SMP'));
    }
    setTableRows((prev) => [...prev, ...newRows]);
  };

  const handleDuplicateRow = (idx: number) => {
    const target = tableRows[idx];
    const cloned: MultiRoadshowRow = {
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

  const handleUpdateRow = (id: string, field: keyof MultiRoadshowRow, value: any) => {
    setTableRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleDefaultDaerahChange = (val: string) => {
    const prevDefault = defaultDaerah;
    setDefaultDaerah(val);
    setTableRows((prev) =>
      prev.map((r) =>
        !r.daerahRoadshow.trim() || r.daerahRoadshow === prevDefault
          ? { ...r, daerahRoadshow: val }
          : r
      )
    );
  };

  const handleApplyDaerahToAll = () => {
    if (!defaultDaerah.trim()) return;
    setTableRows((prev) =>
      prev.map((r) => ({ ...r, daerahRoadshow: defaultDaerah.trim() }))
    );
  };

  const handleApplyPicToAll = () => {
    if (!defaultPicRoadshow.trim()) return;
    setTableRows((prev) =>
      prev.map((r) => ({ ...r, picRoadshow: defaultPicRoadshow.trim() }))
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
  const handleManualSubmit = async () => {
    setErrorMsg('');

    if (inputMode === 'single') {
      if (!singleSekolah.trim()) {
        setErrorMsg('Nama sekolah wajib diisi');
        return;
      }
      const effectiveDaerah = singleDaerah.trim() || defaultDaerah.trim() || 'Jakarta Selatan';
      const effectivePicRoadshow = singlePicRoadshow.trim() || defaultPicRoadshow.trim() || 'Tim Roadshow Pusat';

      try {
        setIsSubmitting(true);
        await onSubmit({
          wilayah: 'Jabodetabek',
          kabupatenKota: effectiveDaerah,
          daerahRoadshow: effectiveDaerah,
          picRoadshow: effectivePicRoadshow,
          isJabodetabek: true,
          jenjang: singleJenjang,
          sekolah: singleSekolah.trim(),
          pic: singlePic.trim() || '-',
          kontak: singleKontak.trim() || '-',
          jumlahAudience: Number(singleAudience) || 0,
          jumlahPendaftar: Number(singlePendaftar) || 0,
          tanggalKunjungan: singleTanggal,
          catatan: singleCatatan.trim(),
          dokumentasiUrl: singleDokumentasiList.length > 0 ? singleDokumentasiList[0] : '',
          dokumentasiList: singleDokumentasiList,
        });
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal menyimpan laporan roadshow');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Table Mode Validation
      const validRows = tableRows.filter((r) => r.sekolah && r.sekolah.trim().length > 0);

      if (validRows.length === 0) {
        setErrorMsg('Silakan isi minimal 1 Nama Sekolah pada baris tabel sebelum menekan simpan.');
        return;
      }

      const payloadList = validRows.map((r) => {
        const effectiveDaerah = r.daerahRoadshow.trim() || defaultDaerah.trim() || 'Jakarta Selatan';
        const effectivePicRoadshow = r.picRoadshow.trim() || defaultPicRoadshow.trim() || 'Tim Roadshow Pusat';

        return {
          wilayah: 'Jabodetabek',
          kabupatenKota: effectiveDaerah,
          daerahRoadshow: effectiveDaerah,
          picRoadshow: effectivePicRoadshow,
          isJabodetabek: true,
          jenjang: r.jenjang,
          sekolah: r.sekolah.trim(),
          pic: r.pic.trim() || '-',
          kontak: r.kontak.trim() || '-',
          jumlahAudience: Math.max(0, Number(r.jumlahAudience) || 0),
          jumlahPendaftar: Math.max(0, Number(r.jumlahPendaftar) || 0),
          tanggalKunjungan: r.tanggalKunjungan || defaultTanggal,
          catatan: r.catatan ? r.catatan.trim() : '',
          dokumentasiUrl: r.dokumentasiList.length > 0 ? r.dokumentasiList[0] : '',
          dokumentasiList: r.dokumentasiList,
        };
      });

      try {
        setIsSubmitting(true);
        await onSubmit(payloadList);
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal menyimpan daftar laporan roadshow');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const filledRowsCount = tableRows.filter((r) => r.sekolah && r.sekolah.trim().length > 0).length;
  const tableTotalAudience = tableRows.reduce(
    (sum, r) => sum + (Number(r.jumlahAudience) || 0),
    0
  );
  const tableTotalPendaftar = tableRows.reduce(
    (sum, r) => sum + (Number(r.jumlahPendaftar) || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 flex items-center justify-center animate-in fade-in duration-200">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={rowFileInputRef}
        onChange={handleRowPhotoChange}
        accept="image/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={singleFileInputRef}
        onChange={handleSinglePhotoChange}
        accept="image/*"
        multiple
        className="hidden"
      />

      <div
        className={`bg-white rounded-2xl shadow-2xl border border-slate-200 w-full flex flex-col overflow-hidden my-auto transition-all ${
          inputMode === 'table' ? 'max-w-6xl max-h-[96vh]' : 'max-w-2xl max-h-[90vh]'
        }`}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-xl">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  {initialData ? 'Edit Laporan Roadshow Jabodetabek' : 'Input Laporan Roadshow Jabodetabek'}
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  Target: 19 Tim (Maks. 15 Sekolah/Tim - Total 285)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Sosialisasi panitia pusat ke sekolah sekitar Jabodetabek (Target kumulatif: 285 sekolah)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!initialData && (
              <div className="flex bg-slate-800 rounded-xl p-0.5 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setInputMode('table')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
                    inputMode === 'table'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Input Banyak</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('single')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
                    inputMode === 'single'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span>Satu per Satu</span>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Notice */}
        {errorMsg && (
          <div className="px-5 py-3 bg-red-100 border-b border-red-300 text-red-900 text-xs flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="font-bold">{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg('')}
              className="text-red-700 hover:text-red-900 text-xs font-bold underline"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 overscroll-contain">
          {inputMode === 'table' ? (
            /* TABLE MODE */
            <div className="space-y-4">
              {/* Default Bar */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                {/* Wilayah / Daerah Roadshow */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Wilayah / Daerah Roadshow
                    </label>
                    <button
                      type="button"
                      onClick={handleApplyDaerahToAll}
                      className="text-[11px] text-teal-700 hover:text-teal-800 font-bold underline"
                    >
                      Terapkan ke Semua
                    </button>
                  </div>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={defaultDaerah}
                      onChange={(e) => handleDefaultDaerahChange(e.target.value)}
                      placeholder="Pilih/isi daerah Jabodetabek"
                      list="daerah-list-modal"
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none font-bold"
                    />
                    <datalist id="daerah-list-modal">
                      {DAFTAR_DAERAH_JABODETABEK.map((d) => (
                        <option key={d} value={d} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* PIC Roadshow Panitia Pusat */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      PIC Roadshow Panitia Pusat
                    </label>
                    <button
                      type="button"
                      onClick={handleApplyPicToAll}
                      className="text-[11px] text-teal-700 hover:text-teal-800 font-bold underline"
                    >
                      Terapkan ke Semua
                    </button>
                  </div>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={defaultPicRoadshow}
                      onChange={(e) => {
                        setDefaultPicRoadshow(e.target.value);
                        setTableRows((prev) =>
                          prev.map((r) => ({ ...r, picRoadshow: e.target.value }))
                        );
                      }}
                      placeholder="Pilih/ketik tim (contoh: Tim 1)"
                      list="tim-roadshow-list"
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none font-bold"
                    />
                    <datalist id="tim-roadshow-list">
                      {DAFTAR_DEFAULT_TIM_ROADSHOW.map((t) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Tanggal Kunjungan Default */}
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
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Spreadsheet Grid */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                        <th className="py-2.5 px-2 w-10 text-center">No</th>
                        <th className="py-2.5 px-2 w-28">Jenjang</th>
                        <th className="py-2.5 px-3 min-w-[200px]">Nama Sekolah *</th>
                        <th className="py-2.5 px-3 min-w-[140px]">Daerah Roadshow</th>
                        <th className="py-2.5 px-3 min-w-[130px]">PIC Roadshow Pusat</th>
                        <th className="py-2.5 px-2 min-w-[120px]">PIC Sekolah</th>
                        <th className="py-2.5 px-2 min-w-[110px]">Kontak / WA</th>
                        <th className="py-2.5 px-2 w-24 text-right">Audience</th>
                        <th className="py-2.5 px-2 w-24 text-right">Daftar</th>
                        <th className="py-2.5 px-2 w-20 text-center">Foto</th>
                        <th className="py-2.5 px-2 min-w-[130px]">Catatan</th>
                        <th className="py-2.5 px-2 w-16 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tableRows.map((row, index) => (
                        <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
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

                          {/* Sekolah */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.sekolah}
                              onChange={(e) => handleUpdateRow(row.id, 'sekolah', e.target.value)}
                              placeholder="Nama Sekolah sasaran..."
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-teal-500 outline-none"
                            />
                          </td>

                          {/* Daerah Roadshow */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.daerahRoadshow}
                              onChange={(e) => handleUpdateRow(row.id, 'daerahRoadshow', e.target.value)}
                              placeholder="Daerah Roadshow..."
                              list="daerah-list-modal"
                              className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-teal-500 outline-none"
                            />
                          </td>

                          {/* PIC Roadshow */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.picRoadshow}
                              onChange={(e) => handleUpdateRow(row.id, 'picRoadshow', e.target.value)}
                              placeholder="Tim/PIC Roadshow..."
                              list="tim-roadshow-list"
                              className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-teal-500 outline-none"
                            />
                          </td>

                          {/* PIC Sekolah */}
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={row.pic}
                              onChange={(e) => handleUpdateRow(row.id, 'pic', e.target.value)}
                              placeholder="PIC Sekolah"
                              className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-teal-500 outline-none"
                            />
                          </td>

                          {/* Kontak */}
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={row.kontak}
                              onChange={(e) => handleUpdateRow(row.id, 'kontak', e.target.value)}
                              placeholder="08..."
                              className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-1 focus:ring-teal-500 outline-none"
                            />
                          </td>

                          {/* Audience */}
                          <td className="py-2 px-2">
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
                              className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-right font-mono text-slate-900 focus:ring-1 focus:ring-teal-500 outline-none"
                            />
                          </td>

                          {/* Pendaftar */}
                          <td className="py-2 px-2">
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
                              className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-right font-mono font-bold text-amber-700 focus:ring-1 focus:ring-amber-500 outline-none"
                            />
                          </td>

                          {/* Foto */}
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveUploadRowId(row.id);
                                rowFileInputRef.current?.click();
                              }}
                              className={`p-1.5 rounded-lg border text-xs inline-flex items-center space-x-1 cursor-pointer transition-colors ${
                                row.dokumentasiList.length > 0
                                  ? 'bg-teal-50 text-teal-700 border-teal-300'
                                  : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
                              }`}
                              title={
                                row.dokumentasiList.length > 0
                                  ? `${row.dokumentasiList.length} Foto diunggah`
                                  : 'Unggah foto dokumentasi'
                              }
                            >
                              <Camera className="w-3.5 h-3.5" />
                              {row.dokumentasiList.length > 0 && (
                                <span className="font-bold text-[10px]">{row.dokumentasiList.length}</span>
                              )}
                            </button>
                          </td>

                          {/* Catatan */}
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={row.catatan || ''}
                              onChange={(e) => handleUpdateRow(row.id, 'catatan', e.target.value)}
                              placeholder="Catatan..."
                              className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:ring-1 focus:ring-teal-500 outline-none"
                            />
                          </td>

                          {/* Aksi */}
                          <td className="py-2 px-2 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleDuplicateRow(index)}
                                title="Duplikasi baris ini"
                                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(row.id)}
                                title="Hapus baris"
                                className="p-1 rounded text-red-400 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add Row Button */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleAddRow(1)}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-teal-600" />
                      <span>+ Tambah 1 Baris</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddRow(5)}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-teal-600" />
                      <span>+ Tambah 5 Baris</span>
                    </button>
                  </div>

                  <div className="text-xs text-slate-500 flex items-center space-x-3">
                    <span>
                      Terisi: <strong className="text-teal-700">{filledRowsCount}</strong> / {tableRows.length} Baris
                    </span>
                    <span>•</span>
                    <span>
                      Audience: <strong>{tableTotalAudience.toLocaleString('id-ID')}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Pendaftar: <strong className="text-amber-700">{tableTotalPendaftar.toLocaleString('id-ID')}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* SINGLE FORM MODE */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Wilayah / Daerah Roadshow */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Wilayah / Daerah Roadshow <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={singleDaerah}
                      onChange={(e) => setSingleDaerah(e.target.value)}
                      placeholder="Contoh: Kota Bogor / Kota Depok / Jakarta Selatan"
                      list="daerah-list-single"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                    />
                    <datalist id="daerah-list-single">
                      {DAFTAR_DAERAH_JABODETABEK.map((d) => (
                        <option key={d} value={d} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* PIC Roadshow Panitia Pusat */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    PIC Roadshow (Panitia Pusat) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Compass className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={singlePicRoadshow}
                      onChange={(e) => setSinglePicRoadshow(e.target.value)}
                      placeholder="Pilih/ketik tim (contoh: Tim 1 / Ust. Budi)"
                      list="tim-roadshow-list"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Jenjang & Sekolah */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Jenjang Sekolah <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSingleJenjang('SD')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center space-x-1 ${
                        singleJenjang === 'SD'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      SD
                    </button>
                    <button
                      type="button"
                      onClick={() => setSingleJenjang('SMP')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center space-x-1 ${
                        singleJenjang === 'SMP'
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      SMP
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Sekolah Sasaran <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={singleSekolah}
                      onChange={(e) => setSingleSekolah(e.target.value)}
                      placeholder="Contoh: SDIT Al-Madinah Bogor"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* PIC Sekolah & Kontak */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    PIC / Guru Kontak di Sekolah
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={singlePic}
                      onChange={(e) => setSinglePic(e.target.value)}
                      placeholder="Nama Kepala Sekolah / Guru BK"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nomor Kontak / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={singleKontak}
                      onChange={(e) => setSingleKontak(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Audience & Pendaftar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Jumlah Audience Siswa
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="0"
                      value={singleAudience}
                      onChange={(e) => setSingleAudience(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Calon Siswa Mendaftar
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="0"
                      value={singlePendaftar}
                      onChange={(e) => setSinglePendaftar(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-amber-700 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tanggal Sosialisasi
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={singleTanggal}
                      onChange={(e) => setSingleTanggal(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Foto Dokumentasi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Foto Dokumentasi Kegiatan
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => singleFileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-teal-600" />
                    <span>{isUploadingPhoto ? 'Mengunggah...' : '+ Unggah Foto'}</span>
                  </button>

                  {singleDokumentasiList.map((url, idx) => (
                    <div key={idx} className="relative group w-12 h-12 rounded-lg overflow-hidden border border-slate-300">
                      <img src={url} alt="Dokumentasi" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setSingleDokumentasiList((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute inset-0 bg-red-950/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Catatan Sosialisasi
                </label>
                <textarea
                  rows={2}
                  value={singleCatatan}
                  onChange={(e) => setSingleCatatan(e.target.value)}
                  placeholder="Keterangan respons sekolah, aula/kelas, tindak lanjut..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleManualSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan ke Cloud...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Laporan Roadshow</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
