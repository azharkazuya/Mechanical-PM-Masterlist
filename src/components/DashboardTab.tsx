import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { MechanicalPMItem } from '../types';
import { getDomainColor } from '../data/pmStore';
import { TrendingUp, Layers, Clock, UserCheck, ShieldCheck } from 'lucide-react';

Chart.register(...registerables);

interface DashboardTabProps {
  items: MechanicalPMItem[];
  onSelectDomain: (domain: string) => void;
  onSelectWeek: (week: number) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  items,
  onSelectDomain,
  onSelectWeek,
}) => {
  const lineChartRef = useRef<HTMLCanvasElement | null>(null);
  const pieChartRef = useRef<HTMLCanvasElement | null>(null);
  const freqChartRef = useRef<HTMLCanvasElement | null>(null);
  const picChartRef = useRef<HTMLCanvasElement | null>(null);
  const engChartRef = useRef<HTMLCanvasElement | null>(null);

  // Dynamic unique domains
  const uniqueDomains = Array.from(new Set(items.map((i) => i.domain))).filter(Boolean);

  // Calculate dynamic weekly workload
  const weeklyLoads: { week: number; count: number }[] = [];
  for (let w = 1; w <= 52; w++) {
    const inWeek = items.filter((it) => it.scheduled_weeks.includes(w)).length;
    weeklyLoads.push({ week: w, count: inWeek });
  }

  const peakWeek = [...weeklyLoads].sort((a, b) => b.count - a.count)[0] || { week: 1, count: 0 };
  const minWeek = [...weeklyLoads].sort((a, b) => a.count - b.count)[0] || { week: 1, count: 0 };

  useEffect(() => {
    const chartInstances: Chart[] = [];

    // Common Chart.js styling for Dark Mode with Soft Contrast
    const gridColor = '#1e293b'; // slate-800
    const tickTextColor = '#94a3b8'; // slate-400
    const fontFamily = 'Plus Jakarta Sans';
    const monoFont = 'JetBrains Mono';

    // 1. Calculate 52-Week Workload Data
    const weekLabels: string[] = [];
    const totalWeekly: number[] = [];
    const domainWeeklyData: Record<string, number[]> = {};

    uniqueDomains.forEach((d) => {
      domainWeeklyData[d] = [];
    });

    for (let w = 1; w <= 52; w++) {
      weekLabels.push(`W${w}`);
      const inWeek = items.filter((it) => it.scheduled_weeks.includes(w));
      totalWeekly.push(inWeek.length);
      uniqueDomains.forEach((d) => {
        domainWeeklyData[d].push(inWeek.filter((it) => it.domain === d).length);
      });
    }

    // Line Chart Datasets
    const datasets: any[] = [
      {
        label: 'Total Mechanical Jobs',
        data: totalWeekly,
        borderColor: '#38bdf8', // Soft sky blue
        backgroundColor: 'rgba(56, 189, 248, 0.08)',
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 6,
        pointBackgroundColor: '#38bdf8',
      },
    ];

    uniqueDomains.forEach((d) => {
      const colorToken = getDomainColor(d);
      const itemCount = items.filter((i) => i.domain === d).length;
      datasets.push({
        label: `${d} (${itemCount} jobs)`,
        data: domainWeeklyData[d],
        borderColor: colorToken.accentHex,
        borderWidth: 1.5,
        borderDash: [3, 3],
        tension: 0.35,
        pointRadius: 0,
      });
    });

    if (lineChartRef.current) {
      const lineInstance = new Chart(lineChartRef.current, {
        type: 'line',
        data: {
          labels: weekLabels,
          datasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            legend: {
              labels: {
                color: '#cbd5e1',
                font: { size: 11, family: fontFamily },
                boxWidth: 12,
              },
            },
            tooltip: {
              backgroundColor: '#0f172a',
              titleColor: '#f8fafc',
              bodyColor: '#cbd5e1',
              borderColor: '#334155',
              borderWidth: 1,
              padding: 10,
              cornerRadius: 8,
            },
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: tickTextColor, maxTicksLimit: 26, font: { size: 9, family: monoFont } },
            },
            y: {
              grid: { color: gridColor },
              ticks: { color: tickTextColor, font: { size: 10, family: monoFont } },
            },
          },
          onClick: (_event, elements) => {
            if (elements.length > 0) {
              const weekIndex = elements[0].index + 1;
              onSelectWeek(weekIndex);
            }
          },
        },
      });
      chartInstances.push(lineInstance);
    }

    // 2. Domain Donut Chart
    const donutLabels = uniqueDomains;
    const donutData = donutLabels.map((d) => items.filter((i) => i.domain === d).length);
    const donutColors = donutLabels.map((d) => getDomainColor(d).accentHex);

    if (pieChartRef.current) {
      const pieInstance = new Chart(pieChartRef.current, {
        type: 'doughnut',
        data: {
          labels: donutLabels,
          datasets: [
            {
              data: donutData,
              backgroundColor: donutColors,
              borderColor: '#0f172a',
              borderWidth: 2.5,
              hoverOffset: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#0f172a',
              titleColor: '#f8fafc',
              bodyColor: '#cbd5e1',
              borderColor: '#334155',
              borderWidth: 1,
              padding: 10,
              cornerRadius: 8,
            },
          },
          onClick: (_event, elements) => {
            if (elements.length > 0) {
              onSelectDomain(donutLabels[elements[0].index]);
            }
          },
        },
      });
      chartInstances.push(pieInstance);
    }

    // 3. Frequency Breakdown Chart
    const freqCounts: Record<string, number> = {};
    items.forEach((it) => {
      const f = it.frequency || 'N/A';
      freqCounts[f] = (freqCounts[f] || 0) + 1;
    });
    const sortedFreqs = Object.keys(freqCounts).sort((a, b) => freqCounts[b] - freqCounts[a]);

    if (freqChartRef.current) {
      const freqInstance = new Chart(freqChartRef.current, {
        type: 'bar',
        data: {
          labels: sortedFreqs,
          datasets: [
            {
              label: 'PM Items',
              data: sortedFreqs.map((f) => freqCounts[f]),
              backgroundColor: 'rgba(56, 189, 248, 0.75)', // Soft sky
              borderColor: '#38bdf8',
              borderWidth: 1,
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#0f172a',
              titleColor: '#f8fafc',
              bodyColor: '#cbd5e1',
              borderColor: '#334155',
              borderWidth: 1,
              padding: 10,
              cornerRadius: 8,
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: tickTextColor, font: { size: 10, family: monoFont } },
            },
            y: {
              grid: { color: gridColor },
              ticks: { color: tickTextColor, font: { size: 10, family: monoFont } },
            },
          },
        },
      });
      chartInstances.push(freqInstance);
    }

    // 4. Job Allocation by PIC
    const picCounts: Record<string, number> = {};
    items.forEach((it) => {
      const p = it.pic === 'Boilermen' ? 'Boilerman' : it.pic || 'Unassigned';
      picCounts[p] = (picCounts[p] || 0) + 1;
    });
    const sortedPics = Object.keys(picCounts).sort((a, b) => picCounts[b] - picCounts[a]);

    if (picChartRef.current) {
      const picInstance = new Chart(picChartRef.current, {
        type: 'bar',
        data: {
          labels: sortedPics,
          datasets: [
            {
              label: 'Assigned PM Items',
              data: sortedPics.map((p) => picCounts[p]),
              backgroundColor: 'rgba(52, 211, 153, 0.75)', // Soft emerald
              borderColor: '#34d399',
              borderWidth: 1,
              borderRadius: 6,
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#0f172a',
              titleColor: '#f8fafc',
              bodyColor: '#cbd5e1',
              borderColor: '#334155',
              borderWidth: 1,
              padding: 10,
              cornerRadius: 8,
            },
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: tickTextColor, font: { size: 10, family: monoFont } },
            },
            y: {
              grid: { display: false },
              ticks: { color: '#cbd5e1', font: { size: 10, family: fontFamily } },
            },
          },
        },
      });
      chartInstances.push(picInstance);
    }

    // 5. Engineer Oversight Chart
    const engCounts: Record<string, number> = {};
    items.forEach((it) => {
      const e = it.engineer || 'Unassigned';
      engCounts[e] = (engCounts[e] || 0) + 1;
    });
    const sortedEngs = Object.keys(engCounts).sort((a, b) => engCounts[b] - engCounts[a]);

    if (engChartRef.current) {
      const engInstance = new Chart(engChartRef.current, {
        type: 'bar',
        data: {
          labels: sortedEngs,
          datasets: [
            {
              label: 'Oversight PM Items',
              data: sortedEngs.map((e) => engCounts[e]),
              backgroundColor: 'rgba(251, 191, 36, 0.75)', // Soft warm amber
              borderColor: '#fbbf24',
              borderWidth: 1,
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#0f172a',
              titleColor: '#f8fafc',
              bodyColor: '#cbd5e1',
              borderColor: '#334155',
              borderWidth: 1,
              padding: 10,
              cornerRadius: 8,
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#cbd5e1', font: { size: 11, family: fontFamily } },
            },
            y: {
              grid: { color: gridColor },
              ticks: { color: tickTextColor, font: { size: 10, family: monoFont } },
            },
          },
        },
      });
      chartInstances.push(engInstance);
    }

    return () => {
      chartInstances.forEach((inst) => inst.destroy());
    };
  }, [items, uniqueDomains, onSelectDomain, onSelectWeek]);

  return (
    <div className="space-y-6">
      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 52-Week Workload Profile (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white tracking-tight">52-Week Workload Profile (2026)</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Weekly scheduled mechanical PM interventions · Click any week point to jump to that week
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-mono text-[11px] border border-cyan-500/30">
                Peak: W{peakWeek.week} ({peakWeek.count} jobs)
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
                Min: W{minWeek.week} ({minWeek.count} jobs)
              </span>
            </div>
          </div>
          <div className="h-72 w-full relative">
            <canvas ref={lineChartRef} />
          </div>
        </div>

        {/* Domain Share Donut (1 Col) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">Jobs by Domain</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Distribution across plant operational areas</p>
          </div>
          <div className="h-52 w-full relative my-2">
            <canvas ref={pieChartRef} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-800">
            {uniqueDomains.map((domain) => {
              const count = items.filter((i) => i.domain === domain).length;
              const style = getDomainColor(domain);
              return (
                <button
                  key={domain}
                  onClick={() => onSelectDomain(domain)}
                  className="flex items-center space-x-2 text-left hover:opacity-80 transition cursor-pointer p-1 rounded hover:bg-slate-800/40"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: style.accentHex }}
                  />
                  <span className="text-slate-300 truncate">
                    {domain}: <strong className="font-mono text-white">{count}</strong>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Frequency Breakdown */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 mb-1">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">PM Frequency Distribution</h2>
          </div>
          <p className="text-xs text-slate-400 mb-3">Breakdown of routines by maintenance interval</p>
          <div className="h-60 w-full relative">
            <canvas ref={freqChartRef} />
          </div>
        </div>

        {/* Job Allocation by PIC */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 mb-1">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">Job Allocation by PIC</h2>
          </div>
          <p className="text-xs text-slate-400 mb-3">Count of mechanical equipment routines per PIC</p>
          <div className="h-60 w-full relative">
            <canvas ref={picChartRef} />
          </div>
        </div>

        {/* Engineer Oversight */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">Engineer Oversight</h2>
          </div>
          <p className="text-xs text-slate-400 mb-3">Engineering sign-off authority & supervisory items</p>
          <div className="h-60 w-full relative">
            <canvas ref={engChartRef} />
          </div>
        </div>
      </div>

      {/* Scope Breakdown Detail Cards */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-bold text-white mb-3 tracking-tight">Technical Scope & Asset Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Civil Piping Card */}
          {(() => {
            const cpItems = items.filter((i) => i.domain === 'Civil Piping');
            const cpEngs = Array.from(new Set(cpItems.map((i) => i.engineer))).join(', ');
            const cpPics = Array.from(new Set(cpItems.map((i) => i.pic))).join(', ');
            return (
              <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-800/40 flex flex-col justify-between hover:border-sky-700/60 transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sky-300 text-sm">Civil & Piping</span>
                    <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono font-semibold border border-sky-500/30">
                      {cpItems.length} Items
                    </span>
                  </div>
                  <p className="text-slate-300 mb-2 text-[11px]">
                    Key Systems: <span className="text-sky-300 font-medium">Water Plant, Tanks & Roofs</span>
                  </p>
                  <ul className="space-y-1.5 text-slate-300 list-disc list-inside text-[11px]">
                    <li>Main & Drinking Water Pumps #01–#07</li>
                    <li>Cooling Towers & Pumps #01–#02</li>
                    <li>Fire Pumps: Standby, Jockey, Duty</li>
                    <li>Rain Water, Elevation, Diesel & MFO Tanks</li>
                    <li>NG, H2, N2 Piping & Bath High Pressure</li>
                  </ul>
                </div>
                <div className="mt-4 pt-2.5 border-t border-sky-900/50 flex flex-col gap-1 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>PIC:</span>
                    <span className="text-slate-200 font-medium">{cpPics || 'Faizal'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Oversight:</span>
                    <span className="text-sky-300 font-medium">{cpEngs || 'Azhar, Hazlizam'}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Furnace PCP Card */}
          {(() => {
            const fpcpItems = items.filter((i) => i.domain === 'Furnace PCP');
            const fpcpEngs = Array.from(new Set(fpcpItems.map((i) => i.engineer))).join(', ');
            const fpcpPics = Array.from(new Set(fpcpItems.map((i) => i.pic))).join(', ');
            return (
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 flex flex-col justify-between hover:border-amber-700/60 transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-amber-300 text-sm">Furnace PCP</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-semibold border border-amber-500/30">
                      {fpcpItems.length} Items
                    </span>
                  </div>
                  <p className="text-slate-300 mb-2 text-[11px]">
                    Key Systems: <span className="text-amber-300 font-medium">Hot End & Gas Cleaning</span>
                  </p>
                  <ul className="space-y-1.5 text-slate-300 list-disc list-inside text-[11px]">
                    <li>Lime Silo, Ventilation Bag Filter & Feeder</li>
                    <li>Gas-Air Heat Exchanger (GAH) & Sootblowers 1–12</li>
                    <li>NH3 Storage Tank & Weekly NH3 Spray Nozzles</li>
                    <li>CCBF Ceramic Catalyst Bag Filter & Hoppers A–H</li>
                    <li>Ducting, Damper System & ID Fan</li>
                  </ul>
                </div>
                <div className="mt-4 pt-2.5 border-t border-amber-900/50 flex flex-col gap-1 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>PIC:</span>
                    <span className="text-slate-200 font-medium">{fpcpPics || 'Wan Mahassan'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Oversight:</span>
                    <span className="text-amber-300 font-medium">Azhar & Eqbal only</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* CVD Card */}
          {(() => {
            const cvdItems = items.filter((i) => i.domain === 'CVD');
            const cvdEngs = Array.from(new Set(cvdItems.map((i) => i.engineer))).join(', ');
            const cvdPics = Array.from(new Set(cvdItems.map((i) => i.pic))).join(', ');
            return (
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 flex flex-col justify-between hover:border-emerald-700/60 transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-emerald-300 text-sm">CVD System</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-semibold border border-emerald-500/30">
                      {cvdItems.length} Items
                    </span>
                  </div>
                  <p className="text-slate-300 mb-2 text-[11px]">
                    Key Systems: <span className="text-emerald-300 font-medium">Coating Chambers & Precursors</span>
                  </p>
                  <ul className="space-y-1.5 text-slate-300 list-disc list-inside text-[11px]">
                    <li>Divert Skid, Evaporator Skid & Precursor Skid</li>
                    <li>CVD Compressors 1–4 & Booster Pumps</li>
                    <li>DMT Liquid Oven, Canister, Evaporators A–E</li>
                    <li>Special Gas Tubing: Silane, Ethylene, Helium, HF</li>
                    <li>Exhaust Control Valves (Balls, Seals, Couplings)</li>
                  </ul>
                </div>
                <div className="mt-4 pt-2.5 border-t border-emerald-900/50 flex flex-col gap-1 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>PIC under Syazwan:</span>
                    <span className="text-slate-200 font-medium">{cvdPics || 'Samsudin'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Engineer:</span>
                    <span className="text-emerald-300 font-medium">{cvdEngs || 'Syazwan'}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* CVD PCP Card */}
          {(() => {
            const cvdpcpItems = items.filter((i) => i.domain === 'CVD PCP');
            const cvdpcpEngs = Array.from(new Set(cvdpcpItems.map((i) => i.engineer))).join(', ');
            const cvdpcpPics = Array.from(new Set(cvdpcpItems.map((i) => i.pic))).join(', ');
            return (
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 flex flex-col justify-between hover:border-purple-700/60 transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-purple-300 text-sm">CVD PCP System</span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-semibold border border-purple-500/30">
                      {cvdpcpItems.length} Items
                    </span>
                  </div>
                  <p className="text-slate-300 mb-2 text-[11px]">
                    Key Systems: <span className="text-purple-300 font-medium">Pollution Control & Boiler</span>
                  </p>
                  <ul className="space-y-1.5 text-slate-300 list-disc list-inside text-[11px]">
                    <li>Thermal Oxidizer Burner Cone (Online/Offline)</li>
                    <li>Waste Heat Boiler & Feed Pumps 1 & 2</li>
                    <li>Steam Condenser Blowers & Heat Exchanger</li>
                    <li>Sodium Bicarbonate Silo & Screw Conveyors</li>
                    <li>Baghouse Filter (Rotary Valve, Joint, Cleaning)</li>
                  </ul>
                </div>
                <div className="mt-4 pt-2.5 border-t border-purple-900/50 flex flex-col gap-1 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>PIC under Syazwan:</span>
                    <span className="text-slate-200 font-medium">{cvdpcpPics || 'Samsudin'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Engineer:</span>
                    <span className="text-purple-300 font-medium">{cvdpcpEngs || 'Syazwan'}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 2F HE (Hot End) Card */}
          {(() => {
            const heItems = items.filter((i) => i.domain === '2F HE');
            const heEngs = Array.from(new Set(heItems.map((i) => i.engineer))).join(', ');
            const hePics = Array.from(new Set(heItems.map((i) => i.pic))).join(', ');
            return (
              <div className="p-4 rounded-xl bg-orange-950/20 border border-orange-800/40 flex flex-col justify-between hover:border-orange-700/60 transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-orange-300 text-sm">2F HE (Hot End)</span>
                    <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 font-mono font-semibold border border-orange-500/30">
                      {heItems.length} Items
                    </span>
                  </div>
                  <p className="text-slate-300 mb-2 text-[11px]">
                    Key Systems: <span className="text-orange-300 font-medium">Tweels, Auto Rack & Bath Equipment</span>
                  </p>
                  <ul className="space-y-1.5 text-slate-300 list-disc list-inside text-[11px]">
                    <li>Front & Back Tweel Hoisting Mechanisms, Cables & Drives</li>
                    <li>Canal Auto Rack & Pinion Drive, Rails & Clutches</li>
                    <li>Restrictor Tile Lifting Gear, Winch & Positioner</li>
                    <li>Canal Cooler Water Jackets, Flexible Hoses & Sight Flow</li>
                    <li>Top Roll Machines 1–8 Angle Drives & Bearings</li>
                    <li>Bath Exit Lip, Dross Box Flap, LOR Rollers & HP Pumps 1–2</li>
                  </ul>
                </div>
                <div className="mt-4 pt-2.5 border-t border-orange-900/50 flex flex-col gap-1 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>PIC:</span>
                    <span className="text-slate-200 font-medium">{hePics || 'Nazri'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Oversight:</span>
                    <span className="text-orange-300 font-medium">{heEngs || 'Eqbal'}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 2F CE Card */}
          {(() => {
            const ceItems = items.filter((i) => i.domain === '2F CE');
            const ceEngs = Array.from(new Set(ceItems.map((i) => i.engineer))).join(', ');
            const cePics = Array.from(new Set(ceItems.map((i) => i.pic))).join(', ');
            return (
              <div className="p-4 rounded-xl bg-teal-950/20 border border-teal-800/40 flex flex-col justify-between hover:border-teal-700/60 transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-teal-300 text-sm">2F CE (Cold End)</span>
                    <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono font-semibold border border-teal-500/30">
                      {ceItems.length} Items
                    </span>
                  </div>
                  <p className="text-slate-300 mb-2 text-[11px]">
                    Key Systems: <span className="text-teal-300 font-medium">Cutting, Conveying & Stacking</span>
                  </p>
                  <ul className="space-y-1.5 text-slate-300 list-disc list-inside text-[11px]">
                    <li>Lehr End Breaker, 1st Dryer Blower & Thickness Gauge</li>
                    <li>Trimmer Cutters 1–7, Kerosene Pumps & Ribbon Conveyor</li>
                    <li>Traverse Cutters 1–2, Auto Breaker & Swing Rejector</li>
                    <li>A1, A2, C1 & C2 Line Conveyors & Chip Blowers</li>
                    <li>Stackers 1–3 (Accumulators, Vacuum & Rotators)</li>
                    <li>SQC Tables 1–2, Auto Sorting, Compactors & Dock Levelers</li>
                  </ul>
                </div>
                <div className="mt-4 pt-2.5 border-t border-teal-900/50 flex flex-col gap-1 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>PIC:</span>
                    <span className="text-slate-200 font-medium">{cePics || 'Nazri'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Oversight:</span>
                    <span className="text-teal-300 font-medium">{ceEngs || 'Eqbal'}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Batch Plant Card */}
          {(() => {
            const bpItems = items.filter((i) => i.domain === 'Batch Plant');
            const bpEngs = Array.from(new Set(bpItems.map((i) => i.engineer))).join(', ');
            const bpPics = Array.from(new Set(bpItems.map((i) => i.pic))).join(', ');
            return (
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 flex flex-col justify-between hover:border-rose-700/60 transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-rose-300 text-sm">Batch Plant</span>
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-semibold border border-rose-500/30">
                      {bpItems.length} Items
                    </span>
                  </div>
                  <p className="text-slate-300 mb-2 text-[11px]">
                    Key Systems: <span className="text-rose-300 font-medium">Ensiling, Weighing & Conveying</span>
                  </p>
                  <ul className="space-y-1.5 text-slate-300 list-disc list-inside text-[11px]">
                    <li>Bucket Elevators & Ensiling Silos (Dolomite, Soda Ash)</li>
                    <li>Silica Sand Silos 1–2 & Conveyors 1–7</li>
                    <li>Weighing Systems & Batch Hoppers</li>
                    <li>Mixers 2 & 3, Greasing & Gathering Conveyor</li>
                    <li>Dedusting Units EV 1–9 & Cullet Conveyors 1–8</li>
                  </ul>
                </div>
                <div className="mt-4 pt-2.5 border-t border-rose-900/50 flex flex-col gap-1 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>PIC:</span>
                    <span className="text-slate-200 font-medium">{bpPics || 'Hamilludin'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Engineer:</span>
                    <span className="text-rose-300 font-medium">{bpEngs || 'Hazlizam'}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
