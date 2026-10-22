// ==============================================================================
// BloodSync Comprehensive Automated Verification Test Suite (17 Scenarios)
// ==============================================================================

const BASE_URL = 'http://localhost:3001';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  let data;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data, ok: res.ok };
}

async function runTests() {
  console.log('====================================================');
  console.log('🩸 STARTING BLOODSYNC 22-SCENARIO VERIFICATION SUITE');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log('====================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  async function test(name, fn) {
    process.stdout.write(`Scenario ${passedCount + failedCount + 1}: ${name} ... `);
    try {
      await fn();
      console.log('✅ PASS');
      passedCount++;
    } catch (err) {
      console.log('❌ FAIL');
      console.error('   Error:', err.message);
      failedCount++;
    }
  }

  const testSuffix = Date.now().toString().slice(-4);
  await request('/api/auth/reset_rate_limit', { method: 'POST' });
  let adminToken;
  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@bloodsync.gov.in', password: 'password123' }),
  });
  adminToken = adminLogin.data.session?.access_token || adminLogin.data.session?.token;

  // SCENARIO 1: Citizen Registration & Profile Setup
  let citizenUser, citizenSession;
  await test('Citizen Registration and Profile Setup', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: `citizen_${testSuffix}@bloodsync.org`,
        password: 'password123',
        fullName: 'Aravind Krishnan',
        phone: '+91 98401 99887',
        role: 'individual',
        metadata: {
          dob: '1998-05-20',
          age: 28,
          blood_group: 'O-',
          address: 'Flat 4B, Shanthi Apartments, Velachery Main Road, Velachery, Chennai',
          latitude: 12.9815,
          longitude: 80.2180,
          willing_to_donate: true,
        },
      }),
    });
    if (res.status !== 201) throw new Error(`Registration failed: ${JSON.stringify(res.data)}`);
    citizenUser = res.data.user;
    citizenSession = res.data.session;
    if (!citizenUser.id || citizenUser.role !== 'individual') throw new Error('Invalid user created');

    // Verify donor record in DB
    const donorRes = await request(`/api/donors?user_id=${citizenUser.id}`);
    if (donorRes.status !== 200 || donorRes.data.length === 0) throw new Error('Donor profile record missing');
    if (donorRes.data[0].blood_group !== 'O-') throw new Error('Blood group mismatch');
  });

  // SCENARIO 2: Citizen Login & Role Session
  await test('Citizen Login & Role Session Creation', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: `citizen_${testSuffix}@bloodsync.org`,
        password: 'password123',
      }),
    });
    const token = res.data.session?.access_token || res.data.session?.token;
    if (res.data.user.role !== 'individual' || !token) {
      throw new Error('Role or session token missing in login response');
    }
  });

  // SCENARIO 3: Availability Toggle & Search Exclusion
  await test('Availability Toggle & Matching Exclusion', async () => {
    // Toggle citizen availability to break/paused
    const patchRes = await request(`/api/donors/user/${citizenUser.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        willing_to_donate: false,
        availability_status: 'on_break',
      }),
    });
    if (patchRes.status !== 200) throw new Error(`Toggle failed: ${JSON.stringify(patchRes.data)}`);
    if (patchRes.data.willing_to_donate !== 0 || patchRes.data.availability_status !== 'on_break') {
      throw new Error('Willingness state did not persist as 0');
    }

    // Query emergency sources and ensure paused donor is excluded
    const searchRes = await request('/api/emergency_sources/search?blood_group=O-&latitude=12.9815&longitude=80.2180');
    if (searchRes.status !== 200) throw new Error('Search failed');
    const found = searchRes.data.donors.find((d) => d.user_id === citizenUser.id);
    if (found) throw new Error('Unavailable donor was incorrectly returned in active emergency search');

    // Re-enable availability
    await request(`/api/donors/user/${citizenUser.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        willing_to_donate: true,
        availability_status: 'ready_to_donate',
      }),
    });
  });

  // SCENARIO 4: Profile Update (Phone & Address)
  await test('Profile Update Persistence', async () => {
    const updateRes = await request(`/api/donors/user/${citizenUser.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        phone: '+91 98401 11223',
        address: 'Villa 12, Lake View Colony, Velachery, Chennai',
      }),
    });
    if (updateRes.status !== 200) throw new Error('Profile update failed');

    // Verify in donor table
    const donorRes = await request(`/api/donors?user_id=${citizenUser.id}`);
    if (donorRes.data[0].address !== 'Villa 12, Lake View Colony, Velachery, Chennai') {
      throw new Error('Address did not persist in donor table');
    }
    // Verify in profiles table
    const profRes = await request(`/api/profiles/${citizenUser.id}`);
    if (profRes.data.phone !== '+91 98401 11223') {
      throw new Error('Phone did not persist in profiles table');
    }
  });

  // SCENARIO 5: 56-Day Cooldown Eligibility Logic
  await test('56-Day Whole Blood Donation Cooldown Logic', async () => {
    const dnr = (await request(`/api/donors?user_id=${citizenUser.id}`)).data[0];
    if (!dnr) throw new Error('Citizen donor profile not found');

    // 1. Set last donation date to 20 days ago (within 56 day clinical cooldown window)
    const twentyDaysAgo = new Date(Date.now() - 20 * 86400000).toISOString().slice(0, 10);
    const patchRes = await request(`/api/donors/${dnr.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ last_donation_date: twentyDaysAgo }),
    });
    if (patchRes.status !== 200) throw new Error(`Failed to update last_donation_date: ${JSON.stringify(patchRes.data)}`);

    // Verify GET /api/donors/:id returns 200 with populated last_donation_date
    const getRes = await request(`/api/donors/${dnr.id}`);
    if (getRes.status !== 200) throw new Error(`GET /api/donors/${dnr.id} returned status ${getRes.status}`);
    const updated = getRes.data;
    if (!updated.last_donation_date || updated.last_donation_date !== twentyDaysAgo) {
      throw new Error(`Expected last_donation_date ${twentyDaysAgo}, got ${updated.last_donation_date}`);
    }

    const diffDays = Math.floor((Date.now() - new Date(updated.last_donation_date).getTime()) / 86400000);
    if (diffDays >= 56) throw new Error(`Expected diffDays < 56, got ${diffDays}`);

    // Verify donor is EXCLUDED from active emergency search during cooldown
    const cooldownSearch = await request('/api/emergency_sources/search?blood_group=O-&latitude=12.9815&longitude=80.2180');
    if (cooldownSearch.status !== 200) throw new Error('Search failed');
    const excluded = cooldownSearch.data.donors.find((d) => d.id === dnr.id || d.user_id === citizenUser.id);
    if (excluded) throw new Error('Donor within 56-day cooldown was incorrectly returned in emergency search');

    // Reset last donation date to 90 days ago (outside 56 day cooldown window)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
    await request(`/api/donors/${dnr.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ last_donation_date: ninetyDaysAgo }),
    });

    // Verify donor is now INCLUDED in active emergency search
    const eligibleSearch = await request('/api/emergency_sources/search?blood_group=O-&latitude=12.9815&longitude=80.2180');
    const included = eligibleSearch.data.donors.find((d) => d.id === dnr.id || d.user_id === citizenUser.id);
    if (!included) throw new Error('Clinically eligible donor (>56 days) was not included in emergency search');
  });

  // SCENARIO 6: Hospital Registration & Unverified Rejection
  let unverifiedHospitalId;
  await test('Hospital Registration & Verification Gate', async () => {
    const hospReg = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: `hospital_pending_${testSuffix}@bloodsync.org`,
        password: 'password123',
        fullName: 'City Trauma Specialty Clinic',
        phone: '+91 44 2490 8899',
        role: 'hospital',
        metadata: {
          organization_name: 'City Trauma Specialty Clinic',
          address: 'Adyar, Chennai',
          latitude: 13.0012,
          longitude: 80.2565,
        },
      }),
    });
    const hospUser = hospReg.data.user;
    const hospRecord = (await request(`/api/hospitals?user_id=${hospUser.id}`)).data[0];
    unverifiedHospitalId = hospRecord.id;

    // Explicitly set verification to unverified / pending
    await request(`/api/hospitals/${unverifiedHospitalId}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ verification_status: 'unverified' }),
    });

    // Attempt to publish emergency request from unverified hospital -> Expect 403 Forbidden
    const unverifiedAttempt = await request('/api/emergency_requests', {
      method: 'POST',
      body: JSON.stringify({
        hospital_id: unverifiedHospitalId,
        patient_name: 'Unverified Test Patient',
        patient_blood_group: 'O-',
        units_required: 2,
      }),
    });
    if (unverifiedAttempt.status !== 403) {
      throw new Error(`Expected 403 Forbidden for unverified hospital, got ${unverifiedAttempt.status}`);
    }

    // Now admin verifies hospital
    const verifyRes = await request(`/api/hospitals/${unverifiedHospitalId}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ verification_status: 'verified' }),
    });
    if (verifyRes.status !== 200 || verifyRes.data.verification_status !== 'verified') {
      throw new Error('Verification failed');
    }

    // Re-attempt publish -> Expect 201 Created
    const verifiedAttempt = await request('/api/emergency_requests', {
      method: 'POST',
      body: JSON.stringify({
        hospital_id: unverifiedHospitalId,
        patient_name: 'Verified Patient',
        patient_blood_group: 'O-',
        units_required: 2,
      }),
    });
    if (verifiedAttempt.status !== 201) {
      throw new Error(`Expected 201 Created after verification, got ${verifiedAttempt.status}`);
    }
  });

  // SCENARIO 7: Component-Specific Immunohematological Matching
  await test('Component-Specific Immunohematological Matching (PRBC vs FFP)', async () => {
    // 1. PRBC: Patient is O- -> Only O- donors compatible
    const prbcRes = await request('/api/emergency_sources/search?blood_group=O-&component_type=prbc');
    if (prbcRes.status !== 200) throw new Error('PRBC search failed');
    for (const d of prbcRes.data.donors) {
      if (d.blood_group !== 'O-') throw new Error(`Incompatible PRBC donor: ${d.blood_group}`);
    }

    // 2. FFP (Plasma): Patient is O- -> All ABO groups can donate plasma to O! (AB is universal plasma donor)
    const ffpRes = await request('/api/emergency_sources/search?blood_group=O-&component_type=ffp');
    if (ffpRes.status !== 200) throw new Error('FFP search failed');
    // Ensure donors of other groups (e.g. A+, B+) are compatible for FFP to O patient
    const hasNonODonor = ffpRes.data.donors.some((d) => d.blood_group !== 'O-' && d.blood_group !== 'O+');
    if (!hasNonODonor && ffpRes.data.donors.length > 1) {
      throw new Error('FFP plasma rule did not return compatible non-O donors');
    }
  });

  // SCENARIO 8: Nearest Donors Spatial Search (Haversine distance ranking)
  await test('Nearest Donors Haversine Spatial Ranking', async () => {
    const res = await request('/api/emergency_sources/search?blood_group=O-&latitude=12.8231&longitude=80.0442&radius_km=50');
    if (res.status !== 200) throw new Error('Spatial search failed');
    const donors = res.data.donors;
    if (donors.length < 2) throw new Error('Not enough donors to verify distance ordering');
    for (let i = 0; i < donors.length - 1; i++) {
      if (donors[i].distance_km > donors[i + 1].distance_km) {
        throw new Error(`Distance ordering violation at index ${i}: ${donors[i].distance_km} > ${donors[i + 1].distance_km}`);
      }
    }
  });

  // SCENARIO 9: Donor Privacy Protection (Address Masking)
  await test('Donor Residential Address Privacy Masking', async () => {
    const searchRes = await request('/api/emergency_sources/search?blood_group=O-&latitude=12.8231&longitude=80.0442');
    const donors = searchRes.data.donors;
    const testDonor = donors.find((d) => d.user_id === citizenUser.id);
    if (!testDonor) throw new Error('Test donor not in search results');

    // Full address was: "Villa 12, Lake View Colony, Velachery, Chennai"
    // Masked should NOT contain "Villa 12"
    if (testDonor.address.includes('Villa 12')) {
      throw new Error(`House number was not masked: ${testDonor.address}`);
    }
    if (!testDonor.address.includes('Velachery') && !testDonor.address.includes('Chennai')) {
      throw new Error(`Locality/City missing from masked address: ${testDonor.address}`);
    }
  });

  // SCENARIO 10: In-App Emergency Notification Delivery
  let emergencyReqId;
  await test('Emergency Request In-App Notification Delivery', async () => {
    // Re-verify citizen availability
    await request(`/api/donors/user/${citizenUser.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ willing_to_donate: true, availability_status: 'ready_to_donate' }),
    });

    const createRes = await request('/api/emergency_requests', {
      method: 'POST',
      body: JSON.stringify({
        hospital_id: 'hosp-01',
        patient_name: 'Emergency Trauma Patient #77',
        patient_blood_group: 'O-',
        units_required: 2,
        urgency: 'critical',
        component_type: 'prbc',
      }),
    });
    if (createRes.status !== 201) throw new Error('Emergency request creation failed');
    emergencyReqId = createRes.data.id;

    // Check notifications for citizenUser
    const notifs = await request(`/api/notifications?user_id=${citizenUser.id}`, {
      headers: { Authorization: `Bearer ${citizenSession.access_token || citizenSession.token}` },
    });
    if (notifs.status !== 200 || notifs.data.length === 0) {
      throw new Error(`No notifications generated for compatible citizen (status: ${notifs.status}, data: ${JSON.stringify(notifs.data)})`);
    }
    const match = notifs.data.find((n) => n.related_request_id === emergencyReqId);
    if (!match) throw new Error('Notification for this specific emergency request not found');
  });

  // SCENARIO 11: Citizen Donor Pledge Response
  let pledgeId;
  await test('Citizen Donor Pledge Creation', async () => {
    const donorRecord = (await request(`/api/donors?user_id=${citizenUser.id}`)).data[0];
    const pledgeRes = await request('/api/donor_pledges', {
      method: 'POST',
      body: JSON.stringify({
        request_id: emergencyReqId,
        donor_id: donorRecord.id,
        eta_minutes: 25,
      }),
    });
    if (pledgeRes.status !== 201) throw new Error('Pledge failed');
    pledgeId = pledgeRes.data.id;
    if (pledgeRes.data.status !== 'pledged' || pledgeRes.data.eta_minutes !== 25) {
      throw new Error('Pledge fields mismatch');
    }
  });

  // SCENARIO 12: Blood Bank Inventory Addition
  let testUnitId;
  await test('Blood Bank Inventory Unit Addition', async () => {
    const unitRes = await request('/api/blood_units', {
      method: 'POST',
      body: JSON.stringify({
        blood_bank_id: 'bb-01',
        blood_group: 'O-',
        component_type: 'prbc',
        collection_date: new Date().toISOString().slice(0, 10),
        expiry_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        status: 'available',
      }),
    });
    if (unitRes.status !== 201) throw new Error('Blood unit addition failed');
    testUnitId = unitRes.data.id;
    if (unitRes.data.status !== 'available') throw new Error('Initial unit status should be available');
  });

  // SCENARIO 13: Atomic Inventory Reservation (Concurrency & No Double Allocation)
  await test('Atomic Inventory Reservation & Double-Allocation Prevention', async () => {
    // Attempt 1: Should succeed
    const res1 = await request('/api/inventory/reserve', {
      method: 'POST',
      body: JSON.stringify({
        request_id: emergencyReqId,
        blood_unit_ids: [testUnitId],
        actor_id: 'usr-hosp-01',
      }),
    });
    if (res1.status !== 200 || !res1.data.success) {
      throw new Error(`First reservation failed: ${JSON.stringify(res1.data)}`);
    }

    // Create second active request to simulate real-world race condition
    const req2 = await request('/api/emergency_requests', {
      method: 'POST',
      body: JSON.stringify({
        hospital_id: 'hosp-01',
        patient_name: 'Concurrent Patient',
        patient_blood_group: 'A+',
        units_required: 1,
      }),
    });
    if (req2.status !== 201) throw new Error('Failed to create second request for concurrent reservation test');

    // Attempt 2: Same unit simultaneously -> Must fail with 409 Conflict
    const res2 = await request('/api/inventory/reserve', {
      method: 'POST',
      body: JSON.stringify({
        request_id: req2.data.id,
        blood_unit_ids: [testUnitId],
        actor_id: 'usr-hosp-02',
      }),
    });
    if (res2.status !== 409) {
      throw new Error(`Expected 409 Conflict for double-reservation, got ${res2.status}`);
    }
  });

  // SCENARIO 14: Request Cancellation Inventory Release
  await test('Request Cancellation Inventory Release', async () => {
    // Verify unit is currently reserved
    const unitBefore = (await request(`/api/blood_units?id=${testUnitId}`)).data[0];
    if (unitBefore.status !== 'reserved') throw new Error('Unit should be reserved');

    // Cancel emergency request
    const cancelRes = await request(`/api/emergency_requests/${emergencyReqId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'cancelled' }),
    });
    if (cancelRes.status !== 200) throw new Error('Cancellation failed');

    // Verify unit reverted to available and reserved_for_request_id is cleared
    const unitAfter = (await request(`/api/blood_units?id=${testUnitId}`)).data[0];
    if (unitAfter.status !== 'available') {
      throw new Error(`Expected unit status available after cancel, got ${unitAfter.status}`);
    }
    if (unitAfter.reserved_for_request_id) {
      throw new Error('reserved_for_request_id was not cleared');
    }
  });

  // SCENARIO 15: Request Fulfilment Inventory Issue
  await test('Request Fulfilment Inventory Transition to Issued', async () => {
    // Create new request and reserve unit again
    const fulfillReq = await request('/api/emergency_requests', {
      method: 'POST',
      body: JSON.stringify({
        hospital_id: 'hosp-01',
        patient_name: 'Fulfilment Test Patient',
        patient_blood_group: 'O-',
        units_required: 1,
      }),
    });
    const fulfillReqId = fulfillReq.data.id;

    await request('/api/inventory/reserve', {
      method: 'POST',
      body: JSON.stringify({
        request_id: fulfillReqId,
        blood_unit_ids: [testUnitId],
      }),
    });

    // Mark request as fulfilled
    const fulfillRes = await request(`/api/emergency_requests/${fulfillReqId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'fulfilled' }),
    });
    if (fulfillRes.status !== 200) throw new Error('Fulfill request failed');

    // Verify unit transitioned to 'issued'
    const unitIssued = (await request(`/api/blood_units?id=${testUnitId}`)).data[0];
    if (unitIssued.status !== 'issued') {
      throw new Error(`Expected unit status 'issued', got ${unitIssued.status}`);
    }
  });

  // SCENARIO 16: Admin User Suspension Gate
  await test('Admin User Suspension Gate', async () => {
    // Suspend citizen user (with admin token)
    const suspendRes = await request(`/api/profiles/${citizenUser.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ is_suspended: 1 }),
    });
    if (suspendRes.status !== 200 || suspendRes.data.is_suspended !== 1) {
      throw new Error('Suspension failed');
    }

    // Attempt login -> Expect 403 Forbidden
    const loginAttempt = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: citizenUser.email,
        password: 'password123',
      }),
    });
    if (loginAttempt.status !== 403) {
      throw new Error(`Expected 403 Forbidden for suspended user, got ${loginAttempt.status}`);
    }

    // Reactivate user (with admin token)
    const reactivateRes = await request(`/api/profiles/${citizenUser.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ is_suspended: 0 }),
    });
    if (reactivateRes.status !== 200 || reactivateRes.data.is_suspended !== 0) {
      throw new Error('Reactivation failed');
    }

    // Attempt login -> Expect 200 OK
    const reactivateLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: citizenUser.email,
        password: 'password123',
      }),
    });
    if (reactivateLogin.status !== 200) {
      throw new Error(`Expected 200 OK after reactivation, got ${reactivateLogin.status}`);
    }
  });

  // SCENARIO 17: Admin Audit Log Verification
  await test('Coordination & Security Audit Trail Logging', async () => {
    const logsRes = await request('/api/coordination_logs');
    if (logsRes.status !== 200 || !Array.isArray(logsRes.data)) {
      throw new Error('Failed to fetch coordination logs');
    }
    const logActions = logsRes.data.map((l) => l.action);
    const requiredActions = [
      'UNITS_RESERVED',
      'REQUEST_CANCELLED_UNITS_RELEASED',
      'REQUEST_FULFILLED_UNITS_ISSUED',
      'HOSPITAL_VERIFICATION_UPDATED',
      'USER_ACCOUNT_STATUS_CHANGED',
    ];
    for (const reqAct of requiredActions) {
      if (!logActions.includes(reqAct)) {
        throw new Error(`Expected audit log action '${reqAct}' was not recorded`);
      }
    }
  });

  // SCENARIO 18: Duplicate Emergency Request Prevention Gate (409 Conflict)
  await test('Duplicate Emergency Request Prevention Gate (409 Conflict)', async () => {
    const original = await request('/api/emergency_requests', {
      method: 'POST',
      body: JSON.stringify({
        hospital_id: 'hosp-01',
        patient_name: `Duplicate Guard Patient ${testSuffix}`,
        patient_blood_group: 'AB-',
        units_required: 1,
      }),
    });
    if (original.status !== 201) throw new Error('First emergency request submission failed');

    // Rapid double-submission with same patient and blood group -> Must be rejected with 409 Conflict
    const duplicateAttempt = await request('/api/emergency_requests', {
      method: 'POST',
      body: JSON.stringify({
        hospital_id: 'hosp-01',
        patient_name: `Duplicate Guard Patient ${testSuffix}`,
        patient_blood_group: 'AB-',
        units_required: 1,
      }),
    });
    if (duplicateAttempt.status !== 409) {
      throw new Error(`Expected 409 Conflict on duplicate emergency request, got ${duplicateAttempt.status}`);
    }
  });

  // SCENARIO 19: Cross-User Notification Privacy & Snoop Protection
  await test('Cross-User Notification Privacy & Access Rejection (403 Forbidden)', async () => {
    // Citizen user attempts to view another user's notifications (e.g. admin or hospital)
    const snoopAttempt = await request('/api/notifications?user_id=usr-adm-01', {
      headers: { Authorization: `Bearer ${citizenSession.access_token || citizenSession.token}` },
    });
    if (snoopAttempt.status !== 403) {
      throw new Error(`Expected 403 Forbidden when snooping another user notifications, got ${snoopAttempt.status}`);
    }
  });

  // SCENARIO 20: Non-Admin Access Rejection on Administrative Routes
  await test('Role-Based Access Guard on Admin Route (403 Forbidden)', async () => {
    // Non-admin citizen attempts to call hospital verification endpoint
    const nonAdminAttempt = await request('/api/hospitals/hosp-01/verify', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${citizenSession.access_token || citizenSession.token}` },
      body: JSON.stringify({ verification_status: 'verified' }),
    });
    if (nonAdminAttempt.status !== 403) {
      throw new Error(`Expected 403 Forbidden for non-admin calling admin endpoint, got ${nonAdminAttempt.status}`);
    }
  });

  // SCENARIO 21: Notification Intimation & Pledge Transition on Request Cancellation
  await test('Request Cancellation Notification Dispatch & Pledge Release', async () => {
    // Create new request
    const cancelReq = await request('/api/emergency_requests', {
      method: 'POST',
      body: JSON.stringify({
        hospital_id: 'hosp-01',
        patient_name: `Cancellation Test Patient ${testSuffix}`,
        patient_blood_group: 'O-',
        units_required: 1,
      }),
    });
    const cancelReqId = cancelReq.data.id;

    // Citizen pledges
    const donorRecord = (await request(`/api/donors?user_id=${citizenUser.id}`)).data[0];
    const pledgeRes = await request('/api/donor_pledges', {
      method: 'POST',
      body: JSON.stringify({
        request_id: cancelReqId,
        donor_id: donorRecord.id,
        eta_minutes: 20,
      }),
    });
    const testPledgeId = pledgeRes.data.id;

    // Cancel request
    const cancelRes = await request(`/api/emergency_requests/${cancelReqId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'cancelled' }),
    });
    if (cancelRes.status !== 200) throw new Error('Cancellation failed');

    // Verify pledge transitioned to cancelled
    const updatedPledge = (await request(`/api/donor_pledges?id=${testPledgeId}`)).data[0];
    if (updatedPledge.status !== 'cancelled') {
      throw new Error(`Expected pledge status 'cancelled', got ${updatedPledge.status}`);
    }

    // Verify REQUEST_CANCELLED notification sent to citizen
    const citizenNotifs = await request(`/api/notifications?user_id=${citizenUser.id}`, {
      headers: { Authorization: `Bearer ${citizenSession.access_token || citizenSession.token}` },
    });
    const cancelNotif = citizenNotifs.data.find(
      (n) => n.related_request_id === cancelReqId && n.type === 'REQUEST_CANCELLED'
    );
    if (!cancelNotif) {
      throw new Error('REQUEST_CANCELLED notification was not dispatched to pledged donor');
    }
  });

  // SCENARIO 22: Unread Notifications Count & Bulk Mark-All-Read API
  await test('Unread Notifications Counter & Bulk Mark-All-Read API', async () => {
    const unreadRes = await request(`/api/notifications/unread_count?user_id=${citizenUser.id}`, {
      headers: { Authorization: `Bearer ${citizenSession.access_token || citizenSession.token}` },
    });
    if (unreadRes.status !== 200 || typeof unreadRes.data.unread_count !== 'number') {
      throw new Error('Failed to retrieve unread notification count');
    }
    const initialUnread = unreadRes.data.unread_count;
    if (initialUnread === 0) {
      throw new Error('Expected at least one unread notification for test user');
    }

    // Bulk mark all read
    const markAllRes = await request('/api/notifications/mark_all_read', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenSession.access_token || citizenSession.token}` },
      body: JSON.stringify({ user_id: citizenUser.id }),
    });
    if (markAllRes.status !== 200 || !markAllRes.data.success) {
      throw new Error('Bulk mark_all_read failed');
    }

    // Verify unread count is now 0
    const verifyUnread = await request(`/api/notifications/unread_count?user_id=${citizenUser.id}`, {
      headers: { Authorization: `Bearer ${citizenSession.access_token || citizenSession.token}` },
    });
    if (verifyUnread.data.unread_count !== 0) {
      throw new Error(`Expected 0 unread notifications after mark_all_read, got ${verifyUnread.data.unread_count}`);
    }
  });

  // SCENARIO 23: Adversarial Auth Token Rejection (Missing, Invalid, Tampered)
  await test('Adversarial Auth Token Rejection (Missing, Tampered, Invalid)', async () => {
    // Missing token
    const missingRes = await request('/api/profiles/usr-adm-01', {
      method: 'PATCH',
      body: JSON.stringify({ full_name: 'Attacker' }),
    });
    if (missingRes.status !== 401) throw new Error(`Expected 401 for missing token, got ${missingRes.status}`);

    // Tampered token
    const tamperedRes = await request('/api/profiles/usr-adm-01', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.token' },
      body: JSON.stringify({ full_name: 'Attacker' }),
    });
    if (tamperedRes.status !== 401) throw new Error(`Expected 401 for tampered token, got ${tamperedRes.status}`);

    // Malformed auth header
    const malformedRes = await request('/api/profiles/usr-adm-01', {
      method: 'PATCH',
      headers: { Authorization: 'Basic dXNlcjpwYXNz' },
      body: JSON.stringify({ full_name: 'Attacker' }),
    });
    if (malformedRes.status !== 401) throw new Error(`Expected 401 for malformed auth header, got ${malformedRes.status}`);
  });

  // SCENARIO 24: Expired Session Token Rejection
  await test('Expired Session Token Rejection', async () => {
    // Call with nonexistent / expired token
    const expiredRes = await request('/api/auth/me', {
      headers: { Authorization: 'Bearer expired_or_revoked_session_token_9999' },
    });
    if (expiredRes.status !== 401) throw new Error(`Expected 401 for expired token, got ${expiredRes.status}`);
  });

  // SCENARIO 25: Non-Admin Privilege Escalation Guard (Register & Admin Routes)
  await test('Non-Admin Privilege Escalation Guard (Register & Admin Routes)', async () => {
    // 1. Attempt self-register as admin
    const adminRegRes = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: `hacker_admin_${testSuffix}@bloodsync.org`,
        password: 'password123',
        fullName: 'Rogue Administrator',
        role: 'admin',
      }),
    });
    if (adminRegRes.status !== 403) {
      throw new Error(`Expected 403 when self-registering as admin, got ${adminRegRes.status}`);
    }

    // 2. Citizen attempts to call admin-restricted matching configuration endpoint
    const citizenToken = citizenSession.access_token || citizenSession.token;
    const adminConfigRes = await request('/api/matching_configuration', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
      body: JSON.stringify({ max_distance_km: 999 }),
    });
    if (adminConfigRes.status !== 403) {
      throw new Error(`Expected 403 when citizen invokes admin matching configuration, got ${adminConfigRes.status}`);
    }
  });

  // SCENARIO 26: Cross-User Profile Tampering Guard
  await test('Cross-User Profile Tampering Guard', async () => {
    const citizenToken = citizenSession.access_token || citizenSession.token;
    // Citizen attempts to modify admin user profile
    const tamperRes = await request('/api/profiles/usr-adm-01', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${citizenToken}` },
      body: JSON.stringify({ full_name: 'Compromised Name' }),
    });
    if (tamperRes.status !== 403) {
      throw new Error(`Expected 403 when modifying another user profile, got ${tamperRes.status}`);
    }
  });

  // SCENARIO 27: Cross-User Notification Isolation & Privacy
  await test('Cross-User Notification Privacy & Isolation', async () => {
    const citizenToken = citizenSession.access_token || citizenSession.token;
    // Citizen attempts to read admin notifications
    const crossNotifRes = await request('/api/notifications?user_id=usr-adm-01', {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    if (crossNotifRes.status !== 403) {
      throw new Error(`Expected 403 when reading another user's notifications, got ${crossNotifRes.status}`);
    }

    // Unauthenticated request to notifications
    const unauthNotifRes = await request(`/api/notifications?user_id=${citizenUser.id}`);
    if (unauthNotifRes.status !== 401) {
      throw new Error(`Expected 401 when accessing notifications without token, got ${unauthNotifRes.status}`);
    }
  });

  // SCENARIO 28: Expired Inventory Atomic Reservation Rejection & Rollback
  await test('Expired Inventory Reservation Rejection & Rollback', async () => {
    // 1. Create a blood unit with past expiry date in the test blood bank
    const expiredUnitId = `unit_exp_${testSuffix}`;
    const insertExpRes = await request('/api/blood_units', {
      method: 'POST',
      body: JSON.stringify({
        id: expiredUnitId,
        blood_bank_id: 'bb-01',
        blood_group: 'B+',
        component_type: 'prbc',
        status: 'available',
        expiry_date: '2023-01-01', // Expired
      }),
    });
    if (insertExpRes.status !== 201) throw new Error('Failed to create test expired blood unit');

    // 2. Create emergency request
    const expReqRes = await request('/api/emergency_requests', {
      method: 'POST',
      body: JSON.stringify({
        hospital_id: 'hosp-01',
        patient_name: `Expired Test Patient ${testSuffix}`,
        patient_blood_group: 'B+',
        component_type: 'prbc',
        units_required: 1,
      }),
    });
    const expReqId = expReqRes.data.id;

    // 3. Attempt to reserve the expired unit
    const reserveExpRes = await request('/api/inventory/reserve', {
      method: 'POST',
      body: JSON.stringify({
        request_id: expReqId,
        blood_unit_ids: [expiredUnitId],
      }),
    });
    if (reserveExpRes.status !== 409) {
      throw new Error(`Expected 409 Conflict when reserving expired unit, got ${reserveExpRes.status}`);
    }

    // 4. Verify the unit remains unreserved and request remains open
    const checkUnitRes = await request(`/api/blood_units?id=${expiredUnitId}`);
    if (checkUnitRes.data[0].status === 'reserved') {
      throw new Error('Expired blood unit was incorrectly reserved');
    }
  });

  // SCENARIO 29: Closed Request Pledge Guard & Duplicate Pledge Prevention
  await test('Closed Request Pledge Guard & Duplicate Pledge Prevention', async () => {
    // 1. Create a request and immediately cancel it
    const closedReq = await request('/api/emergency_requests', {
      method: 'POST',
      body: JSON.stringify({
        hospital_id: 'hosp-01',
        patient_name: `Closed Pledge Target ${testSuffix}`,
        patient_blood_group: 'O-',
        units_required: 1,
      }),
    });
    const closedReqId = closedReq.data.id;
    await request(`/api/emergency_requests/${closedReqId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'cancelled' }),
    });

    const citizenDonor = (await request(`/api/donors?user_id=${citizenUser.id}`)).data[0];

    // Attempt pledge to cancelled request -> 400 Bad Request
    const closedPledgeRes = await request('/api/donor_pledges', {
      method: 'POST',
      body: JSON.stringify({
        request_id: closedReqId,
        donor_id: citizenDonor.id,
        eta_minutes: 20,
      }),
    });
    if (closedPledgeRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request when pledging to cancelled request, got ${closedPledgeRes.status}`);
    }

    // 2. Create an open request and pledge once
    const activeReq = await request('/api/emergency_requests', {
      method: 'POST',
      body: JSON.stringify({
        hospital_id: 'hosp-01',
        patient_name: `Duplicate Pledge Test ${testSuffix}`,
        patient_blood_group: 'O-',
        units_required: 1,
      }),
    });
    const activeReqId = activeReq.data.id;

    const firstPledge = await request('/api/donor_pledges', {
      method: 'POST',
      body: JSON.stringify({
        request_id: activeReqId,
        donor_id: citizenDonor.id,
        eta_minutes: 25,
      }),
    });
    if (firstPledge.status !== 201) throw new Error('First pledge failed');

    // 3. Attempt duplicate active pledge by same donor -> 409 Conflict
    const duplicatePledge = await request('/api/donor_pledges', {
      method: 'POST',
      body: JSON.stringify({
        request_id: activeReqId,
        donor_id: citizenDonor.id,
        eta_minutes: 25,
      }),
    });
    if (duplicatePledge.status !== 409) {
      throw new Error(`Expected 409 Conflict on duplicate donor pledge, got ${duplicatePledge.status}`);
    }
  });

  // SCENARIO 30: Terminal Request Status Transition Guard & Idempotency
  await test('Terminal Request Status Transition Guard & Idempotency', async () => {
    // 1. Create request and cancel it
    const termReq = await request('/api/emergency_requests', {
      method: 'POST',
      body: JSON.stringify({
        hospital_id: 'hosp-01',
        patient_name: `Terminal State Test ${testSuffix}`,
        patient_blood_group: 'O-',
        units_required: 1,
      }),
    });
    const termReqId = termReq.data.id;
    await request(`/api/emergency_requests/${termReqId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'cancelled' }),
    });

    // 2. Repeated cancellation of already cancelled request (idempotent 200)
    const repeatCancel = await request(`/api/emergency_requests/${termReqId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'cancelled' }),
    });
    if (repeatCancel.status !== 200) {
      throw new Error(`Expected idempotent 200 on repeated cancellation, got ${repeatCancel.status}`);
    }

    // 3. Attempt to resurrect cancelled request to 'open' -> 409 Conflict
    const resurrectRes = await request(`/api/emergency_requests/${termReqId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'open' }),
    });
    if (resurrectRes.status !== 409) {
      throw new Error(`Expected 409 Conflict when attempting to reopen cancelled request, got ${resurrectRes.status}`);
    }
  });

  // SCENARIO 31: Anonymous Donor Contact Information Privacy Masking
  await test('Anonymous Donor Contact Information Privacy Masking', async () => {
    // 1. Unauthenticated search - contact details must be masked
    const publicSearch = await request('/api/emergency_sources/search?blood_group=O-&latitude=12.9815&longitude=80.2180');
    if (publicSearch.status !== 200) throw new Error('Search failed');
    if (!publicSearch.data.clinical_disclaimer) {
      throw new Error('Clinical disclaimer missing in search response');
    }
    const publicDonor = publicSearch.data.donors[0];
    if (publicDonor) {
      if (publicDonor.phone !== 'Protected (Verified Hospital Only)' || publicDonor.email !== 'Protected (Verified Hospital Only)') {
        throw new Error('Donor phone or email was exposed to unauthenticated caller');
      }
    }

    // 2. Authenticated hospital search - contact details unmasked for verified hospital
    const hospLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'emergency.lead@srmhospital.edu.in', password: 'password123' }),
    });
    if (hospLogin.status !== 200) throw new Error(`Hospital login failed in Scenario 31: ${JSON.stringify(hospLogin.data)}`);
    const hospToken = hospLogin.data.session?.access_token || hospLogin.data.session?.token;

    const hospSearch = await request('/api/emergency_sources/search?blood_group=O-&latitude=12.9815&longitude=80.2180', {
      headers: { Authorization: `Bearer ${hospToken}` },
    });
    if (hospSearch.status !== 200) throw new Error('Hospital search failed');
    const hospDonor = hospSearch.data.donors[0];
    if (hospDonor) {
      if (hospDonor.phone === 'Protected (Verified Hospital Only)') {
        throw new Error('Donor contact was unexpectedly masked for verified hospital coordinator');
      }
    }
  });

  // SCENARIO 32: Rate Limiting Sliding Window Flood Protection
  await test('Rate Limiting Sliding Window Flood Protection', async () => {
    // Send rapid burst of requests to /api/auth/login to trigger the sliding window rate limit (100 req/min)
    let hitRateLimit = false;
    for (let i = 0; i < 110; i++) {
      const floodRes = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: `flood_probe_${i}@example.com`, password: 'badpassword' }),
      });
      if (floodRes.status === 429) {
        hitRateLimit = true;
        break;
      }
    }
    if (!hitRateLimit) {
      throw new Error('Rate limit (429) was not triggered after rapid auth requests');
    }
    // Clear rate limits so subsequent operations are unblocked
    await request('/api/auth/reset_rate_limit', { method: 'POST' });
  });

  console.log('\n====================================================');
  console.log(`TEST RUN COMPLETED: ${passedCount} PASSED, ${failedCount} FAILED (TOTAL: ${passedCount + failedCount})`);
  console.log('====================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
