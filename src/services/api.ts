import { SosialisasiReport, WilayahTargetProgress, DAFTAR_WILAYAH, KabupatenStats } from '../types';
import { INITIAL_REPORTS } from '../data/initialReports';
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
const STORAGE_KEY_DELETED = 'sensei_deleted_report_ids';
const STORAGE_KEY_CONFIG = 'sensei_cloud_config';

// Helper: tracking explicitly deleted report IDs so they are not resurrected
function getDeletedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {}
  return new Set();
}

function addDeletedIds(ids: string[]) {
  try {
    const set = getDeletedIds();
    ids.forEach((id) => set.add(id));
    localStorage.setItem(STORAGE_KEY_DELETED, JSON.stringify(Array.from(set)));
  } catch {}
}

// Helper: load local reports cache with automatic fallback to bundled INITIAL_REPORTS (49 reports)
function getLocalReports(): SosialisasiReport[] {
  const deletedSet = getDeletedIds();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPORTS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((r) => !deletedSet.has(r.id));
      }
    }
  } catch (err) {
    console.warn('Error reading from localStorage:', err);
  }
  // Initialize with the 49 verified baseline reports so data is ALWAYS present on any device/GitHub push
  const baseline = INITIAL_REPORTS.filter((r) => !deletedSet.has(r.id));
  saveLocalReports(baseline);
  return baseline;
}

// Helper: save local reports cache
function saveLocalReports(reports: SosialisasiReport[]) {
  try {
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(reports));
  } catch (err) {
    console.warn('Error writing to localStorage:', err);
  }
}

// Helper: compute statistics in-browser with exact 14-region KPI criteria & full national cumulative
export function computeStatsFromReports(reports: SosialisasiReport[]): StatsResponse {
  let grandTotalSD = 0;
  let grandTotalSMP = 0;
  let grandTotalAudience = 0;
  let grandTotalPendaftar = 0;

  // Calculate cumulative national totals across ALL reports (14 Wilayah & Roadshow Jabodetabek)
  reports.forEach((r) => {
    if (r.jenjang === 'SD') {
      grandTotalSD += 1;
    } else {
      grandTotalSMP += 1;
    }
    grandTotalAudience += Number(r.jumlahAudience) || 0;
    grandTotalPendaftar += Number(r.jumlahPendaftar) || 0;
  });

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
      } else {
        kabMap[kab].smpCount += 1;
        totalSMP += 1;
      }

      totalAudience += Number(r.jumlahAudience) || 0;
      totalPendaftar += Number(r.jumlahPendaftar) || 0;
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
    const deletedSet = getDeletedIds();

    // 1. Fetch from server API
    let serverReports: SosialisasiReport[] = [];
    try {
      const url = wilayah ? `/api/reports?wilayah=${encodeURIComponent(wilayah)}` : '/api/reports';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          serverReports = json.data;
        }
      }
    } catch {}

    // 1b. If server API returned nothing (e.g. static hosting on GitHub Pages / Vercel), load static JSON
    if (serverReports.length === 0) {
      try {
        const staticRes = await fetch('/data/reports.json');
        if (staticRes.ok) {
          const staticData = await staticRes.json();
          if (Array.isArray(staticData) && staticData.length > 0) {
            serverReports = staticData;
          }
        }
      } catch {}
    }

    // 2. Fetch from Firestore cloud database if quota and connection allow
    let firestoreList: SosialisasiReport[] = [];
    try {
      const fsRes = await getReportsFromFirestore();
      if (Array.isArray(fsRes) && fsRes.length > 0) {
        firestoreList = fsRes;
      }
    } catch (e) {
      console.warn('Firestore cloud fetch warning (using local/server storage):', e);
    }

    // 3. Merge uniquely starting with bundled baseline INITIAL_REPORTS (guarantees all 49 reports are present)
    const idMap = new Map<string, SosialisasiReport>();

    // Baseline 49 reports
    INITIAL_REPORTS.forEach((r) => {
      if (!deletedSet.has(r.id)) idMap.set(r.id, r);
    });

    // Local cached reports
    const local = getLocalReports();
    local.forEach((r) => {
      if (!deletedSet.has(r.id)) idMap.set(r.id, r);
    });

    // Server / static reports
    serverReports.forEach((r) => {
      if (!deletedSet.has(r.id)) idMap.set(r.id, r);
    });

    // Firestore reports
    firestoreList.forEach((r) => {
      if (!deletedSet.has(r.id)) idMap.set(r.id, r);
    });

    const merged = Array.from(idMap.values());
    merged.sort((a, b) => new Date(b.createdAt || b.tanggalKunjungan).getTime() - new Date(a.createdAt || a.tanggalKunjungan).getTime());
    saveLocalReports(merged);

    if (wilayah) {
      return merged.filter(
        (r) => r.wilayah.trim().toLowerCase() === wilayah.trim().toLowerCase()
      );
    }
    return merged;
  },

  async createReport(
    data: Omit<SosialisasiReport, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SosialisasiReport> {
    const now = new Date().toISOString();
    const newReport: SosialisasiReport = {
      ...data,
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      wilayah: data.wilayah.trim(),
      kabupatenKota: data.kabupatenKota.trim(),
      sekolah: data.sekolah.trim(),
      pic: data.pic ? data.pic.trim() : '-',
      kontak: data.kontak ? data.kontak.trim() : '-',
      jumlahAudience: Math.max(0, Number(data.jumlahAudience) || 0),
      jumlahPendaftar: Math.max(0, Number(data.jumlahPendaftar) || 0),
      tanggalKunjungan: data.tanggalKunjungan || now.split('T')[0],
      catatan: data.catatan ? data.catatan.trim() : '',
      dokumentasiUrl: data.dokumentasiUrl ? String(data.dokumentasiUrl) : '',
      dokumentasiList: Array.isArray(data.dokumentasiList)
        ? data.dokumentasiList.filter(Boolean)
        : (data.dokumentasiUrl ? [String(data.dokumentasiUrl)] : []),
      createdAt: now,
      updatedAt: now,
      picRoadshow: data.picRoadshow ? data.picRoadshow.trim() : '',
      daerahRoadshow: data.daerahRoadshow ? data.daerahRoadshow.trim() : (data.kabupatenKota ? data.kabupatenKota.trim() : ''),
      isJabodetabek: Boolean(data.isJabodetabek || (data.wilayah && data.wilayah.toLowerCase() === 'jabodetabek')),
    };

    // Save locally first so it is immediately responsive
    const current = getLocalReports();
    const existingIdx = current.findIndex((r) => r.id === newReport.id);
    if (existingIdx >= 0) {
      current[existingIdx] = newReport;
    } else {
      current.unshift(newReport);
    }
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
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReport),
      });
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
        wilayah: r.wilayah.trim(),
        kabupatenKota: r.kabupatenKota.trim(),
        sekolah: r.sekolah.trim(),
        pic: r.pic ? r.pic.trim() : '-',
        kontak: r.kontak ? r.kontak.trim() : '-',
        jumlahAudience: Math.max(0, Number(r.jumlahAudience) || 0),
        jumlahPendaftar: Math.max(0, Number(r.jumlahPendaftar) || 0),
        tanggalKunjungan: r.tanggalKunjungan || now.split('T')[0],
        catatan: r.catatan ? r.catatan.trim() : '',
        dokumentasiUrl: r.dokumentasiUrl ? String(r.dokumentasiUrl) : (r.dokumentasiList && r.dokumentasiList[0] ? String(r.dokumentasiList[0]) : ''),
        dokumentasiList: Array.isArray(r.dokumentasiList)
          ? r.dokumentasiList.filter(Boolean)
          : (r.dokumentasiUrl ? [String(r.dokumentasiUrl)] : []),
        createdAt: now,
        updatedAt: now,
        picRoadshow: r.picRoadshow ? r.picRoadshow.trim() : '',
        daerahRoadshow: r.daerahRoadshow ? r.daerahRoadshow.trim() : (r.kabupatenKota ? r.kabupatenKota.trim() : ''),
        isJabodetabek: Boolean(r.isJabodetabek || (r.wilayah && r.wilayah.toLowerCase() === 'jabodetabek')),
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
      await fetch('/api/reports/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports: newItems }),
      });
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
      await fetch(`/api/reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {}

    return updated;
  },

  async deleteReport(id: string): Promise<void> {
    // 0. Track deleted ID to prevent resurrection from baseline bundle
    addDeletedIds([id]);

    // 1. Remove from local storage cache
    let current = getLocalReports();
    current = current.filter((r) => r.id !== id);
    saveLocalReports(current);
    syncDirectToFirebase(current);

    // 2. Remove from Firestore cloud database
    try {
      await deleteReportFromFirestore(id);
    } catch (err) {
      console.warn('Cloud delete warning:', err);
    }

    // 3. Await backend deletion so server data/reports.json is kept in exact sync
    try {
      await fetch(`/api/reports/${id}`, { method: 'DELETE' });
    } catch {}
  },

  async batchDeleteReports(ids: string[]): Promise<number> {
    // 0. Track deleted IDs to prevent resurrection from baseline bundle
    addDeletedIds(ids);

    const idSet = new Set(ids);
    let current = getLocalReports();
    const beforeCount = current.length;
    current = current.filter((r) => !idSet.has(r.id));
    const deletedCount = beforeCount - current.length;
    saveLocalReports(current);
    syncDirectToFirebase(current);

    // 1. Remove from Firestore cloud database
    try {
      await batchDeleteReportsFromFirestore(ids);
    } catch (err) {
      console.warn('Cloud batch delete warning:', err);
    }

    // 2. Await backend batch deletion
    try {
      await fetch('/api/reports/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
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

  async getStats(customReports?: SosialisasiReport[]): Promise<StatsResponse> {
    // Compute directly from active reports (never returns stale deleted items)
    const current = customReports !== undefined ? customReports : getLocalReports();
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

};
