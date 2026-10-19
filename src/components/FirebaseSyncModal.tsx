import React from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  Cloud, 
  ShieldCheck, 
  Laptop,
  Smartphone,
  Wifi
} from 'lucide-react';

interface FirebaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncSuccess: () => void;
}

export const FirebaseSyncModal: React.FC<FirebaseSyncModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6 flex items-start sm:items-center justify-center animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-sm border-b border-slate-800 z-10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Status Database Cloud</h3>
              <p className="text-xs text-slate-300">
                Penyimpanan Online Terpusat Multi-Device SENSEI 2027
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Active Cloud Server Status */}
          <div className="p-4 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <h4 className="font-bold text-sm text-emerald-950">
                  Cloud Database Aktif & Terhubung
                </h4>
              </div>
              <span className="text-[11px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md">
                Online
              </span>
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed">
              Sistem backend SENSEI 2027 telah terintegrasi secara otomatis. Setiap laporan kunjungan sekolah yang diinput langsung tersimpan di cloud database dan dapat diakses bersamaan dari berbagai perangkat.
            </p>
          </div>

          {/* Privacy & No API Key Guarantee */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs text-slate-700">
            <div className="flex items-center space-x-2 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Keamanan & Kemudahan Penggunaan</span>
            </div>
            <ul className="space-y-1.5 list-disc list-inside text-slate-600 leading-relaxed">
              <li>
                <strong>Bebas Pengaturan Rumit</strong>: Pengguna, panitia, maupun admin tidak perlu memasukkan API Key atau konfigurasi teknis apa pun.
              </li>
              <li>
                <strong>Sinkronisasi Lintas Perangkat</strong>: Laporan yang diisi panitia di HP langsung muncul di dashboard Admin Pusat secara otomatis.
              </li>
              <li>
                <strong>Privasi Terjamin</strong>: Setiap wilayah memiliki akses tersendiri sehingga progres per wilayah terlindungi dan hanya bisa dipantau oleh wilayah masing-masing serta Admin Pusat.
              </li>
            </ul>
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              Mengerti & Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
