import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/common/Navbar';
import { EmergencyAlertBanner } from './components/common/EmergencyAlertBanner';
import { LandingPage } from './components/landing/LandingPage';
import { DonorPortal } from './components/donor/DonorPortal';
import { HospitalPortal } from './components/hospital/HospitalPortal';
import { BloodBankPortal } from './components/bloodbank/BloodBankPortal';
import { AdminPortal } from './components/admin/AdminPortal';
import { LoginModal } from './components/auth/LoginModal';
import { RegisterModal } from './components/auth/RegisterModal';
import { ChennaiDemandTrendsDashboard } from './components/analytics/ChennaiDemandTrendsDashboard';
import { CompatibilityMatrixModal } from './components/common/CompatibilityMatrixModal';
import { SupabaseConfigModal } from './components/setup/SupabaseConfigModal';
import { TestRunnerModal } from './components/tests/TestRunnerModal';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { SimulatedMap } from './components/map/SimulatedMap';
import { FourWayCoordinationDemo } from './components/demo/FourWayCoordinationDemo';
import {
  Heart,
  Activity,
  Award,
  Database,
  ShieldCheck,
  ShieldAlert,
  Building2,
  Warehouse,
  ExternalLink,
  Sparkles,
  Lock,
} from 'lucide-react';
import { UserRole } from './types';

function BloodSyncApp() {
  const { currentRole, switchPersona, isLoggedIn, currentUser } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  // Modals state
  const [showMatrix, setShowMatrix] = useState(false);
  const [showSupabase, setShowSupabase] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [showDemandModal, setShowDemandModal] = useState(false);

  // Auth Modals state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRole, setLoginRole] = useState<UserRole>('donor');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerRole, setRegisterRole] = useState<UserRole>('donor');

  const handleSelectTab = (tab: string) => {
    if (tab === 'landing' || tab === 'map' || tab === 'demo') {
      setCurrentTab(tab);
      return;
    }

    if (!isLoggedIn) {
      // Unauthenticated visitor
      handleOpenLogin(tab as UserRole);
      return;
    }

    // Role-based access control: Only permitted role (or admin) can access this portal
    if (currentUser.role !== tab && currentUser.role !== 'admin') {
      // Intercept and prompt to switch account / log in with that specific role
      handleOpenLogin(tab as UserRole);
      return;
    }

    setCurrentTab(tab);
  };

  const handleOpenLogin = (role?: UserRole) => {
    setLoginRole(role || 'donor');
    setShowLoginModal(true);
  };

  const handleOpenRegister = (role?: UserRole) => {
    setRegisterRole(role || 'donor');
    setShowRegisterModal(true);
  };

  const handleLoginSuccess = (role: UserRole) => {
    setCurrentTab(role);
    setShowLoginModal(false);
  };

  const handleRegisterSuccess = (role: UserRole) => {
    setCurrentTab(role);
    setShowRegisterModal(false);
  };

  const handleViewEmergencyRequest = (requestId: string) => {
    setSelectedRequestId(requestId);
    if (!isLoggedIn) {
      handleOpenLogin('donor');
      return;
    }
    // Direct users to their appropriate portal view
    if (currentUser.role === 'donor') {
      setCurrentTab('donor');
    } else if (currentUser.role === 'hospital' || currentUser.role === 'admin') {
      setCurrentTab('hospital');
    } else if (currentUser.role === 'blood_bank') {
      setCurrentTab('blood_bank');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* High-Priority Emergency Broadcast Banner */}
      <EmergencyAlertBanner onViewRequest={handleViewEmergencyRequest} />

      {/* Primary Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onSelectRequest={handleViewEmergencyRequest}
        onOpenLogin={handleOpenLogin}
        onOpenRegister={handleOpenRegister}
        onOpenDemandDashboard={() => setShowDemandModal(true)}
      />

      {/* Main View Area with Strict RBAC Role Isolation */}
      <main className="flex-1">
        {currentTab === 'landing' && (
          <LandingPage
            onNavigate={handleSelectTab}
            onOpenLogin={handleOpenLogin}
            onOpenRegister={handleOpenRegister}
          />
        )}
        {currentTab === 'map' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-neutral-900 dark:text-white">
                  Chennai Metro Live Telemetry Network
                </h1>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Spatial positioning of verified trauma hospitals, blood banks, and voluntary donor dispatch circles
                </p>
              </div>
              <button
                onClick={() => handleSelectTab('landing')}
                className="text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800"
              >
                ← Back to Overview
              </button>
            </div>
            <SimulatedMap
              onSelectFacility={(type, id) => {
                if (type === 'hospital') handleSelectTab('hospital');
                else if (type === 'blood_bank') handleSelectTab('blood_bank');
                else handleSelectTab('donor');
              }}
              onRequestBlood={() => handleSelectTab('hospital')}
            />
          </div>
        )}
        {currentTab === 'demo' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-neutral-900 dark:text-white">
                  4-Way Real-Time Coordination Demonstration
                </h1>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Simulate live emergency broadcast, citizen donor pledge, blood bank reservation, and administrative audit sealing
                </p>
              </div>
              <button
                onClick={() => handleSelectTab('landing')}
                className="text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800"
              >
                ← Back to Overview
              </button>
            </div>
            <FourWayCoordinationDemo onNavigatePortal={(portal) => handleSelectTab(portal)} />
          </div>
        )}
        {isLoggedIn && currentTab === 'donor' && (currentUser.role === 'donor' || currentUser.role === 'admin') && (
          <DonorPortal />
        )}
        {isLoggedIn && currentTab === 'hospital' && (currentUser.role === 'hospital' || currentUser.role === 'admin') && (
          <HospitalPortal initialRequestId={selectedRequestId} />
        )}
        {isLoggedIn && currentTab === 'blood_bank' && (currentUser.role === 'blood_bank' || currentUser.role === 'admin') && (
          <BloodBankPortal />
        )}
        {isLoggedIn && currentTab === 'admin' && currentUser.role === 'admin' && (
          <AdminPortal />
        )}

        {/* Role Access Denied Card if logged-in user enters unauthorized portal */}
        {isLoggedIn &&
          currentTab !== 'landing' &&
          currentTab !== 'map' &&
          currentTab !== 'demo' &&
          currentUser.role !== currentTab &&
          currentUser.role !== 'admin' && (
          <div className="max-w-xl mx-auto my-16 p-8 text-center bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-neutral-900 dark:text-white">
              Role Access Restricted
            </h2>
            <p className="text-sm text-neutral-500 mt-2 max-w-md mx-auto leading-relaxed">
              You are signed in as <span className="font-bold text-neutral-900 dark:text-white">{currentUser.fullName}</span> ({currentUser.role === 'donor' ? 'Citizen Donor' : currentUser.role === 'hospital' ? 'Hospital Staff' : 'Blood Bank Officer'}). Access to the {currentTab.replace('_', ' ')} portal is restricted to authorized credentials.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setCurrentTab(currentUser.role)}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/30 cursor-pointer"
              >
                Return to My {currentUser.role === 'donor' ? 'Donor' : currentUser.role === 'hospital' ? 'Hospital' : 'Blood Bank'} Portal
              </button>
              <button
                onClick={() => handleOpenLogin(currentTab as UserRole)}
                className="px-6 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs border border-neutral-200 dark:border-neutral-700 cursor-pointer"
              >
                Switch Account / Log In as {currentTab.replace('_', ' ')}
              </button>
            </div>
          </div>
        )}

        {/* Strict Access Guard Card if unauthenticated visitor lands outside public pages */}
        {!isLoggedIn && currentTab !== 'landing' && currentTab !== 'map' && currentTab !== 'demo' && (
          <div className="max-w-xl mx-auto my-16 p-8 text-center bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-neutral-900 dark:text-white">
              Portal Access Restricted
            </h2>
            <p className="text-sm text-neutral-500 mt-2 max-w-md mx-auto leading-relaxed">
              Access to this Chennai Emergency Coordination Grid portal is restricted. You must log in with verified credentials or register an authorized account to continue.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => handleOpenLogin(currentTab as UserRole)}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/30 cursor-pointer"
              >
                Log In with Credentials
              </button>
              <button
                onClick={() => handleOpenRegister(currentTab as UserRole)}
                className="px-6 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs border border-neutral-200 dark:border-neutral-700 cursor-pointer"
              >
                Sign Up / Register
              </button>
              <button
                onClick={() => setCurrentTab('landing')}
                className="w-full text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 font-semibold mt-3 cursor-pointer"
              >
                ← Return to Public Homepage
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Offline Connectivity Indicator */}
      <OfflineIndicator />

      {/* Footer */}
      <footer className="border-t border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#07090e] text-neutral-500 py-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-neutral-200/80 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-700 to-rose-500 text-white flex items-center justify-center font-bold shadow-md shadow-red-600/20">
                <Heart className="w-4 h-4 fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-neutral-900 dark:text-white text-base">
                    Blood<span className="text-red-600">Sync</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60">
                    Official
                  </span>
                </div>
                <span className="text-xs text-neutral-400 block -mt-0.5">
                  State Emergency Blood Coordination System • Government of Tamil Nadu
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-xs font-semibold">
              <button
                onClick={() => setShowDemandModal(true)}
                className="hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>Demand Trends</span>
              </button>
              <button
                onClick={() => setShowMatrix(true)}
                className="hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-red-500" />
                <span>RBC Protocols</span>
              </button>
              <button
                onClick={() => setShowTests(true)}
                className="hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Acceptance Test Suite (16/16)</span>
              </button>
              <button
                onClick={() => setShowSupabase(true)}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                <span>Database Sync</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
            <p>
              © 2026 Tamil Nadu State Blood Transfusion Council (TNSBTC). All rights reserved.
            </p>
            <p className="text-[11px] max-w-md text-center sm:text-right text-neutral-500">
              Clinical Transfusion Notice: Automated matching is an emergency decision-support system. Final compatibility is confirmed via standard laboratory crossmatching.
            </p>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        initialRole={loginRole}
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={(prefRole) => {
          setShowLoginModal(false);
          setRegisterRole(prefRole || loginRole);
          setShowRegisterModal(true);
        }}
      />

      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        initialRole={registerRole}
        onRegisterSuccess={handleRegisterSuccess}
        onSwitchToLogin={(prefRole) => {
          setShowRegisterModal(false);
          setLoginRole(prefRole || registerRole);
          setShowLoginModal(true);
        }}
      />

      {showDemandModal && (
        <ChennaiDemandTrendsDashboard
          isModal
          onClose={() => setShowDemandModal(false)}
        />
      )}

      <CompatibilityMatrixModal isOpen={showMatrix} onClose={() => setShowMatrix(false)} />
      <SupabaseConfigModal isOpen={showSupabase} onClose={() => setShowSupabase(false)} />
      <TestRunnerModal isOpen={showTests} onClose={() => setShowTests(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BloodSyncApp />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
