import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  Building2,
  Warehouse,
  ShieldCheck,
  LogIn,
  KeyRound,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  MapPin,
  Lock,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { UserRole } from '../../types';
import { useAuth, DEFAULT_CREDENTIALS } from '../../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: (preferredRole?: UserRole) => void;
  initialRole?: UserRole;
  onLoginSuccess?: (role: UserRole) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToRegister,
  initialRole = 'donor',
  onLoginSuccess,
}) => {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fillFeedback, setFillFeedback] = useState(false);

  useEffect(() => {
    if (initialRole) {
      setSelectedRole(initialRole);
    }
  }, [initialRole]);

  // When selected role changes, reset error and fill the role's default email/password
  useEffect(() => {
    setError(null);
    const creds = DEFAULT_CREDENTIALS[selectedRole];
    if (creds) {
      setEmail(creds.email);
      setPassword(creds.password);
    }
  }, [selectedRole]);

  if (!isOpen) return null;

  const roleMeta: Record<
    UserRole,
    {
      title: string;
      desc: string;
      icon: any;
      color: string;
      accentBg: string;
      demoUser: string;
      demoLocation: string;
    }
  > = {
    donor: {
      title: 'Citizen Donor',
      desc: 'Chennai Blood Donor & Emergency Responder',
      icon: Heart,
      color: 'text-red-600',
      accentBg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800',
      demoUser: 'Karthik Subramanian (O- Universal Donor)',
      demoLocation: 'Mylapore, Chennai (600004)',
    },
    hospital: {
      title: 'Hospital Trauma',
      desc: 'Emergency Wards & Transfusion Units',
      icon: Building2,
      color: 'text-blue-600',
      accentBg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
      demoUser: 'Dr. A. Sundaram (RGGGH Trauma Center)',
      demoLocation: 'Park Town, Chennai (600003)',
    },
    blood_bank: {
      title: 'Blood Bank',
      desc: 'Licensed Cryo Storage & Emergency Dispatch',
      icon: Warehouse,
      color: 'text-amber-600',
      accentBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      demoUser: 'S. Meenakshi (Indian Red Cross Society)',
      demoLocation: 'Montieth Rd, Egmore, Chennai (600008)',
    },
    admin: {
      title: 'Health Authority',
      desc: 'Tamil Nadu Blood Transfusion Council',
      icon: ShieldCheck,
      color: 'text-purple-600',
      accentBg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
      demoUser: 'Dr. S. Kanthimathy (State Blood Authority)',
      demoLocation: 'DMS Complex, Teynampet, Chennai',
    },
  };

  const currentMeta = roleMeta[selectedRole];
  const roleCreds = DEFAULT_CREDENTIALS[selectedRole];

  const handleFillDemoCreds = () => {
    if (roleCreds) {
      setEmail(roleCreds.email);
      setPassword(roleCreds.password);
      setError(null);
      setFillFeedback(true);
      setTimeout(() => setFillFeedback(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide your authorized email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your account password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Strict credentials check in AuthContext
      await login(selectedRole, { email: email.trim(), password: password.trim() });
      onClose();
      if (onLoginSuccess) {
        onLoginSuccess(selectedRole);
      }
    } catch (err: any) {
      setError(err?.message || 'Login verification failed. Check email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Top Header */}
        <div className="p-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/30">
                <LogIn className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-neutral-950 dark:text-white flex items-center gap-2">
                  <span>Log In to BloodSync</span>
                  <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400">
                    <Lock className="w-2.5 h-2.5" /> Strict Access
                  </span>
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-red-600" />
                  <span>Chennai Emergency Coordination Grid (Tamil Nadu)</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role Selector Tabs */}
          <div className="mt-5 grid grid-cols-4 gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-2xl">
            {(['donor', 'hospital', 'blood_bank', 'admin'] as UserRole[]).map((r) => {
              const meta = roleMeta[r];
              const Icon = meta.icon;
              const isActive = selectedRole === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRole(r)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-center text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 mb-1 ${isActive ? meta.color : 'text-neutral-400'}`} />
                  <span className="truncate w-full text-[11px]">{meta.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Persona Info Card */}
        <div className="px-6 pt-4">
          <div className={`p-3 rounded-2xl border ${currentMeta.accentBg} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl bg-white dark:bg-neutral-800 flex items-center justify-center shadow-xs ${currentMeta.color}`}>
                <currentMeta.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-900 dark:text-white">
                  {currentMeta.demoUser}
                </div>
                <div className="text-[11px] text-neutral-500 flex items-center gap-1">
                  <span>{currentMeta.demoLocation}</span>
                </div>
              </div>
            </div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
              Chennai Grid
            </span>
          </div>
        </div>

        {/* Authorized Demo Credentials Helper Box */}
        {roleCreds && (
          <div className="mx-6 mt-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 flex items-center gap-1">
                <Lock className="w-3 h-3 text-red-600" />
                Authorized Demo Account ({currentMeta.title})
              </span>
              <button
                type="button"
                onClick={handleFillDemoCreds}
                className="text-[10px] font-bold text-red-600 hover:text-red-700 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {fillFeedback ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-600 font-bold">Credentials Filled</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Auto-Fill Demo</span>
                  </>
                )}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-neutral-700 dark:text-neutral-300">
              <div className="truncate">
                <span className="text-neutral-400 block text-[9px] font-sans">EMAIL:</span>
                <span className="font-semibold">{roleCreds.email}</span>
              </div>
              <div className="truncate">
                <span className="text-neutral-400 block text-[9px] font-sans">PASSWORD:</span>
                <span className="font-semibold">{roleCreds.password}</span>
              </div>
            </div>
          </div>
        )}

        {/* Strict Login Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-3 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 font-medium flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Authorized Email / Account ID
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80 text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80 text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit standard login */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Verify Credentials & Log In</span>
              </>
            )}
          </button>
        </form>

        {/* Footer switch to Register */}
        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-800/80 border-t border-neutral-100 dark:border-neutral-700 text-center text-xs text-neutral-600 dark:text-neutral-400">
          Need a new authorized account?{' '}
          <button
            type="button"
            onClick={() => onSwitchToRegister(selectedRole)}
            className="text-red-600 hover:text-red-700 dark:text-red-400 font-bold hover:underline cursor-pointer"
          >
            Sign Up for {currentMeta.title} Portal
          </button>
        </div>
      </div>
    </div>
  );
};
