export type JenjangSekolah = 'SD' | 'SMP';

export interface SosialisasiReport {
  id: string;
  wilayah: string; // salah satu dari 14 wilayah
  kabupatenKota: string; // nama kab/kota yang dikunjungi
  jenjang: JenjangSekolah; // SD atau SMP
  sekolah: string; // Nama Sekolah
  pic: string; // Penanggung Jawab di sekolah / Panitia Daerah
  kontak: string; // Kontak / HP / WA
  jumlahAudience: number; // Jumlah Audience Sosialisasi
  jumlahPendaftar: number; // Jumlah Siswa yang Daftar
  tanggalKunjungan: string; // YYYY-MM-DD
  catatan?: string; // Dokumentasi / keterangan tambahan
  dokumentasiUrl?: string; // Foto/dokumentasi utama (Base64 atau URL cloud)
  dokumentasiList?: string[]; // Daftar foto dokumentasi kegiatan sosialisasi
  createdAt: string;
  updatedAt: string;
  // Field khusus Roadshow Jabodetabek (Panitia Pusat)
  picRoadshow?: string; // PIC Tim Roadshow Panitia Pusat
  daerahRoadshow?: string; // Wilayah/Daerah Roadshow sekitar Jabodetabek
  isJabodetabek?: boolean; // Penanda khusus laporan roadshow Jabodetabek
}

export const DAFTAR_DAERAH_JABODETABEK = [
  'Kota Bogor',
  'Kab. Bogor',
  'Kota Depok',
  'Kota Tangerang',
  'Kota Tangerang Selatan',
  'Kab. Tangerang',
  'Kota Bekasi',
  'Kab. Bekasi',
  'Jakarta Selatan',
  'Jakarta Timur',
  'Jakarta Barat',
  'Jakarta Pusat',
  'Jakarta Utara',
] as const;

export const TARGET_ROADSHOW_PER_TIM = 15; // Target maksimal kunjungan sekolah per tim (SD dan SMP)
export const TOTAL_TIM_ROADSHOW = 19; // Total 19 tim roadshow panitia pusat
export const TARGET_TOTAL_ROADSHOW = 285; // Target total roadshow: 19 tim x 15 sekolah = 285 sekolah
export const TARGET_JABODETABEK = TARGET_TOTAL_ROADSHOW; // Alias kompatibilitas target total roadshow (285)

export interface TimRoadshowItem {
  id: number;
  tim: string;
  namaAnggota: string;
  fullName: string;
}

export const LIST_TIM_ROADSHOW: TimRoadshowItem[] = [
  { id: 1, tim: 'Tim 1', namaAnggota: 'Abdul & Teguh', fullName: 'Tim 1 (Abdul & Teguh)' },
  { id: 2, tim: 'Tim 2', namaAnggota: 'Akmal & Asep', fullName: 'Tim 2 (Akmal & Asep)' },
  { id: 3, tim: 'Tim 3', namaAnggota: 'Enoh & Alfin', fullName: 'Tim 3 (Enoh & Alfin)' },
  { id: 4, tim: 'Tim 4', namaAnggota: 'Asmat & Yusuf', fullName: 'Tim 4 (Asmat & Yusuf)' },
  { id: 5, tim: 'Tim 5', namaAnggota: 'Agil & Ervan', fullName: 'Tim 5 (Agil & Ervan)' },
  { id: 6, tim: 'Tim 6', namaAnggota: 'Miftah & Fauzan', fullName: 'Tim 6 (Miftah & Fauzan)' },
  { id: 7, tim: 'Tim 7', namaAnggota: 'Dian & Firman', fullName: 'Tim 7 (Dian & Firman)' },
  { id: 8, tim: 'Tim 8', namaAnggota: 'Irsan & Troy', fullName: 'Tim 8 (Irsan & Troy)' },
  { id: 9, tim: 'Tim 9', namaAnggota: 'Firman pentry & Edo', fullName: 'Tim 9 (Firman pentry & Edo)' },
  { id: 10, tim: 'Tim 10', namaAnggota: 'Susilo & Syamil', fullName: 'Tim 10 (Susilo & Syamil)' },
  { id: 11, tim: 'Tim 11', namaAnggota: 'Dika & Yusuf', fullName: 'Tim 11 (Dika & Yusuf)' },
  { id: 12, tim: 'Tim 12', namaAnggota: 'Romlih & Sucipto', fullName: 'Tim 12 (Romlih & Sucipto)' },
  { id: 13, tim: 'Tim 13', namaAnggota: 'Yulia & Nada', fullName: 'Tim 13 (Yulia & Nada)' },
  { id: 14, tim: 'Tim 14', namaAnggota: 'Miqdad & Saiful', fullName: 'Tim 14 (Miqdad & Saiful)' },
  { id: 15, tim: 'Tim 15', namaAnggota: 'Izah & Ida', fullName: 'Tim 15 (Izah & Ida)' },
  { id: 16, tim: 'Tim 16', namaAnggota: 'Zahroh & Ratih', fullName: 'Tim 16 (Zahroh & Ratih)' },
  { id: 17, tim: 'Tim 17', namaAnggota: 'Deden & Agus', fullName: 'Tim 17 (Deden & Agus)' },
  { id: 18, tim: 'Tim 18', namaAnggota: 'Anwar & Rudy', fullName: 'Tim 18 (Anwar & Rudy)' },
  { id: 19, tim: 'Tim 19', namaAnggota: 'Sayla & Dhita', fullName: 'Tim 19 (Sayla & Dhita)' },
];

// Daftar tim roadshow default dengan nama anggota untuk kemudahan input
export const DAFTAR_DEFAULT_TIM_ROADSHOW = LIST_TIM_ROADSHOW.map((t) => t.fullName);

// Helper function untuk mencari info tim secara akurat (mencegah bentrokan substring seperti 'tim 11' mencocokkan 'tim 1')
export const getTeamInfo = (rawName?: string): TimRoadshowItem | undefined => {
  if (!rawName) return undefined;
  const str = String(rawName).trim();
  const lower = str.toLowerCase();

  // 1. Exact match pada fullName, tim, atau namaAnggota
  for (const t of LIST_TIM_ROADSHOW) {
    if (
      lower === t.fullName.toLowerCase() ||
      lower === t.tim.toLowerCase() ||
      lower === t.namaAnggota.toLowerCase()
    ) {
      return t;
    }
  }

  // 2. Exact match dengan kata 'dan' menggantikan '&'
  for (const t of LIST_TIM_ROADSHOW) {
    const withDan = t.namaAnggota.toLowerCase().replace(/&/g, 'dan');
    const fullWithDan = t.fullName.toLowerCase().replace(/&/g, 'dan');
    if (lower === withDan || lower === fullWithDan) {
      return t;
    }
  }

  // 3. Strict regex match nomor tim dengan batasan kata (\b) sehingga "tim 11" TIDAK PERNAH mencocokkan "tim 1"
  const timNumMatch = lower.match(/\btim\s*[-_]?\s*(\d+)\b/);
  if (timNumMatch) {
    const num = parseInt(timNumMatch[1], 10);
    const found = LIST_TIM_ROADSHOW.find((t) => t.id === num);
    if (found) return found;
  }

  // 4. Pencocokan jika kedua nama anggota terdapat dalam teks (misal: "Dika & Yusuf" atau "Yusuf dan Dika")
  for (const t of LIST_TIM_ROADSHOW) {
    const parts = t.namaAnggota.toLowerCase().split(/[&,]/).map((s) => s.trim()).filter(Boolean);
    const matchAll = parts.every((p) => {
      const words = p.split(/\s+/);
      return words.some((w) => lower.includes(w));
    });
    if (matchAll && parts.length > 0) return t;
  }

  // 5. Pencocokan kata kunci nama khas yang unik per tim
  if (lower.includes('dika')) return LIST_TIM_ROADSHOW.find((t) => t.id === 11);
  if (lower.includes('asmat')) return LIST_TIM_ROADSHOW.find((t) => t.id === 4);
  if (lower.includes('teguh') || lower.includes('abdul')) return LIST_TIM_ROADSHOW.find((t) => t.id === 1);
  if (lower.includes('akmal') || lower.includes('asep')) return LIST_TIM_ROADSHOW.find((t) => t.id === 2);
  if (lower.includes('enoh') || lower.includes('alfin')) return LIST_TIM_ROADSHOW.find((t) => t.id === 3);
  if (lower.includes('agil') || lower.includes('ervan')) return LIST_TIM_ROADSHOW.find((t) => t.id === 5);
  if (lower.includes('miftah') || lower.includes('fauzan')) return LIST_TIM_ROADSHOW.find((t) => t.id === 6);
  if (lower.includes('dian')) return LIST_TIM_ROADSHOW.find((t) => t.id === 7);
  if (lower.includes('irsan') || lower.includes('troy')) return LIST_TIM_ROADSHOW.find((t) => t.id === 8);
  if (lower.includes('pentry') || lower.includes('edo')) return LIST_TIM_ROADSHOW.find((t) => t.id === 9);
  if (lower.includes('susilo') || lower.includes('syamil')) return LIST_TIM_ROADSHOW.find((t) => t.id === 10);
  if (lower.includes('romlih') || lower.includes('sucipto')) return LIST_TIM_ROADSHOW.find((t) => t.id === 12);
  if (lower.includes('yulia') || lower.includes('nada')) return LIST_TIM_ROADSHOW.find((t) => t.id === 13);
  if (lower.includes('miqdad') || lower.includes('saiful')) return LIST_TIM_ROADSHOW.find((t) => t.id === 14);
  if (lower.includes('izah') || lower.includes('ida')) return LIST_TIM_ROADSHOW.find((t) => t.id === 15);
  if (lower.includes('zahroh') || lower.includes('ratih')) return LIST_TIM_ROADSHOW.find((t) => t.id === 16);
  if (lower.includes('deden') || lower.includes('agus')) return LIST_TIM_ROADSHOW.find((t) => t.id === 17);
  if (lower.includes('anwar') || lower.includes('rudy')) return LIST_TIM_ROADSHOW.find((t) => t.id === 18);
  if (lower.includes('sayla') || lower.includes('dhita')) return LIST_TIM_ROADSHOW.find((t) => t.id === 19);

  return undefined;
};

export interface KabupatenStats {
  nama: string;
  sdCount: number;
  smpCount: number;
  totalSekolah: number;
  audienceCount: number;
  pendaftarCount: number;
  sdTargetMet: boolean; // >= 15 SD
  smpTargetMet: boolean; // >= 5 SMP
  isTargetMet: boolean; // both >= 15 SD and >= 5 SMP
}

export interface WilayahTargetProgress {
  wilayah: string;
  totalSekolah: number;
  totalSD: number;
  totalSMP: number;
  totalAudience: number;
  totalPendaftar: number;
  kabupatenStats: KabupatenStats[];
  kabupatenCount: number; // total distinct kab/kota visited
  qualifyingKabupatenCount: number; // kab/kota meeting both 15 SD & 5 SMP
  isTargetSelesai: boolean; // qualifyingKabupatenCount >= 2
  persentaseSelesai: number; // 0 - 100%
}

export const DAFTAR_WILAYAH = [
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
] as const;

export type WilayahName = typeof DAFTAR_WILAYAH[number];

export const TARGET_RULES = {
  MIN_KAB_KOTA: 2,
  MIN_SD_PER_KAB: 15,
  MIN_SMP_PER_KAB: 5,
};

export const DEFAULT_WILAYAH_PINS: Record<WilayahName, string> = {
  'Sulawesi tengah': 'sulteng2027',
  'Riau': 'riau2027',
  'Kalbar': 'kalbar2027',
  'Jabar': 'jabar2027',
  'Jateng': 'jateng2027',
  'Sumut': 'sumut2027',
  'Sumbar': 'sumbar2027',
  'Sumsel': 'sumsel2027',
  'Lampung': 'lampung2027',
  'Sulsel': 'sulsel2027',
  'Bali': 'bali2027',
  'NTB': 'ntb2027',
  'Bengkulu': 'bengkulu2027',
  'Kep. Riau': 'kepri2027',
};
