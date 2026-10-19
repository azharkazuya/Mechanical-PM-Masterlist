import React, { useState, useEffect } from 'react';
import { MechanicalPMItem, Domain } from '../types';
import { X, Check } from 'lucide-react';

interface ItemFormModalProps {
  item: MechanicalPMItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: MechanicalPMItem) => void;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<MechanicalPMItem>>({
    domain: 'Civil Piping',
    sheet: 'SMC',
    category: '',
    pm_no: '',
    location: 'Civil & Piping',
    section: 'Mechanical',
    machine: '',
    pic: 'Faizal',
    engineer: 'Azhar',
    check_sheet: '',
    frequency: '1M',
    scheduled_weeks: [1, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49],
  });

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        id: Date.now(),
        domain: 'Civil Piping',
        sheet: 'SMC',
        category: '',
        pm_no: 'PM-',
        location: 'Civil & Piping',
        section: 'Mechanical',
        machine: '',
        pic: 'Faizal',
        engineer: 'Azhar',
        check_sheet: '',
        frequency: '1M',
        scheduled_weeks: [1, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49],
      });
    }
  }, [item, isOpen]);

  if (!isOpen) return null;

  const toggleWeek = (w: number) => {
    const current = formData.scheduled_weeks || [];
    if (current.includes(w)) {
      setFormData({ ...formData, scheduled_weeks: current.filter((x) => x !== w) });
    } else {
      setFormData({ ...formData, scheduled_weeks: [...current, w].sort((a, b) => a - b) });
    }
  };

  const setPresetWeeks = (preset: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'clear') => {
    if (preset === 'weekly') {
      setFormData({ ...formData, scheduled_weeks: Array.from({ length: 52 }, (_, i) => i + 1), frequency: '1W' });
    } else if (preset === 'biweekly') {
      setFormData({ ...formData, scheduled_weeks: Array.from({ length: 26 }, (_, i) => i * 2 + 1), frequency: '2W' });
    } else if (preset === 'monthly') {
      setFormData({ ...formData, scheduled_weeks: [2, 6, 10, 14, 18, 22, 26, 30, 34, 38, 42, 46, 50], frequency: '1M' });
    } else if (preset === 'quarterly') {
      setFormData({ ...formData, scheduled_weeks: [13, 26, 39, 52], frequency: '3M' });
    } else {
      setFormData({ ...formData, scheduled_weeks: [] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.machine?.trim()) return;

    const fullItem: MechanicalPMItem = {
      id: formData.id || Date.now(),
      domain: (formData.domain as Domain) || 'Civil Piping',
      sheet: formData.sheet || 'SMC',
      category: formData.category || 'General Mechanical',
      pm_no: formData.pm_no || `PM-${Math.floor(Math.random() * 900 + 100)}`,
      location: formData.location || 'Civil & Piping',
      section: 'Mechanical',
      machine: formData.machine,
      pic: formData.pic || 'Faizal',
      engineer: formData.engineer || 'Azhar',
      check_sheet: formData.check_sheet || '',
      frequency: formData.frequency || '1M',
      scheduled_weeks: formData.scheduled_weeks || [],
      weeks_detail: formData.weeks_detail || {},
    };

    onSave(fullItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">
              {item ? 'Edit Mechanical PM Routine' : 'Create New Mechanical PM Routine'}
            </h3>
            <p className="text-xs text-slate-400">
              Update machine details, designated engineer & 52-week schedule
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">PM Routine No.</label>
              <input
                type="text"
                required
                value={formData.pm_no || ''}
                onChange={(e) => setFormData({ ...formData, pm_no: e.target.value })}
                placeholder="e.g. P19 or 2FCVD130"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Domain</label>
              <select
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value as Domain })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
              >
                <option value="Civil Piping">Civil Piping</option>
                <option value="Furnace PCP">Furnace PCP</option>
                <option value="2F CE">2F CE</option>
                <option value="2F HE">2F HE</option>
                <option value="CVD">CVD</option>
                <option value="CVD PCP">CVD PCP</option>
                <option value="Batch Plant">Batch Plant</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Frequency</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer font-mono"
              >
                <option value="1W">1W (Weekly)</option>
                <option value="2W">2W (Bi-Weekly)</option>
                <option value="1M">1M (Monthly)</option>
                <option value="2M">2M (Bi-Monthly)</option>
                <option value="3M">3M (Quarterly)</option>
                <option value="6M">6M (Half-Yearly)</option>
                <option value="8M">8M (Every 8 Months)</option>
                <option value="1YR">1YR (Yearly)</option>
                <option value="HC">HC (Campaign)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Machine / Maintenance Job Description</label>
            <input
              type="text"
              required
              value={formData.machine || ''}
              onChange={(e) => setFormData({ ...formData, machine: e.target.value })}
              placeholder="e.g. Inspect Divert Skid valves & couplings"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Category</label>
              <input
                type="text"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. PUMP & MOTOR"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Location</label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. CVD JB2F or Civil & Piping"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Person In Charge (PIC)</label>
              <input
                type="text"
                list="pic-options"
                value={formData.pic || ''}
                onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                placeholder="e.g. Samsudin or Faizal"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <datalist id="pic-options">
                <option value="Samsudin" />
                <option value="Faizal" />
                <option value="Wan Mahassan" />
                <option value="Nazri" />
                <option value="Boilerman" />
                <option value="Hamilludin" />
              </datalist>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Responsible Engineer</label>
              <input
                type="text"
                list="engineer-options"
                value={formData.engineer || ''}
                onChange={(e) => setFormData({ ...formData, engineer: e.target.value })}
                placeholder="e.g. Syazwan, Azhar, Hazlizam, Eqbal"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <datalist id="engineer-options">
                <option value="Syazwan" />
                <option value="Azhar" />
                <option value="Hazlizam" />
                <option value="Eqbal" />
              </datalist>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Check Sheet Code</label>
              <input
                type="text"
                value={formData.check_sheet || ''}
                onChange={(e) => setFormData({ ...formData, check_sheet: e.target.value })}
                placeholder="e.g. JE-M-F9-6.0-PMR-CP-001"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* 52-Week Schedule Picker */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-slate-300 font-bold">
                Scheduled Weeks Selection ({formData.scheduled_weeks?.length || 0} weeks selected)
              </label>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setPresetWeeks('weekly')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer"
                >
                  All 52 Wks
                </button>
                <button
                  type="button"
                  onClick={() => setPresetWeeks('monthly')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer"
                >
                  Monthly (~12)
                </button>
                <button
                  type="button"
                  onClick={() => setPresetWeeks('quarterly')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer"
                >
                  Quarterly (4)
                </button>
                <button
                  type="button"
                  onClick={() => setPresetWeeks('clear')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-13 gap-1 p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              {Array.from({ length: 52 }, (_, i) => i + 1).map((w) => {
                const isSelected = formData.scheduled_weeks?.includes(w);
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => toggleWeek(w)}
                    className={`w-full aspect-square rounded flex items-center justify-center font-mono text-[10px] transition cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-600 text-white font-bold shadow-sm'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {w}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-cyan-600/20 transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{item ? 'Save Changes' : 'Create PM Routine'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
