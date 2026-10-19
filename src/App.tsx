import { useState, useCallback, useRef, useEffect } from 'react';
import { TabType, MechanicalPMItem, ExecutionStatus } from './types';
import { 
  getStoredItems, 
  saveStoredItems, 
  getStoredRecords, 
  saveExecutionRecord, 
  resetAllData,
  INITIAL_ITEMS
} from './data/pmStore';
import { 
  subscribeToAuth, 
  subscribeToExecutionRecords, 
  subscribeToPMItems,
  saveExecutionRecordToCloud,
  savePMItemToCloud,
  deletePMItemFromCloud,
  seedMasterlistToCloud,
  checkCloudItemsCount,
  signInWithGoogle,
  signOutUser
} from './services/firebaseService';
import { User } from 'firebase/auth';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { DashboardTab } from './components/DashboardTab';
import { WeeklyPlannerTab } from './components/WeeklyPlannerTab';
import { MasterlistTableTab } from './components/MasterlistTableTab';
import { MatrixTab } from './components/MatrixTab';
import { RosterTab } from './components/RosterTab';
import { JobDetailModal } from './components/JobDetailModal';
import { ItemFormModal } from './components/ItemFormModal';
import { CheckCircle2, Upload, Download, RefreshCw, CloudCheck, AlertCircle } from 'lucide-react';

export default function App() {
  const [items, setItems] = useState<MechanicalPMItem[]>(() => getStoredItems());
  const [records, setRecords] = useState(() => getStoredRecords());
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [weeklySelectedDomain, setWeeklySelectedDomain] = useState<string>('all');
  
  // Firebase Auth & Sync State
  const [user, setUser] = useState<User | null>(null);
  const [cloudSynced, setCloudSynced] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modals state
  const [detailItem, setDetailItem] = useState<MechanicalPMItem | null>(null);
  const [editingItem, setEditingItem] = useState<MechanicalPMItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  // Hidden file input for importing JSON backup
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type?: 'success' | 'info' | 'warn' } | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        showToast(`Signed in as ${currentUser.displayName || currentUser.email}`, 'info');
      }
    });
    return () => unsubscribe();
  }, [showToast]);

  // Real-time synchronization for execution records
  useEffect(() => {
    const unsubRecords = subscribeToExecutionRecords(
      (cloudRecords) => {
        if (Object.keys(cloudRecords).length > 0) {
          setRecords((prev) => {
            const merged = { ...prev, ...cloudRecords };
            try {
              localStorage.setItem('mech_pm_records_2026', JSON.stringify(merged));
            } catch (err) {
              console.warn('Failed to cache merged records locally', err);
            }
            return merged;
          });
          setCloudSynced(true);
        }
      },
      (err) => {
        console.warn('Firestore records sync notice:', err);
      }
    );

    return () => unsubRecords();
  }, []);

  // Real-time synchronization for PM items
  useEffect(() => {
    const unsubItems = subscribeToPMItems(
      (cloudItems) => {
        if (!cloudItems || cloudItems.length === 0) return;

        setItems((prev) => {
          let updatedList: MechanicalPMItem[];
          if (cloudItems.length >= INITIAL_ITEMS.length) {
            updatedList = cloudItems;
          } else {
            // Guard against partial cloud datasets: merge by ID with base items
            const cloudMap = new Map<number, MechanicalPMItem>(cloudItems.map((i) => [i.id, i]));
            const baseItems = prev.length >= INITIAL_ITEMS.length ? prev : INITIAL_ITEMS;
            updatedList = baseItems.map((item) => cloudMap.get(item.id) || item);
            // Append any new cloud items not in base
            cloudItems.forEach((cItem) => {
              if (!baseItems.some((b) => b.id === cItem.id)) {
                updatedList.push(cItem);
              }
            });
            updatedList.sort((a, b) => a.id - b.id);
          }
          saveStoredItems(updatedList);
          return updatedList;
        });
        setCloudSynced(true);
      },
      (err) => {
        console.warn('Firestore items sync notice:', err);
      }
    );

    return () => unsubItems();
  }, []);

  // Check if initial items exist in cloud on startup
  useEffect(() => {
    checkCloudItemsCount().then((count) => {
      if (count > 0) {
        setCloudSynced(true);
      }
    }).catch(() => {
      // Offline or initial
    });
  }, []);

  // Handle Google Sign-In
  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      showToast('Signed in with Google successfully!', 'success');
    } catch (err) {
      showToast('Google Sign-in was cancelled or encountered an error.', 'warn');
    }
  };

  // Handle Google Sign-Out
  const handleSignOut = async () => {
    try {
      await signOutUser();
      showToast('Signed out of Firebase account.', 'info');
    } catch {
      showToast('Failed to sign out.', 'warn');
    }
  };

  // Push local items to Firestore masterlist
  const handleSyncAllToCloud = async () => {
    setIsSyncing(true);
    showToast(`Syncing ${items.length} PM routines to Firebase Firestore...`, 'info');
    try {
      const count = await seedMasterlistToCloud(items, (processed, total) => {
        if (processed % 100 === 0 || processed === total) {
          showToast(`Synced ${processed}/${total} PM items to Firestore...`, 'info');
        }
      });
      setCloudSynced(true);
      showToast(`Masterlist synchronized! ${count} routines live in Firestore.`, 'success');
    } catch (err) {
      console.error('Cloud sync failed:', err);
      showToast('Sync error: Ensure you are signed in with plant authorization.', 'warn');
    } finally {
      setIsSyncing(false);
    }
  };

  // Update routine status
  const handleStatusChange = useCallback((itemId: number, week: number, status: ExecutionStatus) => {
    // 1. Optimistic local update
    const updated = saveExecutionRecord(itemId, week, status);
    setRecords({ ...updated });
    showToast(`Status updated to "${status.replace('_', ' ')}" for Week ${week}`);

    // 2. Cloud sync in background
    saveExecutionRecordToCloud(itemId, week, status).catch((err) => {
      console.warn('Execution record saved locally; cloud sync failed:', err);
    });
  }, [showToast]);

  // On-the-spot item update
  const handleUpdateItemOnTheSpot = useCallback((updatedItem: MechanicalPMItem) => {
    const normalized: MechanicalPMItem = {
      ...updatedItem,
      pic: updatedItem.pic === 'Boilermen' ? 'Boilerman' : updatedItem.pic,
    };
    // 1. Local update
    setItems((prev) => {
      const next = prev.map((it) => (it.id === normalized.id ? normalized : it));
      saveStoredItems(next);
      return next;
    });
    showToast(`Updated routine ${normalized.pm_no} (${normalized.machine}) on the spot!`);

    // 2. Cloud update
    savePMItemToCloud(normalized).catch((err) => {
      console.warn('PM item saved locally; cloud sync failed:', err);
    });
  }, [showToast]);

  // On-the-spot item delete
  const handleDeleteItem = useCallback((itemId: number) => {
    // 1. Local delete
    setItems((prev) => {
      const target = prev.find((i) => i.id === itemId);
      const next = prev.filter((it) => it.id !== itemId);
      saveStoredItems(next);
      showToast(`Deleted routine ${target?.pm_no || ''}`);
      return next;
    });

    // 2. Cloud delete
    deletePMItemFromCloud(itemId).catch((err) => {
      console.warn('PM item deleted locally; cloud delete failed:', err);
    });
  }, [showToast]);

  // Save new or edited item from modal
  const handleSaveItem = useCallback((savedItem: MechanicalPMItem) => {
    const normalized: MechanicalPMItem = {
      ...savedItem,
      pic: savedItem.pic === 'Boilermen' ? 'Boilerman' : savedItem.pic,
    };
    // 1. Local save
    setItems((prev) => {
      const exists = prev.some((it) => it.id === normalized.id);
      let next: MechanicalPMItem[];
      if (exists) {
        next = prev.map((it) => (it.id === normalized.id ? normalized : it));
        showToast(`PM item ${normalized.pm_no} updated successfully!`);
      } else {
        next = [normalized, ...prev];
        showToast(`New PM item ${normalized.pm_no} added successfully!`);
      }
      saveStoredItems(next);
      return next;
    });

    // 2. Cloud save
    savePMItemToCloud(normalized).catch((err) => {
      console.warn('Item saved locally; cloud sync failed:', err);
    });
  }, [showToast]);

  // CSV Export
  const handleExportCsv = useCallback(() => {
    const headers = [
      'ID',
      'PM Routine No',
      'Domain',
      'Source Sheet',
      'Category',
      'Location',
      'Section',
      'Machine Description',
      'PIC',
      'Engineer',
      'Frequency',
      'Check Sheet',
      'Total Weeks Scheduled',
      'Scheduled Weeks List',
    ];
    for (let w = 1; w <= 52; w++) {
      headers.push(`Week ${w}`);
    }

    const rows: string[][] = [headers];
    items.forEach((it) => {
      const picNormalized = it.pic === 'Boilermen' ? 'Boilerman' : it.pic;
      const row: string[] = [
        String(it.id),
        `"${it.pm_no}"`,
        `"${it.domain}"`,
        `"${it.sheet}"`,
        `"${it.category}"`,
        `"${it.location}"`,
        `"${it.section}"`,
        `"${it.machine.replace(/"/g, '""')}"`,
        `"${picNormalized}"`,
        `"${it.engineer}"`,
        `"${it.frequency}"`,
        `"${it.check_sheet}"`,
        String(it.scheduled_weeks.length),
        `"${it.scheduled_weeks.join(', ')}"`,
      ];

      for (let w = 1; w <= 52; w++) {
        if (it.scheduled_weeks.includes(w)) {
          const dt = it.weeks_detail && it.weeks_detail[w]?.val ? it.weeks_detail[w].val : 'Y';
          row.push(`"${dt}"`);
        } else {
          row.push('""');
        }
      }
      rows.push(row);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `JB_Mechanical_PM_Masterlist_Schedule_2026.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('Exported PM routines to CSV!');
  }, [items, showToast]);

  // Export JSON Backup
  const handleExportJson = useCallback(() => {
    const jsonStr = JSON.stringify(items, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `JB_Mechanical_PM_Custom_Data_2026.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Custom PM data backup downloaded as JSON!');
  }, [items, showToast]);

  // Import JSON Backup
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed.map((it: MechanicalPMItem) => ({
            ...it,
            pic: it.pic === 'Boilermen' ? 'Boilerman' : it.pic,
          }));
          setItems(normalized);
          saveStoredItems(normalized);
          showToast(`Successfully imported ${normalized.length} PM routines!`);
        } else {
          showToast('Invalid JSON file format.', 'warn');
        }
      } catch {
        showToast('Failed to parse JSON file.', 'warn');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Print view
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Quick navigation handlers from charts
  const handleSelectDomainFromDashboard = useCallback((domain: string) => {
    setWeeklySelectedDomain(domain);
    setCurrentTab('weekly');
  }, []);

  const handleSelectWeekFromDashboard = useCallback((week: number) => {
    setCurrentWeek(week);
    setCurrentTab('weekly');
  }, []);

  const handleResetToFactoryData = useCallback(() => {
    if (window.confirm(`Reset all modifications and return to factory ${INITIAL_ITEMS.length} PM masterlist data?`)) {
      resetAllData();
      setItems(INITIAL_ITEMS);
      setRecords({});
      showToast('Reset to original masterlist data completed.');
    }
  }, [showToast]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Bar Header with Firebase Auth & Cloud Sync */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        totalItemsCount={items.length}
        onExportCsv={handleExportCsv}
        onPrint={handlePrint}
        onAddNew={() => {
          setEditingItem(null);
          setIsFormOpen(true);
        }}
        user={user}
        isSyncing={isSyncing}
        cloudSynced={cloudSynced}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onSyncAllToCloud={handleSyncAllToCloud}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6">
        {/* KPI Summary Cards */}
        <KpiCards items={items} />

        {/* Tab 1: Executive Dashboard */}
        {currentTab === 'dashboard' && (
          <DashboardTab
            items={items}
            onSelectDomain={handleSelectDomainFromDashboard}
            onSelectWeek={handleSelectWeekFromDashboard}
          />
        )}

        {/* Tab 2: Weekly Schedule Planner */}
        {currentTab === 'weekly' && (
          <WeeklyPlannerTab
            items={items}
            currentWeek={currentWeek}
            onWeekChange={setCurrentWeek}
            selectedDomain={weeklySelectedDomain}
            onDomainChange={setWeeklySelectedDomain}
            records={records}
            onStatusChange={handleStatusChange}
            onInspectItem={(item) => setDetailItem(item)}
            onUpdateItemOnTheSpot={handleUpdateItemOnTheSpot}
          />
        )}

        {/* Tab 3: Masterlist Table */}
        {currentTab === 'masterlist' && (
          <MasterlistTableTab
            items={items}
            onInspectItem={(item) => setDetailItem(item)}
            onEditItem={(item) => {
              setEditingItem(item);
              setIsFormOpen(true);
            }}
            onUpdateItemOnTheSpot={handleUpdateItemOnTheSpot}
            onDeleteItem={handleDeleteItem}
            onAddNew={() => {
              setEditingItem(null);
              setIsFormOpen(true);
            }}
          />
        )}

        {/* Tab 4: 52-Week Matrix (Heatmap) */}
        {currentTab === 'matrix' && (
          <MatrixTab
            items={items}
            onInspectItem={(item) => setDetailItem(item)}
            onSelectWeek={(w) => {
              setCurrentWeek(w);
              setCurrentTab('weekly');
            }}
            onUpdateItemOnTheSpot={handleUpdateItemOnTheSpot}
          />
        )}

        {/* Tab 5: PIC & Engineer Roster */}
        {currentTab === 'roster' && (
          <RosterTab
            items={items}
            onSelectPic={() => {
              setCurrentTab('masterlist');
            }}
            onSelectEngineer={() => {
              setCurrentTab('masterlist');
            }}
          />
        )}
      </main>

      {/* Footer & Data Customization Tools */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span>JB Plant Mechanical PM Masterlist & Schedule System · 2026 Master</span>
            <span>·</span>
            <span className="text-cyan-400 font-mono">{items.length} Routines</span>
            <span>·</span>
            <span className="text-slate-400 flex items-center gap-1">
              <CloudCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Firebase Database: celtic-yew-73bk6</span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* JSON Export/Import for on-the-spot backup and restore */}
            <button
              onClick={handleExportJson}
              className="text-slate-400 hover:text-cyan-400 flex items-center space-x-1 transition cursor-pointer"
              title="Download your custom data as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Backup JSON</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-slate-400 hover:text-cyan-400 flex items-center space-x-1 transition cursor-pointer"
              title="Upload previously saved JSON data"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportJson}
              accept=".json"
              className="hidden"
            />

            <span className="text-slate-700">|</span>

            <button
              onClick={handleResetToFactoryData}
              className="text-slate-500 hover:text-amber-400 flex items-center space-x-1 transition cursor-pointer"
              title="Reset all changes back to factory default data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Factory</span>
            </button>

            <span className="text-slate-700">|</span>
            <span className="text-slate-400">Engineers: Azhar, Syazwan, Hazlizam, Eqbal</span>
          </div>
        </div>
      </footer>

      {/* Item Details Modal */}
      <JobDetailModal
        item={detailItem}
        records={records}
        onClose={() => setDetailItem(null)}
        onStatusChange={handleStatusChange}
        onShowToast={(msg) => showToast(msg, 'success')}
      />

      {/* Item Create/Edit Modal */}
      <ItemFormModal
        item={editingItem}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center space-x-2 px-4 py-2.5 rounded-xl shadow-2xl border text-xs font-semibold backdrop-blur-md transition-all ${
          toastMessage.type === 'warn'
            ? 'bg-amber-950/90 text-amber-200 border-amber-500/40'
            : toastMessage.type === 'info'
            ? 'bg-sky-950/90 text-sky-200 border-sky-500/40'
            : 'bg-teal-950/90 text-teal-200 border-teal-500/40'
        }`}>
          {toastMessage.type === 'warn' ? (
            <AlertCircle className="w-4 h-4 text-amber-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-teal-300" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
