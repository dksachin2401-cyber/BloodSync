import React, { useState } from 'react';
import {
  Building2,
  Heart,
  Warehouse,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Send,
  Zap,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { BloodGroup, UrgencyLevel } from '../../types';

interface FourWayCoordinationDemoProps {
  onClose?: () => void;
  onNavigatePortal?: (portal: string) => void;
}

export const FourWayCoordinationDemo: React.FC<FourWayCoordinationDemoProps> = ({
  onClose,
  onNavigatePortal,
}) => {
  const { switchPersona, currentUser } = useAuth();
  const { addNotification } = useNotifications();

  const [activeStep, setActiveStep] = useState<number>(1);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [createdRequestId, setCreatedRequestId] = useState<string>('REQ-9042');
  const [pledgeStatus, setPledgeStatus] = useState<'pending' | 'pledged'>('pending');
  const [reserveStatus, setReserveStatus] = useState<'pending' | 'reserved'>('pending');
  const [adminLogStatus, setAdminLogStatus] = useState<'waiting' | 'verified'>('waiting');

  // Step 1: Hospital creates emergency broadcast
  const handleHospitalCreateRequest = async () => {
    setActiveStep(2);
    addNotification({
      title: '🚨 CRITICAL O- EMERGENCY BROADCAST',
      message: 'Rajiv Gandhi Govt General Hospital has broadcast a priority request for 3 units of O- Negative for a major highway trauma case.',
      type: 'emergency_broadcast',
      linkRequestId: createdRequestId,
    });
  };

  // Step 2: Citizen donor pledges blood
  const handleDonorPledge = async () => {
    setPledgeStatus('pledged');
    setActiveStep(3);
    addNotification({
      title: '🩸 CITIZEN DONOR PLEDGE CONFIRMED',
      message: 'Karthik Subramanian (O- Universal Donor, 14 prior donations) has pledged 1 unit and is en route to RGGGH.',
      type: 'pledge_update',
      linkRequestId: createdRequestId,
    });
  };

  // Step 3: Blood bank reserves units atomically
  const handleBloodBankReserve = async () => {
    setReserveStatus('reserved');
    setActiveStep(4);
    addNotification({
      title: '📦 ATOMIC INVENTORY RESERVATION CONFIRMED',
      message: 'Red Cross Chennai Blood Bank has locked and allocated 2 tested units of O- under BEGIN IMMEDIATE TRANSACTION.',
      type: 'bank_response',
      linkRequestId: createdRequestId,
    });
  };

  // Step 4: Admin audit verification
  const handleAdminVerify = () => {
    setAdminLogStatus('verified');
    addNotification({
      title: '🛡️ TNSBTC COMMAND COORDINATION COMPLETE',
      message: 'Emergency request REQ-9042 successfully fulfilled (1 Citizen Pledge + 2 Bank Units). Coordination log written to persistent audit trail.',
      type: 'verification',
      linkRequestId: createdRequestId,
    });
  };

  // Run full automated demonstration cycle
  const runFullSimulation = async () => {
    setIsSimulating(true);
    handleReset();

    // Step 1: Hospital
    setActiveStep(1);
    await new Promise((r) => setTimeout(r, 1200));
    await handleHospitalCreateRequest();

    // Step 2: Donor
    await new Promise((r) => setTimeout(r, 1600));
    await handleDonorPledge();

    // Step 3: Blood Bank
    await new Promise((r) => setTimeout(r, 1600));
    await handleBloodBankReserve();

    // Step 4: Admin
    await new Promise((r) => setTimeout(r, 1600));
    handleAdminVerify();

    setIsSimulating(false);
  };

  const handleReset = () => {
    setActiveStep(1);
    setPledgeStatus('pending');
    setReserveStatus('pending');
    setAdminLogStatus('waiting');
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center font-black shadow-lg shadow-red-600/30">
            <Zap className="w-6 h-6 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                4-Way Real-Time Coordination Pipeline
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                Full-Stack Architecture
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              Simulate the complete emergency cycle between Hospital, Donor, Blood Bank, and State Admin
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={runFullSimulation}
            disabled={isSimulating}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-red-600/30 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            {isSimulating ? 'Simulating Pipeline...' : 'Run Automated Simulation'}
          </button>
          <button
            onClick={handleReset}
            disabled={isSimulating}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            title="Reset Pipeline"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Interactive Role Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1: Hospital */}
        <div
          className={`rounded-2xl border p-5 transition-all duration-300 flex flex-col justify-between ${
            activeStep === 1
              ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20 shadow-lg shadow-red-500/10'
              : activeStep > 1
              ? 'border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/10'
              : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20 opacity-70'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300 font-black text-xs flex items-center justify-center">
                1
              </span>
              <span className="text-[10px] uppercase font-bold text-neutral-400">Pillar 1</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-red-600" />
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Hospital Trauma</h3>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              RGGGH Trauma Coordinator raises critical broadcast for <strong className="text-red-600">O- (3 units)</strong>.
            </p>
            <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-400">Case Ref:</span>
                <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">#TR-2026-9042</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Patient:</span>
                <span className="font-medium text-neutral-800 dark:text-neutral-200">Polytrauma (ICU)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Needed By:</span>
                <span className="font-bold text-red-600">Immediate (&lt;1 hr)</span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            {activeStep === 1 ? (
              <button
                onClick={handleHospitalCreateRequest}
                className="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-600/30 cursor-pointer"
              >
                Broadcast Emergency <Send className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Broadcast Dispatched
              </div>
            )}
          </div>
        </div>

        {/* Pillar 2: Voluntary Citizen Donor */}
        <div
          className={`rounded-2xl border p-5 transition-all duration-300 flex flex-col justify-between ${
            activeStep === 2
              ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-lg shadow-emerald-500/10'
              : activeStep > 2
              ? 'border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/10'
              : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20 opacity-70'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 font-black text-xs flex items-center justify-center">
                2
              </span>
              <span className="text-[10px] uppercase font-bold text-neutral-400">Pillar 2</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Heart className="w-5 h-5 text-emerald-600 fill-emerald-600/20" />
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Citizen Donor</h3>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Verified O- donor Karthik Subramanian receives priority alert in Mylapore (3.5 km).
            </p>
            <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-400">Donor:</span>
                <span className="font-medium text-neutral-800 dark:text-neutral-200">Karthik S. (34)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Cooldown:</span>
                <span className="font-bold text-emerald-600">Eligible (162 days)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Transit ETA:</span>
                <span className="font-medium text-neutral-800 dark:text-neutral-200">~15 mins via Anna Salai</span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            {activeStep === 2 ? (
              <button
                onClick={handleDonorPledge}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer"
              >
                Pledge Blood Donation <Heart className="w-3.5 h-3.5 fill-white" />
              </button>
            ) : activeStep > 2 ? (
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> 1 Unit Pledged En Route
              </div>
            ) : (
              <div className="text-xs text-neutral-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Awaiting Broadcast
              </div>
            )}
          </div>
        </div>

        {/* Pillar 3: Licensed Blood Bank */}
        <div
          className={`rounded-2xl border p-5 transition-all duration-300 flex flex-col justify-between ${
            activeStep === 3
              ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-lg shadow-blue-500/10'
              : activeStep > 3
              ? 'border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/10'
              : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20 opacity-70'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 font-black text-xs flex items-center justify-center">
                3
              </span>
              <span className="text-[10px] uppercase font-bold text-neutral-400">Pillar 3</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Warehouse className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Blood Bank Reserve</h3>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Red Cross Blood Bank locks 2 tested units under atomic database transaction.
            </p>
            <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-400">Facility:</span>
                <span className="font-medium text-neutral-800 dark:text-neutral-200">Red Cross Egmore</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Lock Type:</span>
                <span className="font-mono font-bold text-blue-600">BEGIN IMMEDIATE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Allocation:</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">2 Units PRBC O-</span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            {activeStep === 3 ? (
              <button
                onClick={handleBloodBankReserve}
                className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 cursor-pointer"
              >
                Atomic Unit Lock & Dispatch <Warehouse className="w-3.5 h-3.5" />
              </button>
            ) : activeStep > 3 ? (
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> 2 Units Dispatched
              </div>
            ) : (
              <div className="text-xs text-neutral-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Standing By
              </div>
            )}
          </div>
        </div>

        {/* Pillar 4: State Admin / Command Center */}
        <div
          className={`rounded-2xl border p-5 transition-all duration-300 flex flex-col justify-between ${
            activeStep === 4
              ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/20 shadow-lg shadow-purple-500/10'
              : adminLogStatus === 'verified'
              ? 'border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/10'
              : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20 opacity-70'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 font-black text-xs flex items-center justify-center">
                4
              </span>
              <span className="text-[10px] uppercase font-bold text-neutral-400">Pillar 4</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">State Command</h3>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              TNSBTC Command validates the zero-loss audit log and marks request fulfilled.
            </p>
            <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-400">Authority:</span>
                <span className="font-medium text-neutral-800 dark:text-neutral-200">TNSBTC Directorate</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Fulfillment:</span>
                <span className="font-bold text-emerald-600">100% (3 of 3 units)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Audit Status:</span>
                <span className="font-mono text-purple-600">IMMUTABLE_HASH_OK</span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            {activeStep === 4 && adminLogStatus !== 'verified' ? (
              <button
                onClick={handleAdminVerify}
                className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30 cursor-pointer"
              >
                Verify & Close Audit Trail <ShieldCheck className="w-3.5 h-3.5" />
              </button>
            ) : adminLogStatus === 'verified' ? (
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Audit Sealed & Completed
              </div>
            ) : (
              <div className="text-xs text-neutral-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Awaiting Fulfillments
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Role Persona Switcher Bar */}
      <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-neutral-500" />
          <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
            Switch Active Persona for Testing:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => {
              switchPersona('donor');
              if (onNavigatePortal) onNavigatePortal('donor');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentUser.role === 'donor'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:border-emerald-400'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current" /> Citizen Donor (Karthik O-)
          </button>

          <button
            onClick={() => {
              switchPersona('hospital');
              if (onNavigatePortal) onNavigatePortal('hospital');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentUser.role === 'hospital'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:border-red-400'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Hospital Staff (RGGGH Trauma)
          </button>

          <button
            onClick={() => {
              switchPersona('blood_bank');
              if (onNavigatePortal) onNavigatePortal('blood_bank');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentUser.role === 'blood_bank'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:border-blue-400'
            }`}
          >
            <Warehouse className="w-3.5 h-3.5" /> Blood Bank (Red Cross)
          </button>

          <button
            onClick={() => {
              switchPersona('admin');
              if (onNavigatePortal) onNavigatePortal('admin');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentUser.role === 'admin'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:border-purple-400'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> State Admin (TNSBTC)
          </button>
        </div>
      </div>
    </div>
  );
};
