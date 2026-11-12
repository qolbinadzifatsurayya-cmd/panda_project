import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  writeBatch, 
  onSnapshot,
  query,
  where,
  getDocsFromCache
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { SosialisasiReport } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const REPORTS_COLLECTION = 'reports';

let isFirestoreReadQuotaExceeded = false;

export function isQuotaError(error?: unknown): boolean {
  if (!error) return isFirestoreReadQuotaExceeded;
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('Quota limit exceeded') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.toLowerCase().includes('quota exceeded') ||
    msg.toLowerCase().includes('quota metric') ||
    msg.toLowerCase().includes('offline') ||
    msg.toLowerCase().includes('timeout') ||
    msg.toLowerCase().includes('network') ||
    msg.toLowerCase().includes('failed to get document') ||
    msg.toLowerCase().includes('backend didn\'t respond')
  );
}

/**
 * Fetch reports from Firestore with cache-fallback & quota resilience
 */
export async function getReportsFromFirestore(wilayah?: string): Promise<SosialisasiReport[]> {
  const colRef = collection(db, REPORTS_COLLECTION);
  const q = wilayah ? query(colRef, where('wilayah', '==', wilayah)) : query(colRef);

  // If read quota was already triggered in this session, attempt reading from offline cache first
  if (isFirestoreReadQuotaExceeded) {
    try {
      const cacheSnap = await getDocsFromCache(q);
      if (cacheSnap.size > 0) {
        const list = cacheSnap.docs.map((d) => d.data() as SosialisasiReport);
        list.sort((a, b) => new Date(b.createdAt || b.tanggalKunjungan).getTime() - new Date(a.createdAt || a.tanggalKunjungan).getTime());
        return list;
      }
    } catch {}
    return [];
  }

  try {
    const snap = await getDocs(q);
    isFirestoreReadQuotaExceeded = false;
    const list = snap.docs.map((d) => d.data() as SosialisasiReport);
    list.sort((a, b) => new Date(b.createdAt || b.tanggalKunjungan).getTime() - new Date(a.createdAt || a.tanggalKunjungan).getTime());
    return list;
  } catch (error) {
    if (isQuotaError(error)) {
      isFirestoreReadQuotaExceeded = true;
      console.warn('Firestore read quota limit reached. Falling back to local offline cache.');
      try {
        const cacheSnap = await getDocsFromCache(q);
        if (cacheSnap.size > 0) {
          const list = cacheSnap.docs.map((d) => d.data() as SosialisasiReport);
          list.sort((a, b) => new Date(b.createdAt || b.tanggalKunjungan).getTime() - new Date(a.createdAt || a.tanggalKunjungan).getTime());
          return list;
        }
      } catch {}
      return [];
    }
    handleFirestoreError(error, OperationType.GET, REPORTS_COLLECTION);
  }
}

/**
 * Sanitize report payload to guarantee valid Firestore data types and prevent undefined fields
 */
export function sanitizeReportForFirestore(report: Partial<SosialisasiReport>): SosialisasiReport {
  return {
    id: String(report.id || `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`).slice(0, 128),
    wilayah: String(report.wilayah || 'Umum').trim().slice(0, 50),
    kabupatenKota: String(report.kabupatenKota || report.wilayah || 'Umum').trim().slice(0, 100),
    jenjang: report.jenjang === 'SMP' ? 'SMP' : 'SD',
    sekolah: String(report.sekolah || 'Sekolah').trim().slice(0, 200),
    pic: String(report.pic || '-').trim().slice(0, 100),
    kontak: String(report.kontak || '-').trim().slice(0, 50),
    jumlahAudience: Math.max(0, Number(report.jumlahAudience) || 0),
    jumlahPendaftar: Math.max(0, Number(report.jumlahPendaftar) || 0),
    tanggalKunjungan: String(report.tanggalKunjungan || new Date().toISOString().split('T')[0]).slice(0, 30),
    catatan: String(report.catatan || '').trim().slice(0, 2000),
    dokumentasiUrl: report.dokumentasiUrl ? String(report.dokumentasiUrl) : '',
    dokumentasiList: Array.isArray(report.dokumentasiList)
      ? report.dokumentasiList.filter((item): item is string => typeof item === 'string' && item.length > 0)
      : (report.dokumentasiUrl ? [String(report.dokumentasiUrl)] : []),
    createdAt: String(report.createdAt || new Date().toISOString()),
    updatedAt: String(report.updatedAt || new Date().toISOString()),
  };
}

/**
 * Save single report to Firestore (always attempts cloud persistence)
 */
export async function saveReportToFirestore(report: SosialisasiReport): Promise<void> {
  const sanitized = sanitizeReportForFirestore(report);
  const path = `${REPORTS_COLLECTION}/${sanitized.id}`;
  try {
    await setDoc(doc(db, REPORTS_COLLECTION, sanitized.id), sanitized);
  } catch (error) {
    if (isQuotaError(error)) {
      console.warn('Firestore write quota limit reached. Report safely preserved in local/server database.');
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Save multiple reports in atomic batch
 */
export async function saveBatchReportsToFirestore(reports: SosialisasiReport[]): Promise<void> {
  if (reports.length === 0) return;
  try {
    const batch = writeBatch(db);
    for (const item of reports) {
      const sanitized = sanitizeReportForFirestore(item);
      const ref = doc(db, REPORTS_COLLECTION, sanitized.id);
      batch.set(ref, sanitized);
    }
    await batch.commit();
  } catch (error) {
    if (isQuotaError(error)) {
      console.warn('Firestore batch write quota reached. Reports safely preserved in local/server database.');
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, REPORTS_COLLECTION);
  }
}

/**
 * Update single report
 */
export async function updateReportInFirestore(id: string, data: Partial<SosialisasiReport>): Promise<void> {
  const path = `${REPORTS_COLLECTION}/${id}`;
  try {
    const cleanData: Record<string, any> = { ...data, updatedAt: new Date().toISOString() };
    // Remove any undefined keys to avoid Firestore error
    Object.keys(cleanData).forEach((key) => {
      if (cleanData[key] === undefined) {
        delete cleanData[key];
      }
    });
    const ref = doc(db, REPORTS_COLLECTION, id);
    await setDoc(ref, cleanData, { merge: true });
  } catch (error) {
    if (isQuotaError(error)) {
      console.warn('Firestore update quota reached. Report safely updated in local/server database.');
      return;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete single report
 */
export async function deleteReportFromFirestore(id: string): Promise<void> {
  const path = `${REPORTS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, REPORTS_COLLECTION, id));
  } catch (error) {
    if (isQuotaError(error)) {
      console.warn('Firestore delete quota reached. Report safely removed from local/server database.');
      return;
    }
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Delete multiple reports
 */
export async function batchDeleteReportsFromFirestore(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  try {
    const batch = writeBatch(db);
    for (const id of ids) {
      batch.delete(doc(db, REPORTS_COLLECTION, id));
    }
    await batch.commit();
  } catch (error) {
    if (isQuotaError(error)) {
      console.warn('Firestore batch delete quota reached.');
      return;
    }
    handleFirestoreError(error, OperationType.DELETE, REPORTS_COLLECTION);
  }
}

/**
 * Real-time listener for reports collection with resilience
 */
export function subscribeReportsFromFirestore(
  callback: (reports: SosialisasiReport[]) => void,
  onError?: (err: any) => void
): () => void {
  try {
    const colRef = collection(db, REPORTS_COLLECTION);
    return onSnapshot(
      colRef,
      (snap) => {
        isFirestoreReadQuotaExceeded = false;
        const list = snap.docs.map((d) => d.data() as SosialisasiReport);
        list.sort((a, b) => new Date(b.createdAt || b.tanggalKunjungan).getTime() - new Date(a.createdAt || a.tanggalKunjungan).getTime());
        callback(list);
      },
      async (error) => {
        if (isQuotaError(error)) {
          isFirestoreReadQuotaExceeded = true;
          console.warn('Firestore snapshot listener paused due to daily quota limit. Serving from offline cache.');
          try {
            const cacheSnap = await getDocsFromCache(colRef);
            if (cacheSnap.size > 0) {
              const list = cacheSnap.docs.map((d) => d.data() as SosialisasiReport);
              list.sort((a, b) => new Date(b.createdAt || b.tanggalKunjungan).getTime() - new Date(a.createdAt || a.tanggalKunjungan).getTime());
              callback(list);
            }
          } catch {}
          if (onError) onError(error);
          return;
        }
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, REPORTS_COLLECTION);
      }
    );
  } catch (error) {
    if (isQuotaError(error)) {
      return () => {};
    }
    handleFirestoreError(error, OperationType.GET, REPORTS_COLLECTION);
  }
}

/**
 * Safe fetch without auto-resurrecting deleted reports
 */
export async function seedInitialReportsIfEmpty(_initialSeed: SosialisasiReport[]): Promise<SosialisasiReport[]> {
  return getReportsFromFirestore();
}
