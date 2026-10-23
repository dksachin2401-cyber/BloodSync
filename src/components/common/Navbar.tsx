import React, { useState } from 'react';
import {
  Heart,
  Activity,
  Building2,
  Warehouse,
  ShieldCheck,
  Bell,
  Sun,
  Moon,
  MapPin,
  ChevronDown,
  Navigation,
  Globe,
  LogIn,
  UserPlus,
  LogOut,
  Sparkles,
  TrendingUp,
  X,
  Radio,
  FileText,
  User,
  ExternalLink,
  Compass,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { UserRole } from '../../types';
import { NotificationDropdown } from './NotificationDropdown';
import { CompatibilityMatrixModal } from './CompatibilityMatrixModal';
import { SupabaseConfigModal } from '../setup/SupabaseConfigModal';
import { TestRunnerModal } from '../tests/TestRunnerModal';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onSelectRequest?: (requestId: string) => void;
  onOpenLogin?: (role?: UserRole) => void;
  onOpenRegister?: (role?: UserRole) => void;
  onOpenDemandDashboard?: () => void;
}

const CHENNAI_NEIGHBORHOOD_PRESETS = [
  { name: 'Mylapore', pin: '600004' },
  { name: 'Park Town (RGGGH)', pin: '600003' },
  { name: 'Greams Rd (Apollo)', pin: '600006' },
  { name: 'Anna Nagar', pin: '600040' },
  { name: 'T. Nagar', pin: '600017' },
  { name: 'Adyar', pin: '600020' },
  { name: 'Egmore (Red Cross)', pin: '600008' },
  { name: 'Royapuram (Stanley)', pin: '600001' },
  { name: 'OMR / Taramani', pin: '600113' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onSelectRequest,
  onOpenLogin,
  onOpenRegister,
  onOpenDemandDashboard,
}) => {
  const {
    currentUser,
    isLoggedIn,
    logout,
    switchPersona,
    detectLiveLocation,
    locationStatus,
    setManualLocation,
  } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);
  const [showSupabase, setShowSupabase] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Manual city form defaults to Chennai, Tamil Nadu
  const [cityInput, setCityInput] = useState(currentUser.city || 'Chennai');
  const [stateInput, setStateInput] = useState(currentUser.state || 'Tamil Nadu');
  const [pinInput, setPinInput] = useState(currentUser.pinCode || '600004');

  const handleApplyPreset = (preset: { name: string; pin: string }) => {
    setCityInput('Chennai');
    setStateInput('Tamil Nadu');
    setPinInput(preset.pin);
    setManualLocation('Chennai', 'Tamil Nadu', preset.pin);
    setShowLocationModal(false);
  };

  const handleScrollToSection = (id: string) => {
    if (currentTab !== 'landing') {
      onSelectTab('landing');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#07090e]/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Official Brand Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onSelectTab('landing')}
                className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-700 via-red-600 to-rose-500 text-white flex items-center justify-center shadow-md shadow-red-600/25 group-hover:scale-105 transition-transform">
                  <Heart className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black tracking-tight text-neutral-900 dark:text-white">
                      Blood<span className="text-red-600">Sync</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60">
                      TN Grid
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium block -mt-0.5">
                    State Emergency Blood Coordination System
                  </span>
                </div>
              </button>
            </div>

            {/* Official Clean Navigation Links (Lexora Style - No Cluttered Portals) */}
            <nav className="hidden lg:flex items-center gap-1">
              <button
                onClick={() => onSelectTab('landing')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  currentTab === 'landing'
                    ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 font-bold'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                Overview
              </button>

              <button
                onClick={() => handleScrollToSection('live-emergency-grid')}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span>Live Crises</span>
              </button>

              <button
                onClick={() => onSelectTab('map')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'map'
                    ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 font-bold'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-blue-500" />
                <span>Live Map</span>
              </button>

              <button
                onClick={() => onSelectTab('demo')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'demo'
                    ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 font-bold'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                <span>4-Way Demo</span>
              </button>

              <button
                onClick={() => handleScrollToSection('institutional-gateways')}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Facility Portals
              </button>

              <button
                onClick={() => setShowMatrix(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5 text-red-600" />
                <span>RBC Matrix</span>
              </button>

              {onOpenDemandDashboard && (
                <button
                  onClick={onOpenDemandDashboard}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                  <span>Demand Forecast</span>
                </button>
              )}

              {/* Logged-In User's Dedicated Authorized Workspace Pill */}
              {isLoggedIn && (
                <button
                  onClick={() => onSelectTab(currentUser.role)}
                  className={`ml-1 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                    currentTab === currentUser.role
                      ? 'bg-red-600 text-white shadow-red-600/25'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  <span>
                    My {currentUser.role === 'donor' ? 'Donor' : currentUser.role === 'hospital' ? 'Hospital' : currentUser.role === 'blood_bank' ? 'Blood Bank' : 'Admin'} Workspace
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </button>
              )}
            </nav>

            {/* Right Tools, Location Badge & Auth Controls */}
            <div className="flex items-center gap-2">
              {/* Subtle Location Selector */}
              <button
                onClick={() => setShowLocationModal(true)}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-neutral-100/80 dark:bg-neutral-900 hover:bg-neutral-200/80 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/70 dark:border-neutral-800 cursor-pointer transition-colors"
                title="Change Chennai area or detect GPS location"
              >
                <MapPin className="w-3.5 h-3.5 text-red-600" />
                <span className="max-w-[100px] truncate">{currentUser.city || 'Chennai'}</span>
                <span className="text-[10px] text-neutral-400 font-mono hidden xl:inline">
                  ({currentUser.pinCode || '600004'})
                </span>
                {locationStatus === 'detected' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="GPS active" />
                )}
              </button>

              {/* Notifications Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="relative p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-extrabold text-white animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <NotificationDropdown
                  isOpen={showNotifs}
                  onClose={() => setShowNotifs(false)}
                  onSelectRequest={onSelectRequest}
                />
              </div>

              {/* Dark/Light Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Clean Official Authentication CTA */}
              {!isLoggedIn ? (
                <div className="flex items-center gap-1.5 pl-1">
                  <button
                    onClick={() => onOpenLogin?.()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 transition-colors cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Sign In</span>
                  </button>

                  <button
                    onClick={() => onOpenRegister?.()}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-sm shadow-red-600/30 transition-transform hover:scale-105 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Register</span>
                  </button>
                </div>
              ) : (
                /* Active Official User Profile Pill */
                <div className="relative">
                  <button
                    onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                    className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-neutral-200/80 dark:border-neutral-700 hover:border-red-500 bg-neutral-50 dark:bg-neutral-900 transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-red-600 text-white font-extrabold text-xs flex items-center justify-center uppercase">
                      {currentUser.role === 'hospital' ? (
                        <Building2 className="w-3.5 h-3.5" />
                      ) : currentUser.role === 'blood_bank' ? (
                        <Warehouse className="w-3.5 h-3.5" />
                      ) : currentUser.role === 'admin' ? (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      ) : (
                        <Heart className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="text-left hidden sm:block max-w-[125px]">
                      <div className="text-xs font-bold text-neutral-900 dark:text-white leading-tight truncate">
                        {currentUser.fullName}
                      </div>
                      <div className="text-[10px] text-red-600 dark:text-red-400 font-semibold uppercase tracking-wider truncate">
                        {currentUser.role.replace('_', ' ')}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                  </button>

                  {/* Clean User & Role Menu */}
                  {showPersonaMenu && (
                    <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-800 z-50 p-2 divide-y divide-neutral-100 dark:divide-neutral-800 animate-in fade-in duration-150">
                      <div className="p-2.5">
                        <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center justify-between">
                          <span className="truncate">{currentUser.fullName}</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                            Authenticated
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                          <span className="truncate">{currentUser.address || `${currentUser.city}, ${currentUser.state}`}</span>
                        </div>
                      </div>

                      {/* Jump to Workspace */}
                      <div className="p-1">
                        <button
                          onClick={() => {
                            onSelectTab(currentUser.role);
                            setShowPersonaMenu(false);
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-xl text-left text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors cursor-pointer"
                        >
                          <span>Open My {currentUser.role === 'donor' ? 'Donor' : currentUser.role === 'hospital' ? 'Hospital' : currentUser.role === 'blood_bank' ? 'Blood Bank' : 'Admin'} Workspace</span>
                          <span>→</span>
                        </button>
                      </div>

                      {/* Demo Persona Switcher (Convenient & Professional) */}
                      <div className="py-2">
                        <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          <span>Quick Demo Persona</span>
                          <span className="text-[9px] text-neutral-400 font-normal">Click to switch</span>
                        </div>
                        <div className="space-y-1">
                          <button
                            onClick={() => {
                              switchPersona('donor');
                              onSelectTab('donor');
                              setShowPersonaMenu(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                              currentUser.role === 'donor'
                                ? 'bg-neutral-100 dark:bg-neutral-800 text-red-600 font-bold'
                                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <Heart className="w-3.5 h-3.5 text-red-600 shrink-0" />
                              <div className="truncate">
                                <div className="font-bold truncate">Citizen Donor</div>
                                <div className="text-[10px] text-neutral-500 truncate">Karthik Subramanian (O- Universal)</div>
                              </div>
                            </div>
                            {currentUser.role === 'donor' && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-red-600 text-white font-bold">Current</span>}
                          </button>

                          <button
                            onClick={() => {
                              switchPersona('hospital');
                              onSelectTab('hospital');
                              setShowPersonaMenu(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                              currentUser.role === 'hospital'
                                ? 'bg-neutral-100 dark:bg-neutral-800 text-red-600 font-bold'
                                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <div className="truncate">
                                <div className="font-bold truncate">Hospital Trauma Ward</div>
                                <div className="text-[10px] text-neutral-500 truncate">Dr. A. Sundaram (RGGGH Trauma)</div>
                              </div>
                            </div>
                            {currentUser.role === 'hospital' && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold">Current</span>}
                          </button>

                          <button
                            onClick={() => {
                              switchPersona('blood_bank');
                              onSelectTab('blood_bank');
                              setShowPersonaMenu(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                              currentUser.role === 'blood_bank'
                                ? 'bg-neutral-100 dark:bg-neutral-800 text-red-600 font-bold'
                                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <Warehouse className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <div className="truncate">
                                <div className="font-bold truncate">Certified Blood Bank</div>
                                <div className="text-[10px] text-neutral-500 truncate">S. Meenakshi (Indian Red Cross)</div>
                              </div>
                            </div>
                            {currentUser.role === 'blood_bank' && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-600 text-white font-bold">Current</span>}
                          </button>

                          <button
                            onClick={() => {
                              switchPersona('admin');
                              onSelectTab('admin');
                              setShowPersonaMenu(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                              currentUser.role === 'admin'
                                ? 'bg-neutral-100 dark:bg-neutral-800 text-red-600 font-bold'
                                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <div className="truncate">
                                <div className="font-bold truncate">State Health Authority</div>
                                <div className="text-[10px] text-neutral-500 truncate">Director Dr. S. Kanthimathy (TNSBTC)</div>
                              </div>
                            </div>
                            {currentUser.role === 'admin' && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-purple-600 text-white font-bold">Current</span>}
                          </button>
                        </div>
                      </div>

                      {/* Sign Out */}
                      <div className="p-1 pt-2">
                        <button
                          onClick={() => {
                            logout();
                            setShowPersonaMenu(false);
                            onSelectTab('landing');
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="lg:hidden flex items-center justify-around border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-[#07090e]/95 py-2 px-3">
          <button
            onClick={() => onSelectTab('landing')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold ${
              currentTab === 'landing' ? 'text-red-600' : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            <Globe className="w-4 h-4 mb-0.5" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => onSelectTab('map')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold ${
              currentTab === 'map' ? 'text-blue-600' : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            <Compass className="w-4 h-4 mb-0.5 text-blue-500" />
            <span>Map</span>
          </button>

          <button
            onClick={() => onSelectTab('demo')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold ${
              currentTab === 'demo' ? 'text-amber-600' : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            <Zap className="w-4 h-4 mb-0.5 text-amber-500" />
            <span>4-Way</span>
          </button>

          <button
            onClick={() => handleScrollToSection('live-emergency-grid')}
            className="flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold text-neutral-500 dark:text-neutral-400"
          >
            <Radio className="w-4 h-4 mb-0.5 text-red-500" />
            <span>Crises</span>
          </button>

          {isLoggedIn ? (
            <button
              onClick={() => onSelectTab(currentUser.role)}
              className="flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold text-red-600"
            >
              <User className="w-4 h-4 mb-0.5" />
              <span>Workspace</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenLogin?.()}
              className="flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold text-neutral-800 dark:text-neutral-200"
            >
              <LogIn className="w-4 h-4 mb-0.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Chennai Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-neutral-200 dark:border-neutral-800 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                    Chennai Emergency Proximity
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Calculates Haversine distance to Chennai hospitals & blood banks
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLocationModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Pick Neighborhood Chips */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Quick Select Chennai Area
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CHENNAI_NEIGHBORHOOD_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-2.5 py-1 text-xs rounded-lg font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950 dark:hover:text-red-300 border border-neutral-200 dark:border-neutral-700 cursor-pointer transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={async () => {
                await detectLiveLocation();
                setShowLocationModal(false);
              }}
              className="w-full mb-4 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-red-600/20 cursor-pointer"
            >
              <Navigation className="w-4 h-4" /> Detect GPS Coordinates
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-neutral-900 px-2 text-neutral-400 font-bold">
                  Or Customize Manually
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={stateInput}
                    onChange={(e) => setStateInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    PIN Code (600xxx)
                  </label>
                  <input
                    type="text"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  setManualLocation(cityInput, stateInput, pinInput);
                  setShowLocationModal(false);
                }}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs cursor-pointer"
              >
                Apply Chennai Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auxiliary Modals */}
      <CompatibilityMatrixModal isOpen={showMatrix} onClose={() => setShowMatrix(false)} />
      <SupabaseConfigModal isOpen={showSupabase} onClose={() => setShowSupabase(false)} />
      <TestRunnerModal isOpen={showTests} onClose={() => setShowTests(false)} />
    </>
  );
};
