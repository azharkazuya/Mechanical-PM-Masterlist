import React from 'react';
import { MechanicalPMItem, ExecutionRecord, ExecutionStatus } from '../types';
import { getDomainColor } from '../data/pmStore';
import { X, CheckCircle2, Clock, Copy, Printer } from 'lucide-react';

interface JobDetailModalProps {
  item: MechanicalPMItem | null;
  records: Record<string, ExecutionRecord>;
  onClose: () => void;
  onStatusChange: (itemId: number, week: number, status: ExecutionStatus) => void;
  onShowToast: (msg: string) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  item,
  records,
  onClose,
  onStatusChange,
  onShowToast,
}) => {
  if (!item) return null;

  const domainStyle = getDomainColor(item.domain);

  const copyCheckSheet = () => {
    if (item.check_sheet) {
      navigator.clipboard.writeText(item.check_sheet);
      onShowToast(`Check sheet "${item.check_sheet}" copied to clipboard!`);
    }
  };

  const printJobCard = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 rounded font-mono font-bold text-sm">
                {item.pm_no}
              </span>
              <span
                className={`px-2.5 py-1 rounded text-xs font-semibold ${domainStyle.badgeBg} ${domainStyle.badgeText} border ${domainStyle.badgeBorder}`}
              >
                {item.domain}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Source: {item.sheet}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">{item.machine}</h3>
            <p className="text-xs text-slate-400">
              {item.category} · <span className="text-slate-300 font-medium">{item.location}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Key Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-800/60 rounded-xl text-xs border border-slate-700/60">
          <div>
            <span className="text-slate-400 block text-[11px]">Person In Charge</span>
            <strong className="text-white text-xs font-medium">{item.pic}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Responsible Engineer</span>
            <strong className="text-white text-xs font-medium">{item.engineer}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Frequency</span>
            <strong className="text-cyan-400 font-mono text-xs">{item.frequency}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Check Sheet</span>
            <div className="flex items-center space-x-1">
              <strong className="text-white font-mono text-[11px] truncate" title={item.check_sheet || 'N/A'}>
                {item.check_sheet || '—'}
              </strong>
              {item.check_sheet && (
                <button
                  onClick={copyCheckSheet}
                  className="text-slate-400 hover:text-cyan-400 transition cursor-pointer"
                  title="Copy check sheet ID"
                >
                  <Copy className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 52-Week Schedule Grid in Modal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              52-Week Annual Schedule & Execution Status (2026)
            </h4>
            <span className="text-xs text-cyan-400 font-mono font-semibold">
              {item.scheduled_weeks.length} weeks scheduled
            </span>
          </div>

          <div className="grid grid-cols-13 gap-1.5 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            {Array.from({ length: 52 }, (_, i) => i + 1).map((w) => {
              const isSched = item.scheduled_weeks.includes(w);
              const detail = item.weeks_detail && item.weeks_detail[w];
              const dateVal = detail?.val ? ` [${detail.val}]` : '';

              const recKey = `${item.id}_w${w}`;
              const record = records[recKey];
              const status: ExecutionStatus = record?.status || (isSched ? 'scheduled' : 'deferred');

              let cellColor = 'bg-slate-900/90 border border-slate-800 text-slate-400';
              if (isSched) {
                if (status === 'completed') {
                  cellColor = 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold shadow-sm';
                } else if (status === 'in_progress') {
                  cellColor = 'bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold shadow-sm';
                } else {
                  cellColor = 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 font-bold shadow-sm hover:bg-cyan-500/35';
                }
              }

              return (
                <div
                  key={w}
                  onClick={() => {
                    if (isSched) {
                      // Cycle status: scheduled -> completed -> in_progress -> scheduled
                      const next = status === 'scheduled' ? 'completed' : status === 'completed' ? 'in_progress' : 'scheduled';
                      onStatusChange(item.id, w, next);
                    }
                  }}
                  className={`w-full aspect-square rounded flex flex-col items-center justify-center text-[10px] cursor-pointer transition select-none ${cellColor}`}
                  title={`Week ${w}${isSched ? `: Scheduled${dateVal} · Click to cycle status (${status})` : ' (Not scheduled)'}`}
                >
                  <span className="font-mono">{w}</span>
                  {isSched && detail?.val && (
                    <span className="text-[7px] truncate max-w-full font-mono opacity-80">{detail.val}</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Tip: Click any active week cell above to toggle execution status (Done / Ongoing / Scheduled).</span>
            <div className="flex items-center space-x-2">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded bg-cyan-500/25 border border-cyan-500/40"></span>
                <span className="text-cyan-300">Scheduled</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500/25 border border-emerald-500/40"></span>
                <span className="text-emerald-300">Done</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-500/25 border border-amber-500/40"></span>
                <span className="text-amber-300">Ongoing</span>
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            onClick={printJobCard}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span>Print Job Card</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
