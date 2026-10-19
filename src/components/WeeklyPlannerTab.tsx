import React, { useState, useMemo } from 'react';
import { MechanicalPMItem, ExecutionRecord, ExecutionStatus } from '../types';
import { getDomainColor, getApproxMonthForWeek, getQuarterForWeek } from '../data/pmStore';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  XCircle, 
  Check 
} from 'lucide-react';

interface WeeklyPlannerTabProps {
  items: MechanicalPMItem[];
  currentWeek: number;
  onWeekChange: (week: number) => void;
  selectedDomain: string;
  onDomainChange: (domain: string) => void;
  records: Record<string, ExecutionRecord>;
  onStatusChange: (itemId: number, week: number, status: ExecutionStatus) => void;
  onInspectItem: (item: MechanicalPMItem) => void;
  onUpdateItemOnTheSpot: (updatedItem: MechanicalPMItem) => void;
}

export const WeeklyPlannerTab: React.FC<WeeklyPlannerTabProps> = ({
  items,
  currentWeek,
  onWeekChange,
  selectedDomain,
  onDomainChange,
  records,
  onStatusChange,
  onInspectItem,
  onUpdateItemOnTheSpot,
}) => {
  // Dynamic unique domains
  const uniqueDomains = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.domain))).filter(Boolean).sort();
  }, [items]);

  // Filter jobs scheduled in currentWeek
  const weekJobs = items.filter((item) => item.scheduled_weeks.includes(currentWeek));

  // Filter by selected domain
  const displayJobs = selectedDomain === 'all'
    ? weekJobs
    : weekJobs.filter((j) => j.domain === selectedDomain);

  const monthName = getApproxMonthForWeek(currentWeek);
  const quarterName = getQuarterForWeek(currentWeek);

  // Quick picker to add an unscheduled routine to this week on the spot
  const [showAddRoutinePicker, setShowAddRoutinePicker] = useState(false);
  const unscheduledForThisWeek = items.filter((i) => !i.scheduled_weeks.includes(currentWeek));

  // Inline note editing state on cards
  const [editingNoteJobId, setEditingNoteJobId] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState<string>('');

  const uniquePics = useMemo(() => {
    return Array.from(
      new Set(items.map((i) => (i.pic === 'Boilermen' ? 'Boilerman' : i.pic)))
    ).filter(Boolean).sort();
  }, [items]);

  const uniqueEngineers = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.engineer))).filter(Boolean).sort();
  }, [items]);

  const handleRemoveFromWeek = (job: MechanicalPMItem) => {
    if (window.confirm(`Remove ${job.pm_no} from Week ${currentWeek}?`)) {
      const nextWeeks = job.scheduled_weeks.filter((w) => w !== currentWeek);
      const nextDetails = { ...(job.weeks_detail || {}) };
      delete nextDetails[currentWeek];
      onUpdateItemOnTheSpot({
        ...job,
        scheduled_weeks: nextWeeks,
        weeks_detail: nextDetails,
      });
    }
  };

  const handleAddJobToThisWeek = (job: MechanicalPMItem) => {
    if (!job.scheduled_weeks.includes(currentWeek)) {
      const nextWeeks = [...job.scheduled_weeks, currentWeek].sort((a, b) => a - b);
      const nextDetails = { ...(job.weeks_detail || {}) };
      nextDetails[currentWeek] = { val: 'Scheduled' };
      onUpdateItemOnTheSpot({
        ...job,
        scheduled_weeks: nextWeeks,
        weeks_detail: nextDetails,
      });
      setShowAddRoutinePicker(false);
    }
  };

  const handleSaveDateNote = (job: MechanicalPMItem) => {
    const nextDetails = { ...(job.weeks_detail || {}) };
    nextDetails[currentWeek] = { ...(nextDetails[currentWeek] || {}), val: noteDraft.trim() };
    onUpdateItemOnTheSpot({
      ...job,
      weeks_detail: nextDetails,
    });
    setEditingNoteJobId(null);
  };

  return (
    <div className="space-y-5">
      {/* Week Selector Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-base font-bold text-white tracking-tight">Week-by-Week Maintenance Planner</h2>
              <span className="px-3 py-1 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded-lg font-mono font-bold text-sm shadow-sm">
                Week {currentWeek}
              </span>
              <span className="text-xs text-slate-300 font-medium">
                ({monthName} 2026 · {quarterName})
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select any week from Week 1 to Week 52 to view, customize, and execute active mechanical work orders
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => currentWeek > 1 && onWeekChange(currentWeek - 1)}
              disabled={currentWeek <= 1}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev Week</span>
            </button>

            <select
              value={currentWeek}
              onChange={(e) => onWeekChange(Number(e.target.value))}
              aria-label="Select maintenance week"
              className="bg-slate-800 text-slate-100 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
            >
              {Array.from({ length: 52 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  Week {w} ({getApproxMonthForWeek(w)})
                </option>
              ))}
            </select>

            <button
              onClick={() => currentWeek < 52 && onWeekChange(currentWeek + 1)}
              disabled={currentWeek >= 52}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
            >
              <span>Next Week</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Week Scrubber Slider */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>W1 (Jan)</span>
            <span>W13 (Q1)</span>
            <span>W26 (Mid-Year)</span>
            <span>W39 (Q3)</span>
            <span>W52 (Dec)</span>
          </div>
          <input
            type="range"
            min={1}
            max={52}
            value={currentWeek}
            onChange={(e) => onWeekChange(Number(e.target.value))}
            aria-label="Week navigation slider"
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Domain Filter Buttons & On-The-Spot Add */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-medium mr-1">Filter Domain:</span>
            <button
              onClick={() => onDomainChange('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                selectedDomain === 'all'
                  ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
              }`}
            >
              All Domains ({weekJobs.length})
            </button>
            {uniqueDomains.map((d) => {
              const dCount = weekJobs.filter((j) => j.domain === d).length;
              const isSelected = selectedDomain === d;
              const dColor = getDomainColor(d);
              return (
                <button
                  key={d}
                  onClick={() => onDomainChange(d)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                    isSelected
                      ? `${dColor.chipActive} border-transparent font-semibold shadow-sm`
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700/60'
                  }`}
                >
                  {d} ({dCount})
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-slate-300">
              Active in Week {currentWeek}:{' '}
              <strong className="text-cyan-300 font-mono text-sm">{displayJobs.length}</strong>
            </span>

            {/* Quick Add Routine to Week X button */}
            <button
              onClick={() => setShowAddRoutinePicker(!showAddRoutinePicker)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center space-x-1 transition cursor-pointer"
              title="Add another routine to this week on the spot"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Routine In W{currentWeek}</span>
            </button>
          </div>
        </div>

        {/* Add Routine Dropdown Drawer */}
        {showAddRoutinePicker && (
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
              <span>Select a routine to schedule into Week {currentWeek}:</span>
              <button
                onClick={() => setShowAddRoutinePicker(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/80 text-xs">
              {unscheduledForThisWeek.length === 0 ? (
                <p className="text-slate-400 py-2">All routines are already active in Week {currentWeek}.</p>
              ) : (
                unscheduledForThisWeek.map((it) => (
                  <div
                    key={it.id}
                    className="py-1.5 flex items-center justify-between hover:bg-slate-900/80 px-2 rounded transition"
                  >
                    <div className="flex items-center space-x-2 truncate pr-2">
                      <span className="font-mono text-cyan-300 font-bold">{it.pm_no}</span>
                      <span className="text-slate-200 truncate">{it.machine}</span>
                      <span className="text-slate-400 text-[10px]">({it.domain})</span>
                    </div>
                    <button
                      onClick={() => handleAddJobToThisWeek(it)}
                      className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[11px] font-medium shrink-0 transition cursor-pointer"
                    >
                      + Add to W{currentWeek}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cards Grid */}
      {displayJobs.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl py-14 text-center text-slate-400">
          <AlertCircle className="w-9 h-9 mx-auto mb-2 text-slate-500" />
          <p className="text-sm font-medium text-slate-300">
            No mechanical PM items scheduled in Week {currentWeek} for this filter.
          </p>
          <button
            onClick={() => onDomainChange('all')}
            className="mt-3 px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded text-xs transition cursor-pointer border border-slate-700"
          >
            Clear Domain Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayJobs.map((job) => {
            const domainStyle = getDomainColor(job.domain);
            const detail = job.weeks_detail && job.weeks_detail[currentWeek];
            const dateStr = detail?.val;

            const recKey = `${job.id}_w${currentWeek}`;
            const record = records[recKey];
            const currentStatus: ExecutionStatus = record?.status || 'scheduled';
            const displayPic = job.pic === 'Boilermen' ? 'Boilerman' : job.pic;

            const isEditingNote = editingNoteJobId === job.id;

            return (
              <div
                key={job.id}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition flex flex-col justify-between space-y-3"
              >
                {/* Header */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-cyan-300 bg-cyan-950/70 border border-cyan-800/60 px-2 py-0.5 rounded">
                      {job.pm_no}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${domainStyle.badgeBg} ${domainStyle.badgeText} border ${domainStyle.badgeBorder}`}
                      >
                        {job.domain}
                      </span>
                      {/* Remove from this week button */}
                      <button
                        onClick={() => handleRemoveFromWeek(job)}
                        className="text-slate-400 hover:text-red-400 p-0.5 rounded transition cursor-pointer"
                        title={`Remove from Week ${currentWeek}`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-white tracking-tight leading-snug pt-1">
                    {job.machine}
                  </h3>

                  <p className="text-[11px] text-slate-300 truncate">
                    <span className="text-slate-400 font-medium">Loc:</span> {job.location} ·{' '}
                    <span className="text-slate-400 font-medium">Cat:</span> {job.category}
                  </p>
                </div>

                {/* Body Details: On-the-spot editable PIC and Engineer */}
                <div className="pt-2.5 border-t border-slate-800/80 space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-medium">PIC (On-the-spot):</span>
                      <select
                        value={displayPic}
                        onChange={(e) => {
                          onUpdateItemOnTheSpot({ ...job, pic: e.target.value });
                        }}
                        className="bg-slate-900 border border-slate-700/80 rounded px-1.5 py-0.5 text-slate-200 text-xs w-full cursor-pointer focus:ring-1 focus:ring-cyan-500"
                        title="Change PIC on the spot"
                      >
                        {uniquePics.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] font-medium">Engineer:</span>
                      <select
                        value={job.engineer}
                        onChange={(e) => {
                          onUpdateItemOnTheSpot({ ...job, engineer: e.target.value });
                        }}
                        className="bg-slate-900 border border-slate-700/80 rounded px-1.5 py-0.5 text-slate-200 text-xs w-full cursor-pointer focus:ring-1 focus:ring-cyan-500"
                        title="Change Engineer on the spot"
                      >
                        {uniqueEngineers.map((e) => (
                          <option key={e} value={e}>
                            {e}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Scheduled Date/Note on the spot */}
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-300 pt-0.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[10px]">
                      Freq: {job.frequency}
                    </span>

                    {/* On the spot date/note editor */}
                    {isEditingNote ? (
                      <div className="flex items-center space-x-1">
                        <input
                          type="text"
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder="Date / note (e.g. 14.01.)"
                          className="bg-slate-800 border border-cyan-500 rounded px-1.5 py-0.5 text-[10px] text-white w-28 font-mono focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveDateNote(job)}
                          className="p-1 bg-emerald-600 text-white rounded cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <span
                          onClick={() => {
                            setEditingNoteJobId(job.id);
                            setNoteDraft(dateStr || '');
                          }}
                          className="px-2 py-0.5 rounded bg-slate-800/90 text-cyan-300 font-mono text-[10px] border border-slate-700 cursor-pointer hover:border-cyan-500"
                          title="Click to edit date/note on the spot"
                        >
                          {dateStr ? `Date: ${dateStr}` : '+ Set Date/Note'}
                        </span>
                      </div>
                    )}

                    <button
                      onClick={() => onInspectItem(job)}
                      className="text-cyan-400 hover:text-cyan-300 text-[11px] font-medium ml-auto cursor-pointer"
                    >
                      Details &rarr;
                    </button>
                  </div>

                  {/* Status Toggle Bar with Soft Colors and High Contrast */}
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Status:</span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onStatusChange(job.id, currentWeek, 'completed')}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-medium flex items-center space-x-1 transition cursor-pointer border ${
                          currentStatus === 'completed'
                            ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40 font-semibold shadow-sm'
                            : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700/60 hover:bg-slate-700'
                        }`}
                        title="Mark routine as completed"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Done</span>
                      </button>

                      <button
                        onClick={() => onStatusChange(job.id, currentWeek, 'in_progress')}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-medium flex items-center space-x-1 transition cursor-pointer border ${
                          currentStatus === 'in_progress'
                            ? 'bg-amber-500/25 text-amber-300 border-amber-500/40 font-semibold shadow-sm'
                            : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700/60 hover:bg-slate-700'
                        }`}
                        title="Mark routine as in progress"
                      >
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Ongoing</span>
                      </button>

                      <button
                        onClick={() => onStatusChange(job.id, currentWeek, 'scheduled')}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition cursor-pointer border ${
                          currentStatus === 'scheduled'
                            ? 'bg-cyan-500/25 text-cyan-300 border-cyan-500/40 font-semibold shadow-sm'
                            : 'bg-slate-800/60 text-slate-400 hover:text-white border-slate-700/60'
                        }`}
                        title="Reset to scheduled"
                      >
                        Scheduled
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
