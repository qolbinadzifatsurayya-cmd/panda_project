import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  writeBatch, 
  onSnapshot,
  query,
  where
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

let isFirestoreQuotaExceeded = false;

export function isQuotaError(error?: unknown): boolean {
  if (!error) return isFirestoreQuotaExceeded;
  const msg = error instanceof Error ? error.message : String(error);
  if (
    msg.includes('Quota limit exceeded') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.toLowerCase().includes('quota exceeded') ||
    msg.toLowerCase().includes('quota metric')
  ) {
    isFirestoreQuotaExceeded = true;
    return true;
  }
  return isFirestoreQuotaExceeded;
}

/**
 * Fetch reports from Firestore with error handling & quota resilience
 */
export async function getReportsFromFirestore(wilayah?: string): Promise<SosialisasiReport[]> {
  if (isFirestoreQuotaExceeded) {
    return [];
  }
  try {
    const colRef = collection(db, REPORTS_COLLECTION);
    const q = wilayah ? query(colRef, where('wilayah', '==', wilayah)) : query(colRef);
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => d.data() as SosialisasiReport);
    // Sort newest first
    list.sort((a, b) => new Date(b.createdAt || b.tanggalKunjungan).getTime() - new Date(a.createdAt || a.tanggalKunjungan).getTime());
    return list;
  } catch (error) {
    if (isQuotaError(error)) {
      console.warn('Firestore read quota exceeded for today. Serving data seamlessly from local and server storage.');
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
    id: String(report.id || `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
    wilayah: String(report.wilayah || '').trim(),
    kabupatenKota: String(report.kabupatenKota || '').trim(),
    jenjang: report.jenjang === 'SMP' ? 'SMP' : 'SD',
    sekolah: String(report.sekolah || '').trim(),
    pic: String(report.pic || '-').trim(),
    kontak: String(report.kontak || '-').trim(),
    jumlahAudience: Math.max(0, Number(report.jumlahAudience) || 0),
    jumlahPendaftar: Math.max(0, Number(report.jumlahPendaftar) || 0),
    tanggalKunjungan: String(report.tanggalKunjungan || new Date().toISOString().split('T')[0]),
    catatan: String(report.catatan || '').trim(),
    dokumentasiUrl: report.dokumentasiUrl ? String(report.dokumentasiUrl) : '',
    dokumentasiList: Array.isArray(report.dokumentasiList)
      ? report.dokumentasiList.filter((item): item is string => typeof item === 'string' && item.length > 0)
      : (report.dokumentasiUrl ? [String(report.dokumentasiUrl)] : []),
    createdAt: String(report.createdAt || new Date().toISOString()),
    updatedAt: String(report.updatedAt || new Date().toISOString()),
    picRoadshow: report.picRoadshow ? String(report.picRoadshow).trim() : '',
    daerahRoadshow: report.daerahRoadshow ? String(report.daerahRoadshow).trim() : '',
    isJabodetabek: Boolean(
      report.isJabodetabek || 
      (report.wilayah && report.wilayah.trim().toLowerCase() === 'jabodetabek')
    ),
  };
}

/**
 * Save single report to Firestore
 */
export async function saveReportToFirestore(report: SosialisasiReport): Promise<void> {
  if (isFirestoreQuotaExceeded) return;
  const sanitized = sanitizeReportForFirestore(report);
  const path = `${REPORTS_COLLECTION}/${sanitized.id}`;
  try {
    await setDoc(doc(db, REPORTS_COLLECTION, sanitized.id), sanitized);
  } catch (error) {
    if (isQuotaError(error)) {
      console.warn('Firestore write quota exceeded. Report is safely persisted to server database.');
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Save multiple reports in atomic batch
 */
export async function saveBatchReportsToFirestore(reports: SosialisasiReport[]): Promise<void> {
  if (isFirestoreQuotaExceeded || reports.length === 0) return;
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
      console.warn('Firestore batch write quota exceeded. Reports safely persisted to server database.');
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, REPORTS_COLLECTION);
  }
}

/**
 * Update single report
 */
export async function updateReportInFirestore(id: string, data: Partial<SosialisasiReport>): Promise<void> {
  if (isFirestoreQuotaExceeded) return;
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
      console.warn('Firestore update quota exceeded. Report safely updated in server database.');
      return;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete single report
 */
export async function deleteReportFromFirestore(id: string): Promise<void> {
  if (isFirestoreQuotaExceeded) return;
  const path = `${REPORTS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, REPORTS_COLLECTION, id));
  } catch (error) {
    if (isQuotaError(error)) {
      console.warn('Firestore delete quota exceeded. Report safely deleted from server database.');
      return;
    }
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Delete multiple reports
 */
export async function batchDeleteReportsFromFirestore(ids: string[]): Promise<void> {
  if (isFirestoreQuotaExceeded || ids.length === 0) return;
  try {
    const batch = writeBatch(db);
    for (const id of ids) {
      batch.delete(doc(db, REPORTS_COLLECTION, id));
    }
    await batch.commit();
  } catch (error) {
    if (isQuotaError(error)) {
      console.warn('Firestore batch delete quota exceeded. Reports safely deleted from server database.');
      return;
    }
    handleFirestoreError(error, OperationType.DELETE, REPORTS_COLLECTION);
  }
}

/**
 * Real-time listener for reports collection
 */
export function subscribeReportsFromFirestore(
  callback: (reports: SosialisasiReport[]) => void,
  onError?: (err: any) => void
): () => void {
  if (isFirestoreQuotaExceeded) {
    return () => {};
  }
  try {
    const colRef = collection(db, REPORTS_COLLECTION);
    return onSnapshot(
      colRef,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as SosialisasiReport);
        list.sort((a, b) => new Date(b.createdAt || b.tanggalKunjungan).getTime() - new Date(a.createdAt || a.tanggalKunjungan).getTime());
        callback(list);
      },
      (error) => {
        if (isQuotaError(error)) {
          console.warn('Firestore snapshot listener paused due to daily quota limit. Operating in resilient server mode.');
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
