import React from 'react';
import { MechanicalPMItem } from '../types';
import { Wrench, CalendarCheck, Network, Users } from 'lucide-react';
import { getDomainColor } from '../data/pmStore';

interface KpiCardsProps {
  items: MechanicalPMItem[];
}

export const KpiCards: React.FC<KpiCardsProps> = ({ items }) => {
  const totalItems = items.length;
  
  // Total scheduled execution runs across the entire year
  const totalExecutions = items.reduce((sum, item) => sum + item.scheduled_weeks.length, 0);
  const avgPerWeek = (totalExecutions / 52).toFixed(1);

  // Dynamic unique domains
  const uniqueDomains = Array.from(new Set(items.map((i) => i.domain))).filter(Boolean);

  // Unique PICs and Engineers
  const uniquePics = Array.from(
    new Set(items.map((i) => (i.pic === 'Boilermen' ? 'Boilerman' : i.pic)))
  ).filter(Boolean);
  const uniqueEngs = Array.from(new Set(items.map((i) => i.engineer))).filter(Boolean);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Mechanical PM Items */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Mechanical PMs</span>
          <span className="p-1.5 bg-cyan-500/15 text-cyan-300 rounded-lg border border-cyan-500/30">
            <Wrench className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-white tracking-tight font-mono">{totalItems}</span>
          <span className="text-xs text-slate-400">distinct PM jobs</span>
        </div>
        <div className="mt-2.5 flex items-center text-xs text-slate-300">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 mr-2 shadow-sm shadow-cyan-400/50"></span>
          <span>100% Mechanical section routines</span>
        </div>
      </div>

      {/* 2. Total Annual Executions */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Annual Executions</span>
          <span className="p-1.5 bg-emerald-500/15 text-emerald-300 rounded-lg border border-emerald-500/30">
            <CalendarCheck className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-white tracking-tight font-mono">
            {totalExecutions.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400">scheduled runs</span>
        </div>
        <div className="mt-2.5 flex items-center text-xs text-slate-300">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2 shadow-sm shadow-emerald-400/50"></span>
          <span>Avg {avgPerWeek} work orders / week</span>
        </div>
      </div>

      {/* 3. Scope Coverage */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Domains Covered</span>
          <span className="p-1.5 bg-purple-500/15 text-purple-300 rounded-lg border border-purple-500/30">
            <Network className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-white tracking-tight font-mono">{uniqueDomains.length}</span>
          <span className="text-xs text-slate-400">operational zones</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          {uniqueDomains.map((domain) => {
            const count = items.filter((i) => i.domain === domain).length;
            const style = getDomainColor(domain);
            return (
              <span
                key={domain}
                className={`px-1.5 py-0.5 rounded font-mono text-[10px] border ${style.badgeBg} ${style.badgeText} ${style.badgeBorder}`}
              >
                {domain}: {count}
              </span>
            );
          })}
        </div>
      </div>

      {/* 4. Personnel in Charge */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Engineers & PICs</span>
          <span className="p-1.5 bg-amber-500/15 text-amber-300 rounded-lg border border-amber-500/30">
            <Users className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-white tracking-tight font-mono">
            {uniqueEngs.length} Eng / {uniquePics.length} PIC
          </span>
          <span className="text-xs text-slate-400">dedicated team</span>
        </div>
        <div className="mt-2.5 text-xs text-slate-300 truncate">
          <span className="text-slate-400 font-medium">Oversight:</span> {uniqueEngs.join(', ')}
        </div>
      </div>
    </div>
  );
};
