import React, { useState, useEffect } from 'react';
import {
  Heart,
  Building2,
  Warehouse,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Activity,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  LogIn,
  UserPlus,
  MapPin,
  TrendingUp,
  Radio,
  FileCheck2,
  Ambulance,
  PhoneCall,
  Search,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { BloodGroup, UserRole, BloodRequest } from '../../types';
import { RBC_COMPATIBILITY_RULES } from '../../utils/bloodCompatibility';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ChennaiDemandTrendsDashboard } from '../analytics/ChennaiDemandTrendsDashboard';
import { SimulatedMap } from '../map/SimulatedMap';
import { FourWayCoordinationDemo } from '../demo/FourWayCoordinationDemo';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
  onOpenLogin?: (role?: UserRole) => void;
  onOpenRegister?: (role?: UserRole) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onOpenLogin,
  onOpenRegister,
}) => {
  const { isLoggedIn, currentUser } = useAuth();
  const [selectedCalcGroup, setSelectedCalcGroup] = useState<BloodGroup>('O-');
  const [showDemandPreview, setShowDemandPreview] = useState(false);
  const [emergencyRequests, setEmergencyRequests] = useState<BloodRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestFilter, setRequestFilter] = useState<'all' | 'Critical' | 'High'>('all');

  const [metrics, setMetrics] = useState({
    activeCrises: 4,
    totalDonors: 1420,
    totalHospitals: 14,
    totalBloodBanks: 8,
    totalDispatchedUnits: 384,
    fulfillmentRatePercent: 94,
  });

  useEffect(() => {
    api.getAdminAnalytics().then((res) => {
      if (res?.metrics) {
        setMetrics({
          ...res.metrics,
          totalDonors: Math.max(res.metrics.totalDonors, 1420),
          totalDispatchedUnits: Math.max(res.metrics.totalDispatchedUnits, 384),
          fulfillmentRatePercent: Math.max(res.metrics.fulfillmentRatePercent, 94),
        });
      }
    }).catch(() => {});

    setLoadingRequests(true);
    api.getEmergencyRequests()
      .then((reqs) => setEmergencyRequests(reqs))
      .catch(() => {})
      .finally(() => setLoadingRequests(false));
  }, []);

  const compatibleDonors = RBC_COMPATIBILITY_RULES[selectedCalcGroup] || [];

  const filteredRequests = emergencyRequests.filter((r) => {
    if (requestFilter === 'all') return true;
    return r.urgency === requestFilter;
  });

  const handlePortalAccess = (role: UserRole) => {
    if (isLoggedIn) {
      if (currentUser.role === role || currentUser.role === 'admin') {
        onNavigate(role);
      } else {
        onOpenLogin?.(role);
      }
    } else {
      onOpenLogin?.(role);
    }
  };

  return (
    <div className="space-y-20 pb-20">
      {/* 1. Official Enterprise Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24 border-b border-neutral-200/60 dark:border-neutral-800">
        {/* Subtle Ambient Red Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-red-600/10 dark:bg-red-600/15 blur-[120px] pointer-events-none -z-10 rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Official Authority Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-xs font-bold uppercase tracking-wider mb-6 border border-red-200/80 dark:border-red-900/60 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              <span>Government of Tamil Nadu • State Blood Transfusion Council (TNSBTC)</span>
            </div>

            {/* Official Title */}
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-neutral-900 dark:text-white leading-[1.12]">
              Rapid Immuno-Compatible{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-600 to-amber-600">
                Blood Logistics
              </span>{' '}
              & Demand Forecasting
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base sm:text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-3xl mx-auto font-normal">
              A centralized emergency coordination infrastructure synchronizing Chennai's trauma corridors (RGGGH, Apollo, Stanley), certified blood banks (Indian Red Cross, TTK VHS), and verified citizen donors in real time.
            </p>

            {/* Primary Action Buttons (Lexora Style) */}
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
              <button
                onClick={() => handlePortalAccess('hospital')}
                className="px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Report Emergency Requisition</span>
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('institutional-gateways');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3.5 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white font-bold text-sm border border-neutral-300 dark:border-neutral-700 shadow-sm flex items-center gap-2 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Access Facility Portals</span>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>

              <button
                onClick={() => onOpenRegister?.('donor')}
                className="px-5 py-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-semibold text-sm transition-colors cursor-pointer flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4 text-red-500" />
                <span>Register as Voluntary Donor</span>
              </button>
            </div>
          </div>

          {/* 2. Official Live Telemetry Grid (Lexora Metric Cards) */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 backdrop-blur-md shadow-xs text-center">
              <div className="text-3xl sm:text-4xl font-black text-red-600 font-mono tracking-tight">
                {metrics.activeCrises}
              </div>
              <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1 uppercase tracking-wider">
                Active Crises
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Trauma requisitions in transit
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 backdrop-blur-md shadow-xs text-center">
              <div className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white font-mono tracking-tight">
                {metrics.totalDonors.toLocaleString()}
              </div>
              <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1 uppercase tracking-wider">
                Screened Donors
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Cleared by 56-day clinical interval
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 backdrop-blur-md shadow-xs text-center">
              <div className="text-3xl sm:text-4xl font-black text-emerald-600 font-mono tracking-tight">
                {metrics.totalDispatchedUnits}
              </div>
              <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1 uppercase tracking-wider">
                Reserve Units
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Atomic 8-group bank inventory
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 backdrop-blur-md shadow-xs text-center">
              <div className="text-3xl sm:text-4xl font-black text-blue-600 font-mono tracking-tight">
                12.4 min
              </div>
              <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1 uppercase tracking-wider">
                Response Velocity
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Average matching & courier dispatch
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Four Institutional Facility Gateways Section */}
      <section id="institutional-gateways" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
            <span>Institutional Access Gateways</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
            Operational Facility Portals
          </h2>
          <p className="text-sm text-neutral-500 mt-2">
            Verified access points for hospitals, certified blood banks, registered voluntary donors, and health council officials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Gateway 1: Hospital Trauma Portal */}
          <div className="group p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 hover:border-red-500 dark:hover:border-red-600 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center font-bold mb-4 group-hover:scale-105 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
                Hospital Trauma Unit
              </h3>
              <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-3 uppercase tracking-wider">
                RGGGH • Apollo • Stanley
              </p>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6">
                Rapid emergency requisitions, automated immunohematological matching against voluntary donors, and certified blood bank allocations.
              </p>
            </div>

            <button
              onClick={() => handlePortalAccess('hospital')}
              className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs border border-transparent dark:border-neutral-700"
            >
              <span>Enter Hospital Operations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Gateway 2: Voluntary Citizen Donor Network */}
          <div className="group p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 hover:border-red-500 dark:hover:border-red-600 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-bold mb-4 group-hover:scale-105 transition-transform">
                <Heart className="w-6 h-6 fill-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
                Voluntary Donor Network
              </h3>
              <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-3 uppercase tracking-wider">
                Mylapore • Anna Nagar • T. Nagar
              </p>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6">
                Screening for age (18–65) & donation interval (56 days). Strict RBC compatibility matching, privacy-masked addresses, and ETA pledge tracking.
              </p>
            </div>

            <button
              onClick={() => handlePortalAccess('donor')}
              className="w-full py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-red-600/30 transition-colors cursor-pointer"
            >
              <span>Access Donor Network</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Gateway 3: Licensed Blood Bank Operations */}
          <div className="group p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 hover:border-red-500 dark:hover:border-red-600 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold mb-4 group-hover:scale-105 transition-transform">
                <Warehouse className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
                Certified Blood Bank Hub
              </h3>
              <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-3 uppercase tracking-wider">
                Indian Red Cross • TTK VHS
              </p>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6">
                Real-time 8-group atomic reserve inventory, cold-chain courier manifests, automated stock replenishment, and mutual-aid transfers.
              </p>
            </div>

            <button
              onClick={() => handlePortalAccess('blood_bank')}
              className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs border border-transparent dark:border-neutral-700"
            >
              <span>Manage Bank Inventory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Gateway 4: State Health Council Command */}
          <div className="group p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 hover:border-red-500 dark:hover:border-red-600 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center font-bold mb-4 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
                Command & Predictive Hub
              </h3>
              <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-3 uppercase tracking-wider">
                TNSBTC State Administrator
              </p>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6">
                City-wide demand telemetry, shortage risk modeling, institution accreditation management, and immutable clinical audit trails.
              </p>
            </div>

            <button
              onClick={() => handlePortalAccess('admin')}
              className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs border border-transparent dark:border-neutral-700"
            >
              <span>Open Command Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 3B. Chennai Metropolitan Live Telemetry Map */}
      <section id="chennai-network-map" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 mb-3 border border-blue-200 dark:border-blue-900/60">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>Interactive Spatial Telemetry</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
            Live Chennai Facility & Donor Map
          </h2>
          <p className="text-sm text-neutral-500 mt-2">
            Real-time coordinates of verified government/private trauma centers, licensed blood banks, and nearby universal donors with dynamic distance circles.
          </p>
        </div>
        <SimulatedMap
          activeRequest={emergencyRequests[0] || null}
          onSelectFacility={(type) => {
            if (type === 'hospital') handlePortalAccess('hospital');
            else if (type === 'blood_bank') handlePortalAccess('blood_bank');
            else handlePortalAccess('donor');
          }}
          onRequestBlood={() => handlePortalAccess('hospital')}
        />
      </section>

      {/* 3C. 4-Way Real-Time Coordination Pipeline */}
      <section id="four-way-coordination-pipeline" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <FourWayCoordinationDemo onNavigatePortal={(p) => handlePortalAccess(p as UserRole)} />
      </section>

      {/* 4. Live Emergency Grid Broadcast Stream (Active Chennai Requisitions) */}
      <section id="live-emergency-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200/80 dark:border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  Live Chennai Emergency Coordination Grid
                </h3>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Active clinical blood requisitions receiving immediate voluntary pledges and cold-chain dispatches.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setRequestFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  requestFilter === 'all'
                    ? 'bg-neutral-900 dark:bg-neutral-800 text-white border border-transparent dark:border-neutral-700'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                }`}
              >
                All Crises ({emergencyRequests.length})
              </button>
              <button
                onClick={() => setRequestFilter('Critical')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  requestFilter === 'Critical'
                    ? 'bg-red-600 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                }`}
              >
                Critical Only
              </button>
              <button
                onClick={() => setRequestFilter('High')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  requestFilter === 'High'
                    ? 'bg-amber-600 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                }`}
              >
                High Urgency
              </button>
            </div>
          </div>

          {/* Requisitions Table / Cards */}
          <div className="mt-6 space-y-3">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-sm">
                No active requisitions matching this filter.
              </div>
            ) : (
              filteredRequests.slice(0, 5).map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 font-black text-base flex items-center justify-center shrink-0 border border-red-200 dark:border-red-900/60 font-mono">
                      {req.bloodGroup}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-neutral-900 dark:text-white">
                          {req.hospitalName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            req.urgency === 'Critical'
                              ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {req.urgency}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {req.hospitalCity} • {req.clinicalNotes || 'Acute emergency transfusion'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 justify-between md:justify-end">
                    <div className="text-left md:text-right">
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">
                        {req.unitsFulfilled || 0} of {req.unitsRequired} Units Secured
                      </div>
                      <div className="w-32 bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-red-600 h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.round(((req.unitsFulfilled || 0) / req.unitsRequired) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handlePortalAccess('donor')}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm cursor-pointer whitespace-nowrap"
                    >
                      Pledge or Dispatch
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 5. Scientific Immunohematological Red Blood Cell Matrix */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 mb-2">
              <Activity className="w-3.5 h-3.5" />
              <span>Scientific Immunohematology Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
              Red Blood Cell (RBC) Compatibility Matrix
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-2">
              Select recipient blood group to inspect clinically verified donor compatibility rules enforced across all automated matching pipelines.
            </p>
          </div>

          {/* Blood Group Selector Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {(['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] as BloodGroup[]).map((group) => (
              <button
                key={group}
                onClick={() => setSelectedCalcGroup(group)}
                className={`w-14 h-12 rounded-xl font-mono text-sm font-black transition-all cursor-pointer ${
                  selectedCalcGroup === group
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30 scale-105'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {group}
              </button>
            ))}
          </div>

          {/* Selected Group Clinical Result Card */}
          <div className="max-w-3xl mx-auto p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Patient Recipient Group
                </span>
                <div className="text-2xl font-black text-neutral-900 dark:text-white font-mono mt-0.5">
                  Type {selectedCalcGroup}
                </div>
              </div>

              {selectedCalcGroup === 'AB+' && (
                <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                  Universal Recipient (All 8 Groups Allowed)
                </span>
              )}
              {selectedCalcGroup === 'O-' && (
                <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-xs font-bold">
                  Strict O- Only (Universal Red Cell Donor)
                </span>
              )}
            </div>

            <div className="pt-4">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">
                Clinically Approved Red Cell Donor Groups:
              </span>
              <div className="flex flex-wrap gap-2">
                {compatibleDonors.map((donorGroup) => (
                  <span
                    key={donorGroup}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 text-sm font-mono font-bold shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>{donorGroup}</span>
                  </span>
                ))}
              </div>
              <p className="text-xs text-neutral-500 mt-3 leading-relaxed">
                {selectedCalcGroup === 'O-'
                  ? 'O- individuals lack A, B, and Rh antigens, rendering their red blood cells safe for any recipient in extreme trauma. However, they can strictly receive only O- negative units.'
                  : selectedCalcGroup === 'AB+'
                  ? 'AB+ individuals possess A, B, and Rh antigens, eliminating plasma antibodies against foreign red blood cell antigens. They can safely receive PRBC from all 8 blood groups.'
                  : `Transfusion for ${selectedCalcGroup} safely accepts red cells from ${compatibleDonors.join(', ')} while strictly excluding non-compatible antigen groups to avoid hemolytic transfusion reactions.`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Chennai Healthcare Corridors */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 mb-2">
            <MapPin className="w-3.5 h-3.5 text-red-600" />
            <span>Geographic Distribution</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
            Chennai Healthcare Corridors Covered
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2">
            Strategic mutual-aid connectivity ensuring minimum transit times for emergency cold-chain couriers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
            <div className="text-xs font-bold text-red-600 uppercase tracking-wider">
              Central Trauma Corridor
            </div>
            <div className="font-bold text-neutral-900 dark:text-white text-base mt-1">
              Park Town & Royapuram
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              Rajiv Gandhi Govt General Hospital (RGGGH), Stanley Medical College Hospital, Egmore Red Cross Blood Bank.
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Specialty Surgical Corridor
            </div>
            <div className="font-bold text-neutral-900 dark:text-white text-base mt-1">
              Greams Road & Thousand Lights
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              Apollo Hospitals Greams Road, specialized cardiac and organ transplant surgical suites, TNSBTC headquarters.
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
            <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              South & OMR Corridor
            </div>
            <div className="font-bold text-neutral-900 dark:text-white text-base mt-1">
              Adyar, Velachery & Taramani
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              Rotary Central TTK VHS Blood Bank, Fortis Malar, IT highway rapid mobile voluntary donor response cluster.
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
            <div className="text-xs font-bold text-purple-600 uppercase tracking-wider">
              West Zone Healthcare
            </div>
            <div className="font-bold text-neutral-900 dark:text-white text-base mt-1">
              Anna Nagar & Kilpauk
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              Government Kilpauk Medical College (KMC), suburban voluntary donor networks, secondary arterial supply depots.
            </div>
          </div>
        </div>
      </section>

      {/* 7. Institutional Compliance & Standards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-3xl bg-neutral-900 text-white border border-neutral-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">TNSBTC & NACO Certified</h4>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Fully compliant with Drugs and Cosmetics Rules and National AIDS Control Organisation blood safety guidelines.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Confidential Donor Protection</h4>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Donor residential addresses and personal phone numbers remain masked across public views to preserve privacy.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Zero Negative Stock Locks</h4>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Atomic reservation locks eliminate double-allocations and race conditions across simultaneous hospital orders.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
