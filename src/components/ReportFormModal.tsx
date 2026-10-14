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
  Database
} from 'lucide-react';
import { JenjangSekolah, SosialisasiReport, WilayahName, DAFTAR_WILAYAH } from '../types';
import { api } from '../services/api';

interface ReportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<SosialisasiReport, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: SosialisasiReport | null;
  defaultWilayah?: WilayahName;
  existingKabupatenList?: string[];
}

// Client-side helper to compress image to max dimensions to keep cloud database fast & light
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
        // Compress as JPEG 0.8
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
  const [wilayah, setWilayah] = useState<string>(defaultWilayah || DAFTAR_WILAYAH[0]);
  const [kabupatenKota, setKabupatenKota] = useState('');
  const [jenjang, setJenjang] = useState<JenjangSekolah>('SD');
  const [sekolah, setSekolah] = useState('');
  const [pic, setPic] = useState('');
  const [kontak, setKontak] = useState('');
  const [jumlahAudience, setJumlahAudience] = useState<number | ''>('');
  const [jumlahPendaftar, setJumlahPendaftar] = useState<number | ''>('');
  const [tanggalKunjungan, setTanggalKunjungan] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [catatan, setCatatan] = useState('');
  
  // Documentation uploads
  const [dokumentasiList, setDokumentasiList] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialData) {
      setWilayah(initialData.wilayah);
      setKabupatenKota(initialData.kabupatenKota);
      setJenjang(initialData.jenjang);
      setSekolah(initialData.sekolah);
      setPic(initialData.pic);
      setKontak(initialData.kontak);
      setJumlahAudience(initialData.jumlahAudience);
      setJumlahPendaftar(initialData.jumlahPendaftar);
      setTanggalKunjungan(initialData.tanggalKunjungan);
      setCatatan(initialData.catatan || '');
      setDokumentasiList(
        initialData.dokumentasiList && initialData.dokumentasiList.length > 0
          ? initialData.dokumentasiList
          : initialData.dokumentasiUrl
          ? [initialData.dokumentasiUrl]
          : []
      );
    } else {
      if (defaultWilayah) setWilayah(defaultWilayah);
      setKabupatenKota(existingKabupatenList.length > 0 ? existingKabupatenList[0] : '');
      setJenjang('SD');
      setSekolah('');
      setPic('');
      setKontak('');
      setJumlahAudience('');
      setJumlahPendaftar('');
      setTanggalKunjungan(new Date().toISOString().split('T')[0]);
      setCatatan('');
      setDokumentasiList([]);
    }
    setErrorMsg('');
  }, [initialData, defaultWilayah, isOpen]);

  if (!isOpen) return null;

  // Handle file selection from camera / gallery
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploadingPhoto(true);
      setErrorMsg('');

      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          continue;
        }

        // 1. Compress image client-side
        const compressedBase64 = await compressImageFile(file);

        // 2. Upload to backend cloud database storage
        try {
          const serverUrl = await api.uploadDocumentation(compressedBase64, file.name);
          newUrls.push(serverUrl);
        } catch {
          // If server upload had transient issue, store the compressed base64 directly
          newUrls.push(compressedBase64);
        }
      }

      setDokumentasiList((prev) => [...prev, ...newUrls]);
    } catch (err: any) {
      setErrorMsg('Gagal memproses unggahan foto: ' + (err.message || 'Format tidak didukung'));
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setDokumentasiList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!sekolah.trim()) {
      setErrorMsg('Nama sekolah wajib diisi');
      return;
    }
    if (!kabupatenKota.trim()) {
      setErrorMsg('Kabupaten/Kota kunjungan wajib diisi');
      return;
    }
    if (!pic.trim()) {
      setErrorMsg('PIC sekolah/panitia wajib diisi');
      return;
    }
    if (!kontak.trim()) {
      setErrorMsg('Nomor kontak wajib diisi');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        wilayah,
        kabupatenKota: kabupatenKota.trim(),
        jenjang,
        sekolah: sekolah.trim(),
        pic: pic.trim(),
        kontak: kontak.trim(),
        jumlahAudience: Number(jumlahAudience) || 0,
        jumlahPendaftar: Number(jumlahPendaftar) || 0,
        tanggalKunjungan,
        catatan: catatan.trim(),
        dokumentasiUrl: dokumentasiList.length > 0 ? dokumentasiList[0] : undefined,
        dokumentasiList,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan laporan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6 flex items-start sm:items-center justify-center animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden my-auto">
        
        {/* Sticky Fixed Header - Always visible at top */}
        <div className="px-5 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-sm border-b border-slate-800 z-10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                {initialData ? 'Edit Laporan Kunjungan Sosialisasi' : 'Form Input Laporan Sosialisasi Sekolah'}
              </h3>
              <p className="text-xs text-slate-300">
                Sistem PPDB SENSEI 2027 • Wilayah: <span className="text-emerald-400 font-semibold">{wilayah}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body with scrollable content & sticky footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="p-5 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 overscroll-contain">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

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
                  onClick={() => setJenjang('SD')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center space-x-1.5 ${
                    jenjang === 'SD'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>SD (Target: 15/kab)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setJenjang('SMP')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center space-x-1.5 ${
                    jenjang === 'SMP'
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
                  value={kabupatenKota}
                  onChange={(e) => setKabupatenKota(e.target.value)}
                  placeholder="Contoh: Kab. Bogor / Kota Bandung"
                  list="kabupaten-suggestions"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                />
                <datalist id="kabupaten-suggestions">
                  {existingKabupatenList.map((k) => (
                    <option key={k} value={k} />
                  ))}
                </datalist>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Harus mencakup minimal 2 kabupaten/kota berbeda di wilayah Anda.
              </p>
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
                  value={tanggalKunjungan}
                  onChange={(e) => setTanggalKunjungan(e.target.value)}
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
                value={sekolah}
                onChange={(e) => setSekolah(e.target.value)}
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
                  value={pic}
                  onChange={(e) => setPic(e.target.value)}
                  placeholder="Contoh: Bpk. Ahmad Yani S.Pd (Kepsek)"
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
                  value={kontak}
                  onChange={(e) => setKontak(e.target.value)}
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
                  value={jumlahAudience}
                  onChange={(e) => setJumlahAudience(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
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
                  value={jumlahPendaftar}
                  onChange={(e) => setJumlahPendaftar(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="Jumlah siswa mendaftar SENSEI"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                />
              </div>
            </div>
          </div>

          {/* FITUR UNGGAH DOKUMENTASI TERHUBUNG DATABASE */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>Unggah Dokumentasi Kegiatan Sosialisasi</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Foto kunjungan, audiens aula, atau penyerahan berkas (tersimpan langsung di cloud database)
                </p>
              </div>
              <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300">
                <Database className="w-3 h-3 text-emerald-600" />
                <span>Cloud DB Sync</span>
              </span>
            </div>

            {/* Hidden native input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="hidden"
            />

            {/* Upload Button & Drop Area */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="px-4 py-2.5 rounded-xl border border-dashed border-emerald-400 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800 text-xs font-bold transition-colors flex items-center space-x-2"
              >
                {isUploadingPhoto ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Mengunggah foto ke database...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>Pilih Foto dari Galeri / Kamera</span>
                  </>
                )}
              </button>
              <span className="text-[11px] text-slate-400">
                Mendukung JPG, PNG, WebP (otomatis dioptimalkan untuk kelancaran akses)
              </span>
            </div>

            {/* Photo Preview Grid */}
            {dokumentasiList.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {dokumentasiList.map((url, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-video shadow-sm">
                    <img
                      src={url}
                      alt={`Dokumentasi ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow"
                        title="Hapus foto ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="absolute bottom-1 left-1 bg-slate-900/80 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                      Foto {idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Catatan / Keterangan Tambahan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Catatan Kunjungan / Ringkasan Hasil Sosialisasi (Opsional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <textarea
                rows={2}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Keterangan respons sekolah, link dokumentasi eksternal, atau tindak lanjut pendaftaran..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              />
            </div>
          </div>

          </div>

          {/* Sticky Fixed Action Buttons Footer */}
          <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3 shrink-0 shadow-inner z-10">
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
              className="px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : initialData ? 'Perbarui Laporan' : 'Simpan Laporan & Foto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
