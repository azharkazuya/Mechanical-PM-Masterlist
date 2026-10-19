import React, { useState, useMemo } from 'react';
import { MechanicalPMItem } from '../types';
import { getDomainColor } from '../data/pmStore';
import { 
  Search, 
  RotateCcw, 
  Eye, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Plus, 
  Sparkles,
  SlidersHorizontal,
  Users2
} from 'lucide-react';

interface MasterlistTableTabProps {
  items: MechanicalPMItem[];
  onInspectItem: (item: MechanicalPMItem) => void;
  onEditItem: (item: MechanicalPMItem) => void;
  onUpdateItemOnTheSpot: (updatedItem: MechanicalPMItem) => void;
  onDeleteItem: (itemId: number) => void;
  onAddNew: () => void;
}

export const MasterlistTableTab: React.FC<MasterlistTableTabProps> = ({
  items,
  onInspectItem,
  onEditItem,
  onUpdateItemOnTheSpot,
  onDeleteItem,
  onAddNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedPic, setSelectedPic] = useState('all');
  const [selectedEngineer, setSelectedEngineer] = useState('all');
  const [selectedFrequency, setSelectedFrequency] = useState('all');
  const [selectedWeek, setSelectedWeek] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Inline editing state
  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null);
  const [inlineDraft, setInlineDraft] = useState<Partial<MechanicalPMItem>>({});

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkPic, setBulkPic] = useState('');
  const [bulkEng, setBulkEng] = useState('');

  // Extract unique options
  const uniqueDomains = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.domain))).filter(Boolean).sort();
  }, [items]);

  const uniquePics = useMemo(() => {
    const list = Array.from(new Set(items.map((i) => (i.pic === 'Boilermen' ? 'Boilerman' : i.pic)))).filter(Boolean).sort();
    return list;
  }, [items]);

  const uniqueEngineers = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.engineer))).filter(Boolean).sort();
  }, [items]);

  const uniqueFreqs = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.frequency))).filter(Boolean).sort();
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const picNormalized = item.pic === 'Boilermen' ? 'Boilerman' : item.pic;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const haystack = `${item.pm_no} ${item.machine} ${item.category} ${item.location} ${item.check_sheet} ${picNormalized} ${item.engineer}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (selectedDomain !== 'all' && item.domain !== selectedDomain) return false;
      if (selectedPic !== 'all' && picNormalized !== selectedPic) return false;
      if (selectedEngineer !== 'all' && item.engineer !== selectedEngineer) return false;
      if (selectedFrequency !== 'all' && item.frequency !== selectedFrequency) return false;
      if (selectedWeek !== 'all') {
        const wNum = parseInt(selectedWeek, 10);
        if (!item.scheduled_weeks.includes(wNum)) return false;
      }
      return true;
    });
  }, [items, searchQuery, selectedDomain, selectedPic, selectedEngineer, selectedFrequency, selectedWeek]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDomain('all');
    setSelectedPic('all');
    setSelectedEngineer('all');
    setSelectedFrequency('all');
    setSelectedWeek('all');
    setCurrentPage(1);
  };

  const startInlineEdit = (job: MechanicalPMItem) => {
    setInlineEditingId(job.id);
    setInlineDraft({ ...job, pic: job.pic === 'Boilermen' ? 'Boilerman' : job.pic });
  };

  const cancelInlineEdit = () => {
    setInlineEditingId(null);
    setInlineDraft({});
  };

  const saveInlineEdit = () => {
    if (!inlineEditingId || !inlineDraft.machine) return;
    const existing = items.find((i) => i.id === inlineEditingId);
    if (!existing) return;

    const updated: MechanicalPMItem = {
      ...existing,
      ...inlineDraft,
      machine: inlineDraft.machine || existing.machine,
      pic: inlineDraft.pic || existing.pic,
      engineer: inlineDraft.engineer || existing.engineer,
      frequency: inlineDraft.frequency || existing.frequency,
      check_sheet: inlineDraft.check_sheet ?? existing.check_sheet,
      category: inlineDraft.category || existing.category,
      location: inlineDraft.location || existing.location,
    };

    onUpdateItemOnTheSpot(updated);
    setInlineEditingId(null);
    setInlineDraft({});
  };

  // Bulk assign PIC / Engineer
  const handleApplyBulk = () => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach((id) => {
      const it = items.find((x) => x.id === id);
      if (it) {
        onUpdateItemOnTheSpot({
          ...it,
          pic: bulkPic ? bulkPic : it.pic,
          engineer: bulkEng ? bulkEng : it.engineer,
        });
      }
    });
    setSelectedIds([]);
    setBulkPic('');
    setBulkEng('');
  };

  const toggleSelectAllPage = () => {
    const pageIds = paginatedItems.map((i) => i.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(selectedIds.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])));
    }
  };

  const toggleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <div className="lg:col-span-2 relative">
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Search Keywords</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search PM No, machine, check sheet, category..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Domain Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Domain</label>
            <select
              value={selectedDomain}
              onChange={(e) => {
                setSelectedDomain(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
            >
              <option value="all">All Domains ({items.length})</option>
              {uniqueDomains.map((d) => (
                <option key={d} value={d}>
                  {d} ({items.filter((i) => i.domain === d).length})
                </option>
              ))}
            </select>
          </div>

          {/* PIC Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Person In Charge (PIC)</label>
            <select
              value={selectedPic}
              onChange={(e) => {
                setSelectedPic(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
            >
              <option value="all">All PICs</option>
              {uniquePics.map((pic) => (
                <option key={pic} value={pic}>
                  {pic} ({items.filter((i) => (i.pic === 'Boilermen' ? 'Boilerman' : i.pic) === pic).length})
                </option>
              ))}
            </select>
          </div>

          {/* Engineer Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Responsible Engineer</label>
            <select
              value={selectedEngineer}
              onChange={(e) => {
                setSelectedEngineer(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
            >
              <option value="all">All Engineers</option>
              {uniqueEngineers.map((eng) => (
                <option key={eng} value={eng}>
                  {eng} ({items.filter((i) => i.engineer === eng).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary Filters Row & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 text-[11px]">Frequency:</span>
              <select
                value={selectedFrequency}
                onChange={(e) => {
                  setSelectedFrequency(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all">All Frequencies</option>
                {uniqueFreqs.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 text-[11px]">Active in Week:</span>
              <select
                value={selectedWeek}
                onChange={(e) => {
                  setSelectedWeek(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none cursor-pointer font-mono"
              >
                <option value="all">Any Week (1–52)</option>
                {Array.from({ length: 52 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>
                    Week {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onAddNew}
              className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold flex items-center space-x-1 transition cursor-pointer shadow-sm"
              title="Add a new PM item"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New PM</span>
            </button>

            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-xs flex items-center space-x-1 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Bulk On-The-Spot Assignment Toolbar (shown if items selected) */}
        {selectedIds.length > 0 && (
          <div className="p-2.5 bg-cyan-950/40 border border-cyan-800/60 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                {selectedIds.length} items selected
              </span>
              <span className="text-slate-300">Quick bulk update on the spot:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={bulkPic}
                onChange={(e) => setBulkPic(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
              >
                <option value="">-- Change PIC To --</option>
                {uniquePics.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <select
                value={bulkEng}
                onChange={(e) => setBulkEng(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
              >
                <option value="">-- Change Engineer To --</option>
                {uniqueEngineers.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>

              <button
                onClick={handleApplyBulk}
                disabled={!bulkPic && !bulkEng}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded text-xs font-semibold transition cursor-pointer"
              >
                Apply to Selected
              </button>

              <button
                onClick={() => setSelectedIds([])}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-xs transition cursor-pointer"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Masterlist Data Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-700/60">
              <tr>
                <th className="py-3 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={
                      paginatedItems.length > 0 &&
                      paginatedItems.every((it) => selectedIds.includes(it.id))
                    }
                    onChange={toggleSelectAllPage}
                    className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                    title="Select all on this page"
                  />
                </th>
                <th className="py-3 px-3">PM No</th>
                <th className="py-3 px-3">Domain</th>
                <th className="py-3 px-3">Machine / Maintenance Job</th>
                <th className="py-3 px-3">Category & Location</th>
                <th className="py-3 px-3">PIC</th>
                <th className="py-3 px-3">Engineer</th>
                <th className="py-3 px-3">Freq</th>
                <th className="py-3 px-3">Check Sheet</th>
                <th className="py-3 px-3 text-center">Annual Weeks</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    No mechanical maintenance jobs match the active filters.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((job) => {
                  const domainStyle = getDomainColor(job.domain);
                  const isInlineEditing = inlineEditingId === job.id;
                  const isChecked = selectedIds.includes(job.id);
                  const displayPic = job.pic === 'Boilermen' ? 'Boilerman' : job.pic;

                  if (isInlineEditing) {
                    // Inline Edit Row
                    return (
                      <tr key={job.id} className="bg-slate-800/90 border-2 border-cyan-500/50">
                        <td className="py-2.5 px-3 text-center">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-pulse"></span>
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={inlineDraft.pm_no || ''}
                            onChange={(e) => setInlineDraft({ ...inlineDraft, pm_no: e.target.value })}
                            className="bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-cyan-400 font-mono w-20"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={inlineDraft.domain || job.domain}
                            onChange={(e) => setInlineDraft({ ...inlineDraft, domain: e.target.value as any })}
                            className="bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-white"
                          >
                            {uniqueDomains.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={inlineDraft.machine || ''}
                            onChange={(e) => setInlineDraft({ ...inlineDraft, machine: e.target.value })}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full min-w-[200px]"
                            placeholder="Machine description"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={inlineDraft.category || ''}
                              onChange={(e) => setInlineDraft({ ...inlineDraft, category: e.target.value })}
                              className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-300 w-full"
                              placeholder="Category"
                            />
                            <input
                              type="text"
                              value={inlineDraft.location || ''}
                              onChange={(e) => setInlineDraft({ ...inlineDraft, location: e.target.value })}
                              className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-400 w-full"
                              placeholder="Location"
                            />
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={inlineDraft.pic || displayPic}
                            onChange={(e) => setInlineDraft({ ...inlineDraft, pic: e.target.value })}
                            className="bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-slate-200"
                          >
                            {uniquePics.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={inlineDraft.engineer || job.engineer}
                            onChange={(e) => setInlineDraft({ ...inlineDraft, engineer: e.target.value })}
                            className="bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-slate-200"
                          >
                            {uniqueEngineers.map((e) => (
                              <option key={e} value={e}>
                                {e}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={inlineDraft.frequency || job.frequency}
                            onChange={(e) => setInlineDraft({ ...inlineDraft, frequency: e.target.value })}
                            className="bg-slate-900 border border-slate-700 rounded px-1 py-1 text-xs text-slate-200 font-mono"
                          >
                            <option value="1W">1W</option>
                            <option value="2W">2W</option>
                            <option value="1M">1M</option>
                            <option value="2M">2M</option>
                            <option value="3M">3M</option>
                            <option value="6M">6M</option>
                            <option value="8M">8M</option>
                            <option value="1YR">1YR</option>
                            <option value="HC">HC</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={inlineDraft.check_sheet || ''}
                            onChange={(e) => setInlineDraft({ ...inlineDraft, check_sheet: e.target.value })}
                            className="bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[11px] text-slate-300 font-mono w-24"
                            placeholder="Check sheet"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-xs text-cyan-300">
                          {job.scheduled_weeks.length} wks
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={saveInlineEdit}
                              className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition cursor-pointer"
                              title="Save changes on the spot"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={cancelInlineEdit}
                              className="p-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition cursor-pointer"
                              title="Cancel editing"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  // Normal Row
                  return (
                    <tr
                      key={job.id}
                      className={`hover:bg-slate-800/40 transition ${
                        isChecked ? 'bg-cyan-950/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(job.id)}
                          className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      <td className="py-2.5 px-3 font-mono font-bold text-cyan-400 whitespace-nowrap">
                        {job.pm_no}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${domainStyle.badgeBg} ${domainStyle.badgeText} border ${domainStyle.badgeBorder}`}
                        >
                          {job.domain}
                        </span>
                      </td>

                      <td
                        onDoubleClick={() => startInlineEdit(job)}
                        className="py-2.5 px-3 font-medium text-white max-w-xs truncate cursor-pointer hover:text-cyan-300"
                        title="Double-click to edit on the spot"
                      >
                        {job.machine}
                      </td>

                      <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate" title={`${job.category} (${job.location})`}>
                        {job.category} <span className="text-slate-500">({job.location})</span>
                      </td>

                      {/* On the spot PIC selector */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <select
                          value={displayPic}
                          onChange={(e) => {
                            onUpdateItemOnTheSpot({ ...job, pic: e.target.value });
                          }}
                          className="bg-transparent hover:bg-slate-800 rounded px-1 py-0.5 text-slate-200 border border-transparent hover:border-slate-700 transition cursor-pointer text-xs"
                          title="Click to reassign PIC on the spot"
                        >
                          {uniquePics.map((p) => (
                            <option key={p} value={p} className="bg-slate-900 text-white">
                              {p}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* On the spot Engineer selector */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <select
                          value={job.engineer}
                          onChange={(e) => {
                            onUpdateItemOnTheSpot({ ...job, engineer: e.target.value });
                          }}
                          className="bg-transparent hover:bg-slate-800 rounded px-1 py-0.5 text-slate-200 border border-transparent hover:border-slate-700 transition cursor-pointer text-xs"
                          title="Click to reassign Engineer on the spot"
                        >
                          {uniqueEngineers.map((eng) => (
                            <option key={eng} value={eng} className="bg-slate-900 text-white">
                              {eng}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* On the spot Frequency selector */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <select
                          value={job.frequency}
                          onChange={(e) => {
                            onUpdateItemOnTheSpot({ ...job, frequency: e.target.value });
                          }}
                          className="bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-[10px] rounded px-1.5 py-0.5 cursor-pointer"
                          title="Click to change frequency on the spot"
                        >
                          <option value="1W">1W</option>
                          <option value="2W">2W</option>
                          <option value="1M">1M</option>
                          <option value="2M">2M</option>
                          <option value="3M">3M</option>
                          <option value="6M">6M</option>
                          <option value="8M">8M</option>
                          <option value="1YR">1YR</option>
                          <option value="HC">HC</option>
                        </select>
                      </td>

                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[10px] whitespace-nowrap" title={job.check_sheet || 'N/A'}>
                        {job.check_sheet || '—'}
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono font-bold text-cyan-300 whitespace-nowrap">
                        {job.scheduled_weeks.length} wks
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => startInlineEdit(job)}
                            className="p-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 rounded border border-slate-700 transition cursor-pointer"
                            title="Edit row on the spot"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onInspectItem(job)}
                            className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 transition cursor-pointer"
                            title="Inspect 52-week schedule"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete PM Routine ${job.pm_no} (${job.machine})?`)) {
                                onDeleteItem(job.id);
                              }
                            }}
                            className="p-1 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded border border-slate-700 hover:border-red-800 transition cursor-pointer"
                            title="Delete this routine"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Page <span className="text-white font-mono">{currentPage}</span> of{' '}
              <span className="text-white font-mono">{totalPages}</span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 rounded border border-slate-700 cursor-pointer"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const hasGap = prev && p - prev > 1;
                  return (
                    <React.Fragment key={p}>
                      {hasGap && <span className="px-1 text-slate-600">...</span>}
                      <button
                        onClick={() => setCurrentPage(p)}
                        className={`w-7 h-7 rounded font-mono text-xs cursor-pointer ${
                          currentPage === p
                            ? 'bg-cyan-600 text-white font-semibold'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 rounded border border-slate-700 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
