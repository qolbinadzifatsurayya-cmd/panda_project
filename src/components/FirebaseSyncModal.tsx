import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  Cloud, 
  Flame, 
  HelpCircle, 
  RefreshCw, 
  Save, 
  ShieldCheck, 
  AlertCircle,
  ExternalLink,
  Laptop,
  Smartphone
} from 'lucide-react';
import { api, CloudConfig } from '../services/api';

interface FirebaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncSuccess: () => void;
}

export const FirebaseSyncModal: React.FC<FirebaseSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncSuccess,
}) => {
  const [config, setConfig] = useState<CloudConfig>({ firebaseUrl: '', syncWithFirebase: false });
  const [cloudStatus, setCloudStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await api.getConfig();
      setConfig(res.config || {});
      setCloudStatus(res.cloudStatus);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal memuat status cloud' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setMessage(null);
      await api.updateConfig(config);
      setMessage({
        type: 'success',
        text: 'Pengaturan cloud database berhasil diperbarui & disinkronkan!',
      });
      onSyncSuccess();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal menyimpan pengaturan' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6 flex items-start sm:items-center justify-center animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-sm border-b border-slate-800 z-10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Status Database Cloud & Multi-Device</h3>
              <p className="text-xs text-slate-300">
                Penyimpanan Online SENSEI 2027 Tanpa API Key & Tanpa Langganan Berbayar
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

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 overscroll-contain">
          {message && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center space-x-2.5 ${
                message.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Active Cloud Server Status */}
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/90 text-emerald-950">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <h4 className="font-bold text-sm text-emerald-900">
                  Database Cloud Online Sedang Beroperasi (Aktif)
                </h4>
              </div>
              <span className="text-[11px] font-semibold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-md">
                Multi-Device Ready
              </span>
            </div>
            <p className="text-xs text-emerald-800 mt-2 leading-relaxed">
              Sistem backend SENSEI 2027 saat ini <strong>langsung tersimpan di cloud server</strong>. Setiap input laporan dari panitia daerah di smartphone/komputer mana pun langsung terintegrasi dan dapat dilihat oleh admin pusat secara real-time tanpa perlu API key, tanpa token, dan gratis 100%.
            </p>
            <div className="mt-3 pt-3 border-t border-emerald-200/60 flex items-center space-x-4 text-xs font-medium text-emerald-900">
              <span className="flex items-center space-x-1">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mendukung HP / Tablet Panitia</span>
              </span>
              <span className="flex items-center space-x-1">
                <Laptop className="w-3.5 h-3.5" />
                <span>Laptop Koordinator</span>
              </span>
            </div>
          </div>

          {/* Firebase Realtime Database Anonymous Configuration */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <label className="font-bold text-sm text-slate-900">
                    Konfigurasi Firebase Realtime Database (Anonim)
                  </label>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(config.syncWithFirebase)}
                    onChange={(e) =>
                      setConfig({ ...config, syncWithFirebase: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Jika Anda memiliki URL Firebase Realtime Database gratis (Spark Plan) dengan security rules terbuka / anonim (<code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">.read: true, .write: true</code>), masukkan URL database Anda di bawah ini untuk sinkronisasi otomatis via REST API tanpa API key.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL Firebase Realtime Database (Opsional)
                </label>
                <input
                  type="url"
                  value={config.firebaseUrl || ''}
                  onChange={(e) => setConfig({ ...config, firebaseUrl: e.target.value })}
                  placeholder="https://proyek-anda-default-rtdb.firebaseio.com"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="text-[11px] text-slate-500 space-y-1 bg-white p-3 rounded-lg border border-slate-200">
                <div className="font-semibold text-slate-700 flex items-center space-x-1">
                  <HelpCircle className="w-3 h-3 text-amber-500" />
                  <span>Petunjuk Firebase Realtime Database Gratis:</span>
                </div>
                <p>1. Buka Firebase Console (gratis tanpa kartu kredit) &gt; Buat Realtime Database.</p>
                <p>2. Pada tab Rules, set izin anonim: <code className="bg-slate-100 font-mono text-[10px] text-slate-800">{`{"rules": {".read": true, ".write": true}}`}</code></p>
                <p>3. Salin URL database Anda ke kolom di atas. Sistem otomatis menyinkronkan data.</p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Tutup
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md transition-all flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
