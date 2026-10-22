import React, { useState, useEffect, useCallback } from 'react';
import {
  Heart,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Award,
  ArrowRight,
  UserCheck,
  Edit3,
  Save,
  Check,
  X,
  Navigation,
  Info,
  CalendarPlus,
  CalendarCheck,
  Building,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  BloodGroup,
  DonorAvailability,
  BloodRequest,
  DonorProfile,
  DonorPledge,
  DonationAppointment,
  DonationType,
} from '../../types';
import { api } from '../../services/api';
import { screenDonorEligibility, isRbcCompatible, calculateHaversineDistance, maskPhoneNumber } from '../../utils/bloodCompatibility';

export const DonorPortal: React.FC = () => {
  const { currentUser, updateDonorProfileData, detectLiveLocation, locationStatus, allBloodBanks } = useAuth();
  const donor = currentUser as DonorProfile;

  const [activeRequests, setActiveRequests] = useState<BloodRequest[]>([]);
  const [pledges, setPledges] = useState<DonorPledge[]>([]);
  const [appointments, setAppointments] = useState<DonationAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [pledgingRequestId, setPledgingRequestId] = useState<string | null>(null);
  const [pledgeNotes, setPledgeNotes] = useState('');
  const [estimatedMins, setEstimatedMins] = useState('45');
  const [submittingPledge, setSubmittingPledge] = useState(false);

  // Appointment Scheduling state
  const [isSchedulingModalOpen, setIsSchedulingModalOpen] = useState(false);
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [selectedBankId, setSelectedBankId] = useState(allBloodBanks[0]?.id || 'bank-1');
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const nextWeek = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    return nextWeek.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState('10:00 AM');
  const [donationType, setDonationType] = useState<DonationType>('Whole Blood');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [schedulingSubmitting, setSchedulingSubmitting] = useState(false);

  // Profile edit form state
  const [fullName, setFullName] = useState(donor.fullName || '');
  const [phone, setPhone] = useState(donor.phone || '');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(donor.bloodGroup || 'O-');
  const [dob, setDob] = useState(donor.dateOfBirth || '1992-04-15');
  const [city, setCity] = useState(donor.city || 'Chennai');
  const [state, setState] = useState(donor.state || 'Tamil Nadu');
  const [pinCode, setPinCode] = useState(donor.pinCode || '600004');
  const [address, setAddress] = useState(donor.address || '');
  const [availability, setAvailability] = useState<DonorAvailability>(donor.availability || 'Available');
  const [willingness, setWillingness] = useState(donor.willingnessToDonate ?? true);
  const [weightKg, setWeightKg] = useState(donor.weightKg ? String(donor.weightKg) : '72');
  const [lastDonation, setLastDonation] = useState(donor.lastDonationDate || '');

  // Synchronize form fields when donor profile or active account changes
  useEffect(() => {
    setFullName(donor.fullName || '');
    setPhone(donor.phone || '');
    setBloodGroup(donor.bloodGroup || 'O-');
    setDob(donor.dateOfBirth || '1992-04-15');
    setCity(donor.city || 'Chennai');
    setState(donor.state || 'Tamil Nadu');
    setPinCode(donor.pinCode || '600004');
    setAddress(donor.address || '');
    setAvailability(donor.availability || 'Available');
    setWillingness(donor.willingnessToDonate ?? true);
    setWeightKg(donor.weightKg ? String(donor.weightKg) : '72');
    setLastDonation(donor.lastDonationDate || '');
  }, [donor]);

  const eligibility = screenDonorEligibility(donor);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allRequests, apptsData] = await Promise.all([
        api.getEmergencyRequests({ status: 'Open' }),
        api.getAppointments({ donorId: donor.id }),
      ]);
      // Filter for requests where donor's blood is compatible
      const compatible = allRequests.filter((r) =>
        isRbcCompatible(donor.bloodGroup, r.bloodGroup)
      );
      setActiveRequests(compatible);
      setAppointments(apptsData);
    } catch (err) {
      console.warn('Failed to load donor data:', err);
    } finally {
      setLoading(false);
    }
  }, [donor.bloodGroup, donor.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchedulingSubmitting(true);
    try {
      const res = await api.bookAppointment({
        donorId: donor.id,
        bloodBankId: selectedBankId,
        appointmentDate,
        timeSlot,
        donationType,
        notes: appointmentNotes,
      });

      setBannerMessage({
        type: 'success',
        message: `Appointment successfully booked at ${res.appointment.bloodBankName} on ${res.appointment.appointmentDate} (${res.appointment.timeSlot})! The blood bank inventory for ${donor.bloodGroup} has been updated to reflect the Reserved status.`,
      });
      setIsSchedulingModalOpen(false);
      setAppointmentNotes('');
      await loadData();
    } catch (err: any) {
      setBannerMessage({
        type: 'error',
        message: err.message || 'Failed to book appointment',
      });
    } finally {
      setSchedulingSubmitting(false);
    }
  };

  const handleConfirmCancelAppointment = async () => {
    if (!cancellingAppointmentId) return;
    try {
      await api.updateAppointment(cancellingAppointmentId, { status: 'Cancelled' });
      setBannerMessage({
        type: 'info',
        message: 'Your appointment has been cancelled and the blood bank inventory reservation has been released.',
      });
      setCancellingAppointmentId(null);
      await loadData();
    } catch (err: any) {
      setBannerMessage({
        type: 'error',
        message: err.message || 'Failed to cancel appointment',
      });
      setCancellingAppointmentId(null);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedDob = dob ? new Date(dob) : null;
    let calculatedAge = donor.age;
    let isEligibleAge = donor.isEligibleAge;
    if (parsedDob && !isNaN(parsedDob.getTime())) {
      const birthYear = parsedDob.getFullYear();
      calculatedAge = new Date().getFullYear() - birthYear;
      isEligibleAge = calculatedAge >= 18 && calculatedAge <= 65;
    }

    await updateDonorProfileData({
      fullName,
      phone,
      bloodGroup,
      dateOfBirth: dob,
      age: calculatedAge,
      isEligibleAge,
      city,
      state,
      pinCode,
      address,
      availability,
      willingnessToDonate: willingness,
      weightKg: Number(weightKg) || undefined,
      lastDonationDate: lastDonation || undefined,
    });
    setBannerMessage({
      type: 'success',
      message: 'Donor profile updated successfully with clinical eligibility re-screening.',
    });
    setIsEditingProfile(false);
    loadData();
  };

  const handlePledgeSubmit = async () => {
    if (!pledgingRequestId) return;
    setSubmittingPledge(true);
    try {
      const eta = new Date(Date.now() + Number(estimatedMins) * 60 * 1000).toISOString();
      const newPledge = await api.submitPledge({
        requestId: pledgingRequestId,
        donorId: donor.id,
        estimatedArrival: eta,
        notes: pledgeNotes || `Pledged to arrive within ~${estimatedMins} minutes.`,
      });
      setPledges((prev) => [newPledge, ...prev]);
      setPledgingRequestId(null);
      setPledgeNotes('');
      setBannerMessage({
        type: 'success',
        message: 'Emergency donation pledge officially registered with hospital trauma coordinators.',
      });
      loadData();
    } catch (err: any) {
      setBannerMessage({
        type: 'error',
        message: err.message || 'Pledge submission failed. Please check connection and try again.',
      });
    } finally {
      setSubmittingPledge(false);
    }
  };

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
              <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
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

      {/* Official Clinical Donor Card Header */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg bg-red-700/20 border border-red-600/40 text-red-400 flex items-center justify-center text-2xl font-black font-mono">
            {donor.bloodGroup}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">{donor.fullName}</h1>
              <span className="text-[11px] font-medium text-emerald-400">
                · Verified Citizen Donor
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2 font-normal">
              <span>{donor.city}, {donor.state} ({donor.pinCode})</span>
              <span className="opacity-40">·</span>
              <span>Age {donor.age}</span>
              <span className="opacity-40">·</span>
              <span className="font-mono tabular-nums">{donor.totalDonationsCount} Recorded Donations</span>
              <span className="opacity-40">·</span>
              <span>Group {donor.bloodGroup}</span>
            </p>
          </div>
        </div>

        {/* Quick Availability Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-800/80 p-1 rounded-lg border border-slate-700 flex items-center gap-1">
            {(['Available', 'Temporarily Unavailable', 'Ineligible'] as DonorAvailability[]).map((status) => (
              <button
                key={status}
                onClick={async () => {
                  setAvailability(status);
                  await updateDonorProfileData({ availability: status });
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  donor.availability === status
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1.5 border border-white/30 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isEditingProfile ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Profile Edit Drawer */}
      {isEditingProfile && (
        <form
          onSubmit={handleSaveProfile}
          className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-lg space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-red-600" />
              Edit Personal & Health Screening Details
            </h3>
            <span className="text-xs text-neutral-400">
              Personal phone & street address are never made public
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                Blood Group (Confirmed)
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold"
              >
                {(['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] as BloodGroup[]).map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                Date of Birth (18–65 required)
              </label>
              <input
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                Phone Number (Private)
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                City
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                State
              </label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                PIN Code / Zip
              </label>
              <input
                type="text"
                required
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                Last Whole Blood Donation Date
              </label>
              <input
                type="date"
                value={lastDonation}
                onChange={(e) => setLastDonation(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={willingness}
                onChange={(e) => setWillingness(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
              />
              Willing to receive rapid emergency alerts for compatible critical cases
            </label>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Save Profile Updates
            </button>
          </div>
        </form>
      )}

      {/* Eligibility Screening Status Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-5 rounded-2xl border ${
          eligibility.isEligible
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
        }`}>
          <div className="flex items-center gap-2 font-bold text-sm mb-1">
            {eligibility.isEligible ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600" />
            )}
            Prototype Screening Status
          </div>
          <p className="text-xs leading-relaxed opacity-90">
            {eligibility.isEligible
              ? 'Meets age (18–65) screening and voluntary health declaration. Certified eligible for notification broadcasts.'
              : eligibility.reasons.join(' ')}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            Donation Interval Buffer
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white">
            {donor.lastDonationDate
              ? `${Math.floor((Date.now() - new Date(donor.lastDonationDate).getTime()) / (1000 * 60 * 60 * 24))} Days Since Last`
              : 'No recorded prior donations'}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Minimum 56-day standard recovery interval between whole blood donations.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            Transfusion Compatibility
          </div>
          <div className="text-xl font-bold text-red-600">
            {donor.bloodGroup === 'O-' ? 'Universal RBC Donor' : `Safe for Compatible Groups`}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Your {donor.bloodGroup} red blood cells are matched instantly when compatible trauma patients are registered.
          </p>
        </div>
      </div>

      {/* Future Donation Appointment Scheduling Section */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <CalendarPlus className="w-5 h-5 text-red-600" />
              Future Blood Donation Appointments
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Book a scheduled donation slot at a regional blood bank. Booking automatically reserves an intake slot and updates blood bank inventory to 'Reserved' status.
            </p>
          </div>

          <button
            onClick={() => setIsSchedulingModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer shrink-0"
          >
            <CalendarPlus className="w-4 h-4" /> Book New Appointment
          </button>
        </div>

        {/* List of Scheduled Appointments */}
        {appointments.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-center text-xs text-neutral-500">
            <Calendar className="w-8 h-8 text-neutral-400 mx-auto mb-2 opacity-50" />
            <div className="font-semibold text-neutral-700 dark:text-neutral-300">No upcoming donation appointments scheduled.</div>
            <p className="text-[11px] text-neutral-400 mt-1 max-w-md mx-auto">
              Plan ahead to maintain community blood bank reserves. Choose a convenient date and time to donate!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/60 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
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
                    <span className="text-[11px] font-mono font-semibold text-red-600 dark:text-red-400">
                      Reserved: {apt.unitsReserved} Unit ({apt.donorBloodGroup})
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-neutral-500" />
                    {apt.bloodBankName}
                  </h3>
                  <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" /> {apt.bloodBankAddress}, {apt.bloodBankCity}
                  </p>

                  <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-red-600" />
                      {apt.appointmentDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-red-600" />
                      {apt.timeSlot}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-800 text-[10px]">
                      {apt.donationType}
                    </span>
                  </div>

                  {apt.notes && (
                    <p className="text-[11px] text-neutral-500 italic mt-2">
                      "{apt.notes}"
                    </p>
                  )}
                </div>

                {apt.status === 'Scheduled' && (
                  <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Blood Bank Slot Confirmed
                    </span>
                    <button
                      onClick={() => setCancellingAppointmentId(apt.id)}
                      className="text-xs text-neutral-400 hover:text-red-600 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Cancel Booking
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Emergency Requests Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></span>
              Emergency Blood Requests Matching Your Group ({donor.bloodGroup})
            </h2>
            <p className="text-xs text-neutral-500">
              Only requests clinically compatible with your blood are shown.
            </p>
          </div>
          <button
            onClick={loadData}
            className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-medium"
          >
            Refresh Feed
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-neutral-400">Loading emergency matches...</div>
        ) : activeRequests.length === 0 ? (
          <div className="p-12 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-center">
            <Heart className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
              No Open Emergency Requests for {donor.bloodGroup} Right Now
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Your community blood reserves are stable. You will receive an immediate in-app broadcast if a critical need arises!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeRequests.map((req) => {
              let distance: number | null = null;
              if (donor.coordinates && req.hospitalCoordinates) {
                distance = calculateHaversineDistance(donor.coordinates, req.hospitalCoordinates);
              }

              return (
                <div
                  key={req.id}
                  className={`p-6 rounded-2xl bg-white dark:bg-neutral-900 border shadow-xs transition-all ${
                    req.urgency === 'Critical'
                      ? 'border-red-300 dark:border-red-800/80 hover:border-red-500'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            req.urgency === 'Critical'
                              ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {req.urgency} Urgency
                        </span>
                        <span className="text-xs font-mono text-neutral-400">
                          {req.caseReferenceId}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-neutral-900 dark:text-white mt-1">
                        {req.hospitalName}
                      </h3>
                      <p className="text-xs text-neutral-500 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-red-500" />
                        {req.hospitalCity}
                        {distance !== null && (
                          <span className="font-bold text-neutral-700 dark:text-neutral-300">
                            • ~{distance} km away
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black text-red-600 font-mono">
                        {req.unitsRequired} Units
                      </div>
                      <div className="text-[10px] font-semibold text-neutral-400">
                        Requested: {req.bloodGroup}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-xl mb-4 leading-relaxed">
                    {req.clinicalNotes}
                  </p>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <span className="text-neutral-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Needed by: {new Date(req.requiredBy).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <button
                      onClick={() => setPledgingRequestId(req.id)}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 flex items-center gap-1.5 transition-transform hover:scale-105 cursor-pointer"
                    >
                      <Heart className="w-3.5 h-3.5 fill-white" /> Pledge to Donate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pledge Modal */}
      {pledgingRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-4">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-600 fill-current" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                  Confirm Emergency Donation Pledge
                </h3>
              </div>
              <button
                onClick={() => setPledgingRequestId(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-neutral-600 dark:text-neutral-300">
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                <p className="font-bold mb-1 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-600" /> Medical Disclaimer & Screening
                </p>
                <p className="leading-relaxed">
                  Your pledge alerts the trauma surgical team that a donor is en route. Actual blood donation is subject to on-site hemoglobin testing, vitals check, and physician clearance.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Estimated Arrival Time to Hospital:
                </label>
                <select
                  value={estimatedMins}
                  onChange={(e) => setEstimatedMins(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold"
                >
                  <option value="20">Within 20 minutes (Immediate emergency)</option>
                  <option value="45">Within 45 minutes</option>
                  <option value="60">Within 1 hour</option>
                  <option value="90">Within 1.5 hours</option>
                  <option value="120">Within 2 hours</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Notes for Trauma Reception (Optional):
                </label>
                <textarea
                  rows={2}
                  value={pledgeNotes}
                  onChange={(e) => setPledgeNotes(e.target.value)}
                  placeholder="E.g. Arriving via Chennai Metro to RGGGH Blood Bank / Emergency Block."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setPledgingRequestId(null)}
                  className="px-4 py-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingPledge}
                  onClick={handlePledgeSubmit}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-600/20 disabled:opacity-50"
                >
                  {submittingPledge ? 'Submitting...' : 'Confirm Pledge & Notify Hospital'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Book Future Donation Appointment Modal */}
      {isSchedulingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-4">
              <div className="flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                  Schedule Blood Bank Donation
                </h3>
              </div>
              <button
                onClick={() => setIsSchedulingModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-4 text-xs">
              {/* Blood Bank Info & Inventory Reservation Banner */}
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-900 dark:text-red-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-red-600 shrink-0" />
                  Inventory Earmark Guarantee
                </div>
                <p className="text-[11px] leading-relaxed text-red-800 dark:text-red-300">
                  Scheduling an appointment reserves <strong>1 unit of {donor.bloodGroup}</strong> in the selected blood bank's inventory as incoming quota, helping emergency planners anticipate stock.
                </p>
              </div>

              {/* Blood Bank Picker */}
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Select Blood Bank / Donation Center:
                </label>
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium"
                >
                  {allBloodBanks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.bloodBankName} — {bank.address || bank.city} ({bank.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time Slot Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Appointment Date:
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Time Slot:
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium"
                  >
                    <option value="09:00 AM">09:00 AM - Morning Slot</option>
                    <option value="10:00 AM">10:00 AM - Morning Slot</option>
                    <option value="11:30 AM">11:30 AM - Late Morning</option>
                    <option value="01:00 PM">01:00 PM - Afternoon</option>
                    <option value="02:30 PM">02:30 PM - Afternoon</option>
                    <option value="04:00 PM">04:00 PM - Evening</option>
                    <option value="05:30 PM">05:30 PM - Evening</option>
                  </select>
                </div>
              </div>

              {/* Donation Type */}
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Donation Category:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Whole Blood', 'Platelets', 'Plasma', 'Double Red Cells'] as DonationType[]).map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setDonationType(type)}
                      className={`py-2 px-3 rounded-xl border text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        donationType === type
                          ? 'border-red-600 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <span>{type}</span>
                      {donationType === type && <Check className="w-3.5 h-3.5 text-red-600" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Special Notes or Medical Requests (Optional):
                </label>
                <textarea
                  rows={2}
                  value={appointmentNotes}
                  onChange={(e) => setAppointmentNotes(e.target.value)}
                  placeholder="E.g., First time platelet donor, prefer left arm, arriving with family member."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsSchedulingModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedulingSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-600/20 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <CalendarCheck className="w-4 h-4" />
                  {schedulingSubmitting ? 'Confirming...' : 'Confirm Appointment & Reserve Quota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {cancellingAppointmentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-neutral-200 dark:border-neutral-800 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-white mb-1">
              Cancel Donation Booking?
            </h3>
            <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
              This will cancel your scheduled slot and release the <strong>1 Reserved unit</strong> from the blood bank's inventory quota.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setCancellingAppointmentId(null)}
                className="px-4 py-2 rounded-xl text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 font-bold text-xs hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelAppointment}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 cursor-pointer"
              >
                Yes, Cancel Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
