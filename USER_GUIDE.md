# 🏥 MediPortal Enterprise — User Guide

> A brief guide for clinical and administrative staff on how to use each module of the MediPortal HMS Dashboard.

---

## Getting Started: Login

Navigate to the dashboard URL provided by your administrator. Enter your credentials and click **Sign In**.

> Your **role** determines which modules you can see. A Receptionist sees Scheduling and Registration. A Doctor sees Patient Charts and Lab Portal. A Super Admin sees everything.

---

## Module Guide

### 1. 📊 Executive Command Center (Dashboard)
**Who:** Super Admins, Administrators

The home screen after login. Provides a real-time "Global Health Pulse" with **4 Intelligence Pillars**:
- **Clinical**: AI Triage distribution — how many Red/Yellow/Green cases are active.
- **Operational**: 7-day bed occupancy vs. AI forecast chart.
- **Genomic**: Total Pharmacogenomic Shields protecting patients.
- **Financial**: RPA auto-claim settlement rate and operational savings.

Also shows a live **Global System Activity** feed of the most recent financial transactions.

---

### 2. 📅 Scheduling
**Who:** Receptionists, Doctors, Admins

- **View** the calendar in Day, Week, or Month view.
- **Book** a new appointment by clicking any time slot and selecting a patient and doctor.
- **Check** a doctor's live availability before booking.
- **Update or cancel** existing appointments by clicking them on the calendar.

---

### 3. 🧑‍⚕️ Patient Registration
**Who:** Receptionists, Admins

- **Register** a new patient by filling in their demographic details (name, DOB, gender, contact, blood group).
- Each patient receives a unique **UHID** (Universal Health ID).
- **Search** for existing patients by name or UHID.
- **Edit** patient profiles by selecting them from the list.

---

### 4. 🩺 Patient Chart (EHR)
**Who:** Doctors, Nurses

The core Electronic Health Record for each patient. Contains five tabs:

| Tab | What You Can Do |
|---|---|
| **Vitals** | Record BP, pulse, SpO2, temperature, weight/height |
| **Clinical Notes** | Write SOAP notes; AI can auto-generate a "Clinical Brief" summary |
| **Prescriptions** | Issue medications; AI "Genetic Safety Shield" runs if patient has genomic data |
| **Lab Orders** | Request lab tests; attach and view results with AI interpretation |
| **AI Insights** | ICD-10/CPT code suggestions, trend analysis, complex report parsing |

> **AI Safety Note**: All AI suggestions display a "Review Required by Medical Professional" disclaimer. Never prescribe based solely on AI output.

---

### 5. 🔬 Lab Portal
**Who:** Lab Technicians, Doctors

- **View** incoming test orders from doctors.
- **Upload** results (PDF, image) against a test order.
- **Results** automatically appear in the patient's chart and notify the ordering doctor.
- **AI Interpretation** button translates complex results into plain language.

---

### 6. 💊 Pharmacy Portal
**Who:** Pharmacists

- **View** prescription orders issued by doctors.
- **Manage Inventory**: Add new drug batches, set expiry dates, get low-stock alerts.
- **Dispense** medicines by marking a prescription as fulfilled.
- **Inventory Audits**: Track stock-in and stock-out transactions.

---

### 7. 💰 Billing Portal
**Who:** Billing Administrators, Receptionists

- **Generate Invoice**: Create itemized invoices for consultations, procedures, labs, and pharmacy.
- **Apply Discounts** and calculate GST/tax automatically.
- **Record Payments**: Accept Cash, Card, UPI, or Insurance.
- **Print/Download** PDF receipts and invoices.
- **View Transaction History** for a patient.

---

### 8. 🤖 Insurance RPA (Claims Dashboard)
**Who:** Billing Administrators, Finance Managers

MediPortal's automated insurance claims pipeline:

- **Pipeline KPIs**: See how many claims are in each stage — Draft → AI Auditing → Submitted → Settled.
- **Manual Audit Queue**: Claims that the AI flagged for discrepancies appear here with the specific "AI Rejection Rationale" (e.g., *"Invoice bills for MRI but no MRI is documented in clinical notes"*).
- **Override Actions**:
  - **Force Submit** — Override the AI rejection and submit manually.
  - **Mark as Paid** — Directly settle a claim.
- **Auto-Processing**: Every minute, the RPA engine automatically audits draft claims, scores them, and submits low-risk ones without any manual intervention.

---

### 9. 🛏️ Bed Management
**Who:** Nurses, Admins

- **Live Heatmap**: View all wards and beds — colour-coded as Available, Occupied, or Under Maintenance.
- **Assign Bed**: Select a patient and assign them to a specific bed and ward.
- **Discharge**: Free up a bed by discharging a patient.
- **AI Forecast**: View predicted patient inflow for the next 7 days to plan capacity.
- **Alerts**: Automatic notification to Admin when occupancy exceeds the 85% threshold.

---

### 10. 🧬 Genomics (Precision Medicine)
**Who:** Doctors (with patient consent only)

- **Add Genetic Profile**: Record key genetic markers for a patient (CYP2D6, CYP2C19, etc.).
- **Patient Consent Gate**: Genetic data cannot be added or viewed without explicit patient consent on record.
- **Pharmacogenomic Safety**: When prescribing a high-risk drug to a patient with a genetic profile, the AI "Genetic Safety Shield" automatically evaluates potential adverse drug reactions and displays a risk level (Safe / Caution / Danger).

---

### 11. 🌐 Interoperability (FHIR)
**Who:** Administrators, IT Staff

- **Export** a patient's clinical record as a standard **FHIR R4 Bundle** (JSON).
- **Import** patient data from an external FHIR-compatible system.
- Enables data sharing with partner hospitals, insurance companies, and national health registries.

---

### 12. 📹 Telemedicine / Consultation
**Who:** Doctors, Patients

- **Start** a secure video consultation from a scheduled appointment.
- **Live chat** during the consultation session.
- Consultation notes can be added to the patient's EHR directly after the session.

---

### 13. 🔔 Notifications
**Who:** All Staff

The bell icon (top-right) shows real-time system alerts:
- Critical lab results for your patients.
- New appointment bookings.
- Bed occupancy threshold breaches.
- Claim settlement updates.

---

### 14. ⚙️ System Admin Panel
**Who:** Super Admins Only

- **User Management**: Create, deactivate, and manage roles for all staff.
- **Branch Management**: Configure branch names, timezones, tax rates, and currencies.
- **Audit Logs**: View every action taken in the system with timestamps.
- **AI Logs**: Review every Gemini AI call — anonymized prompt, response, and confidence score.

---

## Role Quick Reference

| Role | Primary Modules |
|---|---|
| **SUPER_ADMIN** | All modules + System Admin |
| **ADMIN** | Dashboard, Scheduling, Billing, Beds, Claims, Users |
| **DOCTOR** | Patient Chart, Lab Orders, Prescriptions, Genomics, Telemedicine |
| **NURSE** | Vitals, Patient Chart (read), Bed Management |
| **RECEPTIONIST** | Scheduling, Patient Registration, Billing |
| **LAB_TECHNICIAN** | Lab Portal |
| **PHARMACIST** | Pharmacy Portal |
| **BILLING_ADMIN** | Billing Portal, Insurance RPA |

---

*For technical support, contact your system administrator or refer to the [Developer Guide](./DEVELOPER_GUIDE.md).*
