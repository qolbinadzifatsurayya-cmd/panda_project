import React, { useState, useEffect, useCallback } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  LoginModal 
} from './components/LoginModal';
import { 
  TargetProgressCard 
} from './components/TargetProgressCard';
import { 
  ReportFormModal 
} from './components/ReportFormModal';
import { 
  ReportTable 
} from './components/ReportTable';
import { 
  AdminDashboard 
} from './components/AdminDashboard';
import { 
  FirebaseSyncModal 
} from './components/FirebaseSyncModal';
import { 
  PrintReportView 
} from './components/PrintReportView';
import { 
  SosialisasiReport, 
  WilayahName, 
  DAFTAR_WILAYAH 
} from './types';
import { 
  api, 
  StatsResponse 
} from './services/api';
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  School, 
  Plus, 
  RotateCcw,
  Sparkles,
  MapPin
} from 'lucide-react';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<{
    role: 'admin' | 'wilayah' | null;
    wilayah?: WilayahName;
  }>(() => {
    try {
      const saved = localStorage.getItem('sensei_user_session');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { role: null };
  });

  const [allReports, setAllReports] = useState<SosialisasiReport[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<SosialisasiReport | null>(null);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<{ id: string; sekolah: string } | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Fetch all data
  const fetchData = useCallback(async (quiet = false) => {
    try {
      if (!quiet) setIsRefreshing(true);
      const [reportsData, statsData] = await Promise.all([
        api.getReports(),
        api.getStats(),
      ]);
      setAllReports(reportsData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Fetch data error:', err);
      if (!quiet) {
        showToast('Gagal memuat data dari cloud server', 'error');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time synchronization polling every 10 seconds for multi-device sync
  useEffect(() => {
    const timer = setInterval(() => {
      fetchData(true);
    }, 10000);
    return () => clearInterval(timer);
  }, [fetchData]);

  // Persist session
  const saveSession = (session: { role: 'admin' | 'wilayah' | null; wilayah?: WilayahName }) => {
    setCurrentUser(session);
    try {
      localStorage.setItem('sensei_user_session', JSON.stringify(session));
    } catch {}
  };

  const handleAdminLogin = (user: string, pass: string): boolean => {
    if (user === 'admin' && pass === 'Sensei2027') {
      saveSession({ role: 'admin' });
      showToast('Berhasil masuk sebagai Admin Pusat (Koordinator Nasional)', 'success');
      return true;
    }
    return false;
  };

  const handleSelectWilayah = (wilayah: WilayahName) => {
    saveSession({ role: 'wilayah', wilayah });
    showToast(`Masuk ke halaman kerja Wilayah: ${wilayah}`, 'info');
  };

  const handleLogout = () => {
    saveSession({ role: null });
    showToast('Berhasil keluar dari akun', 'info');
  };

  // Create or Update report (Single or Batch Multi-School)
  const handleSaveReport = async (
    data:
      | Omit<SosialisasiReport, 'id' | 'createdAt' | 'updatedAt'>
      | Omit<SosialisasiReport, 'id' | 'createdAt' | 'updatedAt'>[]
  ) => {
    try {
      if (Array.isArray(data)) {
        const createdList = await api.createBatchReports(data);
        showToast(`Berhasil menyimpan ${createdList.length} laporan sekolah ke cloud database!`, 'success');
      } else if (editingReport) {
        const updated = await api.updateReport(editingReport.id, data);
        showToast(`Laporan ${updated.sekolah} berhasil diperbarui!`, 'success');
      } else {
        const created = await api.createReport(data);
        showToast(`Laporan ${created.sekolah} berhasil disimpan ke cloud!`, 'success');
      }
      setEditingReport(null);
      await fetchData(true);
    } catch (err: any) {
      console.error('Save report error:', err);
      showToast(err.message || 'Gagal menyimpan laporan', 'error');
      throw err;
    }
  };

  const [batchDeleteCandidates, setBatchDeleteCandidates] = useState<string[] | null>(null);

  // Delete single report
  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    try {
      await api.deleteReport(deleteCandidate.id);
      showToast(`Laporan ${deleteCandidate.sekolah} berhasil dihapus`, 'info');
      setDeleteCandidate(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus laporan', 'error');
    }
  };

  // Batch delete reports (Admin action)
  const handleBatchDelete = (ids: string[]) => {
    setBatchDeleteCandidates(ids);
  };

  const confirmBatchDelete = async () => {
    if (!batchDeleteCandidates || batchDeleteCandidates.length === 0) return;
    try {
      const count = await api.batchDeleteReports(batchDeleteCandidates);
      showToast(`${count} laporan berhasil dihapus dari cloud database`, 'info');
      setBatchDeleteCandidates(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus laporan terpilih', 'error');
    }
  };

  // Seed sample data for testing targets
  const handleSeedSample = async () => {
    try {
      setIsRefreshing(true);
      const res = await api.seedSample();
      showToast(res.message, 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Reset data to default
  const handleResetData = async () => {
    if (!window.confirm('Apakah Anda yakin ingin mereset data laporan ke data awal?')) return;
    try {
      setIsRefreshing(true);
      const res = await api.resetData();
      showToast(res.message, 'info');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Filtered reports for current regional session
  const currentWilayahReports = currentUser.role === 'wilayah' && currentUser.wilayah
    ? allReports.filter((r) => r.wilayah.toLowerCase() === currentUser.wilayah!.toLowerCase())
    : [];

  // Existing kabupaten list for autocomplete
  const existingKabupatenForCurrentWilayah = Array.from(
    new Set(
      (currentUser.role === 'wilayah' ? currentWilayahReports : allReports).map(
        (r) => r.kabupatenKota
      )
    )
  ).filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Toast Floating Notifications - Positioned safely at top right so it NEVER blocks bottom buttons */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col space-y-2 pointer-events-none max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-2xl border text-xs sm:text-sm font-semibold flex items-center space-x-2.5 transition-all animate-in slide-in-from-top-2 duration-200 ${
              toast.type === 'success'
                ? 'bg-emerald-950 text-emerald-100 border-emerald-600 shadow-emerald-950/40'
                : toast.type === 'error'
                ? 'bg-red-950 text-red-100 border-red-600 shadow-red-950/40'
                : 'bg-slate-900 text-slate-100 border-slate-700 shadow-slate-950/40'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            <span>{toast.text}</span>
          </div>
        ))}
      </div>

      {/* Main Header */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onRefresh={() => fetchData()}
        isRefreshing={isRefreshing}
        onOpenCloudSettings={() => setIsCloudModalOpen(true)}
      />

      {/* Main Body View */}
      <main className="flex-1">
        {currentUser.role === null ? (
          /* Role Selector / Login Portal */
          <LoginModal
            onLoginAdmin={handleAdminLogin}
            onSelectWilayah={handleSelectWilayah}
          />
        ) : currentUser.role === 'admin' ? (
          /* Admin Pusat Dashboard */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AdminDashboard
              stats={stats}
              allReports={allReports}
              onSelectWilayah={(w) => {
                // Allow admin to jump into any region's view seamlessly
                saveSession({ role: 'wilayah', wilayah: w });
                showToast(`Membuka tampilan wilayah: ${w}`, 'info');
              }}
              onEditReport={(rep) => {
                setEditingReport(rep);
                setIsFormOpen(true);
              }}
              onDeleteReport={(id, sekolah) => {
                setDeleteCandidate({ id, sekolah });
              }}
              onBatchDeleteReport={handleBatchDelete}
              onAddNewReport={() => {
                setEditingReport(null);
                setIsFormOpen(true);
              }}
              onSeedSample={handleSeedSample}
              onResetData={handleResetData}
              onPrintPreview={() => setIsPrintModalOpen(true)}
            />
          </div>
        ) : (
          /* Halaman Wilayah (Regional View) */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            
            {/* Top Navigation & Quick Switch */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => saveSession({ role: null })}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors shadow-sm"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Pilih Wilayah Lain</span>
                </button>
                <button
                  onClick={() => saveSession({ role: 'admin' })}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-semibold transition-colors"
                  title="Pindah ke Dashboard Admin Pusat"
                >
                  <span>Buka Admin Pusat</span>
                </button>
              </div>

              {/* Quick Region Selector Dropdown */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 hidden sm:inline">Ganti Wilayah:</span>
                <select
                  value={currentUser.wilayah}
                  onChange={(e) => handleSelectWilayah(e.target.value as WilayahName)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {DAFTAR_WILAYAH.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target Progress Card for this Region */}
            <TargetProgressCard
              wilayah={currentUser.wilayah!}
              reports={currentWilayahReports}
              onAddReportClick={() => {
                setEditingReport(null);
                setIsFormOpen(true);
              }}
            />

            {/* Table of Visited Schools */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                    <School className="w-5 h-5 text-emerald-600" />
                    <span>Daftar Kunjungan Sosialisasi Sekolah - {currentUser.wilayah}</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Data langsung tersimpan di cloud database online dan dapat dipantau langsung oleh Koordinator Pusat.
                  </p>
                </div>
              </div>

              <ReportTable
                reports={currentWilayahReports}
                onEdit={(rep) => {
                  setEditingReport(rep);
                  setIsFormOpen(true);
                }}
                onDelete={(id, sekolah) => {
                  setDeleteCandidate({ id, sekolah });
                }}
                onAddNew={() => {
                  setEditingReport(null);
                  setIsFormOpen(true);
                }}
                showWilayahColumn={false}
              />
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal (Single or Batch) */}
      {(deleteCandidate || (batchDeleteCandidates && batchDeleteCandidates.length > 0)) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {batchDeleteCandidates
                    ? `Hapus ${batchDeleteCandidates.length} Laporan Sekaligus?`
                    : 'Hapus Laporan Kunjungan?'}
                </h3>
                <p className="text-xs text-slate-500">Tindakan ini akan menghapus data dari cloud database secara permanen.</p>
              </div>
            </div>

            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {batchDeleteCandidates ? (
                <span>
                  Apakah Anda yakin ingin menghapus <strong>{batchDeleteCandidates.length} laporan terpilih</strong>?
                </span>
              ) : (
                <span>
                  Apakah Anda yakin ingin menghapus data sosialisasi untuk{' '}
                  <strong className="text-slate-900">{deleteCandidate?.sekolah}</strong>?
                </span>
              )}
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => {
                  setDeleteCandidate(null);
                  setBatchDeleteCandidates(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (batchDeleteCandidates) {
                    confirmBatchDelete();
                  } else {
                    confirmDelete();
                  }
                }}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md transition-colors"
              >
                Ya, Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Form Modal */}
      <ReportFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingReport(null);
        }}
        onSubmit={handleSaveReport}
        initialData={editingReport}
        defaultWilayah={currentUser.role === 'wilayah' ? currentUser.wilayah : undefined}
        existingKabupatenList={existingKabupatenForCurrentWilayah}
      />

      {/* Cloud & Firebase RTDB Settings Modal */}
      <FirebaseSyncModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        onSyncSuccess={() => {
          fetchData();
          showToast('Database berhasil disinkronkan', 'success');
        }}
      />

      {/* Official Print/PDF Modal */}
      <PrintReportView
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        stats={stats}
        reports={allReports}
      />

      {/* Minimal Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-200">SENSEI 2027</span>
            <span>•</span>
            <span>Sistem Penerimaan Nasional Siswa Baru SMART Ekselensia Indonesia</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>Penyimpanan Online Multi-Device</span>
            <span>•</span>
            <span>14 Wilayah Mitra PPDB</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
