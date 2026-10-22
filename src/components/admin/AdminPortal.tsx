import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Activity,
  Users,
  Building2,
  Warehouse,
  AlertTriangle,
  Brain,
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  RefreshCw,
  TrendingUp,
  Download,
  Info,
  Layers,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import {
  AuditLogItem,
  DemandForecastInsight,
  HospitalProfile,
  BloodBankProfile,
  BloodGroup,
} from '../../types';
import { api } from '../../services/api';
import { ChennaiDemandTrendsDashboard } from '../analytics/ChennaiDemandTrendsDashboard';

const COLORS = ['#ef4444', '#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

export const AdminPortal: React.FC = () => {
  const { allHospitals, allBloodBanks } = useAuth();

  const [analytics, setAnalytics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [forecast, setForecast] = useState<DemandForecastInsight | null>(null);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [loading, setLoading] = useState(true);

  // Institution verification states
  const [institutions, setInstitutions] = useState<Array<HospitalProfile | BloodBankProfile>>([]);
  const [logFilter, setLogFilter] = useState('all');
  const [logSearch, setLogSearch] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsData, logsData] = await Promise.all([
        api.getAdminAnalytics(),
        api.getAuditLogs({ targetType: logFilter !== 'all' ? logFilter : undefined, search: logSearch || undefined }),
      ]);
      setAnalytics(analyticsData);
      setAuditLogs(logsData);
      setInstitutions([...allHospitals, ...allBloodBanks]);
    } catch (err) {
      console.warn('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  }, [allHospitals, allBloodBanks, logFilter, logSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerateForecast = async () => {
    setLoadingForecast(true);
    try {
      const data = await api.getDemandForecast();
      setForecast(data);
    } catch (err: any) {
      alert(err.message || 'Failed to generate demand forecast');
    } finally {
      setLoadingForecast(false);
    }
  };

  const handleVerifyInstitution = async (id: string, status: 'Verified' | 'Rejected') => {
    try {
      await api.updateInstitutionVerification(id, status);
      setInstitutions((prev) =>
        prev.map((inst) => (inst.id === id ? { ...inst, verificationStatus: status } : inst))
      );
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update institution verification');
    }
  };

  const exportAuditLogsCsv = () => {
    if (auditLogs.length === 0) return;
    const headers = ['Timestamp', 'Action', 'Actor Name', 'Role', 'Target Type', 'Details', 'IP'];
    const rows = auditLogs.map((log) => [
      log.timestamp,
      log.action,
      `"${log.actorName.replace(/"/g, '""')}"`,
      log.actorRole,
      log.targetType,
      `"${log.details.replace(/"/g, '""')}"`,
      log.ipAddress || '127.0.0.1',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bloodsync_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pie chart data from requests by city
  const cityData: Array<{ name: string; value: number }> = analytics?.requestsByCity
    ? Object.entries(analytics.requestsByCity).map(([city, count]) => ({
        name: city,
        value: Number(count),
      }))
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-neutral-900 text-white shadow-xl border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">System Administration & AI Command</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-950 text-purple-300 border border-purple-800">
                Security Officer Level 4
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Live Network Oversight • Institution Verification • HIPAA Audit Trail • AI Demand Forecasting
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerateForecast}
          disabled={loadingForecast}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          {loadingForecast ? 'Analyzing Network Telemetry...' : 'Run Gemini AI Demand Forecast'}
        </button>
      </div>

      {/* KPI Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
              Total Donors
            </div>
            <div className="text-2xl font-extrabold text-neutral-900 dark:text-white mt-1 font-mono">
              {analytics.metrics.totalDonors}
            </div>
            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
              {analytics.metrics.activeDonors} Available
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
              Trauma Centers
            </div>
            <div className="text-2xl font-extrabold text-neutral-900 dark:text-white mt-1 font-mono">
              {analytics.metrics.totalHospitals}
            </div>
            <div className="text-[10px] text-blue-600 font-medium mt-0.5">All Verified</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
              Cryo Blood Banks
            </div>
            <div className="text-2xl font-extrabold text-neutral-900 dark:text-white mt-1 font-mono">
              {analytics.metrics.totalBloodBanks}
            </div>
            <div className="text-[10px] text-amber-600 font-medium mt-0.5">Cold-Chain Monitored</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
              Active Crises
            </div>
            <div className="text-2xl font-extrabold text-red-600 mt-1 font-mono">
              {analytics.metrics.activeCrises}
            </div>
            <div className="text-[10px] text-red-500 font-medium mt-0.5">
              {analytics.metrics.criticalCrises} Critical OR
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
              Dispatched Units
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1 font-mono">
              {analytics.metrics.totalDispatchedUnits}
            </div>
            <div className="text-[10px] text-neutral-400 font-medium mt-0.5">Courier Transfer</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
              Fulfillment Ratio
            </div>
            <div className="text-2xl font-extrabold text-purple-600 mt-1 font-mono">
              {analytics.metrics.fulfillmentRatePercent}%
            </div>
            <div className="text-[10px] text-purple-500 font-medium mt-0.5">Response Efficiency</div>
          </div>
        </div>
      )}

      {/* Dedicated Gemini AI Demand Forecasting & Stock-Out Intelligence */}
      <ChennaiDemandTrendsDashboard />

      {/* Visual Recharts Section: Demand vs Supply */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                  Blood Group Demand vs Available Storage
                </h3>
                <p className="text-xs text-neutral-500">
                  Aggregate units requested by emergency cases vs units ready in certified blood banks
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.bloodGroupComparison}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="bloodGroup" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171717',
                      borderColor: '#262626',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: '#ffffff',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="demandUnits" name="Emergency Demand (Units)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="supplyAvailable" name="Current Available Stock" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                Emergency Demand by City
              </h3>
              <p className="text-xs text-neutral-500 mb-4">
                Distribution of hospital blood calls by municipality
              </p>
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              {cityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={cityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {cityData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#171717',
                        borderColor: '#262626',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        color: '#ffffff',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-neutral-400">No city telemetry</div>
              )}
            </div>

            <div className="space-y-1 text-xs border-t border-neutral-100 dark:border-neutral-800 pt-3">
              {cityData.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between text-neutral-600 dark:text-neutral-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-bold font-mono">{item.value} calls</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Institution Verification Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="font-bold text-base text-neutral-900 dark:text-white">
            Institution Verification & Licensing
          </h3>
          <p className="text-xs text-neutral-500">
            Audit and verify hospital trauma centers and cryo blood banks before granting emergency requisition access
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 uppercase tracking-wider font-semibold border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="p-4">Institution Name</th>
                <th className="p-4">Type</th>
                <th className="p-4">License / Registration</th>
                <th className="p-4">Location</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {institutions.map((inst) => {
                const isHospital = inst.role === 'hospital';
                const name = isHospital ? (inst as HospitalProfile).hospitalName : (inst as BloodBankProfile).bloodBankName;
                const lic = isHospital ? (inst as HospitalProfile).licenseNumber : (inst as BloodBankProfile).licenseNumber;
                return (
                  <tr key={inst.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                    <td className="p-4 font-bold text-neutral-900 dark:text-white">
                      {name}
                    </td>
                    <td className="p-4">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800">
                        {inst.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-neutral-500">
                      {lic}
                    </td>
                    <td className="p-4 text-neutral-500">
                      {inst.city}, {inst.state}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inst.verificationStatus === 'Verified'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : inst.verificationStatus === 'Rejected'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {inst.verificationStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {inst.verificationStatus !== 'Verified' && (
                          <button
                            onClick={() => handleVerifyInstitution(inst.id, 'Verified')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          >
                            Verify License
                          </button>
                        )}
                        {inst.verificationStatus !== 'Rejected' && (
                          <button
                            onClick={() => handleVerifyInstitution(inst.id, 'Rejected')}
                            className="px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:text-red-600 font-bold"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Audit Trail Explorer */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-neutral-500" />
              Security Audit Logs & Healthcare Compliance Trail
            </h3>
            <p className="text-xs text-neutral-500">
              Immutable records of emergency requisitions, stock reservations, donor pledges, and system actions
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportAuditLogsCsv}
              className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export Audit CSV
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search audit trail by actor, action, or case ref..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
            />
          </div>

          <select
            value={logFilter}
            onChange={(e) => setLogFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
          >
            <option value="all">All Event Types</option>
            <option value="blood_request">Blood Requests</option>
            <option value="donor_pledge">Donor Pledges</option>
            <option value="inventory">Inventory Adjustments</option>
            <option value="institution">Institutions</option>
          </select>
        </div>

        <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 font-semibold uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Action</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Target</th>
                <th className="p-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                  <td className="p-3 text-neutral-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="p-3 font-bold text-neutral-900 dark:text-neutral-100">
                    {log.action}
                  </td>
                  <td className="p-3 text-neutral-600 dark:text-neutral-300 font-sans">
                    {log.actorName} ({log.actorRole})
                  </td>
                  <td className="p-3 uppercase text-[10px] text-neutral-400">
                    {log.targetType}
                  </td>
                  <td className="p-3 text-neutral-600 dark:text-neutral-300 font-sans leading-relaxed">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
