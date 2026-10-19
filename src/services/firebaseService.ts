import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  getDocs,
  limit,
  query
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  signOut, 
  User, 
  onAuthStateChanged 
} from 'firebase/auth';
import { db, auth, googleProvider, OperationType, handleFirestoreError } from '../firebase';
import { MechanicalPMItem, ExecutionRecord, ExecutionStatus } from '../types';

export interface CloudSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  cloudItemCount: number;
}

/**
 * Listen to real-time execution record updates from Firestore
 */
export function subscribeToExecutionRecords(
  onUpdate: (records: Record<string, ExecutionRecord>) => void,
  onError?: (err: unknown) => void
) {
  const colRef = collection(db, 'execution_records');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const recordsMap: Record<string, ExecutionRecord> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.status) {
          recordsMap[docSnap.id] = {
            status: data.status as ExecutionStatus,
            updatedAt: data.updatedAt || new Date().toISOString(),
            note: data.note || '',
          };
        }
      });
      onUpdate(recordsMap);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, 'execution_records');
    }
  );
}

/**
 * Save an individual execution record to Firestore
 */
export async function saveExecutionRecordToCloud(
  itemId: number,
  weekNumber: number,
  status: ExecutionStatus,
  note?: string
): Promise<void> {
  const docId = `${itemId}_w${weekNumber}`;
  const docRef = doc(db, 'execution_records', docId);

  const payload: Record<string, unknown> = {
    id: docId,
    itemId,
    weekNumber,
    status,
    updatedAt: new Date().toISOString(),
  };

  if (note && note.trim().length > 0) {
    payload.note = note.trim().slice(0, 1000);
  }

  if (auth.currentUser?.email || auth.currentUser?.uid) {
    payload.updatedBy = (auth.currentUser.email || auth.currentUser.uid).slice(0, 128);
  }

  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `execution_records/${docId}`);
  }
}

/**
 * Listen to real-time PM Items updates from Firestore
 */
export function subscribeToPMItems(
  onUpdate: (items: MechanicalPMItem[]) => void,
  onError?: (err: unknown) => void
) {
  const colRef = collection(db, 'pm_items');
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        return;
      }
      const itemsList: MechanicalPMItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && typeof data.id === 'number') {
          itemsList.push({
            id: data.id,
            domain: data.domain || 'General',
            sheet: data.sheet || '',
            category: data.category || '',
            pm_no: data.pm_no || '',
            location: data.location || '',
            section: data.section || '',
            machine: data.machine || '',
            pic: data.pic || '',
            engineer: data.engineer || '',
            check_sheet: data.check_sheet || '',
            frequency: data.frequency || '1M',
            scheduled_weeks: Array.isArray(data.scheduled_weeks) ? data.scheduled_weeks : [],
            weeks_detail: data.weeks_detail || {},
          });
        }
      });
      // Sort by ID ascending
      itemsList.sort((a, b) => a.id - b.id);
      onUpdate(itemsList);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, 'pm_items');
    }
  );
}

/**
 * Save / Update a PM item to Firestore
 */
export async function savePMItemToCloud(item: MechanicalPMItem): Promise<void> {
  const docId = String(item.id);
  const docRef = doc(db, 'pm_items', docId);

  const payload: Record<string, unknown> = {
    id: Number(item.id),
    domain: String(item.domain || '').slice(0, 64),
    sheet: String(item.sheet || '').slice(0, 64),
    category: String(item.category || '').slice(0, 64),
    pm_no: String(item.pm_no || '').slice(0, 64),
    location: String(item.location || '').slice(0, 128),
    section: String(item.section || '').slice(0, 128),
    machine: String(item.machine || '').slice(0, 256),
    pic: String(item.pic || '').slice(0, 64),
    engineer: String(item.engineer || '').slice(0, 64),
    check_sheet: String(item.check_sheet || '').slice(0, 128),
    frequency: String(item.frequency || '1M').slice(0, 64),
    scheduled_weeks: item.scheduled_weeks || [],
    updatedAt: new Date().toISOString(),
  };

  if (item.weeks_detail) {
    payload.weeks_detail = item.weeks_detail;
  }

  if (auth.currentUser?.email || auth.currentUser?.uid) {
    payload.updatedBy = (auth.currentUser.email || auth.currentUser.uid).slice(0, 128);
  }

  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `pm_items/${docId}`);
  }
}

/**
 * Delete a PM item from Firestore
 */
export async function deletePMItemFromCloud(itemId: number): Promise<void> {
  const docId = String(itemId);
  const docRef = doc(db, 'pm_items', docId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `pm_items/${docId}`);
  }
}

/**
 * Seed all local masterlist items to Firestore in batches
 */
export async function seedMasterlistToCloud(
  items: MechanicalPMItem[],
  onProgress?: (count: number, total: number) => void
): Promise<number> {
  const batchSize = 100;
  let processed = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = items.slice(i, i + batchSize);

    for (const item of chunk) {
      const docRef = doc(db, 'pm_items', String(item.id));
      const payload: Record<string, unknown> = {
        id: Number(item.id),
        domain: String(item.domain || '').slice(0, 64),
        sheet: String(item.sheet || '').slice(0, 64),
        category: String(item.category || '').slice(0, 64),
        pm_no: String(item.pm_no || '').slice(0, 64),
        location: String(item.location || '').slice(0, 128),
        section: String(item.section || '').slice(0, 128),
        machine: String(item.machine || '').slice(0, 256),
        pic: String(item.pic || '').slice(0, 64),
        engineer: String(item.engineer || '').slice(0, 64),
        check_sheet: String(item.check_sheet || '').slice(0, 128),
        frequency: String(item.frequency || '1M').slice(0, 64),
        scheduled_weeks: item.scheduled_weeks || [],
        updatedAt: new Date().toISOString(),
      };
      if (item.weeks_detail) {
        payload.weeks_detail = item.weeks_detail;
      }
      batch.set(docRef, payload, { merge: true });
    }

    try {
      await batch.commit();
      processed += chunk.length;
      if (onProgress) onProgress(processed, items.length);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'pm_items/batch');
    }
  }

  return processed;
}

/**
 * Check if the Firestore PM items collection is currently populated
 */
export async function checkCloudItemsCount(): Promise<number> {
  try {
    const q = query(collection(db, 'pm_items'), limit(5));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch {
    return 0;
  }
}

/**
 * Authentication helpers
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Record user profile in users collection
    if (result.user) {
      const userRef = doc(db, 'users', result.user.uid);
      await setDoc(userRef, {
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || '',
        role: result.user.email === 'azharkazuya@gmail.com' ? 'admin' : 'engineer',
        createdAt: new Date().toISOString(),
      }, { merge: true });
    }
    return result.user;
  } catch (error) {
    console.error('Sign in failed:', error);
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out failed:', error);
    throw error;
  }
}

export function subscribeToAuth(onUserChange: (user: User | null) => void) {
  return onAuthStateChanged(auth, onUserChange);
}
