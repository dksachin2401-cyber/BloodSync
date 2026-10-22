import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Warehouse,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Send,
  Eye,
  RefreshCw,
  X,
  Heart,
  Truck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BloodGroup, UrgencyLevel, BloodRequest, HospitalProfile, MatchingDonorResult, RequestStatus } from '../../types';
import { api } from '../../services/api';
import { maskPhoneNumber } from '../../utils/bloodCompatibility';

interface HospitalPortalProps {
  initialRequestId?: string | null;
}

export const HospitalPortal: React.FC<HospitalPortalProps> = ({ initialRequestId }) => {
  const { currentUser } = useAuth();
  const hospital = currentUser as HospitalProfile;

  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);
  const [matchedDonors, setMatchedDonors] = useState<MatchingDonorResult[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // New request form state
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O-');
  const [unitsRequired, setUnitsRequired] = useState('4');
  const [urgency, setUrgency] = useState<UrgencyLevel>('Critical');
  const [requiredByTime, setRequiredByTime] = useState(() => {
    const d = new Date(Date.now() + 3 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [patientAge, setPatientAge] = useState('38');
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [clinicalNotes, setClinicalNotes] = useState(
    'Acute internal hemorrhage, emergency trauma resuscitation protocol active.'
  );
  const [submitting, setSubmitting] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getEmergencyRequests({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        urgency: urgencyFilter !== 'all' ? urgencyFilter : undefined,
      });
      setRequests(data);

      if (initialRequestId) {
        const found = data.find((r) => r.id === initialRequestId);
        if (found) openMatchesModal(found);
      }
    } catch (err) {
      console.warn('Failed to fetch hospital requests:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, urgencyFilter, initialRequestId]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await api.createEmergencyRequest({
        hospitalId: hospital.id,
        hospitalName: hospital.hospitalName || 'Rajiv Gandhi Government General Hospital (RGGGH)',
        hospitalCity: hospital.city || 'Chennai',
        hospitalContact: hospital.emergencyContact || '+91 44 2530 5000',
        bloodGroup,
        unitsRequired: Number(unitsRequired),
        urgency,
        requiredBy: new Date(requiredByTime).toISOString(),
        clinicalNotes,
        patientAge: Number(patientAge) || undefined,
        patientGender,
      });

      setIsCreating(false);
      loadRequests();
      openMatchesModal(result.request);
    } catch (err: any) {
      alert(err.message || 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  const openMatchesModal = async (req: BloodRequest) => {
    setSelectedRequest(req);
    setLoadingMatches(true);
    try {
      const res = await api.getDonorMatches(req.id);
      setMatchedDonors(res.matches);
    } catch (err) {
      console.warn('Failed to load matches:', err);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: RequestStatus) => {
    try {
      await api.updateEmergencyRequest(requestId, { status: newStatus });
      loadRequests();
      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Metrics
  const activeCount = requests.filter((r) => r.status === 'Open' || r.status === 'Partially Fulfilled').length;
  const fulfilledCount = requests.filter((r) => r.status === 'Fulfilled').length;
  const criticalCount = requests.filter((r) => r.urgency === 'Critical' && r.status !== 'Fulfilled' && r.status !== 'Cancelled').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Hospital Credentials */}
      <div className="p-6 rounded-3xl bg-neutral-900 text-white shadow-xl border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{hospital.hospitalName}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800">
                Verified Trauma Center
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              {hospital.address}, {hospital.city} • Reg: {hospital.registrationNumber} • {hospital.authorizedStaffName} ({hospital.authorizedStaffDesignation})
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Emergency Blood Requisition
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Active Crises
            </div>
            <div className="text-3xl font-extrabold text-red-600 mt-1 font-mono">
              {activeCount}
            </div>
          </div>
          <AlertTriangle className="w-8 h-8 text-red-500 opacity-20" />
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Critical Urgency Cases
            </div>
            <div className="text-3xl font-extrabold text-amber-600 mt-1 font-mono">
              {criticalCount}
            </div>
          </div>
          <Clock className="w-8 h-8 text-amber-500 opacity-20" />
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Fulfilled Emergencies
            </div>
            <div className="text-3xl font-extrabold text-emerald-600 mt-1 font-mono">
              {fulfilledCount}
            </div>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-20" />
        </div>
      </div>

      {/* Create Emergency Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                  Broadcast Emergency Blood Request
                </h3>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Required Blood Group *
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold"
                  >
                    {(['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] as BloodGroup[]).map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Units Required (Units of PRBC) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={unitsRequired}
                    onChange={(e) => setUnitsRequired(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Clinical Urgency *
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold"
                  >
                    <option value="Critical">Critical (Operating Room / Acute Hemorrhage)</option>
                    <option value="High">High (Urgent ICU / Surgery within 4h)</option>
                    <option value="Normal">Normal (Scheduled / Pre-op reserve)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Needed By (Date & Time) *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={requiredByTime}
                    onChange={(e) => setRequiredByTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Patient Age
                  </label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Patient Gender
                  </label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Clinical Notes / Department
                </label>
                <textarea
                  rows={2}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                📢 Submitting broadcasts notifications to all compatible, screened donors within proximity and alerts verified blood banks for rapid inventory reserve.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 dark:text-neutral-400 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-600/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? 'Broadcasting...' : 'Broadcast Emergency Requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Requests Management Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs overflow-hidden">
        {/* Table Filters & Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              Emergency Blood Requests
            </h2>
            <p className="text-xs text-neutral-500">
              Track donor pledges vs verified blood bank dispatches
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Partially Fulfilled">Partially Fulfilled</option>
              <option value="Fulfilled">Fulfilled</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-medium"
            >
              <option value="all">All Urgency</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
            </select>

            <button
              onClick={loadRequests}
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title="Refresh requests"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 uppercase tracking-wider font-semibold border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="p-4">Case Ref</th>
                <th className="p-4">Blood Group</th>
                <th className="p-4">Required Units</th>
                <th className="p-4">Fulfillment Status</th>
                <th className="p-4">Urgency</th>
                <th className="p-4">Needed By</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-400">Loading requests...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-400">No requests match filters.</td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                    <td className="p-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                      {req.caseReferenceId}
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-extrabold text-red-600">
                        {req.bloodGroup}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-neutral-800 dark:text-neutral-200">
                      {req.unitsRequired} Units
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              req.status === 'Fulfilled'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : req.status === 'Partially Fulfilled'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : req.status === 'Cancelled'
                                ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          {req.unitsFulfilled} verified • {req.unitsPledged} pledged
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          req.urgency === 'Critical'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                            : req.urgency === 'High'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                            : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                        }`}
                      >
                        {req.urgency}
                      </span>
                    </td>
                    <td className="p-4 text-neutral-500 font-mono">
                      {new Date(req.requiredBy).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openMatchesModal(req)}
                          className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-bold text-neutral-700 dark:text-neutral-200 flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Matches
                        </button>

                        {req.status !== 'Fulfilled' && req.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleStatusUpdate(req.id, 'Cancelled')}
                            className="px-2.5 py-1.5 rounded-lg text-neutral-400 hover:text-red-600 dark:hover:text-red-400 font-medium"
                            title="Cancel Request"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Matched Donors & Blood Bank Allocation Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-neutral-900 dark:text-white">
                    Emergency Case: {selectedRequest.caseReferenceId}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950 text-red-600">
                    Needs {selectedRequest.unitsRequired} Units {selectedRequest.bloodGroup}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Algorithmic compatibility matches, donor pledges, and certified blood bank availability.
                </p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Progress Summary */}
              <div className="p-4 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">
                    Fulfillment Progress:
                  </div>
                  <div className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
                    {selectedRequest.unitsFulfilled} of {selectedRequest.unitsRequired} Units Verified
                    ({selectedRequest.unitsPledged} Active Pledges En Route)
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedRequest.status !== 'Fulfilled' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedRequest.id, 'Fulfilled')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    >
                      Mark Complete (Fulfilled)
                    </button>
                  )}
                  {selectedRequest.status !== 'Cancelled' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedRequest.id, 'Cancelled')}
                      className="px-3.5 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bold text-xs"
                    >
                      Cancel Emergency
                    </button>
                  )}
                </div>
              </div>

              {/* Compatible Matched Donors */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-red-600" />
                  Compatible Donors in Network ({matchedDonors.filter(m => m.isCompatible).length} Found)
                </h4>

                {loadingMatches ? (
                  <div className="p-8 text-center text-xs text-neutral-400">Running compatibility calculations...</div>
                ) : (
                  <div className="space-y-2.5">
                    {matchedDonors.map((m) => (
                      <div
                        key={m.donor.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                          m.isCompatible && m.isEligible
                            ? 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                            : 'bg-neutral-50/50 dark:bg-neutral-900/50 border-neutral-100 dark:border-neutral-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 font-extrabold flex items-center justify-center">
                            {m.donor.bloodGroup}
                          </span>
                          <div>
                            <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                              {m.donor.fullName}
                              {m.existingPledgeStatus && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                  {m.existingPledgeStatus}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-0.5">
                              {m.donor.city} {m.distanceKm !== null && `• ~${m.distanceKm} km`} • {m.donor.totalDonationsCount} prior donations
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                              m.isCompatible
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                            }`}
                          >
                            {m.isCompatible ? 'RBC Compatible' : 'Incompatible'}
                          </span>
                          <div className="text-[10px] text-neutral-400 mt-0.5">
                            {m.alreadyNotified ? 'Notified via Broadcast' : 'Standing By'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Privacy Notice */}
              <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-[11px] text-neutral-500 leading-relaxed">
                🔒 <strong>Donor Consent & Screening Guard:</strong> Donor personal phone numbers and exact home coordinates remain encrypted until arrival and clinical triage check-in.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
