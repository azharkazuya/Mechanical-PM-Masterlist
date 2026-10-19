import React, { useState, useMemo } from 'react';
import { MechanicalPMItem } from '../types';
import { getDomainColor } from '../data/pmStore';
import { MousePointerClick, Info } from 'lucide-react';

interface MatrixTabProps {
  items: MechanicalPMItem[];
  onInspectItem: (item: MechanicalPMItem) => void;
  onSelectWeek: (week: number) => void;
  onUpdateItemOnTheSpot?: (updatedItem: MechanicalPMItem) => void;
}

export const MatrixTab: React.FC<MatrixTabProps> = ({
  items,
  onInspectItem,
  onSelectWeek,
  onUpdateItemOnTheSpot,
}) => {
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [interactiveMode, setInteractiveMode] = useState<'inspect' | 'edit'>('inspect');

  const uniqueDomains = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.domain))).filter(Boolean).sort();
  }, [items]);

  const matrixItems = selectedDomain === 'all'
    ? items
    : items.filter((it) => it.domain === selectedDomain);

  const handleCellClick = (job: MechanicalPMItem, week: number, isSched: boolean) => {
    if (interactiveMode === 'edit' && onUpdateItemOnTheSpot) {
      // Toggle scheduled week on the spot!
      let nextWeeks: number[];
      const nextDetail = { ...(job.weeks_detail || {}) };
      if (isSched) {
        nextWeeks = job.scheduled_weeks.filter((w) => w !== week);
        delete nextDetail[week];
      } else {
        nextWeeks = [...job.scheduled_weeks, week].sort((a, b) => a - b);
        nextDetail[week] = { val: 'Scheduled' };
      }
      onUpdateItemOnTheSpot({
        ...job,
        scheduled_weeks: nextWeeks,
        weeks_detail: nextDetail,
      });
    } else {
      onInspectItem(job);
    }
  };

  return (
    <div className="space-y-4">
      {/* Matrix Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-white tracking-tight">52-Week Gantt Heatmap Matrix</h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
              Interactive
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Full annual view across Weeks 1 to 52 for all mechanical items
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* On-the-spot mode toggle */}
          {onUpdateItemOnTheSpot && (
            <div className="flex items-center space-x-1.5 bg-slate-800/90 border border-slate-700 rounded-lg p-1">
              <button
                onClick={() => setInteractiveMode('inspect')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer flex items-center space-x-1 ${
                  interactiveMode === 'inspect'
                    ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MousePointerClick className="w-3 h-3" />
                <span>Inspect Mode</span>
              </button>

              <button
                onClick={() => setInteractiveMode('edit')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer flex items-center space-x-1 ${
                  interactiveMode === 'edit'
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Click any cell in matrix to add or remove scheduled week on the spot!"
              >
                <span>Edit Weeks on the Spot</span>
              </button>
            </div>
          )}

          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="all">All Domains ({items.length})</option>
            {uniqueDomains.map((d) => (
              <option key={d} value={d}>
                {d} ({items.filter((i) => i.domain === d).length})
              </option>
            ))}
          </select>

          <div className="flex flex-wrap items-center gap-2.5 pl-3 border-l border-slate-800 text-[11px] text-slate-400">
            {uniqueDomains.map((d) => {
              const style = getDomainColor(d);
              return (
                <span key={d} className="flex items-center space-x-1.5">
                  <span className={`w-2 h-2 rounded-full ${style.dot} inline-block shadow-sm`} />
                  <span className="text-slate-300">{d}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {interactiveMode === 'edit' && (
        <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/40 rounded-lg flex items-center space-x-2 text-xs text-emerald-300">
          <Info className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>
            <strong>On-the-spot Schedule Mode active:</strong> Click any cell to toggle whether that routine is scheduled for that week. Changes are automatically saved.
          </span>
        </div>
      )}

      {/* Heatmap Grid Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[680px] overflow-y-auto">
          <table className="w-full text-left text-[11px] border-collapse font-mono">
            <thead className="bg-slate-800 text-slate-200 sticky top-0 z-20 shadow-md">
              <tr>
                <th className="py-2.5 px-3 border-r border-slate-700 bg-slate-800 sticky left-0 z-30 min-w-[70px] text-slate-300 font-semibold">
                  PM No
                </th>
                <th className="py-2.5 px-3 border-r border-slate-700 bg-slate-800 sticky left-[70px] z-30 min-w-[190px] text-slate-300 font-semibold">
                  Machine
                </th>
                <th className="py-2.5 px-3 border-r border-slate-700 bg-slate-800 sticky left-[260px] z-30 min-w-[95px] text-slate-300 font-semibold">
                  Domain
                </th>
                {Array.from({ length: 52 }, (_, i) => i + 1).map((w) => (
                  <th
                    key={w}
                    onClick={() => onSelectWeek(w)}
                    className="p-0 border-r border-slate-700/80 text-center cursor-pointer hover:bg-slate-700 transition"
                    title={`Click to view Week ${w} in Planner`}
                  >
                    <div className="w-[22px] min-w-[22px] h-[26px] flex items-center justify-center font-bold text-[9px] text-slate-300 hover:text-cyan-300">
                      {w}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {matrixItems.map((job) => {
                const domainStyle = getDomainColor(job.domain);

                return (
                  <tr key={job.id} className="hover:bg-slate-800/30 transition">
                    {/* Sticky PM No */}
                    <td
                      onClick={() => onInspectItem(job)}
                      className="py-1 px-3 border-r border-slate-800 bg-slate-900 sticky left-0 z-10 font-bold text-cyan-300 whitespace-nowrap cursor-pointer hover:underline"
                    >
                      {job.pm_no}
                    </td>

                    {/* Sticky Machine */}
                    <td
                      onClick={() => onInspectItem(job)}
                      className="py-1 px-3 border-r border-slate-800 bg-slate-900 sticky left-[70px] z-10 text-slate-200 truncate max-w-[190px] cursor-pointer hover:text-white"
                      title={job.machine}
                    >
                      {job.machine}
                    </td>

                    {/* Sticky Domain */}
                    <td className="py-1 px-3 border-r border-slate-800 bg-slate-900 sticky left-[260px] z-10 whitespace-nowrap">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${domainStyle.badgeBg} ${domainStyle.badgeText} ${domainStyle.badgeBorder}`}
                      >
                        {job.domain}
                      </span>
                    </td>

                    {/* 52 Week Cells */}
                    {Array.from({ length: 52 }, (_, i) => i + 1).map((w) => {
                      const isSched = job.scheduled_weeks.includes(w);
                      const detail = job.weeks_detail && job.weeks_detail[w];
                      const dateStr = detail?.val ? ` [${detail.val}]` : '';

                      return (
                        <td key={w} className="p-0 border-r border-b border-slate-800 text-center">
                          {isSched ? (
                            <div
                              onClick={() => handleCellClick(job, w, true)}
                              className={`w-[22px] min-w-[22px] h-[22px] rounded-[3px] ${domainStyle.cellBg} flex items-center justify-center ${domainStyle.cellText} font-bold text-[9px] hover:scale-110 shadow-sm transition-all cursor-pointer`}
                              title={
                                interactiveMode === 'edit'
                                  ? `Click to REMOVE Week ${w} from ${job.pm_no}`
                                  : `${job.pm_no} (${job.machine}): Week ${w}${dateStr}`
                              }
                            >
                              ✓
                            </div>
                          ) : (
                            <div
                              onClick={() => handleCellClick(job, w, false)}
                              className={`w-[22px] min-w-[22px] h-[22px] rounded-[3px] ${
                                interactiveMode === 'edit'
                                  ? 'bg-slate-950/70 hover:bg-emerald-950/80 hover:border hover:border-emerald-500/50 cursor-pointer'
                                  : 'bg-slate-950/60'
                              } transition-colors`}
                              title={
                                interactiveMode === 'edit'
                                  ? `Click to ADD Week ${w} to ${job.pm_no}`
                                  : undefined
                              }
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
