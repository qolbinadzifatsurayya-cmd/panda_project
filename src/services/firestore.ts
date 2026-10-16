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

/**
 * Fetch reports from Firestore with error handling
 */
export async function getReportsFromFirestore(wilayah?: string): Promise<SosialisasiReport[]> {
  try {
    const colRef = collection(db, REPORTS_COLLECTION);
    const q = wilayah ? query(colRef, where('wilayah', '==', wilayah)) : query(colRef);
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => d.data() as SosialisasiReport);
    // Sort newest first
    list.sort((a, b) => new Date(b.createdAt || b.tanggalKunjungan).getTime() - new Date(a.createdAt || a.tanggalKunjungan).getTime());
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, REPORTS_COLLECTION);
  }
}

/**
 * Save single report to Firestore
 */
export async function saveReportToFirestore(report: SosialisasiReport): Promise<void> {
  const path = `${REPORTS_COLLECTION}/${report.id}`;
  try {
    await setDoc(doc(db, REPORTS_COLLECTION, report.id), report);
  } catch (error) {
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
      const ref = doc(db, REPORTS_COLLECTION, item.id);
      batch.set(ref, item);
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, REPORTS_COLLECTION);
  }
}

/**
 * Update single report
 */
export async function updateReportInFirestore(id: string, data: Partial<SosialisasiReport>): Promise<void> {
  const path = `${REPORTS_COLLECTION}/${id}`;
  try {
    const ref = doc(db, REPORTS_COLLECTION, id);
    await setDoc(ref, data, { merge: true });
  } catch (error) {
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
  const colRef = collection(db, REPORTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as SosialisasiReport);
      list.sort((a, b) => new Date(b.createdAt || b.tanggalKunjungan).getTime() - new Date(a.createdAt || a.tanggalKunjungan).getTime());
      callback(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, REPORTS_COLLECTION);
    }
  );
}

/**
 * Seed initial sample reports into Firestore if the collection is empty
 */
export async function seedInitialReportsIfEmpty(initialSeed: SosialisasiReport[]): Promise<SosialisasiReport[]> {
  try {
    const colRef = collection(db, REPORTS_COLLECTION);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      console.log('Firestore is empty. Seeding initial reports...');
      const batch = writeBatch(db);
      for (const item of initialSeed) {
        batch.set(doc(db, REPORTS_COLLECTION, item.id), item);
      }
      await batch.commit();
      return initialSeed;
    }
    const list = snap.docs.map((d) => d.data() as SosialisasiReport);
    list.sort((a, b) => new Date(b.createdAt || b.tanggalKunjungan).getTime() - new Date(a.createdAt || a.tanggalKunjungan).getTime());
    return list;
  } catch (error) {
    console.warn('Firestore initial seeding error, falling back to local:', error);
    return initialSeed;
  }
}
