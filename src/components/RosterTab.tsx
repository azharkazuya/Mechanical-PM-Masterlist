import React from 'react';
import { MechanicalPMItem } from '../types';
import { ShieldCheck, UserCheck, ArrowRight } from 'lucide-react';

interface RosterTabProps {
  items: MechanicalPMItem[];
  onSelectPic?: (pic: string) => void;
  onSelectEngineer?: (eng: string) => void;
}

export const RosterTab: React.FC<RosterTabProps> = ({
  items,
  onSelectPic,
  onSelectEngineer,
}) => {
  // Compute counts dynamically from current items
  const azharItems = items.filter((i) => i.engineer === 'Azhar');
  const syazwanItems = items.filter((i) => i.engineer === 'Syazwan');
  const hazlizamItems = items.filter((i) => i.engineer === 'Hazlizam');
  const eqbalItems = items.filter((i) => i.engineer === 'Eqbal');

  // Dynamic unique PICs
  const allPics = Array.from(
    new Set(items.map((i) => (i.pic === 'Boilermen' ? 'Boilerman' : i.pic)))
  ).filter(Boolean);

  // Preset known metadata for standard PICs
  const knownPicMeta: Record<string, { domain: string; badgeColor: string; systems: string; engineer: string }> = {
    Faizal: {
      domain: 'Civil Piping & Infrastructure',
      badgeColor: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
      systems: 'All Civil Piping jobs: Main & drinking water pumps 1-7, cooling towers, fire pumps, rain water, diesel & MFO tanks, building roof inspections, motorized shutter doors, and NG/H2/N2 piping',
      engineer: 'Azhar & Hazlizam',
    },
    'Wan Mahassan': {
      domain: 'Furnace PCP (Hot Section)',
      badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      systems: 'Furnace PCP: Lime silo, lime dosing, GAH heat exchanger, sootblowers 1-12, NH3 storage & spray nozzles, CCBF ceramic catalyst baghouse, ducting dampers & ID fan, and instrument compressors',
      engineer: 'Azhar & Eqbal',
    },
    Nazri: {
      domain: '2F HE (Hot End) & 2F CE (Cold End)',
      badgeColor: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
      systems: '2F HE & 2F CE: Front/Back Tweel, Auto Rack, Restrictor Tile, Canal Cooler, Top Roll Machines, LOR, High Pressure Pumps 1–2; Lehr end breaker, dryer blower, thickness gauge, cutters, stackers 1-3 & sorting',
      engineer: 'Eqbal',
    },
    Hamilludin: {
      domain: 'Batch Plant Operations',
      badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      systems: 'Batch plant mechanical handling: raw material bucket elevators, ensiling silos, weighing systems, batch mixers, dedusting units, gathering and cullet conveyors',
      engineer: 'Hazlizam',
    },
    Samsudin: {
      domain: 'CVD & CVD PCP',
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      systems: 'All jobs related to CVD & PCP CVD: divert skid, evaporators, compressor, oil skids, piping, baghouse filter, thermal oxidizer, steam trap surveys, strainers, effluent dosing',
      engineer: 'Syazwan',
    },
    Boilerman: {
      domain: 'Boiler & Steam Traps',
      badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      systems: 'Plantwide steam traps, condensate return, boiler inspections and auxiliary steam lines',
      engineer: 'Azhar / Syazwan',
    },
  };

  const picStats = allPics.map((picName) => {
    const picItems = items.filter(
      (i) => (i.pic === 'Boilermen' ? 'Boilerman' : i.pic) === picName
    );
    const annualRuns = picItems.reduce((acc, it) => acc + it.scheduled_weeks.length, 0);
    const picDomains = Array.from(new Set(picItems.map((i) => i.domain))).join(', ');
    const picEngs = Array.from(new Set(picItems.map((i) => i.engineer))).join(' / ');

    const meta = knownPicMeta[picName] || {
      domain: picDomains || 'Plant Mechanical',
      badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      systems: picItems.map((i) => i.machine).slice(0, 3).join(', ') + (picItems.length > 3 ? '...' : ''),
      engineer: picEngs || 'Maintenance Engineer',
    };

    return {
      name: picName,
      domain: meta.domain,
      badgeColor: meta.badgeColor,
      systems: meta.systems,
      engineer: meta.engineer,
      itemsCount: picItems.length,
      annualRuns,
    };
  }).sort((a, b) => b.itemsCount - a.itemsCount);

  return (
    <div className="space-y-6">
      {/* Engineers Section */}
      <div>
        <div className="flex items-center space-x-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white tracking-tight">Responsible Maintenance Engineers</h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Supervisory and technical sign-off oversight for plant mechanical PM routines
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Azhar Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3 flex flex-col justify-between hover:border-cyan-500/40 transition">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Azhar</h3>
                <span className="px-2 py-0.5 bg-cyan-500/15 text-cyan-300 font-mono font-bold rounded-lg text-xs border border-cyan-500/30">
                  {azharItems.length} Items
                </span>
              </div>
              <p className="text-[11px] text-cyan-300 font-medium leading-relaxed bg-cyan-950/30 p-2.5 rounded-lg border border-cyan-800/40">
                Oversight for Civil Piping infrastructure & water pumps (with Hazlizam) and Furnace PCP (with Eqbal).
              </p>
              <div className="space-y-1.5 text-xs border-t border-slate-800/80 pt-2.5">
                <div className="flex justify-between text-slate-300">
                  <span>Water Plant Pumps & Piping:</span>
                  <strong className="font-mono text-sky-400">
                    {azharItems.filter((i) => i.sheet === 'POWER' || i.category.includes('PUMP')).length} Items
                  </strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Building Roofs & Infrastructure:</span>
                  <strong className="font-mono text-sky-400">
                    {azharItems.filter((i) => i.category.includes('BUILDING ROOF') || i.category.includes('NG, H2, AND N2')).length} Items
                  </strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Furnace PCP Oversight:</span>
                  <strong className="font-mono text-amber-400">
                    {azharItems.filter((i) => i.domain === 'Furnace PCP').length} Items
                  </strong>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
              <div className="text-[11px] text-slate-400 flex justify-between items-center">
                <span>Primary PIC:</span>
                <span className="text-slate-200 font-medium">Faizal (Civil Piping), Wan Mahassan (Furnace PCP)</span>
              </div>
              {onSelectEngineer && (
                <button
                  onClick={() => onSelectEngineer('Azhar')}
                  className="w-full py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-slate-700 rounded-lg text-[11px] font-medium flex items-center justify-center space-x-1 transition cursor-pointer"
                >
                  <span>View in Table</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Syazwan Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3 flex flex-col justify-between hover:border-emerald-500/40 transition">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Syazwan</h3>
                <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-300 font-mono font-bold rounded-lg text-xs border border-emerald-500/30">
                  {syazwanItems.length} Items
                </span>
              </div>
              <p className="text-[11px] text-emerald-300 font-medium leading-relaxed bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-800/40">
                Engineer taking care of CVD & CVD PCP. PIC under Syazwan is Samsudin.
              </p>
              <div className="space-y-1.5 text-xs border-t border-slate-800/80 pt-2.5">
                <div className="flex justify-between text-slate-300">
                  <span>CVD System:</span>
                  <strong className="font-mono text-emerald-400">
                    {syazwanItems.filter((i) => i.domain === 'CVD').length} Items
                  </strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>CVD PCP System:</span>
                  <strong className="font-mono text-purple-400">
                    {syazwanItems.filter((i) => i.domain === 'CVD PCP').length} Items
                  </strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Annual CVD Runs:</span>
                  <strong className="font-mono text-cyan-300">
                    {syazwanItems.reduce((acc, it) => acc + it.scheduled_weeks.length, 0)} runs
                  </strong>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
              <div className="text-[11px] text-slate-400 flex justify-between items-center">
                <span>PIC under Syazwan:</span>
                <span className="text-emerald-300 font-bold">Samsudin ({syazwanItems.length})</span>
              </div>
              {onSelectEngineer && (
                <button
                  onClick={() => onSelectEngineer('Syazwan')}
                  className="w-full py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 border border-slate-700 rounded-lg text-[11px] font-medium flex items-center justify-center space-x-1 transition cursor-pointer"
                >
                  <span>View in Table</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Hazlizam Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3 flex flex-col justify-between hover:border-amber-500/40 transition">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Hazlizam</h3>
                <span className="px-2 py-0.5 bg-amber-500/15 text-amber-300 font-mono font-bold rounded-lg text-xs border border-amber-500/30">
                  {hazlizamItems.length} Items
                </span>
              </div>
              <p className="text-[11px] text-amber-300 font-medium leading-relaxed bg-amber-950/30 p-2.5 rounded-lg border border-amber-800/40">
                Oversight for Batch Plant (under Hamilludin) and Civil Piping utilities, tanks & shutter doors (PIC Faizal).
              </p>
              <div className="space-y-1.5 text-xs border-t border-slate-800/80 pt-2.5">
                <div className="flex justify-between text-slate-300">
                  <span>Batch Plant Mechanical Handling:</span>
                  <strong className="font-mono text-rose-300">
                    {hazlizamItems.filter((i) => i.domain === 'Batch Plant').length} Items
                  </strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Civil Piping Tanks & Utilities:</span>
                  <strong className="font-mono text-amber-400">
                    {hazlizamItems.filter((i) => i.domain === 'Civil Piping' && !i.category.includes('SHUTTER DOOR')).length} Items
                  </strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Shutter Roller Doors:</span>
                  <strong className="font-mono text-amber-400">
                    {hazlizamItems.filter((i) => i.category.includes('SHUTTER DOOR')).length} Items
                  </strong>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
              <div className="text-[11px] text-slate-400 flex justify-between items-center">
                <span>Primary PIC:</span>
                <span className="text-slate-200 font-medium">Faizal (Civil Piping), Hamilludin (Batch Plant)</span>
              </div>
              {onSelectEngineer && (
                <button
                  onClick={() => onSelectEngineer('Hazlizam')}
                  className="w-full py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 rounded-lg text-[11px] font-medium flex items-center justify-center space-x-1 transition cursor-pointer"
                >
                  <span>View in Table</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Eqbal Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3 flex flex-col justify-between hover:border-purple-500/40 transition">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Eqbal</h3>
                <span className="px-2 py-0.5 bg-purple-500/15 text-purple-300 font-mono font-bold rounded-lg text-xs border border-purple-500/30">
                  {eqbalItems.length} Items
                </span>
              </div>
              <p className="text-[11px] text-purple-300 font-medium leading-relaxed bg-purple-950/30 p-2.5 rounded-lg border border-purple-800/40">
                Oversight for 2F HE (Hot End: Front/Back Tweel, Auto Rack, TRM & Bath; PIC Nazri), 2F CE (Cold End; PIC Nazri) and Furnace PCP (PIC Wan Mahassan).
              </p>
              <div className="space-y-1.5 text-xs border-t border-slate-800/80 pt-2.5">
                <div className="flex justify-between text-slate-300">
                  <span>2F HE (Hot End Systems):</span>
                  <strong className="font-mono text-orange-300">
                    {eqbalItems.filter((i) => i.domain === '2F HE').length} Items
                  </strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>2F CE (Cold End Systems):</span>
                  <strong className="font-mono text-teal-300">
                    {eqbalItems.filter((i) => i.domain === '2F CE').length} Items
                  </strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Furnace PCP Oversight:</span>
                  <strong className="font-mono text-amber-400">
                    {eqbalItems.filter((i) => i.domain === 'Furnace PCP').length} Items
                  </strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Total Scheduled PM Runs:</span>
                  <strong className="font-mono text-cyan-300">
                    {eqbalItems.reduce((acc, it) => acc + it.scheduled_weeks.length, 0)} runs
                  </strong>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
              <div className="text-[11px] text-slate-400 flex justify-between items-center">
                <span>Primary PIC:</span>
                <span className="text-slate-200 font-medium">Nazri (2F HE & 2F CE), Wan Mahassan (Furnace PCP)</span>
              </div>
              {onSelectEngineer && (
                <button
                  onClick={() => onSelectEngineer('Eqbal')}
                  className="w-full py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-purple-200 border border-slate-700 rounded-lg text-[11px] font-medium flex items-center justify-center space-x-1 transition cursor-pointer"
                >
                  <span>View in Table</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PIC Breakdown Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <UserCheck className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Person In Charge (PIC) Workload & Domain Assignments
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-800 text-slate-300 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-700/80">
              <tr>
                <th className="py-2.5 px-3">PIC Name</th>
                <th className="py-2.5 px-3">Total PM Items</th>
                <th className="py-2.5 px-3">Primary Domains</th>
                <th className="py-2.5 px-3">Assigned Systems & Equipment</th>
                <th className="py-2.5 px-3">Reporting Engineer</th>
                <th className="py-2.5 px-3 text-center">Annual Work Orders</th>
                {onSelectPic && <th className="py-2.5 px-3 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {picStats.map((pic) => (
                <tr key={pic.name} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-bold text-white whitespace-nowrap">{pic.name}</td>
                  <td className="py-3 px-3 font-mono font-bold text-cyan-300 whitespace-nowrap">
                    {pic.itemsCount}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${pic.badgeColor}`}>
                      {pic.domain}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300 max-w-md">{pic.systems}</td>
                  <td className="py-3 px-3 text-slate-200 font-medium whitespace-nowrap">{pic.engineer}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-cyan-300 whitespace-nowrap">
                    {pic.annualRuns} runs
                  </td>
                  {onSelectPic && (
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => onSelectPic(pic.name)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded border border-slate-700 text-[11px] transition cursor-pointer"
                      >
                        Filter Items
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
