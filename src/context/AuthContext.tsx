import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  UserRole,
  DonorProfile,
  HospitalProfile,
  BloodBankProfile,
  LocationCoords,
} from '../types';
import {
  INITIAL_DONORS,
  INITIAL_HOSPITALS,
  INITIAL_BLOOD_BANKS,
} from '../data/mockData';
import { api } from '../services/api';

const ADMIN_USER: UserProfile = {
  id: 'admin-1',
  email: 'admin@tnsbtc.tn.gov.in',
  role: 'admin',
  fullName: 'Director Dr. S. Kanthimathy, MD',
  phone: '+91 (44) 2432-0333',
  city: 'Chennai',
  state: 'Tamil Nadu',
  pinCode: '600006',
  address: 'Tamil Nadu State Blood Transfusion Council (TNSBTC), DMS Complex, Anna Salai, Teynampet',
  coordinates: { latitude: 13.0475, longitude: 80.2486 },
  createdAt: '2022-01-01T00:00:00Z',
  updatedAt: '2026-10-21T00:00:00Z',
};

const DEFAULT_CHENNAI_COORDS: LocationCoords = { latitude: 13.0827, longitude: 80.2777 };

export interface StoredAccount {
  email: string;
  password: string;
  role: UserRole;
  profile: UserProfile | DonorProfile | HospitalProfile | BloodBankProfile;
}

export const DEFAULT_CREDENTIALS: Record<UserRole, { email: string; password: string; name: string }> = {
  donor: {
    email: 'karthik.subramanian@example.com',
    password: 'Chennai@Donor2026',
    name: 'Karthik Subramanian (O- Donor)',
  },
  hospital: {
    email: 'trauma@rgggh.tn.gov.in',
    password: 'Chennai@Hospital2026',
    name: 'Dr. A. Sundaram (RGGGH Trauma)',
  },
  blood_bank: {
    email: 'bloodbank@redcrosschennai.org',
    password: 'Chennai@BloodBank2026',
    name: 'S. Meenakshi (Red Cross Blood Bank)',
  },
  admin: {
    email: 'admin@tnsbtc.tn.gov.in',
    password: 'Chennai@Admin2026',
    name: 'Dr. S. Kanthimathy (TNSBTC State Admin)',
  },
};

const SEED_ACCOUNTS: StoredAccount[] = [
  {
    email: 'karthik.subramanian@example.com',
    password: 'Chennai@Donor2026',
    role: 'donor',
    profile: INITIAL_DONORS[0],
  },
  {
    email: 'priya.soundararajan@example.com',
    password: 'Chennai@Donor2026',
    role: 'donor',
    profile: INITIAL_DONORS[1],
  },
  {
    email: 'trauma@rgggh.tn.gov.in',
    password: 'Chennai@Hospital2026',
    role: 'hospital',
    profile: INITIAL_HOSPITALS[0],
  },
  {
    email: 'emergency@apollohospitals.com',
    password: 'Chennai@Hospital2026',
    role: 'hospital',
    profile: INITIAL_HOSPITALS[1],
  },
  {
    email: 'bloodbank@redcrosschennai.org',
    password: 'Chennai@BloodBank2026',
    role: 'blood_bank',
    profile: INITIAL_BLOOD_BANKS[0],
  },
  {
    email: 'dispatch@rotarybloodchennai.org',
    password: 'Chennai@BloodBank2026',
    role: 'blood_bank',
    profile: INITIAL_BLOOD_BANKS[1],
  },
  {
    email: 'admin@tnsbtc.tn.gov.in',
    password: 'Chennai@Admin2026',
    role: 'admin',
    profile: ADMIN_USER,
  },
];

interface AuthContextType {
  currentUser: UserProfile | DonorProfile | HospitalProfile | BloodBankProfile;
  currentRole: UserRole;
  isLoggedIn: boolean;
  userCoordinates: LocationCoords | null;
  locationStatus: 'detected' | 'manual' | 'requesting' | 'unsupported' | 'denied';
  login: (role: UserRole, credentials: { email: string; password: string }) => Promise<boolean>;
  register: (role: UserRole, data: any) => Promise<boolean>;
  logout: () => void;
  switchPersona: (role: UserRole, customId?: string) => void;
  updateDonorProfileData: (updates: Partial<DonorProfile>) => Promise<void>;
  detectLiveLocation: () => Promise<void>;
  setManualLocation: (city: string, state: string, pin: string, coords?: LocationCoords) => void;
  allDonors: DonorProfile[];
  allHospitals: HospitalProfile[];
  allBloodBanks: BloodBankProfile[];
  registeredAccounts: StoredAccount[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('bloodsync_is_logged_in') === 'true';
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('bloodsync_role') as UserRole | null;
    return saved || 'donor';
  });

  const [registeredAccounts, setRegisteredAccounts] = useState<StoredAccount[]>(() => {
    try {
      const stored = localStorage.getItem('bloodsync_registered_accounts_v2');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return SEED_ACCOUNTS;
  });

  const [donorsList, setDonorsList] = useState<DonorProfile[]>(INITIAL_DONORS);
  const [hospitalsList, setHospitalsList] = useState<HospitalProfile[]>(INITIAL_HOSPITALS);
  const [bloodBanksList, setBloodBanksList] = useState<BloodBankProfile[]>(INITIAL_BLOOD_BANKS);

  const [currentUser, setCurrentUser] = useState<UserProfile | DonorProfile | HospitalProfile | BloodBankProfile>(() => {
    const savedRole = (localStorage.getItem('bloodsync_role') as UserRole) || 'donor';
    if (savedRole === 'donor') return INITIAL_DONORS[0];
    if (savedRole === 'hospital') return INITIAL_HOSPITALS[0];
    if (savedRole === 'blood_bank') return INITIAL_BLOOD_BANKS[0];
    return ADMIN_USER;
  });

  const [userCoordinates, setUserCoordinates] = useState<LocationCoords | null>(
    currentUser.coordinates || DEFAULT_CHENNAI_COORDS
  );

  const [locationStatus, setLocationStatus] = useState<'detected' | 'manual' | 'requesting' | 'unsupported' | 'denied'>(
    'manual'
  );

  useEffect(() => {
    localStorage.setItem('bloodsync_registered_accounts_v2', JSON.stringify(registeredAccounts));
  }, [registeredAccounts]);

  useEffect(() => {
    localStorage.setItem('bloodsync_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem('bloodsync_is_logged_in', String(isLoggedIn));
  }, [isLoggedIn]);

  const switchPersona = (role: UserRole, customId?: string) => {
    setCurrentRole(role);
    if (role === 'donor') {
      const donor = (customId && donorsList.find((d) => d.id === customId)) || donorsList[0];
      setCurrentUser(donor);
      if (donor.coordinates) setUserCoordinates(donor.coordinates);
    } else if (role === 'hospital') {
      const hosp = (customId && hospitalsList.find((h) => h.id === customId)) || hospitalsList[0];
      setCurrentUser(hosp);
      if (hosp.coordinates) setUserCoordinates(hosp.coordinates);
    } else if (role === 'blood_bank') {
      const bank = (customId && bloodBanksList.find((b) => b.id === customId)) || bloodBanksList[0];
      setCurrentUser(bank);
      if (bank.coordinates) setUserCoordinates(bank.coordinates);
    } else {
      setCurrentUser(ADMIN_USER);
      setUserCoordinates(ADMIN_USER.coordinates || null);
    }
  };

  const login = async (
    role: UserRole,
    credentials: { email: string; password: string }
  ): Promise<boolean> => {
    const trimmedEmail = (credentials.email || '').trim().toLowerCase();
    const trimmedPassword = (credentials.password || '').trim();

    if (!trimmedEmail) {
      throw new Error('Please enter your authorized email address.');
    }
    if (!trimmedPassword) {
      throw new Error('Please enter your account password.');
    }

    // Lookup in registered accounts
    const account = registeredAccounts.find(
      (acc) => acc.email.toLowerCase() === trimmedEmail && acc.password === trimmedPassword
    );

    if (!account) {
      throw new Error(
        'Invalid email or password. Please verify your credentials or register a new account.'
      );
    }

    // Check if role matches or admin override
    if (account.role !== role && account.role !== 'admin') {
      throw new Error(
        `This account is registered as "${account.role.replace('_', ' ')}", not "${role.replace('_', ' ')}". Please switch to the appropriate portal.`
      );
    }

    // Set authenticated state
    setCurrentRole(role);
    setCurrentUser(account.profile);
    if (account.profile.coordinates) {
      setUserCoordinates(account.profile.coordinates);
    }
    setIsLoggedIn(true);
    return true;
  };

  const register = async (role: UserRole, data: any): Promise<boolean> => {
    const trimmedEmail = (data.email || '').trim().toLowerCase();
    const trimmedPassword = (data.password || '').trim();

    if (!trimmedEmail) {
      throw new Error('Valid email address is required for registration.');
    }
    if (!trimmedPassword || trimmedPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    // Check if already registered
    const existing = registeredAccounts.find((acc) => acc.email.toLowerCase() === trimmedEmail);
    if (existing) {
      throw new Error('An account with this email address already exists. Please log in.');
    }

    const newId = `${role}-${Date.now()}`;
    const timestamp = new Date().toISOString();

    let createdProfile: UserProfile | DonorProfile | HospitalProfile | BloodBankProfile;

    if (role === 'donor') {
      const newDonor: DonorProfile = {
        id: newId,
        email: trimmedEmail,
        role: 'donor',
        fullName: data.fullName || 'Chennai Registered Donor',
        phone: data.phone || '+91 98400 00000',
        bloodGroup: data.bloodGroup || 'O+',
        dateOfBirth: data.dateOfBirth || '1995-01-01',
        age: Number(data.age) || 28,
        weightKg: Number(data.weightKg) || 65,
        city: data.city || 'Chennai',
        state: data.state || 'Tamil Nadu',
        pinCode: data.pinCode || '600004',
        address: data.address || `${data.neighborhood || 'Mylapore'}, Chennai`,
        coordinates: data.coordinates || DEFAULT_CHENNAI_COORDS,
        availability: 'Available',
        willingnessToDonate: true,
        totalDonationsCount: 0,
        isEligibleAge: Number(data.age) >= 18 && Number(data.age) <= 65,
        anonymousToPublic: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      setDonorsList((prev) => [newDonor, ...prev]);
      createdProfile = newDonor;
    } else if (role === 'hospital') {
      const newHospital: HospitalProfile = {
        id: newId,
        email: trimmedEmail,
        role: 'hospital',
        fullName: data.authorizedStaffName || data.fullName || 'Chief Medical Officer',
        hospitalName: data.hospitalName || 'Chennai Emergency Care Hospital',
        registrationNumber: data.registrationNumber || `HOSP-TN-CHEN-${Math.floor(100 + Math.random() * 900)}`,
        licenseNumber: data.licenseNumber || `LIC-MED-TN-${Math.floor(1000 + Math.random() * 9000)}`,
        hospitalType: data.hospitalType || 'Private',
        authorizedStaffName: data.authorizedStaffName || data.fullName || 'Medical Officer',
        authorizedStaffDesignation: data.authorizedStaffDesignation || 'Chief Medical Officer',
        emergencyContact: data.emergencyContact || data.phone || '+91 44 2829 0000',
        phone: data.phone || '+91 44 2829 0000',
        city: data.city || 'Chennai',
        state: data.state || 'Tamil Nadu',
        pinCode: data.pinCode || '600006',
        address: data.address || `${data.neighborhood || 'Anna Nagar'}, Chennai`,
        coordinates: data.coordinates || DEFAULT_CHENNAI_COORDS,
        verificationStatus: 'Verified',
        bedCapacity: Number(data.bedCapacity) || 450,
        icuAvailable: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      setHospitalsList((prev) => [newHospital, ...prev]);
      createdProfile = newHospital;
    } else if (role === 'blood_bank') {
      const newBank: BloodBankProfile = {
        id: newId,
        email: trimmedEmail,
        role: 'blood_bank',
        fullName: data.authorizedOfficer || data.fullName || 'Certified Immunohematologist',
        bloodBankName: data.bloodBankName || 'Chennai Community Blood Bank',
        licenseNumber: data.licenseNumber || `BB-LIC-TN-${Math.floor(100 + Math.random() * 900)}`,
        authorizedOfficer: data.authorizedOfficer || data.fullName || 'Certified Specialist',
        operatingHours: data.operatingHours || '24/7 Rapid Emergency Dispatch',
        emergencyContact: data.emergencyContact || data.phone || '+91 44 2855 0000',
        phone: data.phone || '+91 44 2855 0000',
        city: data.city || 'Chennai',
        state: data.state || 'Tamil Nadu',
        pinCode: data.pinCode || '600008',
        address: data.address || `${data.neighborhood || 'Egmore'}, Chennai`,
        coordinates: data.coordinates || DEFAULT_CHENNAI_COORDS,
        verificationStatus: 'Verified',
        refrigerationCapacityUnits: Number(data.refrigerationCapacityUnits) || 3000,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      setBloodBanksList((prev) => [newBank, ...prev]);
      createdProfile = newBank;
    } else {
      createdProfile = {
        ...ADMIN_USER,
        email: trimmedEmail,
        id: newId,
      };
    }

    const newAccount: StoredAccount = {
      email: trimmedEmail,
      password: trimmedPassword,
      role,
      profile: createdProfile,
    };

    setRegisteredAccounts((prev) => [newAccount, ...prev]);
    setCurrentRole(role);
    setCurrentUser(createdProfile);
    if (createdProfile.coordinates) {
      setUserCoordinates(createdProfile.coordinates);
    }
    setIsLoggedIn(true);
    return true;
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('bloodsync_is_logged_in');
  };

  const updateDonorProfileData = async (updates: Partial<DonorProfile>) => {
    if (currentUser.role !== 'donor') return;
    try {
      const updated = await api.updateDonorProfile(currentUser.id, updates);
      setCurrentUser(updated);
      setDonorsList((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    } catch {
      // Local fallback
      const updated = { ...currentUser, ...updates, updatedAt: new Date().toISOString() } as DonorProfile;
      setCurrentUser(updated);
      setDonorsList((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    }
  };

  const detectLiveLocation = async (): Promise<void> => {
    if (!navigator.geolocation) {
      setLocationStatus('unsupported');
      return;
    }
    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: LocationCoords = {
          latitude: Number(pos.coords.latitude.toFixed(4)),
          longitude: Number(pos.coords.longitude.toFixed(4)),
        };
        setUserCoordinates(coords);
        setLocationStatus('detected');
      },
      (err) => {
        console.warn('Geolocation denied or failed:', err);
        setLocationStatus('denied');
      },
      { timeout: 8000 }
    );
  };

  const setManualLocation = (city: string, state: string, pin: string, coords?: LocationCoords) => {
    setLocationStatus('manual');
    if (coords) {
      setUserCoordinates(coords);
    }
    setCurrentUser((prev) => ({
      ...prev,
      city,
      state,
      pinCode: pin,
      coordinates: coords || prev.coordinates,
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        isLoggedIn,
        userCoordinates,
        locationStatus,
        login,
        register,
        logout,
        switchPersona,
        updateDonorProfileData,
        detectLiveLocation,
        setManualLocation,
        allDonors: donorsList,
        allHospitals: hospitalsList,
        allBloodBanks: bloodBanksList,
        registeredAccounts,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
