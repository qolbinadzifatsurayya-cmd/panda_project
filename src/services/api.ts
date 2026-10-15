import { SosialisasiReport, WilayahTargetProgress } from '../types';

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

export const api = {
  async getReports(wilayah?: string): Promise<SosialisasiReport[]> {
    const url = wilayah ? `/api/reports?wilayah=${encodeURIComponent(wilayah)}` : '/api/reports';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Gagal memuat data laporan dari server');
    const json = await res.json();
    return json.data || [];
  },

  async createReport(data: Omit<SosialisasiReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<SosialisasiReport> {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Gagal menyimpan laporan baru');
    }
    return json.data;
  },

  async createBatchReports(reports: Omit<SosialisasiReport, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<SosialisasiReport[]> {
    const res = await fetch('/api/reports/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reports }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Gagal menyimpan kumpulan laporan sekolah');
    }
    return json.data;
  },

  async updateReport(id: string, data: Partial<SosialisasiReport>): Promise<SosialisasiReport> {
    const res = await fetch(`/api/reports/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Gagal memperbarui laporan');
    }
    return json.data;
  },

  async deleteReport(id: string): Promise<void> {
    const res = await fetch(`/api/reports/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Gagal menghapus laporan');
    }
  },

  async batchDeleteReports(ids: string[]): Promise<number> {
    const res = await fetch('/api/reports/batch-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Gagal menghapus laporan terpilih');
    }
    return json.deletedCount || ids.length;
  },

  async uploadDocumentation(dataBase64: string, filename?: string): Promise<string> {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataBase64, filename }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Gagal mengunggah dokumentasi');
    }
    return json.url;
  },

  async getStats(): Promise<StatsResponse> {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Gagal memuat statistik');
    return res.json();
  },

  async getConfig(): Promise<{ config: CloudConfig; cloudStatus: any }> {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('Gagal memuat konfigurasi');
    return res.json();
  },

  async updateConfig(cfg: CloudConfig): Promise<void> {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Gagal menyimpan pengaturan');
    }
  },

  async seedSample(): Promise<{ message: string; total: number }> {
    const res = await fetch('/api/seed-sample', { method: 'POST' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Gagal menambah data simulasi');
    return json;
  },

  async resetData(): Promise<{ message: string; total: number }> {
    const res = await fetch('/api/reset-data', { method: 'POST' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Gagal mereset data');
    return json;
  },
};
