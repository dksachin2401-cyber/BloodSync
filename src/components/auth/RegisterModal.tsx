import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  Building2,
  Warehouse,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Lock,
  Calendar,
  Scale,
  Award,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { UserRole, BloodGroup } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: (preferredRole?: UserRole) => void;
  initialRole?: UserRole;
  onRegisterSuccess?: (role: UserRole) => void;
}

const CHENNAI_NEIGHBORHOODS = [
  { name: 'Mylapore', pin: '600004', lat: 13.0336, lng: 80.2677 },
  { name: 'Anna Nagar', pin: '600040', lat: 13.0850, lng: 80.2101 },
  { name: 'T. Nagar', pin: '600017', lat: 13.0418, lng: 80.2341 },
  { name: 'Adyar', pin: '600020', lat: 13.0012, lng: 80.2565 },
  { name: 'Velachery', pin: '600042', lat: 12.9815, lng: 80.2180 },
  { name: 'Egmore', pin: '600008', lat: 13.0732, lng: 80.2609 },
  { name: 'Park Town (Central)', pin: '600003', lat: 13.0827, lng: 80.2777 },
  { name: 'Guindy', pin: '600032', lat: 13.0067, lng: 80.2025 },
  { name: 'Tambaram', pin: '600045', lat: 12.9249, lng: 80.1000 },
  { name: 'George Town / Royapuram', pin: '600001', lat: 13.1075, lng: 80.2872 },
  { name: 'Thousand Lights / Greams Rd', pin: '600006', lat: 13.0577, lng: 80.2508 },
  { name: 'OMR / Taramani', pin: '600113', lat: 12.9863, lng: 80.2432 },
];

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
  initialRole = 'donor',
  onRegisterSuccess,
}) => {
  const { register } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole === 'admin' ? 'donor' : initialRole);

  // Common fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('+91 9840');
  const [neighborhood, setNeighborhood] = useState(CHENNAI_NEIGHBORHOODS[0].name);
  const [pinCode, setPinCode] = useState(CHENNAI_NEIGHBORHOODS[0].pin);
  const [address, setAddress] = useState('');

  // Donor fields
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [age, setAge] = useState<number>(26);
  const [weightKg, setWeightKg] = useState<number>(68);

  // Hospital fields
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalType, setHospitalType] = useState<'Government' | 'Private' | 'Trust'>('Private');
  const [bedCapacity, setBedCapacity] = useState<number>(350);

  // Blood Bank fields
  const [bloodBankName, setBloodBankName] = useState('');
  const [refrigerationCapacityUnits, setRefrigerationCapacityUnits] = useState<number>(2500);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time password strength evaluation
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password);

  const criteriaMetCount = [hasMinLength, hasNumber, hasSpecialChar].filter(Boolean).length;

  let strengthLabel = 'Not Set';
  let strengthColor = 'text-neutral-400';
  let strengthBg = 'bg-neutral-200 dark:bg-neutral-700';

  if (password.length > 0) {
    if (criteriaMetCount === 1) {
      strengthLabel = 'Weak';
      strengthColor = 'text-red-500';
      strengthBg = 'bg-red-500';
    } else if (criteriaMetCount === 2) {
      strengthLabel = 'Fair';
      strengthColor = 'text-amber-500';
      strengthBg = 'bg-amber-500';
    } else if (criteriaMetCount === 3) {
      strengthLabel = 'Strong';
      strengthColor = 'text-emerald-500';
      strengthBg = 'bg-emerald-500';
    } else {
      strengthLabel = 'Weak';
      strengthColor = 'text-red-500';
      strengthBg = 'bg-red-500';
    }
  }

  useEffect(() => {
    if (initialRole && initialRole !== 'admin') {
      setSelectedRole(initialRole);
    }
  }, [initialRole]);

  // Handle neighborhood change to sync PIN
  const handleNeighborhoodChange = (name: string) => {
    setNeighborhood(name);
    const match = CHENNAI_NEIGHBORHOODS.find((n) => n.name === name);
    if (match) setPinCode(match.pin);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Password requirements validation: Length, Numbers, Special Characters
    if (!hasMinLength) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!hasNumber) {
      setError('Password must contain at least one numeric digit (0-9).');
      return;
    }
    if (!hasSpecialChar) {
      setError('Password must contain at least one special character (!@#$%^&*...).');
      return;
    }

    if (selectedRole === 'donor') {
      if (age < 18 || age > 65) {
        setError('Donor eligibility requirement: Age must be between 18 and 65 years.');
        return;
      }
      if (weightKg < 50) {
        setError('Donor eligibility requirement: Minimum weight must be 50 kg for blood donation.');
        return;
      }
    }

    const nMatch = CHENNAI_NEIGHBORHOODS.find((n) => n.name === neighborhood);
    const coords = nMatch
      ? { latitude: nMatch.lat, longitude: nMatch.lng }
      : { latitude: 13.0827, longitude: 80.2777 };

    setLoading(true);
    try {
      await register(selectedRole, {
        fullName,
        email,
        phone,
        password,
        city: 'Chennai',
        state: 'Tamil Nadu',
        neighborhood,
        pinCode,
        address: address || `${neighborhood}, Chennai`,
        coordinates: coords,
        // Role specifics
        bloodGroup,
        age,
        weightKg,
        hospitalName,
        hospitalType,
        bedCapacity,
        bloodBankName,
        refrigerationCapacityUnits,
      });

      onClose();
      if (onRegisterSuccess) {
        onRegisterSuccess(selectedRole);
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-md shadow-red-600/30">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-neutral-950 dark:text-white">
                  Join BloodSync Chennai Network
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-red-600" />
                  <span>Tamil Nadu Health & Emergency Grid Registration</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role Tabs */}
          <div className="mt-4 grid grid-cols-3 gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setSelectedRole('donor')}
              className={`flex items-center justify-center gap-2 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                selectedRole === 'donor'
                  ? 'bg-white dark:bg-neutral-900 text-red-600 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Heart className="w-4 h-4 text-red-600" />
              <span>Citizen Donor</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('hospital')}
              className={`flex items-center justify-center gap-2 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                selectedRole === 'hospital'
                  ? 'bg-white dark:bg-neutral-900 text-blue-600 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Hospital Trauma</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('blood_bank')}
              className={`flex items-center justify-center gap-2 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                selectedRole === 'blood_bank'
                  ? 'bg-white dark:bg-neutral-900 text-amber-600 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Warehouse className="w-4 h-4 text-amber-600" />
              <span>Blood Bank</span>
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 font-medium">
              {error}
            </div>
          )}

          {/* Role-Specific Core Fields */}
          {selectedRole === 'donor' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-red-50/60 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-bold text-red-600 focus:outline-hidden focus:ring-2 focus:ring-red-500"
                >
                  {(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] as BloodGroup[]).map((g) => (
                    <option key={g} value={g}>
                      {g} {g === 'O-' ? '(Universal Donor)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Age (Years)
                </label>
                <input
                  type="number"
                  min="18"
                  max="65"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  min="50"
                  max="140"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          )}

          {selectedRole === 'hospital' && (
            <div className="space-y-3 p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Hospital / Trauma Center Name
                </label>
                <input
                  type="text"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  placeholder="e.g. Chennai Medical Trauma Center"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Institution Type
                  </label>
                  <select
                    value={hospitalType}
                    onChange={(e) => setHospitalType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Government">Government / Medical College</option>
                    <option value="Private">Private Trauma Hospital</option>
                    <option value="Trust">Trust / Charitable Hospital</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Emergency Bed Capacity
                  </label>
                  <input
                    type="number"
                    value={bedCapacity}
                    onChange={(e) => setBedCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedRole === 'blood_bank' && (
            <div className="space-y-3 p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Licensed Blood Bank & Storage Name
                </label>
                <input
                  type="text"
                  value={bloodBankName}
                  onChange={(e) => setBloodBankName(e.target.value)}
                  placeholder="e.g. Chennai Central Community Blood Bank"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Refrigerated Storage Capacity (Units)
                </label>
                <input
                  type="number"
                  value={refrigerationCapacityUnits}
                  onChange={(e) => setRefrigerationCapacityUnits(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {/* Full Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                {selectedRole === 'donor' ? 'Full Legal Name' : 'Authorized Officer / Head'}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={selectedRole === 'donor' ? 'e.g. Soundar Rajan' : 'e.g. Dr. K. Venkatesh'}
                required
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@example.com"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {/* Mobile & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Mobile Number (India)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98401 23456"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Account Password
                </label>
                {password.length > 0 && (
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider ${strengthColor}`}>
                    {strengthLabel}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 chars, 1 number, 1 symbol"
                  required
                  className="w-full pl-9 pr-10 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Real-time Password Strength Meter & Visual Indicators */}
              <div className="mt-2 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 space-y-2">
                {/* 3-Segment Progress Bar */}
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 flex gap-1 h-1.5">
                    <div
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        criteriaMetCount >= 1 ? strengthBg : 'bg-neutral-200 dark:bg-neutral-700'
                      }`}
                    />
                    <div
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        criteriaMetCount >= 2 ? strengthBg : 'bg-neutral-200 dark:bg-neutral-700'
                      }`}
                    />
                    <div
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        criteriaMetCount >= 3 ? strengthBg : 'bg-neutral-200 dark:bg-neutral-700'
                      }`}
                    />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${strengthColor} shrink-0`}>
                    {strengthLabel}
                  </span>
                </div>

                {/* Requirements Checklist with Real-Time Indicators */}
                <div className="space-y-1 text-[11px]">
                  <div
                    className={`flex items-center gap-1.5 transition-colors ${
                      hasMinLength
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {hasMinLength ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                      </span>
                    )}
                    <span>Length: At least 8 characters ({password.length}/8)</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 transition-colors ${
                      hasNumber
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {hasNumber ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                      </span>
                    )}
                    <span>Numeric: At least 1 number (0–9)</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 transition-colors ${
                      hasSpecialChar
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {hasSpecialChar ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                      </span>
                    )}
                    <span>Special character: At least 1 symbol (!@#$%^&*...)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Location Details (Chennai & Tamil Nadu) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-white">
              <MapPin className="w-3.5 h-3.5 text-red-600" />
              <span>Chennai Regional Location</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                  Chennai Neighborhood
                </label>
                <select
                  value={neighborhood}
                  onChange={(e) => handleNeighborhoodChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-red-500"
                >
                  {CHENNAI_NEIGHBORHOODS.map((n) => (
                    <option key={n.name} value={n.name}>
                      {n.name} ({n.pin})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                  City & State
                </label>
                <input
                  type="text"
                  disabled
                  value="Chennai, Tamil Nadu"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800/50 text-xs text-neutral-500 cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                  PIN Code
                </label>
                <input
                  type="text"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs focus:outline-hidden focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                Street Address / Landmark
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 14 Luz Church Road, Mylapore"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs focus:outline-hidden focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete Registration & Access Portal</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer switch to Login */}
        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-800/80 border-t border-neutral-100 dark:border-neutral-700 text-center text-xs text-neutral-600 dark:text-neutral-400 shrink-0">
          Already registered?{' '}
          <button
            type="button"
            onClick={() => onSwitchToLogin(selectedRole)}
            className="text-red-600 hover:text-red-700 dark:text-red-400 font-bold hover:underline cursor-pointer"
          >
            Log In to Your Account
          </button>
        </div>
      </div>
    </div>
  );
};
