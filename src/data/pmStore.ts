import initialData from './pmItems.json';
import { MechanicalPMItem, ExecutionRecord, ExecutionStatus } from '../types';

const STORAGE_KEY_ITEMS = 'mech_pm_items_2026_v9';
const STORAGE_KEY_RECORDS = 'mech_pm_records_2026';

export const INITIAL_ITEMS: MechanicalPMItem[] = initialData as MechanicalPMItem[];

export function getStoredItems(): MechanicalPMItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ITEMS);
    if (!raw) return INITIAL_ITEMS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length >= INITIAL_ITEMS.length) {
      return parsed;
    }
    return INITIAL_ITEMS;
  } catch {
    return INITIAL_ITEMS;
  }
}

export function saveStoredItems(items: MechanicalPMItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save PM items to localStorage', err);
  }
}

export function getStoredRecords(): Record<string, ExecutionRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECORDS);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

export function saveExecutionRecord(
  itemId: number,
  weekNumber: number,
  status: ExecutionStatus,
  note?: string
): Record<string, ExecutionRecord> {
  const records = getStoredRecords();
  const key = `${itemId}_w${weekNumber}`;
  records[key] = {
    status,
    updatedAt: new Date().toISOString(),
    note: note || '',
  };
  try {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save record to localStorage', err);
  }
  return records;
}

export function resetAllData(): void {
  localStorage.removeItem(STORAGE_KEY_ITEMS);
  localStorage.removeItem(STORAGE_KEY_RECORDS);
}

export function getDomainColor(domain: string) {
  switch (domain) {
    case 'Civil Piping':
      return {
        badgeBg: 'bg-sky-500/15',
        badgeText: 'text-sky-300',
        badgeBorder: 'border-sky-500/30',
        dot: 'bg-sky-400',
        accentHex: '#38bdf8',
        chipActive: 'bg-sky-600 text-white',
        cellBg: 'bg-sky-400',
        cellText: 'text-slate-950',
      };
    case 'Furnace PCP':
      return {
        badgeBg: 'bg-amber-500/15',
        badgeText: 'text-amber-300',
        badgeBorder: 'border-amber-500/30',
        dot: 'bg-amber-400',
        accentHex: '#fbbf24',
        chipActive: 'bg-amber-600 text-white',
        cellBg: 'bg-amber-400',
        cellText: 'text-slate-950',
      };
    case 'CVD':
      return {
        badgeBg: 'bg-emerald-500/15',
        badgeText: 'text-emerald-300',
        badgeBorder: 'border-emerald-500/30',
        dot: 'bg-emerald-400',
        accentHex: '#34d399',
        chipActive: 'bg-emerald-600 text-white',
        cellBg: 'bg-emerald-400',
        cellText: 'text-slate-950',
      };
    case 'CVD PCP':
      return {
        badgeBg: 'bg-purple-500/15',
        badgeText: 'text-purple-300',
        badgeBorder: 'border-purple-500/30',
        dot: 'bg-purple-400',
        accentHex: '#c084fc',
        chipActive: 'bg-purple-600 text-white',
        cellBg: 'bg-purple-400',
        cellText: 'text-slate-950',
      };
    case 'Batch Plant':
      return {
        badgeBg: 'bg-rose-500/15',
        badgeText: 'text-rose-300',
        badgeBorder: 'border-rose-500/30',
        dot: 'bg-rose-400',
        accentHex: '#fb7185',
        chipActive: 'bg-rose-600 text-white',
        cellBg: 'bg-rose-400',
        cellText: 'text-slate-950',
      };
    case '2F CE':
    case 'Cold End':
      return {
        badgeBg: 'bg-teal-500/15',
        badgeText: 'text-teal-300',
        badgeBorder: 'border-teal-500/30',
        dot: 'bg-teal-400',
        accentHex: '#2dd4bf',
        chipActive: 'bg-teal-600 text-white',
        cellBg: 'bg-teal-400',
        cellText: 'text-slate-950',
      };
    case '2F HE':
    case 'Hot End':
      return {
        badgeBg: 'bg-orange-500/15',
        badgeText: 'text-orange-300',
        badgeBorder: 'border-orange-500/30',
        dot: 'bg-orange-400',
        accentHex: '#fb923c',
        chipActive: 'bg-orange-600 text-white',
        cellBg: 'bg-orange-400',
        cellText: 'text-slate-950',
      };
    default:
      return {
        badgeBg: 'bg-slate-700/30',
        badgeText: 'text-slate-200',
        badgeBorder: 'border-slate-700',
        dot: 'bg-slate-400',
        accentHex: '#94a3b8',
        chipActive: 'bg-slate-700 text-white',
        cellBg: 'bg-slate-400',
        cellText: 'text-slate-950',
      };
  }
}

export function getQuarterForWeek(week: number): string {
  if (week <= 13) return 'Q1';
  if (week <= 26) return 'Q2';
  if (week <= 39) return 'Q3';
  return 'Q4';
}

export function getApproxMonthForWeek(week: number): string {
  const months = [
    'Jan', 'Jan', 'Jan', 'Jan',
    'Feb', 'Feb', 'Feb', 'Feb',
    'Mar', 'Mar', 'Mar', 'Mar', 'Mar',
    'Apr', 'Apr', 'Apr', 'Apr',
    'May', 'May', 'May', 'May',
    'Jun', 'Jun', 'Jun', 'Jun',
    'Jul', 'Jul', 'Jul', 'Jul', 'Jul',
    'Aug', 'Aug', 'Aug', 'Aug',
    'Sep', 'Sep', 'Sep', 'Sep',
    'Oct', 'Oct', 'Oct', 'Oct', 'Oct',
    'Nov', 'Nov', 'Nov', 'Nov',
    'Dec', 'Dec', 'Dec', 'Dec', 'Dec'
  ];
  return months[week - 1] || 'Dec';
}
