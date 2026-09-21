# Enterprise Company Asset Management System (Track 02)

A modern, enterprise-grade internal Asset Management portal built with **Next.js**, **React**, **shadcn/ui**, **Tailwind CSS**, **Lucide React**, **Node.js/Express**, **Prisma ORM**, and **SQLite**.

---

## 🌟 Key Features

- **High-Density Asset Inventory**:
  - Asset CRUD (Laptops, Monitors, Mobile Devices, Peripherals, Software Licenses).
  - Search across tags, serials, employees, models, brands, and departments.
  - Multi-filtering by Category and Status.
  - Interactive **Asset 360° Detail Sheet Drawer** with tabs for technical specs, current custody, complete custody timeline, servicing history, software license metrics, and audit history.
- **Deterministic State Machine**:
  - `AVAILABLE` &rarr; `ASSIGNED`, `IN_REPAIR`, `RETIRED`
  - `ASSIGNED` &rarr; `RETURN_REQUESTED`, `IN_REPAIR`
  - `RETURN_REQUESTED` &rarr; `AVAILABLE`, `IN_REPAIR`, `RETIRED`
  - `IN_REPAIR` &rarr; `AVAILABLE`, `RETIRED`
  - `RETIRED` &rarr; Terminal State (Decommissioned)
  - Full backend validation preventing illegal transitions.
- **Custody Tracking & Historical Preservation**:
  - Check-in/check-out timestamps, condition at issuance and return, notes.
  - Historical records are immutable and preserved permanently.
- **Return Request & Check-in Processing**:
  - Submit returns &rarr; Inspect condition on return &rarr; Check in back to `AVAILABLE`, `IN_REPAIR`, or `RETIRED`.
- **Hardware Service & Repairs**:
  - Create repair tickets with vendors and cost estimates.
  - Resolve repairs with resolution notes, final expenses, and status recovery.
- **Software License Seat Quota Management**:
  - Visual seat meters (`X / Y seats allocated`), cost per seat, expiration warning badge.
  - Over-allocation prevention and duplicate active assignment prevention.
  - Instant seat revoke mechanism with confirmation dialogs.
- **Personnel Directory**:
  - Employee CRUD, departmental allocations, and active hardware/license tracking.
- **Compliance Audit Trail**:
  - Full immutable chronological event log tracking every creation, update, state transition, and deletion.
- **Real-Time Header Controls**:
  - Top-right controls strictly ordered: **`[ Theme ] [ Notification ] [ User Menu ]`**.
  - **Theme Switcher**: Immediate switching between Light ☀, Dark 🌙, and System 🖥.
  - **Notification Popover**: Live alerts for pending returns, in-repair assets, and expiring licenses.
  - **User Profile & JWT Logout**.
- **Enterprise Login Experience**:
  - Inline error validation with exact corporate feedback.
  - `[ Loader ] Signing in...` state, disabled button, zero page reload glitches.

---

## 🚀 Quick Start

### 1. Default Login Credentials
- **Email**: `admin@company.com`
- **Password**: `password123`

### 2. Starting the Application

#### Start the Backend API (Port 5001):
```bash
cd backend
npm run dev
```

#### Start the Next.js Frontend (Port 3000):
```bash
cd frontend
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

---

## 🏗 Technology Stack

- **Frontend**: Next.js (App Router), React, Tailwind CSS, shadcn/ui components, Lucide React, Axios, Sonner toast.
- **Backend**: Node.js, Express.js REST APIs, JWT authentication, bcryptjs password hashing.
- **Database**: SQLite with Prisma ORM.
- **Styling**: Pure Tailwind CSS utility classes and shadcn/ui components (zero custom CSS files).
