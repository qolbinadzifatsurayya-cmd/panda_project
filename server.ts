import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'reports.json');
const CONFIG_FILE = path.resolve(DATA_DIR, 'config.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface ReportItem {
  id: string;
  wilayah: string;
  kabupatenKota: string;
  jenjang: 'SD' | 'SMP';
  sekolah: string;
  pic: string;
  kontak: string;
  jumlahAudience: number;
  jumlahPendaftar: number;
  tanggalKunjungan: string;
  catatan?: string;
  dokumentasiUrl?: string;
  dokumentasiList?: string[];
  createdAt: string;
  updatedAt: string;
}

interface AppConfig {
  firebaseUrl?: string; // e.g. https://xxxx-default-rtdb.firebaseio.com
  syncWithFirebase?: boolean;
}

const DAFTAR_WILAYAH = [
  'Sulawesi tengah',
  'Riau',
  'Kalbar',
  'Jabar',
  'Jateng',
  'Sumut',
  'Sumbar',
  'Sumsel',
  'Lampung',
  'Sulsel',
  'Bali',
  'NTB',
  'Bengkulu',
  'Kep. Riau',
];

// Seed realistic initial records if file doesn't exist
const initialSeedReports: ReportItem[] = [
  // Jabar - Kab. Bogor (16 SD, 5 SMP) -> example meeting target
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
  // Sulsel - Kota Makassar
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
  // Sumut - Kota Medan
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
  // NTB - Kota Mataram
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

function loadReports(): ReportItem[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialSeedReports, null, 2), 'utf-8');
      return initialSeedReports;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading reports file:', err);
    return [];
  }
}

function saveReports(reports: ReportItem[]): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(reports, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing reports file:', err);
  }
}

function loadConfig(): AppConfig {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      const def: AppConfig = {
        firebaseUrl: '',
        syncWithFirebase: false,
      };
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(def, null, 2), 'utf-8');
      return def;
    }
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  } catch {
    return { firebaseUrl: '', syncWithFirebase: false };
  }
}

function saveConfig(cfg: AppConfig): void {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving config:', err);
  }
}

// Background sync to Firebase RTDB if configured
async function syncToFirebase(reports: ReportItem[], firebaseUrl: string) {
  if (!firebaseUrl) return;
  try {
    let cleanUrl = firebaseUrl.trim();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    if (!cleanUrl.endsWith('.json')) {
      cleanUrl = `${cleanUrl}/sensei2027_reports.json`;
    }
    await fetch(cleanUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reports),
    });
  } catch (e) {
    console.warn('Firebase RTDB background sync warning:', e);
  }
}

const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(UPLOADS_DIR));

// API: Upload Documentation Image (Stored in the same local cloud database directory)
app.post('/api/upload', (req: Request, res: Response) => {
  try {
    const { dataBase64, filename } = req.body;
    if (!dataBase64) {
      res.status(400).json({ success: false, message: 'Tidak ada data gambar yang dikirim' });
      return;
    }

    // Parse base64 header if exists (e.g., data:image/png;base64,...)
    const matches = dataBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    let ext = 'jpg';

    if (matches && matches.length === 3) {
      const mime = matches[1];
      if (mime.includes('png')) ext = 'png';
      else if (mime.includes('webp')) ext = 'webp';
      else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(dataBase64, 'base64');
    }

    const safeName = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = path.resolve(UPLOADS_DIR, safeName);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${safeName}`;
    res.json({ success: true, url: publicUrl, filename: safeName });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API: Get all reports (optional filter ?wilayah=...)
app.get('/api/reports', (req: Request, res: Response) => {
  const { wilayah } = req.query;
  let list = loadReports();
  if (wilayah && typeof wilayah === 'string') {
    list = list.filter((r) => r.wilayah.toLowerCase() === wilayah.toLowerCase());
  }
  res.json({ success: true, count: list.length, data: list });
});

// API: Create new report
app.post('/api/reports', async (req: Request, res: Response) => {
  try {
    const {
      wilayah,
      kabupatenKota,
      jenjang,
      sekolah,
      pic,
      kontak,
      jumlahAudience,
      jumlahPendaftar,
      tanggalKunjungan,
      catatan,
      dokumentasiUrl,
      dokumentasiList,
    } = req.body;

    if (!wilayah || !kabupatenKota || !jenjang || !sekolah || !pic || !kontak) {
      res.status(400).json({
        success: false,
        message: 'Mohon lengkapi semua kolom wajib (Wilayah, Kab/Kota, Jenjang, Sekolah, PIC, Kontak)',
      });
      return;
    }

    const newReport: ReportItem = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      wilayah: String(wilayah).trim(),
      kabupatenKota: String(kabupatenKota).trim(),
      jenjang: jenjang === 'SMP' ? 'SMP' : 'SD',
      sekolah: String(sekolah).trim(),
      pic: String(pic).trim(),
      kontak: String(kontak).trim(),
      jumlahAudience: Math.max(0, Number(jumlahAudience) || 0),
      jumlahPendaftar: Math.max(0, Number(jumlahPendaftar) || 0),
      tanggalKunjungan: tanggalKunjungan || new Date().toISOString().split('T')[0],
      catatan: catatan ? String(catatan).trim() : '',
      dokumentasiUrl: dokumentasiUrl ? String(dokumentasiUrl).trim() : undefined,
      dokumentasiList: Array.isArray(dokumentasiList) ? dokumentasiList : dokumentasiUrl ? [dokumentasiUrl] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const current = loadReports();
    current.unshift(newReport);
    saveReports(current);

    // Optional Firebase RTDB sync
    const cfg = loadConfig();
    if (cfg.syncWithFirebase && cfg.firebaseUrl) {
      syncToFirebase(current, cfg.firebaseUrl);
    }

    res.status(201).json({ success: true, data: newReport });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API: Update report
app.put('/api/reports/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const current = loadReports();
    const idx = current.findIndex((r) => r.id === id);

    if (idx === -1) {
      res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });
      return;
    }

    const existing = current[idx];
    const updated: ReportItem = {
      ...existing,
      wilayah: body.wilayah !== undefined ? String(body.wilayah).trim() : existing.wilayah,
      kabupatenKota: body.kabupatenKota !== undefined ? String(body.kabupatenKota).trim() : existing.kabupatenKota,
      jenjang: body.jenjang === 'SMP' ? 'SMP' : 'SD',
      sekolah: body.sekolah !== undefined ? String(body.sekolah).trim() : existing.sekolah,
      pic: body.pic !== undefined ? String(body.pic).trim() : existing.pic,
      kontak: body.kontak !== undefined ? String(body.kontak).trim() : existing.kontak,
      jumlahAudience: body.jumlahAudience !== undefined ? Math.max(0, Number(body.jumlahAudience) || 0) : existing.jumlahAudience,
      jumlahPendaftar: body.jumlahPendaftar !== undefined ? Math.max(0, Number(body.jumlahPendaftar) || 0) : existing.jumlahPendaftar,
      tanggalKunjungan: body.tanggalKunjungan || existing.tanggalKunjungan,
      catatan: body.catatan !== undefined ? String(body.catatan).trim() : existing.catatan,
      dokumentasiUrl: body.dokumentasiUrl !== undefined ? body.dokumentasiUrl : existing.dokumentasiUrl,
      dokumentasiList: Array.isArray(body.dokumentasiList) ? body.dokumentasiList : existing.dokumentasiList,
      updatedAt: new Date().toISOString(),
    };

    current[idx] = updated;
    saveReports(current);

    const cfg = loadConfig();
    if (cfg.syncWithFirebase && cfg.firebaseUrl) {
      syncToFirebase(current, cfg.firebaseUrl);
    }

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API: Delete single report
app.delete('/api/reports/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let current = loadReports();
    const exists = current.some((r) => r.id === id);

    if (!exists) {
      res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });
      return;
    }

    current = current.filter((r) => r.id !== id);
    saveReports(current);

    const cfg = loadConfig();
    if (cfg.syncWithFirebase && cfg.firebaseUrl) {
      syncToFirebase(current, cfg.firebaseUrl);
    }

    res.json({ success: true, message: 'Laporan berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API: Batch Delete reports (Admin Pusat action)
app.post('/api/reports/batch-delete', async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, message: 'Daftar ID laporan tidak valid' });
      return;
    }

    const idSet = new Set(ids);
    let current = loadReports();
    const beforeCount = current.length;
    current = current.filter((r) => !idSet.has(r.id));
    const deletedCount = beforeCount - current.length;

    saveReports(current);

    const cfg = loadConfig();
    if (cfg.syncWithFirebase && cfg.firebaseUrl) {
      syncToFirebase(current, cfg.firebaseUrl);
    }

    res.json({ success: true, message: `${deletedCount} laporan berhasil dihapus`, deletedCount });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API: Detailed Statistics & Target Progression
app.get('/api/stats', (_req: Request, res: Response) => {
  const reports = loadReports();

  let grandTotalSekolah = reports.length;
  let grandTotalSD = 0;
  let grandTotalSMP = 0;
  let grandTotalAudience = 0;
  let grandTotalPendaftar = 0;

  // Process stats for all 14 official regions
  const wilayahStats = DAFTAR_WILAYAH.map((wilayah) => {
    const wilayahReports = reports.filter(
      (r) => r.wilayah.toLowerCase() === wilayah.toLowerCase()
    );

    let totalSD = 0;
    let totalSMP = 0;
    let totalAudience = 0;
    let totalPendaftar = 0;

    // Group by kabupaten/kota
    const kabMap: Record<
      string,
      {
        nama: string;
        sdCount: number;
        smpCount: number;
        totalSekolah: number;
        audienceCount: number;
        pendaftarCount: number;
      }
    > = {};

    wilayahReports.forEach((r) => {
      const kab = r.kabupatenKota.trim();
      if (!kabMap[kab]) {
        kabMap[kab] = {
          nama: kab,
          sdCount: 0,
          smpCount: 0,
          totalSekolah: 0,
          audienceCount: 0,
          pendaftarCount: 0,
        };
      }

      kabMap[kab].totalSekolah += 1;
      kabMap[kab].audienceCount += r.jumlahAudience;
      kabMap[kab].pendaftarCount += r.jumlahPendaftar;

      if (r.jenjang === 'SD') {
        kabMap[kab].sdCount += 1;
        totalSD += 1;
        grandTotalSD += 1;
      } else {
        kabMap[kab].smpCount += 1;
        totalSMP += 1;
        grandTotalSMP += 1;
      }

      totalAudience += r.jumlahAudience;
      totalPendaftar += r.jumlahPendaftar;
      grandTotalAudience += r.jumlahAudience;
      grandTotalPendaftar += r.jumlahPendaftar;
    });

    const kabupatenList = Object.values(kabMap).map((k) => {
      const sdTargetMet = k.sdCount >= 15;
      const smpTargetMet = k.smpCount >= 5;
      const isTargetMet = sdTargetMet && smpTargetMet;
      return {
        ...k,
        sdTargetMet,
        smpTargetMet,
        isTargetMet,
      };
    });

    const qualifyingKabupatenCount = kabupatenList.filter((k) => k.isTargetMet).length;
    const kabupatenCount = kabupatenList.length;
    // Rule: min 2 kabupaten/kota where each has >= 15 SD and >= 5 SMP
    const isTargetSelesai = qualifyingKabupatenCount >= 2;

    // Calculate progression percentage (weighted: kab count + school volume)
    // 2 kab required (50% each). In each, 15 SD (75%) + 5 SMP (25%)
    let scoreSum = 0;
    kabupatenList.forEach((k) => {
      const sdScore = Math.min(1, k.sdCount / 15);
      const smpScore = Math.min(1, k.smpCount / 5);
      const kabScore = sdScore * 0.75 + smpScore * 0.25;
      scoreSum += kabScore;
    });
    // Target requires 2 kab/kota fully done (2.0 score)
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

  res.json({
    success: true,
    summary: {
      grandTotalSekolah,
      grandTotalSD,
      grandTotalSMP,
      grandTotalAudience,
      grandTotalPendaftar,
      totalWilayah: DAFTAR_WILAYAH.length,
      wilayahTercapai,
      wilayahBelumTercapai: DAFTAR_WILAYAH.length - wilayahTercapai,
      conversionRate: grandTotalAudience > 0 ? ((grandTotalPendaftar / grandTotalAudience) * 100).toFixed(1) : '0',
    },
    wilayahStats,
  });
});

// API: App Configuration & Firebase RTDB Settings
app.get('/api/config', (_req: Request, res: Response) => {
  const cfg = loadConfig();
  res.json({
    success: true,
    config: cfg,
    cloudStatus: {
      isOnlineDatabaseActive: true,
      mode: cfg.syncWithFirebase ? 'Firebase Realtime DB + Cloud Server' : 'Cloud Server Multi-Device (Active)',
      persistedRecords: loadReports().length,
    },
  });
});

app.post('/api/config', (req: Request, res: Response) => {
  try {
    const { firebaseUrl, syncWithFirebase } = req.body;
    const current = loadConfig();
    const updated: AppConfig = {
      firebaseUrl: firebaseUrl !== undefined ? String(firebaseUrl).trim() : current.firebaseUrl,
      syncWithFirebase: Boolean(syncWithFirebase),
    };
    saveConfig(updated);

    if (updated.syncWithFirebase && updated.firebaseUrl) {
      syncToFirebase(loadReports(), updated.firebaseUrl);
    }

    res.json({ success: true, config: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API: Quick Seed / Demo Fill for testing
app.post('/api/seed-sample', (_req: Request, res: Response) => {
  try {
    const current = loadReports();
    // Add additional sample data for demonstration of targets
    const sampleBatch: ReportItem[] = [];

    // Let's create complete visits for Kalbar to show target achieved
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

    // Second kabupaten in Kalbar: Kab. Kubu Raya
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

    // Merge without duplicates
    const existingIds = new Set(current.map((r) => r.id));
    const merged = [...current];
    sampleBatch.forEach((s) => {
      if (!existingIds.has(s.id)) {
        merged.push(s);
      }
    });

    saveReports(merged);
    res.json({ success: true, message: 'Data simulasi contoh berhasil ditambahkan', total: merged.length });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reset data endpoint
app.post('/api/reset-data', (_req: Request, res: Response) => {
  saveReports(initialSeedReports);
  res.json({ success: true, message: 'Data berhasil direset ke data awal', total: initialSeedReports.length });
});

// Setup Vite or Static File Serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server SENSEI 2027 running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
