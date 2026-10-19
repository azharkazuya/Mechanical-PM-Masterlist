import React from 'react';
import { TabType } from '../types';
import { User } from 'firebase/auth';
import { 
  BarChart3, 
  CalendarRange, 
  TableProperties, 
  Grid3X3, 
  Users2, 
  FileDown, 
  Printer, 
  Plus,
  Cloud,
  CloudUpload,
  Loader2,
  LogIn,
  LogOut,
  ShieldCheck
} from 'lucide-react';

interface HeaderProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  totalItemsCount: number;
  onExportCsv: () => void;
  onPrint: () => void;
  onAddNew: () => void;
  user: User | null;
  isSyncing: boolean;
  cloudSynced: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onSyncAllToCloud: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  totalItemsCount,
  onExportCsv,
  onPrint,
  onAddNew,
  user,
  isSyncing,
  cloudSynced,
  onSignIn,
  onSignOut,
  onSyncAllToCloud,
}) => {
  const tabs = [
    { id: 'dashboard' as TabType, label: 'Executive Dashboard', icon: BarChart3 },
    { id: 'weekly' as TabType, label: 'Weekly Schedule Planner', icon: CalendarRange },
    { id: 'masterlist' as TabType, label: 'Masterlist Table', icon: TableProperties, count: totalItemsCount },
    { id: 'matrix' as TabType, label: '52-Week Matrix', icon: Grid3X3 },
    { id: 'roster' as TabType, label: 'PIC & Engineer Roster', icon: Users2 },
  ];

  const isAdmin = user?.email === 'azharkazuya@gmail.com';

  return (
    <header className="border-b border-slate-800/90 bg-slate-900/95 backdrop-blur-md sticky top-0 z-40 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Zone 1: Brand & Plant Identification */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/15">
            <span className="font-bold text-white text-base tracking-tighter">PM</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold text-slate-100 tracking-tight">JB Mechanical PM Masterlist</span>
              <span className="text-[11px] font-mono font-medium text-cyan-300 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-800/50">
                2026 Master
              </span>
            </div>
            <p className="text-xs text-slate-400">Civil Piping · Furnace PCP · 2F HE · 2F CE · CVD & CVD PCP · Batch Plant (Weeks 1 – 52)</p>
          </div>
        </div>

        {/* Zone 2: Cloud Sync & Authentication Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Cloud Sync Status Indicator */}
          <div 
            className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
              isSyncing
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : cloudSynced
                ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
            title="Real-time Firebase Firestore Sync"
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Syncing Cloud...</span>
              </>
            ) : cloudSynced ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                <Cloud className="w-3.5 h-3.5 text-teal-400" />
                <span>Firebase Live</span>
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5 text-slate-400" />
                <span>Offline / Local Cache</span>
              </>
            )}
          </div>

          {/* Sync to Cloud Button */}
          <button
            onClick={onSyncAllToCloud}
            disabled={isSyncing}
            className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700/80 active:bg-slate-700 text-slate-300 hover:text-slate-100 border border-slate-700/80 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
            title="Push local data to Firebase Firestore"
          >
            <CloudUpload className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Sync Masterlist</span>
          </button>

          {/* User Profile / Google Sign-In */}
          {user ? (
            <div className="flex items-center space-x-2 pl-1 border-l border-slate-800">
              <div className="flex items-center space-x-1.5 bg-slate-800/90 border border-slate-700/80 rounded-lg px-2.5 py-1">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-5 h-5 rounded-full object-cover border border-cyan-500/40" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-medium text-slate-200 leading-tight max-w-[110px] truncate" title={user.email || ''}>
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  {isAdmin && (
                    <span className="text-[9px] font-mono text-purple-300 font-semibold flex items-center gap-0.5">
                      <ShieldCheck className="w-2.5 h-2.5 text-purple-400" />
                      Engineer (Admin)
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onSignOut}
                className="p-1.5 bg-slate-800/90 hover:bg-rose-950/40 hover:text-rose-300 text-slate-400 border border-slate-700/80 rounded-lg text-xs transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="px-3 py-1.5 bg-slate-800/90 hover:bg-cyan-950/40 hover:text-cyan-300 text-slate-200 border border-slate-700/80 hover:border-cyan-700/50 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer"
              title="Sign in with Google to enable cloud database updates"
            >
              <LogIn className="w-3.5 h-3.5 text-cyan-400" />
              <span className="whitespace-nowrap">Sign In</span>
            </button>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-1.5 pl-1 border-l border-slate-800">
            <button
              onClick={onAddNew}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm shadow-cyan-600/20 transition-colors cursor-pointer"
              title="Add New Mechanical PM Item"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline whitespace-nowrap">Add PM Item</span>
            </button>
            <button
              onClick={onExportCsv}
              className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700/80 text-slate-300 border border-slate-700/80 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Export full schedule to CSV"
            >
              <FileDown className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline whitespace-nowrap">Export</span>
            </button>
            <button
              onClick={onPrint}
              className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700/80 text-slate-300 border border-slate-700/80 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Print or PDF view"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden md:inline whitespace-nowrap">Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Zone 3: Navigation Links / Segmented Control Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 border-t border-slate-800/70 pt-1 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3.5 py-2 text-xs sm:text-sm font-medium border-b-2 flex items-center space-x-2 transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-cyan-400 text-cyan-300 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className="ml-1 px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded font-mono text-[10px]">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
