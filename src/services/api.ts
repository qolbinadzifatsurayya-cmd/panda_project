import { SosialisasiReport, WilayahTargetProgress, DAFTAR_WILAYAH, KabupatenStats } from '../types';
import {
  getReportsFromFirestore,
  saveReportToFirestore,
  saveBatchReportsToFirestore,
  updateReportInFirestore,
  deleteReportFromFirestore,
  batchDeleteReportsFromFirestore,
  subscribeReportsFromFirestore,
  seedInitialReportsIfEmpty,
} from './firestore';

export interface SummaryStats {
  grandTotalSekolah: number;
  grandTotalSD: number;
  grandTotalSMP: number;
  grandTotalAudience: number;
  grandTotalPendaftar: number;
  totalWilayah: number;
  wilayahTercapai: number;
  wilayahBelumTercapai: number;
  conversionRate: string;
}

export interface StatsResponse {
  success: boolean;
  summary: SummaryStats;
  wilayahStats: WilayahTargetProgress[];
}

export interface CloudConfig {
  firebaseUrl?: string;
  syncWithFirebase?: boolean;
}

const STORAGE_KEY_REPORTS = 'sensei_reports_db';
const STORAGE_KEY_CONFIG = 'sensei_cloud_config';

// Initial realistic dataset for 14 regions
export const initialSeedReports: SosialisasiReport[] = [
  // Jabar - Kab. Bogor & Kota Bandung
  {
    id: 'rep-jbr-01',
    wilayah: 'Jabar',
    kabupatenKota: 'Kab. Bogor',
    jenjang: 'SD',
    sekolah: 'SDIT Al-Madinah Cibinong',
    pic: 'Drs. H. Mulyadi',
    kontak: '081234567801',
    jumlahAudience: 85,
    jumlahPendaftar: 14,
    tanggalKunjungan: '2026-09-02',
    catatan: 'Presentasi di aula sekolah, antusiasme siswa kelas 6 sangat tinggi.',
    createdAt: new Date('2026-09-02T08:30:00Z').toISOString(),
    updatedAt: new Date('2026-09-02T08:30:00Z').toISOString(),
  },
  {
    id: 'rep-jbr-02',
    wilayah: 'Jabar',
    kabupatenKota: 'Kab. Bogor',
    jenjang: 'SD',
    sekolah: 'SD Negeri 1 Cibinong',
    pic: 'Ibu Ratna S.Pd',
    kontak: '081234567802',
    jumlahAudience: 92,
    jumlahPendaftar: 18,
    tanggalKunjungan: '2026-09-03',
    catatan: 'Disambut baik oleh kepala sekolah dan wali kelas 6.',
    createdAt: new Date('2026-09-03T09:00:00Z').toISOString(),
    updatedAt: new Date('2026-09-03T09:00:00Z').toISOString(),
  },
  {
    id: 'rep-jbr-03',
    wilayah: 'Jabar',
    kabupatenKota: 'Kab. Bogor',
    jenjang: 'SMP',
    sekolah: 'SMPIT Insantama Bogor',
    pic: 'Ust. Fajar Ramadhan',
    kontak: '081234567803',
    jumlahAudience: 120,
    jumlahPendaftar: 25,
    tanggalKunjungan: '2026-09-05',
    catatan: 'Sosialisasi program beasiswa SMART Ekselensia untuk lulusan SMP.',
    createdAt: new Date('2026-09-05T10:15:00Z').toISOString(),
    updatedAt: new Date('2026-09-05T10:15:00Z').toISOString(),
  },
  {
    id: 'rep-jbr-04',
    wilayah: 'Jabar',
    kabupatenKota: 'Kota Bandung',
    jenjang: 'SD',
    sekolah: 'SD Al-Irsyad Kota Bandung',
    pic: 'Bpk. Hendra Kurniawan',
    kontak: '081398765431',
    jumlahAudience: 78,
    jumlahPendaftar: 12,
    tanggalKunjungan: '2026-09-10',
    catatan: 'Kunjungan ke Kota Bandung wilayah ke-2 untuk pemenuhan target.',
    createdAt: new Date('2026-09-10T11:00:00Z').toISOString(),
    updatedAt: new Date('2026-09-10T11:00:00Z').toISOString(),
  },
  {
    id: 'rep-jbr-05',
    wilayah: 'Jabar',
    kabupatenKota: 'Kota Bandung',
    jenjang: 'SMP',
    sekolah: 'SMP Negeri 2 Bandung',
    pic: 'Ibu Sri Wahyuni',
    kontak: '081398765432',
    jumlahAudience: 140,
    jumlahPendaftar: 31,
    tanggalKunjungan: '2026-09-12',
    catatan: 'Koordinasi dengan guru BK kelas 9.',
    createdAt: new Date('2026-09-12T09:45:00Z').toISOString(),
    updatedAt: new Date('2026-09-12T09:45:00Z').toISOString(),
  },
  // Sulsel
  {
    id: 'rep-sls-01',
    wilayah: 'Sulsel',
    kabupatenKota: 'Kota Makassar',
    jenjang: 'SD',
    sekolah: 'SD Islam Athirah Makassar',
    pic: 'Ustadz Syamsul Alam',
    kontak: '085242123456',
    jumlahAudience: 110,
    jumlahPendaftar: 22,
    tanggalKunjungan: '2026-09-04',
    catatan: 'Brosur dan formulir registrasi SENSEI dibagikan merata.',
    createdAt: new Date('2026-09-04T08:00:00Z').toISOString(),
    updatedAt: new Date('2026-09-04T08:00:00Z').toISOString(),
  },
  {
    id: 'rep-sls-02',
    wilayah: 'Sulsel',
    kabupatenKota: 'Kab. Gowa',
    jenjang: 'SMP',
    sekolah: 'SMP Negeri 1 Sungguminasa Gowa',
    pic: 'Bpk. Daeng Mangngitung',
    kontak: '085242987654',
    jumlahAudience: 95,
    jumlahPendaftar: 19,
    tanggalKunjungan: '2026-09-07',
    catatan: 'Kabupaten kedua di Sulsel yang dikunjungi tim sosialisasi.',
    createdAt: new Date('2026-09-07T10:30:00Z').toISOString(),
    updatedAt: new Date('2026-09-07T10:30:00Z').toISOString(),
  },
  // Sumut
  {
    id: 'rep-smt-01',
    wilayah: 'Sumut',
    kabupatenKota: 'Kota Medan',
    jenjang: 'SD',
    sekolah: 'SD Al-Azhar Medan',
    pic: 'Bpk. Rahmat Harahap S.Pd',
    kontak: '081260123987',
    jumlahAudience: 88,
    jumlahPendaftar: 16,
    tanggalKunjungan: '2026-09-08',
    catatan: 'Sesi tanya jawab wali murid sangat interaktif.',
    createdAt: new Date('2026-09-08T09:00:00Z').toISOString(),
    updatedAt: new Date('2026-09-08T09:00:00Z').toISOString(),
  },
  // NTB
  {
    id: 'rep-ntb-01',
    wilayah: 'NTB',
    kabupatenKota: 'Kota Mataram',
    jenjang: 'SD',
    sekolah: 'SDIT Anak Sholeh Mataram',
    pic: 'Ustadz Lalu Muhammad',
    kontak: '087865432190',
    jumlahAudience: 75,
    jumlahPendaftar: 15,
    tanggalKunjungan: '2026-09-06',
    catatan: 'Wilayah NTB mulai roadshow ke sekolah sasaran.',
    createdAt: new Date('2026-09-06T10:00:00Z').toISOString(),
    updatedAt: new Date('2026-09-06T10:00:00Z').toISOString(),
  },
];

// Helper: load local reports cache
function getLocalReports(): SosialisasiReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPORTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading from localStorage:', err);
  }
  // Initialize with seed data
  try {
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(initialSeedReports));
  } catch {}
  return initialSeedReports;
}

// Helper: save local reports cache
function saveLocalReports(reports: SosialisasiReport[]) {
  try {
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(reports));
  } catch (err) {
    console.warn('Error writing to localStorage:', err);
  }
}

// Helper: compute statistics in-browser with exact 14-region KPI criteria
export function computeStatsFromReports(reports: SosialisasiReport[]): StatsResponse {
  let grandTotalSD = 0;
  let grandTotalSMP = 0;
  let grandTotalAudience = 0;
  let grandTotalPendaftar = 0;

  const wilayahStats: WilayahTargetProgress[] = DAFTAR_WILAYAH.map((wilayah) => {
    const wilayahReports = reports.filter(
      (r) => r.wilayah.toLowerCase() === wilayah.toLowerCase()
    );

    let totalSD = 0;
    let totalSMP = 0;
    let totalAudience = 0;
    let totalPendaftar = 0;

    const kabMap: Record<string, KabupatenStats> = {};

    wilayahReports.forEach((r) => {
      const kab = (r.kabupatenKota || wilayah).trim();
      if (!kabMap[kab]) {
        kabMap[kab] = {
          nama: kab,
          sdCount: 0,
          smpCount: 0,
          totalSekolah: 0,
          audienceCount: 0,
          pendaftarCount: 0,
          sdTargetMet: false,
          smpTargetMet: false,
          isTargetMet: false,
        };
      }

      kabMap[kab].totalSekolah += 1;
      kabMap[kab].audienceCount += Number(r.jumlahAudience) || 0;
      kabMap[kab].pendaftarCount += Number(r.jumlahPendaftar) || 0;

      if (r.jenjang === 'SD') {
        kabMap[kab].sdCount += 1;
        totalSD += 1;
        grandTotalSD += 1;
      } else {
        kabMap[kab].smpCount += 1;
        totalSMP += 1;
        grandTotalSMP += 1;
      }

      totalAudience += Number(r.jumlahAudience) || 0;
      totalPendaftar += Number(r.jumlahPendaftar) || 0;
      grandTotalAudience += Number(r.jumlahAudience) || 0;
      grandTotalPendaftar += Number(r.jumlahPendaftar) || 0;
    });

    const kabupatenList: KabupatenStats[] = Object.values(kabMap).map((k) => {
      const sdTargetMet = k.sdCount >= 15;
      const smpTargetMet = k.smpCount >= 5;
      return {
        ...k,
        sdTargetMet,
        smpTargetMet,
        isTargetMet: sdTargetMet && smpTargetMet,
      };
    });

    const qualifyingKabupatenCount = kabupatenList.filter((k) => k.isTargetMet).length;
    const kabupatenCount = kabupatenList.length;
    const isTargetSelesai = qualifyingKabupatenCount >= 2;

    let scoreSum = 0;
    kabupatenList.forEach((k) => {
      const sdScore = Math.min(1, k.sdCount / 15);
      const smpScore = Math.min(1, k.smpCount / 5);
      const kabScore = sdScore * 0.75 + smpScore * 0.25;
      scoreSum += kabScore;
    });
    const persentaseSelesai = Math.min(100, Math.round((scoreSum / 2) * 100));

    return {
      wilayah,
      totalSekolah: wilayahReports.length,
      totalSD,
      totalSMP,
      totalAudience,
      totalPendaftar,
      kabupatenStats: kabupatenList,
      kabupatenCount,
      qualifyingKabupatenCount,
      isTargetSelesai,
      persentaseSelesai,
    };
  });

  const wilayahTercapai = wilayahStats.filter((w) => w.isTargetSelesai).length;

  return {
    success: true,
    summary: {
      grandTotalSekolah: reports.length,
      grandTotalSD,
      grandTotalSMP,
      grandTotalAudience,
      grandTotalPendaftar,
      totalWilayah: DAFTAR_WILAYAH.length,
      wilayahTercapai,
      wilayahBelumTercapai: DAFTAR_WILAYAH.length - wilayahTercapai,
      conversionRate:
        grandTotalAudience > 0
          ? ((grandTotalPendaftar / grandTotalAudience) * 100).toFixed(1)
          : '0',
    },
    wilayahStats,
  };
}

// Optional Direct Firebase Realtime Database Sync (anonymous, no SDK / no API key)
async function syncDirectToFirebase(reports: SosialisasiReport[]) {
  try {
    const rawCfg = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!rawCfg) return;
    const cfg: CloudConfig = JSON.parse(rawCfg);
    if (cfg.syncWithFirebase && cfg.firebaseUrl) {
      let url = cfg.firebaseUrl.trim().replace(/\/$/, '');
      if (!url.endsWith('.json')) url += '/reports.json';
      await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reports),
      });
    }
  } catch (err) {
    console.warn('Firebase RTDB direct sync warning:', err);
  }
}

export const api = {
  async getReports(wilayah?: string): Promise<SosialisasiReport[]> {
    // 1. Try Firestore cloud database (primary cloud source for multi-device sync)
    try {
      const firestoreList = await seedInitialReportsIfEmpty(initialSeedReports);
      if (firestoreList && firestoreList.length > 0) {
        saveLocalReports(firestoreList);
        if (wilayah) {
          return firestoreList.filter((r) => r.wilayah.toLowerCase() === wilayah.toLowerCase());
        }
        return firestoreList;
      }
    } catch (e) {
      console.warn('Firestore cloud fetch warning:', e);
    }

    // 2. Try backend API if available
    try {
      const url = wilayah ? `/api/reports?wilayah=${encodeURIComponent(wilayah)}` : '/api/reports';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          if (!wilayah) {
            saveLocalReports(json.data);
          }
          return json.data;
        }
      }
    } catch {}

    // 3. Fallback to resilient local cache
    const local = getLocalReports();
    if (wilayah) {
      return local.filter((r) => r.wilayah.toLowerCase() === wilayah.toLowerCase());
    }
    return local;
  },

  async createReport(
    data: Omit<SosialisasiReport, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SosialisasiReport> {
    const newReport: SosialisasiReport = {
      ...data,
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save locally first so it is immediately responsive
    const current = getLocalReports();
    current.unshift(newReport);
    saveLocalReports(current);
    syncDirectToFirebase(current);

    // Persist to Firestore cloud database so other devices immediately receive it
    try {
      await saveReportToFirestore(newReport);
    } catch (err) {
      console.warn('Cloud database sync warning:', err);
    }

    // Also attempt server sync in background (if full-stack server is running)
    try {
      fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    } catch {}

    return newReport;
  },

  async createBatchReports(
    reports: Omit<SosialisasiReport, 'id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<SosialisasiReport[]> {
    if (!Array.isArray(reports) || reports.length === 0) {
      return [];
    }

    const now = new Date().toISOString();
    const newItems: SosialisasiReport[] = reports
      .filter((r) => r.sekolah && r.sekolah.trim().length > 0)
      .map((r, idx) => ({
        ...r,
        id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${idx}`,
        sekolah: r.sekolah.trim(),
        pic: r.pic ? r.pic.trim() : '-',
        kontak: r.kontak ? r.kontak.trim() : '-',
        jumlahAudience: Math.max(0, Number(r.jumlahAudience) || 0),
        jumlahPendaftar: Math.max(0, Number(r.jumlahPendaftar) || 0),
        tanggalKunjungan: r.tanggalKunjungan || now.split('T')[0],
        catatan: r.catatan ? r.catatan.trim() : '',
        dokumentasiList: r.dokumentasiList || (r.dokumentasiUrl ? [r.dokumentasiUrl] : []),
        createdAt: now,
        updatedAt: now,
      }));

    if (newItems.length === 0) {
      return [];
    }

    // 1. Immediately persist to client-side storage
    const current = getLocalReports();
    current.unshift(...newItems);
    saveLocalReports(current);
    syncDirectToFirebase(current);

    // 2. Persist to Firestore cloud database in an atomic batch
    try {
      await saveBatchReportsToFirestore(newItems);
    } catch (err) {
      console.warn('Cloud database batch sync warning:', err);
    }

    // 3. Also try server backend if available
    try {
      fetch('/api/reports/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports: newItems }),
      }).catch(() => {});
    } catch {}

    return newItems;
  },

  async updateReport(id: string, data: Partial<SosialisasiReport>): Promise<SosialisasiReport> {
    const current = getLocalReports();
    const idx = current.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw new Error('Laporan tidak ditemukan');
    }

    const updated: SosialisasiReport = {
      ...current[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    current[idx] = updated;
    saveLocalReports(current);
    syncDirectToFirebase(current);

    try {
      await updateReportInFirestore(id, updated);
    } catch (err) {
      console.warn('Cloud update warning:', err);
    }

    try {
      fetch(`/api/reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    } catch {}

    return updated;
  },

  async deleteReport(id: string): Promise<void> {
    let current = getLocalReports();
    current = current.filter((r) => r.id !== id);
    saveLocalReports(current);
    syncDirectToFirebase(current);

    try {
      await deleteReportFromFirestore(id);
    } catch (err) {
      console.warn('Cloud delete warning:', err);
    }

    try {
      fetch(`/api/reports/${id}`, { method: 'DELETE' }).catch(() => {});
    } catch {}
  },

  async batchDeleteReports(ids: string[]): Promise<number> {
    const idSet = new Set(ids);
    let current = getLocalReports();
    const beforeCount = current.length;
    current = current.filter((r) => !idSet.has(r.id));
    const deletedCount = beforeCount - current.length;
    saveLocalReports(current);
    syncDirectToFirebase(current);

    try {
      await batchDeleteReportsFromFirestore(ids);
    } catch (err) {
      console.warn('Cloud batch delete warning:', err);
    }

    try {
      fetch('/api/reports/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      }).catch(() => {});
    } catch {}

    return deletedCount;
  },

  subscribeReports(callback: (reports: SosialisasiReport[]) => void, onError?: (err: any) => void) {
    try {
      return subscribeReportsFromFirestore((reports) => {
        saveLocalReports(reports);
        callback(reports);
      }, onError);
    } catch {
      return () => {};
    }
  },

  async uploadDocumentation(dataBase64: string, filename?: string): Promise<string> {
    // Attempt server upload first to save server disk storage
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataBase64, filename }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.url) {
          return json.url;
        }
      }
    } catch {
      // In static deploy mode, dataBase64 is directly stored in report.dokumentasiList
    }

    // Direct Base64 data URL (works in browser & cloud database without any API key)
    return dataBase64;
  },

  async getStats(): Promise<StatsResponse> {
    // 1. Try server endpoint
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch('/api/stats', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.summary) {
          return json;
        }
      }
    } catch {}

    // 2. Compute directly from current reports
    const current = getLocalReports();
    return computeStatsFromReports(current);
  },

  async getConfig(): Promise<{ config: CloudConfig; cloudStatus: any }> {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    let cfg: CloudConfig = { firebaseUrl: '', syncWithFirebase: false };
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) cfg = JSON.parse(saved);
    } catch {}

    return {
      config: cfg,
      cloudStatus: {
        isOnlineDatabaseActive: true,
        mode: 'Firebase Firestore Cloud Database (Multi-Device Active)',
        persistedRecords: getLocalReports().length,
      },
    };
  },

  async updateConfig(cfg: CloudConfig): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(cfg));
    } catch {}

    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      });
    } catch {}

    if (cfg.syncWithFirebase && cfg.firebaseUrl) {
      syncDirectToFirebase(getLocalReports());
    }
  },

  async seedSample(): Promise<{ message: string; total: number }> {
    const current = getLocalReports();
    const sampleBatch: SosialisasiReport[] = [];

    // Complete visits for Kalbar
    for (let i = 1; i <= 15; i++) {
      sampleBatch.push({
        id: `seed-kalbar-ptk-sd-${i}`,
        wilayah: 'Kalbar',
        kabupatenKota: 'Kota Pontianak',
        jenjang: 'SD',
        sekolah: `SD Negeri ${i} Pontianak Kota`,
        pic: `Guru Penggerak SD ${i}`,
        kontak: `0856000000${i.toString().padStart(2, '0')}`,
        jumlahAudience: 60 + Math.floor(Math.random() * 40),
        jumlahPendaftar: 8 + Math.floor(Math.random() * 12),
        tanggalKunjungan: '2026-09-15',
        catatan: 'Sosialisasi terlaksana dengan lancar',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    for (let i = 1; i <= 5; i++) {
      sampleBatch.push({
        id: `seed-kalbar-ptk-smp-${i}`,
        wilayah: 'Kalbar',
        kabupatenKota: 'Kota Pontianak',
        jenjang: 'SMP',
        sekolah: `SMP Negeri ${i} Pontianak`,
        pic: `Wakasek Kesiswaan SMP ${i}`,
        kontak: `0856111111${i.toString().padStart(2, '0')}`,
        jumlahAudience: 100 + Math.floor(Math.random() * 50),
        jumlahPendaftar: 15 + Math.floor(Math.random() * 15),
        tanggalKunjungan: '2026-09-18',
        catatan: 'Presentasi jalur beasiswa tahfidz dan prestasi SMART',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    for (let i = 1; i <= 15; i++) {
      sampleBatch.push({
        id: `seed-kalbar-kbr-sd-${i}`,
        wilayah: 'Kalbar',
        kabupatenKota: 'Kab. Kubu Raya',
        jenjang: 'SD',
        sekolah: `SD IT Bina Insan Kubu Raya ${i}`,
        pic: `Koordinator SD ${i}`,
        kontak: `0856222222${i.toString().padStart(2, '0')}`,
        jumlahAudience: 50 + Math.floor(Math.random() * 30),
        jumlahPendaftar: 6 + Math.floor(Math.random() * 8),
        tanggalKunjungan: '2026-09-20',
        catatan: 'Edukasi dan penyerahan berkas PPDB',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    for (let i = 1; i <= 5; i++) {
      sampleBatch.push({
        id: `seed-kalbar-kbr-smp-${i}`,
        wilayah: 'Kalbar',
        kabupatenKota: 'Kab. Kubu Raya',
        jenjang: 'SMP',
        sekolah: `SMP Terpadu Kubu Raya ${i}`,
        pic: `Guru BK SMP ${i}`,
        kontak: `0856333333${i.toString().padStart(2, '0')}`,
        jumlahAudience: 90 + Math.floor(Math.random() * 40),
        jumlahPendaftar: 12 + Math.floor(Math.random() * 10),
        tanggalKunjungan: '2026-09-22',
        catatan: 'Presentasi dan simulasi pendaftaran online',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const existingIds = new Set(current.map((r) => r.id));
    const merged = [...current];
    sampleBatch.forEach((s) => {
      if (!existingIds.has(s.id)) {
        merged.push(s);
      }
    });

    saveLocalReports(merged);
    syncDirectToFirebase(merged);

    try {
      await saveBatchReportsToFirestore(sampleBatch);
    } catch (err) {
      console.warn('Firestore seedSample warning:', err);
    }

    try {
      fetch('/api/seed-sample', { method: 'POST' }).catch(() => {});
    } catch {}

    return { message: 'Data simulasi contoh berhasil ditambahkan ke Cloud Database', total: merged.length };
  },

  async resetData(): Promise<{ message: string; total: number }> {
    saveLocalReports(initialSeedReports);
    syncDirectToFirebase(initialSeedReports);

    try {
      // Overwrite initial seed to Firestore
      await saveBatchReportsToFirestore(initialSeedReports);
    } catch (err) {
      console.warn('Firestore reset warning:', err);
    }

    try {
      fetch('/api/reset-data', { method: 'POST' }).catch(() => {});
    } catch {}

    return { message: 'Data berhasil direset ke data awal', total: initialSeedReports.length };
  },
};
