export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type UserRole = 'donor' | 'hospital' | 'blood_bank' | 'admin';

export type DonorAvailability = 'Available' | 'Temporarily Unavailable' | 'Ineligible';

export type UrgencyLevel = 'Critical' | 'High' | 'Normal';

export type RequestStatus = 'Open' | 'Partially Fulfilled' | 'Fulfilled' | 'Cancelled';

export type PledgeStatus = 'Pledged' | 'Attending' | 'Completed' | 'Declined' | 'Cancelled';

export type ResponseStatus = 'Pending' | 'Stock Reserved' | 'Dispatched' | 'Fulfilled' | 'Declined';

export type InstitutionVerificationStatus = 'Verified' | 'Pending Verification' | 'Rejected';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone: string;
  city: string;
  state: string;
  pinCode: string;
  address?: string;
  coordinates?: LocationCoords;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DonorProfile extends UserProfile {
  role: 'donor';
  bloodGroup: BloodGroup;
  dateOfBirth: string; // YYYY-MM-DD
  age: number;
  weightKg?: number;
  lastDonationDate?: string;
  availability: DonorAvailability;
  willingnessToDonate: boolean;
  totalDonationsCount: number;
  selfReportedEligibilityNotes?: string;
  isEligibleAge: boolean; // 18-65
  daysSinceLastDonation?: number;
  anonymousToPublic: boolean;
}

export interface HospitalProfile extends UserProfile {
  role: 'hospital';
  hospitalName: string;
  registrationNumber: string;
  licenseNumber: string;
  hospitalType: 'Government' | 'Private' | 'Trust' | 'Military';
  authorizedStaffName: string;
  authorizedStaffDesignation: string;
  emergencyContact: string;
  verificationStatus: InstitutionVerificationStatus;
  bedCapacity?: number;
  icuAvailable?: boolean;
}

export interface BloodBankProfile extends UserProfile {
  role: 'blood_bank';
  bloodBankName: string;
  licenseNumber: string;
  parentHospital?: string;
  authorizedOfficer: string;
  operatingHours: string;
  emergencyContact?: string;
  verificationStatus: InstitutionVerificationStatus;
  refrigerationCapacityUnits: number;
}

export interface BloodRequest {
  id: string;
  caseReferenceId: string;
  hospitalId: string;
  hospitalName: string;
  hospitalCity: string;
  hospitalCoordinates?: LocationCoords;
  hospitalContact: string;
  bloodGroup: BloodGroup;
  unitsRequired: number;
  unitsPledged: number; // Sum of active donor pledges
  unitsFulfilled: number; // Verified blood bank units or screened donations
  urgency: UrgencyLevel;
  requiredBy: string; // ISO datetime
  status: RequestStatus;
  clinicalNotes?: string;
  patientAge?: number;
  patientGender?: 'Male' | 'Female' | 'Other';
  createdAt: string;
  updatedAt: string;
}

export interface DonorPledge {
  id: string;
  requestId: string;
  donorId: string;
  donorName: string;
  donorBloodGroup: BloodGroup;
  donorPhone: string;
  donorCity: string;
  donorCoordinates?: LocationCoords;
  distanceKm?: number;
  pledgeStatus: PledgeStatus;
  estimatedArrival?: string;
  medicalScreeningPassed?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BloodBankResponse {
  id: string;
  requestId: string;
  bloodBankId: string;
  bloodBankName: string;
  bloodBankCity: string;
  bloodBankContact: string;
  unitsOffered: number;
  status: ResponseStatus;
  dispatchTrackingNumber?: string;
  dispatchedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface BloodInventoryItem {
  id: string;
  bloodBankId: string;
  bloodGroup: BloodGroup;
  availableUnits: number;
  reservedUnits: number;
  expiredUnits: number;
  lowStockThreshold: number;
  lastUpdated: string;
}

export interface InventoryTransaction {
  id: string;
  bloodBankId: string;
  bloodGroup: BloodGroup;
  unitsDelta: number;
  transactionType: 'Donation Received' | 'Reserved for Emergency' | 'Dispatched to Hospital' | 'Reservation Released' | 'Expired Disposal' | 'Manual Audit Adjustment';
  referenceRequestId?: string;
  reason: string;
  performedByUserId: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  recipientUserId: string;
  roleTarget?: UserRole;
  title: string;
  message: string;
  urgency: 'low' | 'normal' | 'urgent' | 'critical';
  read: boolean;
  linkRequestId?: string;
  actionUrl?: string;
  type: 'emergency_broadcast' | 'pledge_update' | 'bank_response' | 'low_stock' | 'request_status' | 'verification' | 'system';
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  targetType: 'blood_request' | 'donor_pledge' | 'inventory' | 'institution' | 'notification' | 'security' | 'appointment';
  targetId?: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export type AppointmentStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'No Show';

export type DonationType = 'Whole Blood' | 'Platelets' | 'Plasma' | 'Double Red Cells';

export interface DonationAppointment {
  id: string;
  donorId: string;
  donorName: string;
  donorBloodGroup: BloodGroup;
  donorPhone: string;
  donorEmail: string;
  bloodBankId: string;
  bloodBankName: string;
  bloodBankAddress: string;
  bloodBankCity: string;
  appointmentDate: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "09:30 AM"
  donationType: DonationType;
  status: AppointmentStatus;
  notes?: string;
  unitsReserved: number;
  createdAt: string;
  updatedAt: string;
}

export interface MatchingDonorResult {
  donor: DonorProfile;
  isCompatible: boolean;
  compatibilityReason: string;
  distanceKm: number | null;
  approximateLocation: string;
  isEligible: boolean;
  eligibilityNotes: string[];
  alreadyNotified: boolean;
  existingPledgeStatus?: PledgeStatus;
}

export interface MatchingBloodBankResult {
  bloodBank: BloodBankProfile;
  availableUnits: number;
  reservedUnits: number;
  distanceKm: number | null;
  hasSufficientStock: boolean;
}

export interface HospitalStockoutPrediction {
  hospitalName: string;
  zone: string;
  bloodGroup: BloodGroup;
  currentReserveUnits: number;
  projectedDailyBurnUnits: number;
  estimatedHoursRemaining: number;
  stockoutRisk: 'Critical' | 'Warning' | 'Stable';
  mitigationAction: string;
}

export interface DemandForecastInsight {
  summary: string;
  overallRiskLevel: 'Low' | 'Moderate' | 'Severe' | 'Critical';
  criticalBloodGroups: BloodGroup[];
  highDemandRegions: { region: string; demandIndex: number; notes: string }[];
  predictedShortages: { bloodGroup: BloodGroup; projectedDeficitUnits: number; rationale: string }[];
  hospitalPredictions?: HospitalStockoutPrediction[];
  inventoryRecommendations: string[];
  dataSourceDescription: string;
  generatedAt: string;
  isAiGenerated: boolean;
}
