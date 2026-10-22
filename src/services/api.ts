import {
  BloodRequest,
  DonorPledge,
  BloodBankResponse,
  BloodInventoryItem,
  NotificationItem,
  AuditLogItem,
  DemandForecastInsight,
  DonorProfile,
  MatchingDonorResult,
  BloodGroup,
  UrgencyLevel,
  RequestStatus,
  DonationAppointment,
} from '../types';

const API_BASE = '/api';

export const api = {
  // Health
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await res.json();
    } catch {
      return {
        status: 'demo',
        app: 'BloodSync',
        isDemoMode: true,
        supabaseConnected: false,
        geminiConfigured: false,
      };
    }
  },

  // Requests
  async getEmergencyRequests(filters?: {
    status?: string;
    urgency?: string;
    bloodGroup?: string;
    hospitalId?: string;
  }): Promise<BloodRequest[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.urgency) params.append('urgency', filters.urgency);
    if (filters?.bloodGroup) params.append('bloodGroup', filters.bloodGroup);
    if (filters?.hospitalId) params.append('hospitalId', filters.hospitalId);

    const res = await fetch(`${API_BASE}/emergency-requests?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch emergency requests');
    return res.json();
  },

  async createEmergencyRequest(data: {
    hospitalId: string;
    hospitalName: string;
    hospitalCity: string;
    hospitalContact: string;
    bloodGroup: BloodGroup;
    unitsRequired: number;
    urgency: UrgencyLevel;
    requiredBy: string;
    clinicalNotes?: string;
    patientAge?: number;
    patientGender?: 'Male' | 'Female' | 'Other';
  }): Promise<{ request: BloodRequest; notifiedDonors: number; notifiedBloodBanks: number }> {
    const res = await fetch(`${API_BASE}/emergency-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit emergency request');
    }
    return res.json();
  },

  async updateEmergencyRequest(
    id: string,
    updates: { status?: RequestStatus; unitsFulfilled?: number; notes?: string }
  ): Promise<BloodRequest> {
    const res = await fetch(`${API_BASE}/emergency-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update request');
    return res.json();
  },

  // Donors & Matching
  async getDonorMatches(requestId: string): Promise<{
    request: BloodRequest;
    compatibleBloodGroups: BloodGroup[];
    matches: MatchingDonorResult[];
  }> {
    const res = await fetch(`${API_BASE}/donors/matches/${requestId}`);
    if (!res.ok) throw new Error('Failed to fetch donor matches');
    return res.json();
  },

  async updateDonorProfile(
    donorId: string,
    updates: Partial<DonorProfile>
  ): Promise<DonorProfile> {
    const res = await fetch(`${API_BASE}/donors/${donorId}/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  // Pledges
  async submitPledge(data: {
    requestId: string;
    donorId: string;
    estimatedArrival?: string;
    notes?: string;
  }): Promise<DonorPledge> {
    const res = await fetch(`${API_BASE}/donor-pledges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit pledge');
    }
    return res.json();
  },

  async updatePledge(
    pledgeId: string,
    updates: Partial<DonorPledge>
  ): Promise<DonorPledge> {
    const res = await fetch(`${API_BASE}/donor-pledges/${pledgeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update pledge');
    return res.json();
  },

  // Donation Appointments & Scheduling
  async getAppointments(filters?: {
    donorId?: string;
    bloodBankId?: string;
    status?: string;
  }): Promise<DonationAppointment[]> {
    const params = new URLSearchParams();
    if (filters?.donorId) params.append('donorId', filters.donorId);
    if (filters?.bloodBankId) params.append('bloodBankId', filters.bloodBankId);
    if (filters?.status) params.append('status', filters.status);

    const res = await fetch(`${API_BASE}/appointments?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch appointments');
    return res.json();
  },

  async bookAppointment(data: {
    donorId: string;
    bloodBankId: string;
    appointmentDate: string;
    timeSlot: string;
    donationType?: string;
    notes?: string;
  }): Promise<{ appointment: DonationAppointment; updatedInventory?: BloodInventoryItem }> {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to book donation appointment');
    }
    return res.json();
  },

  async updateAppointment(
    id: string,
    updates: { status?: string; notes?: string }
  ): Promise<{ appointment: DonationAppointment; updatedInventory?: BloodInventoryItem }> {
    const res = await fetch(`${API_BASE}/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update appointment');
    }
    return res.json();
  },

  // Blood Bank Inventory
  async getInventory(bloodBankId?: string): Promise<BloodInventoryItem[]> {
    const url = bloodBankId
      ? `${API_BASE}/blood-banks/inventory?bloodBankId=${bloodBankId}`
      : `${API_BASE}/blood-banks/inventory`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch inventory');
    return res.json();
  },

  async updateInventoryItem(
    id: string,
    data: {
      availableUnits?: number;
      reservedUnits?: number;
      expiredUnits?: number;
      reason?: string;
      performedByUserId?: string;
    }
  ): Promise<BloodInventoryItem> {
    const res = await fetch(`${API_BASE}/blood-banks/inventory/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update inventory item');
    }
    return res.json();
  },

  async submitBloodBankResponse(data: {
    requestId: string;
    bloodBankId: string;
    unitsOffered: number;
    notes?: string;
  }): Promise<{
    response: BloodBankResponse;
    updatedInventory: BloodInventoryItem;
    updatedRequest: BloodRequest;
  }> {
    const res = await fetch(`${API_BASE}/blood-bank-responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to dispatch units');
    }
    return res.json();
  },

  // Notifications
  async getNotifications(userId?: string, role?: string): Promise<{
    notifications: NotificationItem[];
    unreadCount: number;
  }> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (role) params.append('role', role);

    const res = await fetch(`${API_BASE}/notifications?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async markNotificationRead(id: string): Promise<NotificationItem> {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Failed to mark notification read');
    return res.json();
  },

  async markAllNotificationsRead(userId?: string, role?: string): Promise<void> {
    const res = await fetch(`${API_BASE}/notifications/mark_all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    });
    if (!res.ok) throw new Error('Failed to mark all notifications read');
  },

  // Admin
  async getAdminAnalytics(): Promise<{
    metrics: {
      totalDonors: number;
      activeDonors: number;
      totalHospitals: number;
      totalBloodBanks: number;
      totalRequests: number;
      activeCrises: number;
      fulfilledRequests: number;
      criticalCrises: number;
      totalPledgesCount: number;
      totalDispatchedUnits: number;
      fulfillmentRatePercent: number;
    };
    bloodGroupComparison: Array<{
      bloodGroup: BloodGroup;
      demandUnits: number;
      supplyAvailable: number;
      deficit: number;
    }>;
    requestsByCity: Record<string, number>;
  }> {
    const res = await fetch(`${API_BASE}/admin/analytics`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  async getAuditLogs(filters?: { targetType?: string; search?: string }): Promise<AuditLogItem[]> {
    const params = new URLSearchParams();
    if (filters?.targetType) params.append('targetType', filters.targetType);
    if (filters?.search) params.append('search', filters.search);

    const res = await fetch(`${API_BASE}/admin/audit-logs?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async updateInstitutionVerification(
    id: string,
    verificationStatus: 'Verified' | 'Pending Verification' | 'Rejected'
  ) {
    const res = await fetch(`${API_BASE}/admin/institutions/${id}/verification`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationStatus }),
    });
    if (!res.ok) throw new Error('Failed to update verification status');
    return res.json();
  },

  // AI Demand Forecast
  async getDemandForecast(): Promise<DemandForecastInsight> {
    const res = await fetch(`${API_BASE}/admin/demand-forecast`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to generate demand forecast');
    return res.json();
  },
};
