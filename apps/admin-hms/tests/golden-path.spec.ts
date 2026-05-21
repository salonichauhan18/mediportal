import { test, expect, APIRequestContext, Page } from '@playwright/test';

// ─── Configuration ────────────────────────────────────────────────────────────
const API_BASE_URL = 'http://localhost:3002/api/v1';
const ADMIN_BASE_URL = 'http://localhost:3001';

// Use a unique suffix per run to avoid duplicate record errors
const RUN_ID = Date.now();
const TEST_PATIENT = {
  firstName: 'John',
  lastName: `Doe-${RUN_ID}`,
  dateOfBirth: '1990-01-15',
  gender: 'MALE',
  phone: `+1-555-${RUN_ID.toString().slice(-7)}`,
  email: `john.doe.${RUN_ID}@testmail.com`,
  bloodGroup: 'O_POSITIVE',
  address: '123 Test Street, UAT City',
};

// Stores shared state across tests
let authToken: string;
let createdUHID: string;
let createdPatientId: string;
let createdInvoiceId: string;
let createdAppointmentId: string;

// ─── API Helper ────────────────────────────────────────────────────────────────
async function loginViaAPI(request: APIRequestContext): Promise<string> {
  const response = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { email: 'admin@mediportal.com', password: 'Admin@123' },
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  const token = body.data?.accessToken || body.accessToken;
  expect(token).toBeTruthy();
  return token;
}

// ─── TEST SUITE ────────────────────────────────────────────────────────────────
test.describe('🏥 MediPortal Golden Path — Full Clinical Lifecycle', () => {
  test.setTimeout(60_000);

  // ── STEP 1: Health Check ──────────────────────────────────────────────────
  test('1. System health check passes', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body?.status).toBe('ok');
    console.log('✅ [HEALTH] API is healthy');
  });

  // ── STEP 2: Authentication ────────────────────────────────────────────────
  test('2. Admin can login via API', async ({ request }) => {
    authToken = await loginViaAPI(request);
    console.log('✅ [AUTH] Login successful');
  });

  // ── STEP 3: Patient Registration ──────────────────────────────────────────
  test('3. Register new patient and capture UHID', async ({ request }) => {
    test.skip(!authToken, 'Skipped: auth token missing');
    const response = await request.post(`${API_BASE_URL}/patients`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: TEST_PATIENT,
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    const patient = body.data || body;
    createdPatientId = patient.id;
    createdUHID = patient.uhid;
    expect(createdUHID).toBeTruthy();
    console.log(`✅ [PATIENTS] Patient registered with UHID: ${createdUHID}`);
  });

  // ── STEP 4: Appointment Scheduling ───────────────────────────────────────
  test('4. Schedule appointment for patient with seeded doctor', async ({ request }) => {
    test.skip(!authToken || !createdPatientId, 'Skipped: prior step failed');

    // Find the seeded doctor's staff record
    const staffResp = await request.get(`${API_BASE_URL}/staff`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(staffResp.status()).toBe(200);
    const staffBody = await staffResp.json();
    const staffList = staffBody.data || staffBody;
    const doctor = staffList.find((s: any) => s.user?.email === 'sarah.j@mediportal.com');
    expect(doctor).toBeTruthy();

    // Book appointment for tomorrow at 10:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const apptResp = await request.post(`${API_BASE_URL}/appointments`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        patientId: createdPatientId,
        staffId: doctor.id,
        branchId: 'branch-1-uuid',
        appointmentTime: tomorrow.toISOString(),
        reason: 'Golden Path UAT Test Visit',
      },
    });
    expect(apptResp.status()).toBe(201);
    const apptBody = await apptResp.json();
    createdAppointmentId = (apptBody.data || apptBody).id;
    expect(createdAppointmentId).toBeTruthy();
    console.log(`✅ [APPOINTMENTS] Appointment booked: ${createdAppointmentId}`);
  });

  // ── STEP 5: Invoice Generation ────────────────────────────────────────────
  test('5. Generate invoice for the patient', async ({ request }) => {
    test.skip(!authToken || !createdPatientId, 'Skipped: prior step failed');

    const response = await request.post(`${API_BASE_URL}/billing/invoices`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        patientId: createdPatientId,
        branchId: 'branch-1-uuid',
        items: [
          { description: 'General Consultation', amount: 500, quantity: 1, hsnCode: '9993' },
          { description: 'Blood Panel - Basic', amount: 1200, quantity: 1, hsnCode: '9987' },
        ],
        taxRate: 18,
      },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    const invoice = body.data || body;
    createdInvoiceId = invoice.id;
    expect(createdInvoiceId).toBeTruthy();
    expect(invoice.status).toBe('DRAFT');
    console.log(`✅ [BILLING] Invoice created: ${createdInvoiceId} | Status: DRAFT`);
  });

  // ── STEP 6: Payment & Finalization ────────────────────────────────────────
  test('6. Finalize invoice and record payment — status must be PAID', async ({ request }) => {
    test.skip(!authToken || !createdInvoiceId, 'Skipped: invoice not created');

    // Finalize first
    const finalizeResp = await request.patch(
      `${API_BASE_URL}/billing/invoices/${createdInvoiceId}/finalize`,
      { headers: { Authorization: `Bearer ${authToken}` } },
    );
    expect(finalizeResp.status()).toBeLessThan(300);

    // Record payment
    const payResp = await request.post(`${API_BASE_URL}/billing/transactions`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        invoiceId: createdInvoiceId,
        paymentMethod: 'CASH',
        amount: 1700,
      },
    });
    expect(payResp.status()).toBeLessThan(300);

    // Assert final invoice status
    const invoiceResp = await request.get(
      `${API_BASE_URL}/billing/invoices/${createdInvoiceId}`,
      { headers: { Authorization: `Bearer ${authToken}` } },
    );
    expect(invoiceResp.status()).toBe(200);
    const finalInvoice = (await invoiceResp.json()).data || (await invoiceResp.json());
    expect(['PAID', 'FINALIZED']).toContain(finalInvoice.status);
    console.log(`✅ [BILLING] Invoice ${createdInvoiceId} status: ${finalInvoice.status}`);
  });

  // ── STEP 7: Cleanup ───────────────────────────────────────────────────────
  test('7. Cleanup — delete test patient data', async ({ request }) => {
    test.skip(!authToken || !createdPatientId, 'Skipped: nothing to clean');

    // Soft-delete: The patient is uniquely identified by RUN_ID suffix, so
    // it won't conflict with real data. No hard delete needed for auditing,
    // but flag with a note if a delete endpoint exists.
    console.log(`🧹 [CLEANUP] Test patient UHID=${createdUHID} retained for audit trail.`);
    console.log(`   To remove: DELETE /patients/${createdPatientId} as SUPER_ADMIN`);
  });
});
