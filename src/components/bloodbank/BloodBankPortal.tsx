import React, { useState, useEffect, useCallback } from 'react';
import {
  Warehouse,
  AlertTriangle,
  Package,
  Plus,
  Minus,
  Truck,
  CheckCircle2,
  Clock,
  History,
  ShieldCheck,
  RefreshCw,
  X,
  Send,
  AlertCircle,
  Calendar,
  CalendarCheck,
  UserCheck,
  Trash2,
  Check,
  Heart,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  BloodBankProfile,
  BloodInventoryItem,
  BloodRequest,
  BloodGroup,
  DonationAppointment,
} from '../../types';
import { api } from '../../services/api';

export const BloodBankPortal: React.FC = () => {
  const { currentUser } = useAuth();
  const bloodBank = currentUser as BloodBankProfile;

  const [inventory, setInventory] = useState<BloodInventoryItem[]>([]);
  const [emergencyRequests, setEmergencyRequests] = useState<BloodRequest[]>([]);
  const [appointments, setAppointments] = useState<DonationAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<BloodInventoryItem | null>(null);
  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [completingAptId, setCompletingAptId] = useState<string | null>(null);

  // Quick adjust form
  const [adjustDelta, setAdjustDelta] = useState('1');
  const [adjustReason, setAdjustReason] = useState('Mobile donation drive intake');
  const [adjustAction, setAdjustAction] = useState<'add' | 'subtract'>('add');

  // Dispatch modal
  const [dispatchingRequest, setDispatchingRequest] = useState<BloodRequest | null>(null);
  const [dispatchUnits, setDispatchUnits] = useState('2');
  const [dispatchNotes, setDispatchNotes] = useState('Emergency cold-chain courier dispatch');
  const [submittingDispatch, setSubmittingDispatch] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [invData, reqData, aptsData] = await Promise.all([
        api.getInventory(bloodBank.id),
        api.getEmergencyRequests({ status: 'Open' }),
        api.getAppointments({ bloodBankId: bloodBank.id }),
      ]);
      setInventory(invData);
      setEmergencyRequests(reqData);
      setAppointments(aptsData);
    } catch (err) {
      console.warn('Failed to fetch blood bank data:', err);
    } finally {
      setLoading(false);
    }
  }, [bloodBank.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const delta = (adjustAction === 'add' ? 1 : -1) * Number(adjustDelta);
    const newAvailable = editingItem.availableUnits + delta;

    if (newAvailable < 0) {
      setBannerMessage({ type: 'error', message: 'Error: Stock cannot be negative.' });
      return;
    }

    try {
      const updated = await api.updateInventoryItem(editingItem.id, {
        availableUnits: newAvailable,
        reason: adjustReason,
        performedByUserId: bloodBank.id,
      });

      setInventory((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditingItem(null);
      setAdjustDelta('1');
      setBannerMessage({ type: 'success', message: `Stock for ${editingItem.bloodGroup} updated to ${newAvailable} units.` });
    } catch (err: any) {
      setBannerMessage({ type: 'error', message: err.message || 'Failed to update stock' });
    }
  };

  const handleDispatch = async () => {
    if (!dispatchingRequest) return;
    setSubmittingDispatch(true);
    try {
      await api.submitBloodBankResponse({
        requestId: dispatchingRequest.id,
        bloodBankId: bloodBank.id,
        unitsOffered: Number(dispatchUnits),
        notes: dispatchNotes,
      });

      setDispatchingRequest(null);
      await loadData();
      setBannerMessage({
        type: 'success',
        message: `Success! Dispatched ${dispatchUnits} units of ${dispatchingRequest.bloodGroup} to ${dispatchingRequest.hospitalName}.`,
      });
    } catch (err: any) {
      setBannerMessage({ type: 'error', message: err.message || 'Failed to dispatch units' });
    } finally {
      setSubmittingDispatch(false);
    }
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      setCompletingAptId(appointmentId);
      const res = await api.updateAppointment(appointmentId, {
        status: 'Completed',
        notes: 'Donor checked in on-site. Screening cleared. 1 unit transferred from Reserved to Available stock.',
      });
      setBannerMessage({
        type: 'success',
        message: `Intake complete for ${res.appointment.donorName}! 1 unit added to Available inventory for ${res.appointment.donorBloodGroup} (Reserved count decremented).`,
      });
      await loadData();
    } catch (err: any) {
      setBannerMessage({
        type: 'error',
        message: err.message || 'Failed to complete appointment',
      });
    } finally {
      setCompletingAptId(null);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await api.updateAppointment(appointmentId, {
        status: 'Cancelled',
        notes: 'Cancelled by blood bank administration. Reserved quota released.',
      });
      setBannerMessage({
        type: 'info',
        message: 'Appointment cancelled and 1 reserved unit released from allocation.',
      });
      await loadData();
    } catch (err: any) {
      setBannerMessage({
        type: 'error',
        message: err.message || 'Failed to cancel appointment',
      });
    }
  };

  const totalAvailable = inventory.reduce((acc, curr) => acc + curr.availableUnits, 0);
  const totalReserved = inventory.reduce((acc, curr) => acc + curr.reservedUnits, 0);
  const lowStockCount = inventory.filter((i) => i.availableUnits < i.lowStockThreshold).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Alert / Notification Banner */}
      {bannerMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
            bannerMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : bannerMessage.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
              : 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200'
          }`}
        >
          <div className="flex items-start gap-2.5 text-xs">
            {bannerMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            ) : bannerMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            )}
            <div className="font-medium leading-relaxed">{bannerMessage.message}</div>
          </div>
          <button
            onClick={() => setBannerMessage(null)}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Verification Card */}
      <div className="p-6 rounded-3xl bg-neutral-900 text-white shadow-xl border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Warehouse className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{bloodBank.bloodBankName}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800">
                Verified Blood Center
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Lic: {bloodBank.licenseNumber} • Officer: {bloodBank.authorizedOfficer} • Cold-Chain Capacity: {bloodBank.refrigerationCapacityUnits || 4500} Units
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold border border-neutral-700 flex items-center gap-1.5 transition-colors self-start md:self-auto"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Inventory
        </button>
      </div>

      {/* Aggregate Stock KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Available Units in Storage
            </div>
            <div className="text-3xl font-extrabold text-emerald-600 mt-1 font-mono">
              {totalAvailable}
            </div>
          </div>
          <Package className="w-8 h-8 text-emerald-500 opacity-20" />
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Reserved for Active Crises
            </div>
            <div className="text-3xl font-extrabold text-blue-600 mt-1 font-mono">
              {totalReserved}
            </div>
          </div>
          <Clock className="w-8 h-8 text-blue-500 opacity-20" />
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Low-Stock Warnings
            </div>
            <div className="text-3xl font-extrabold text-red-600 mt-1 font-mono">
              {lowStockCount}
            </div>
          </div>
          <AlertTriangle className="w-8 h-8 text-red-500 opacity-20" />
        </div>
      </div>

      {/* 8-Group Blood Inventory Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              8-Group Blood Inventory Management
            </h2>
            <p className="text-xs text-neutral-500">
              Live stock counts, reserved units, and atomic adjustment controls
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {inventory.map((item) => {
            const isLow = item.availableUnits < item.lowStockThreshold;
            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all text-center flex flex-col justify-between ${
                  isLow
                    ? 'bg-red-50/60 dark:bg-red-950/20 border-red-300 dark:border-red-900'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <div>
                  <div className="text-2xl font-black text-neutral-900 dark:text-white mb-1">
                    {item.bloodGroup}
                  </div>
                  <div className="text-2xl font-extrabold text-red-600 font-mono">
                    {item.availableUnits}
                  </div>
                  <div className="text-[10px] text-neutral-400 font-medium">Available Units</div>

                  <div className="mt-2 text-[10px] text-neutral-500 border-t border-neutral-100 dark:border-neutral-800 pt-1.5 space-y-0.5">
                    <div>Reserved: <span className="font-bold text-neutral-700 dark:text-neutral-300">{item.reservedUnits}</span></div>
                    <div>Safe Min: <span className="font-bold">{item.lowStockThreshold}</span></div>
                  </div>

                  {isLow && (
                    <div className="mt-2 py-0.5 px-1.5 rounded-md bg-red-600 text-white text-[9px] font-extrabold uppercase">
                      Low Stock
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setEditingItem(item)}
                  className="mt-3 w-full py-1.5 px-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-[11px] transition-colors"
                >
                  Adjust Stock
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Incoming Hospital Emergency Requests */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
            Incoming Emergency Hospital Requisitions
          </h2>
          <p className="text-xs text-neutral-500">
            Hospitals in your district requiring direct emergency blood reserve & courier dispatch.
          </p>
        </div>

        {emergencyRequests.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400">
            No active open hospital requests.
          </div>
        ) : (
          <div className="space-y-3">
            {emergencyRequests.map((req) => {
              // Find matching stock for this bank
              const stock = inventory.find((i) => i.bloodGroup === req.bloodGroup);
              const hasEnough = stock && stock.availableUnits >= req.unitsRequired;

              return (
                <div
                  key={req.id}
                  className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 flex flex-wrap items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-900 dark:text-white text-sm">
                        {req.hospitalName}
                      </span>
                      <span className="font-mono text-[10px] text-neutral-400">
                        {req.caseReferenceId}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          req.urgency === 'Critical'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                        }`}
                      >
                        {req.urgency}
                      </span>
                    </div>

                    <div className="text-neutral-500 flex items-center gap-2">
                      <span>Needs: <strong className="text-red-600 font-bold">{req.unitsRequired} units of {req.bloodGroup}</strong></span>
                      <span>•</span>
                      <span>Your Stock Available: <strong>{stock?.availableUnits || 0} units</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setDispatchingRequest(req);
                        setDispatchUnits(String(Math.min(req.unitsRequired, stock?.availableUnits || 1)));
                      }}
                      disabled={!stock || stock.availableUnits <= 0}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Reserve & Dispatch Units
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming Scheduled Donor Appointments & Reserved Inbound Stock */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-red-600" />
              Scheduled Donor Appointments & Inbound Reserved Quota
            </h2>
            <p className="text-xs text-neutral-500">
              Future donation bookings earmarked as <strong>'Reserved'</strong> stock in your inventory. Completing intake converts them to <strong>'Available'</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
              {appointments.filter((a) => a.status === 'Scheduled').length} Upcoming
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
              {appointments.filter((a) => a.status === 'Completed').length} Intake Done
            </span>
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
            <Calendar className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-2 opacity-50" />
            No donor appointments scheduled yet for this center.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Donor & Contact</th>
                  <th className="py-3 px-4 font-semibold">Blood Group</th>
                  <th className="py-3 px-4 font-semibold">Date & Time</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Inventory Earmark</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Intake Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                        {apt.donorName}
                      </div>
                      <div className="text-[11px] text-neutral-400">{apt.donorPhone || apt.donorEmail}</div>
                      {apt.notes && (
                        <div className="text-[10px] text-neutral-500 italic mt-0.5 max-w-xs truncate" title={apt.notes}>
                          "{apt.notes}"
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 font-black font-mono text-xs">
                        {apt.donorBloodGroup}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-neutral-400" />
                        {apt.appointmentDate}
                      </div>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {apt.timeSlot}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[11px]">
                        {apt.donationType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        {apt.status === 'Scheduled' ? `+${apt.unitsReserved} Reserved Unit` : 'Processed'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          apt.status === 'Scheduled'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : apt.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {apt.status === 'Scheduled' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleCompleteAppointment(apt.id)}
                            disabled={completingAptId === apt.id}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            title="Complete screening, receive donation, and add 1 unit to available stock"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            {completingAptId === apt.id ? 'Processing...' : 'Intake & Add to Stock'}
                          </button>
                          <button
                            onClick={() => handleCancelAppointment(apt.id)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            title="Cancel appointment and release reserved inventory"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-neutral-400 italic">Intake complete</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-4">
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                Adjust Stock: {editingItem.bloodGroup}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStock} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-between">
                <span className="text-neutral-500 font-medium">Current Available Stock:</span>
                <span className="text-lg font-bold text-neutral-900 dark:text-white font-mono">
                  {editingItem.availableUnits} Units
                </span>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Action
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustAction('add')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors ${
                      adjustAction === 'add'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <Plus className="w-4 h-4" /> Add Units (Received)
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustAction('subtract')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors ${
                      adjustAction === 'subtract'
                        ? 'bg-red-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <Minus className="w-4 h-4" /> Deduct (Dispatched / Expired)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Units Delta
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Reason for Stock Transaction (Audit Log)
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-neutral-600 dark:text-neutral-400 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-600/20"
                >
                  Save Stock Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {dispatchingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-4">
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                Dispatch Blood Units to {dispatchingRequest.hospitalName}
              </h3>
              <button
                onClick={() => setDispatchingRequest(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <p className="font-semibold text-neutral-900 dark:text-white">
                  Case: {dispatchingRequest.caseReferenceId} ({dispatchingRequest.bloodGroup})
                </p>
                <p className="text-neutral-500 mt-1">
                  Required: {dispatchingRequest.unitsRequired} units • Urgency: {dispatchingRequest.urgency}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Units to Dispatch Now:
                </label>
                <input
                  type="number"
                  min="1"
                  max={dispatchingRequest.unitsRequired}
                  value={dispatchUnits}
                  onChange={(e) => setDispatchUnits(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Courier Dispatch Notes / Cold Chain ID:
                </label>
                <textarea
                  rows={2}
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setDispatchingRequest(null)}
                  className="px-4 py-2 rounded-xl text-neutral-600 dark:text-neutral-400 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingDispatch}
                  onClick={handleDispatch}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-600/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" />
                  {submittingDispatch ? 'Issuing Dispatch...' : 'Issue Courier Dispatch'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
