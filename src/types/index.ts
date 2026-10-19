export type Domain = 'Civil Piping' | 'Furnace PCP' | '2F CE' | 'CVD' | 'CVD PCP' | 'Batch Plant' | '2F HE' | string;

export interface WeekDetail {
  val?: string;
  color?: string;
}

export interface MechanicalPMItem {
  id: number;
  domain: Domain;
  sheet: string;
  category: string;
  pm_no: string;
  location: string;
  section: string;
  machine: string;
  pic: string;
  engineer: string;
  check_sheet: string;
  frequency: string;
  scheduled_weeks: number[];
  weeks_detail?: Record<number, WeekDetail>;
}

export type ExecutionStatus = 'scheduled' | 'completed' | 'in_progress' | 'deferred';

export interface ExecutionRecord {
  status: ExecutionStatus;
  updatedAt: string;
  note?: string;
}

export type TabType = 'dashboard' | 'weekly' | 'masterlist' | 'matrix' | 'roster';
