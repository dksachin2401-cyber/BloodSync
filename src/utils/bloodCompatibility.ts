import { BloodGroup, DonorProfile, LocationCoords } from '../types';

/**
 * Standard Red Blood Cell (RBC) compatibility mapping.
 * Key: Recipient blood group.
 * Value: Array of compatible donor blood groups.
 * 
 * Note: Prototype clinical reference. Actual transfusion requires antibody crossmatching.
 */
export const RBC_COMPATIBILITY_RULES: Record<BloodGroup, BloodGroup[]> = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

/**
 * Inverse mapping: which recipients can this donor give to?
 */
export const DONOR_CAN_DONATE_TO: Record<BloodGroup, BloodGroup[]> = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // Universal red cell donor
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'], // Universal recipient (can only donate to AB+)
};

/**
 * Check if donor blood group is compatible for a recipient blood group.
 */
export function isRbcCompatible(donorGroup: BloodGroup, recipientGroup: BloodGroup): boolean {
  const allowed = RBC_COMPATIBILITY_RULES[recipientGroup] || [];
  return allowed.includes(donorGroup);
}

/**
 * Minimum and maximum donor ages for prototype eligibility screening
 */
export const MIN_DONOR_AGE = 18;
export const MAX_DONOR_AGE = 65;
export const MIN_DONATION_INTERVAL_DAYS = 56; // Standard 8-week interval for whole blood

/**
 * Check donor eligibility screening
 */
export function screenDonorEligibility(donor: DonorProfile): {
  isEligible: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  // Age screening (18-65)
  if (donor.age < MIN_DONOR_AGE) {
    reasons.push(`Donor age (${donor.age}) is below minimum requirement of ${MIN_DONOR_AGE} years.`);
  } else if (donor.age > MAX_DONOR_AGE) {
    reasons.push(`Donor age (${donor.age}) exceeds maximum prototype screening age of ${MAX_DONOR_AGE} years.`);
  }

  // Availability status
  if (donor.availability !== 'Available') {
    reasons.push(`Donor availability is currently set to "${donor.availability}".`);
  }

  // Willingness
  if (!donor.willingnessToDonate) {
    reasons.push('Donor has opted out of emergency donation notifications.');
  }

  // Minimum wait time since last donation (if reported)
  if (donor.lastDonationDate) {
    const lastDate = new Date(donor.lastDonationDate);
    const diffDays = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < MIN_DONATION_INTERVAL_DAYS) {
      reasons.push(`Only ${diffDays} days since last donation. Minimum interval is ${MIN_DONATION_INTERVAL_DAYS} days.`);
    }
  }

  return {
    isEligible: reasons.length === 0,
    reasons,
  };
}

/**
 * Calculate Great-Circle distance between two points using the Haversine formula.
 * Returns distance in kilometers (rounded to 1 decimal place).
 */
export function calculateHaversineDistance(
  coord1: LocationCoords,
  coord2: LocationCoords
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);
  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return Math.round(d * 10) / 10;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Approximates distance when coordinates are not available, based on city match or PIN difference.
 * Returns null if no reasonable approximation can be computed.
 */
export function approximateDistanceByCityOrPin(
  city1?: string,
  pin1?: string,
  city2?: string,
  pin2?: string
): { distanceKm: number | null; label: string } {
  if (city1 && city2 && city1.trim().toLowerCase() === city2.trim().toLowerCase()) {
    if (pin1 && pin2 && pin1.trim() === pin2.trim()) {
      return { distanceKm: 2.5, label: '~2.5 km (Same locality & PIN)' };
    }
    return { distanceKm: 8.0, label: '~8 km (Same metropolitan city)' };
  }
  return { distanceKm: null, label: 'Regional (Location coordinates unshared)' };
}

/**
 * Masks a phone number for donor privacy.
 * E.g. "+1 (555) 019-2834" -> "•••• ••• 2834"
 */
export function maskPhoneNumber(phone?: string): string {
  if (!phone) return '••••••••';
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 4) return '••••••••';
  const last4 = clean.slice(-4);
  return `•••• ••• ${last4}`;
}

/**
 * Masks residential address to show only city and approximate district
 */
export function maskAddress(address?: string, city?: string, pinCode?: string): string {
  const parts = [];
  if (city) parts.push(city);
  if (pinCode) parts.push(`PIN: ${pinCode.slice(0, 3)}***`);
  return parts.length > 0 ? parts.join(', ') : 'Location concealed for privacy';
}

/**
 * Ranks matching donors by proximity, eligibility, and urgency.
 */
export function rankMatchingDonors(
  recipientBloodGroup: BloodGroup,
  hospitalCoords: LocationCoords | undefined,
  donors: DonorProfile[]
): Array<{
  donor: DonorProfile;
  isCompatible: boolean;
  isEligible: boolean;
  distanceKm: number | null;
  score: number;
  reason: string;
}> {
  return donors
    .map((donor) => {
      const compatible = isRbcCompatible(donor.bloodGroup, recipientBloodGroup);
      const screening = screenDonorEligibility(donor);
      let distance: number | null = null;

      if (hospitalCoords && donor.coordinates) {
        distance = calculateHaversineDistance(hospitalCoords, donor.coordinates);
      }

      // Ranking score calculation:
      // Higher score is better.
      // Incompatible donors get -1000.
      // Ineligible donors get -500.
      let score = 0;
      if (!compatible) {
        score -= 1000;
      } else {
        score += 500;
        // Universal donor O- bonus
        if (donor.bloodGroup === 'O-') score += 50;
        // Exact match bonus
        if (donor.bloodGroup === recipientBloodGroup) score += 40;
      }

      if (!screening.isEligible) {
        score -= 500;
      } else {
        score += 200;
      }

      // Distance scoring: closer is better
      if (distance !== null) {
        // Less than 50km gives up to 100 points
        score += Math.max(0, 100 - distance * 2);
      } else {
        score += 20; // baseline if distance unknown
      }

      // Reason explanation
      let reason = '';
      if (!compatible) {
        reason = `${donor.bloodGroup} red blood cells are not compatible with requested ${recipientBloodGroup}.`;
      } else if (!screening.isEligible) {
        reason = `Compatible blood (${donor.bloodGroup}), but ineligible: ${screening.reasons[0]}`;
      } else {
        reason = `Compatible ${donor.bloodGroup} RBC donor. Meets age & self-reported health criteria.`;
      }

      return {
        donor,
        isCompatible: compatible,
        isEligible: screening.isEligible,
        distanceKm: distance,
        score,
        reason,
      };
    })
    .sort((a, b) => b.score - a.score);
}
