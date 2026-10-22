import React, { useState } from 'react';
import { X, Check, AlertTriangle, Info, Heart } from 'lucide-react';
import { BloodGroup } from '../../types';
import { RBC_COMPATIBILITY_RULES, DONOR_CAN_DONATE_TO } from '../../utils/bloodCompatibility';

interface CompatibilityMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_GROUPS: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

export const CompatibilityMatrixModal: React.FC<CompatibilityMatrixModalProps> = ({ isOpen, onClose }) => {
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup>('O-');

  if (!isOpen) return null;

  const compatibleDonors = RBC_COMPATIBILITY_RULES[selectedGroup] || [];
  const canDonateTo = DONOR_CAN_DONATE_TO[selectedGroup] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-neutral-200 dark:border-neutral-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                Red Blood Cell Compatibility Matrix
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Scientific clinical matching logic for the BloodSync Emergency Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Interactive Picker */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Select Blood Group to Inspect:
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {ALL_GROUPS.map((group) => (
                <button
                  key={group}
                  onClick={() => setSelectedGroup(group)}
                  className={`py-2 px-3 rounded-xl font-bold text-sm transition-all border ${
                    selectedGroup === group
                      ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/30'
                      : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700 hover:border-red-400'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>

          {/* Recipient vs Donor Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* As Recipient */}
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                If patient is <span className="text-red-600 font-extrabold">{selectedGroup}</span> (Recipient)
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                Can safely receive red blood cells from:
              </p>
              <div className="flex flex-wrap gap-2">
                {compatibleDonors.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 font-bold text-xs border border-green-300 dark:border-green-800"
                  >
                    <Check className="w-3.5 h-3.5" /> {d}
                  </span>
                ))}
              </div>
              {selectedGroup === 'AB+' && (
                <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  🌟 Universal Recipient: Can receive red blood cells of any blood type.
                </p>
              )}
            </div>

            {/* As Donor */}
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                If donor is <span className="text-red-600 font-extrabold">{selectedGroup}</span> (Donor)
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                Can safely donate red blood cells to:
              </p>
              <div className="flex flex-wrap gap-2">
                {canDonateTo.map((rec) => (
                  <span
                    key={rec}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-300 dark:border-blue-800"
                  >
                    <Check className="w-3.5 h-3.5" /> {rec}
                  </span>
                ))}
              </div>
              {selectedGroup === 'O-' && (
                <p className="mt-3 text-xs text-red-600 dark:text-red-400 font-medium">
                  🌟 Universal Red Cell Donor: Critical asset for emergency trauma patients.
                </p>
              )}
            </div>
          </div>

          {/* Complete 8x8 Grid */}
          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Full Transfusion Cross-Matrix
            </h3>
            <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-xl">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                    <th className="p-2 border border-neutral-200 dark:border-neutral-700 text-left font-bold">
                      Recipient ↓ \ Donor →
                    </th>
                    {ALL_GROUPS.map((g) => (
                      <th key={g} className="p-2 border border-neutral-200 dark:border-neutral-700 font-bold">
                        {g}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ALL_GROUPS.map((rec) => (
                    <tr
                      key={rec}
                      className={rec === selectedGroup ? 'bg-red-50/50 dark:bg-red-950/20' : ''}
                    >
                      <td className="p-2 border border-neutral-200 dark:border-neutral-700 font-bold text-left text-neutral-900 dark:text-neutral-100">
                        {rec}
                      </td>
                      {ALL_GROUPS.map((don) => {
                        const isMatch = RBC_COMPATIBILITY_RULES[rec].includes(don);
                        return (
                          <td
                            key={don}
                            className={`p-2 border border-neutral-200 dark:border-neutral-700 font-semibold ${
                              isMatch
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                                : 'text-neutral-300 dark:text-neutral-600'
                            }`}
                          >
                            {isMatch ? '✓' : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Medical Disclaimer */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex gap-3 text-xs text-amber-800 dark:text-amber-300">
            <Info className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-semibold mb-1">Clinical Protocol Disclaimer</p>
              <p className="leading-relaxed">
                This table represents pure red blood cell (RBC) compatibility for prototype matching.
                Actual clinical transfusion requires rigorous antibody screening, component separation
                (PRBC vs FFP vs Platelets), and mandatory pre-transfusion crossmatching by certified blood
                bank laboratory officers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
