# AssetPilot — Enterprise Asset Management System

A modern internal **Company Asset Management System** built to manage company hardware, software licenses, employee custody, returns, repairs, and audit records.

AssetPilot provides a centralized portal for tracking assets throughout their complete lifecycle — from purchase and assignment to return, repair, and retirement.

## 🌟 Key Features

### Asset Inventory

* Create, update, view, and manage company assets.
* Supports laptops, monitors, mobile devices, printers, peripherals, and software licenses.
* Search by asset tag, serial number, model, employee, department, category, and status.
* Filter assets by category and status.
* Asset 360° detail view with:

  * Technical specifications
  * Current custody
  * Custody history
  * Service and repair history
  * License information
  * Audit history

### Deterministic Asset State Machine

The backend validates allowed asset state transitions.

```text
AVAILABLE → ASSIGNED
AVAILABLE → IN_REPAIR
AVAILABLE → RETIRED

ASSIGNED → RETURN_REQUESTED
ASSIGNED → IN_REPAIR

RETURN_REQUESTED → AVAILABLE
RETURN_REQUESTED → IN_REPAIR
RETURN_REQUESTED → RETIRED

IN_REPAIR → AVAILABLE
IN_REPAIR → RETIRED

RETIRED → Terminal State
```

Illegal state transitions are rejected by the backend.

### Custody Tracking

* Track asset check-out and check-in timestamps.
* Record asset condition at issuance and return.
* Maintain notes and historical custody records.
* Preserve historical custody information for audit purposes.
* Track the employee currently responsible for an assigned asset.

### Return Management

* Employees can submit asset return requests.
* Employees can view their own return requests.
* Administrators can inspect returned assets.
* Employees cannot process their own asset check-in.
* Return requests contain:
   * Asset information
   * Employee information
   * Return reason
   * Condition notes
   * Request status
   * Request timestamp

* Returned assets can be moved to:

  * `AVAILABLE`
  * `IN_REPAIR`
  * `RETIRED`
* RETURN WORFLOW
    Employee
      ↓
    Request Return
      ↓
    RETURN_REQUESTED
      ↓
    Admin / Authorized Staff Review
      ↓
    Process Check-in
      ↓
  AVAILABLE / IN_REPAIR / RETIRED
### Hardware Repairs

* Create repair records.
*  Track vendor information.
* Record repair issues.
* Record repair costs.
* Store resolution notes.
* Store repair creation and resolution timestamps.
* Restore assets to the appropriate state after repair.
* Employees can view their repair information.
* Authorized IT and management users can resolve repair records.

### Software License Management

* Register and manage software licenses.
*  Track software license keys.
* Track license types.
* Track seat quotas.
* Monitor allocated versus available seats.
* Prevent license over-allocation.
* Prevent duplicate active assignments.
* Track license expiration dates.
* Track license allocations.
* Revoke allocated seats when required.
* Employees can view their allocated software licenses.
* License management operations are restricted to authorized users.

### Digital Handover Documents

 * Handover documents are associated with:

  *  Employee
  *   Asset
  *  Custody record
  *    Document type
  *   Document status
  *   Employee signature
  *   Administrator signature
  *   Signature timestamps
  *   Generated PDF document

  Handover Workflow
    PENDING_EMPLOYEE_SIGNATURE
              ↓
      Employee Signs
              ↓
        Admin Signs
              ↓
          COMPLETED
### Employee Management

* Employee CRUD operations.
*  Employee ID management.
* Department information.
* Employee contact information.
* View assigned hardware.
* View allocated software licenses.
* View employee custody information.
* Role-based employee access.
* Employees can update their own permitted information.
* Administrative employee operations are restricted to authorized  users.

### Audit Trail

* The system can track events related to:

  * Asset creation.
  * Asset updates.
  * Asset assignments.
  * Asset returns.
  * Asset state changes.
  * Asset deletion.
  * Other important system operations.

### Dashboard & Notifications

* Asset and employee overview.
* Pending return notifications.
* Assets currently under repair.
* Expiring software license alerts.
* Light, dark, and system theme modes.
* User profile and JWT-based logout.

### Authentication

* JWT-based authentication.
* Password hashing using bcrypt.
* Protected backend API routes.
* Authentication validation.
* Persistent authentication state.
* Login error handling.
* Secure logout functionality.
* Role and permission information associated with authenticated users --

## 🛠 Technology Stack

### Frontend

* Next.js
* React
* Tailwind CSS
* shadcn/ui
* Lucide React
* Axios
* Sonner

### Backend

* Node.js
* Express.js
* REST APIs
* JWT authentication
* bcryptjs

### Database

* PostgreSQL
* Prisma ORM

### Development Tools

* Git
* GitHub
* npm

---

## 📁 Project Structure

AssetPilot/

│
├── backend/
│   │
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── utility scripts
│   │
│   └── src/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       ├── lib/
│       └── server.js
│
├── frontend/
│   │
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── assets/
│   │   │   ├── employees/
│   │   │   ├── licenses/
│   │   │   ├── returns/
│   │   │   ├── repairs/
│   │   │   └── ...
│   │   │
│   │   └── login/
│   │
│   ├── components/
│   ├── context/
│   │   └── AuthContext.js
│   ├── lib/
│   │   └── utils.js
│   └── services/
│       └── api.js
│
├── .gitignore
├── package.json
└── README.md
### APPLICATION ARCHITECTURE
┌──────────────────────────────┐
│          Frontend            │
│      Next.js / React         │
│                              │
│  Dashboard                   │
│  Assets                      │
│  Employees                   │
│  Licenses                    │
│  Returns                     │
│  Repairs                     │
│  Documents                   │
└──────────────┬───────────────┘
               │
               │ REST API
               ▼
┌──────────────────────────────┐
│           Backend            │
│      Node.js / Express       │
│                              │
│ Authentication               │
│ Authorization / RBAC         │
│ Controllers                  │
│ Business Logic               │
│ Asset Lifecycle              │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│         Prisma ORM           │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│         PostgreSQL           │
└──────────────────────────────┘
## 🚀 Getting Started

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* PostgreSQL
* Git

### 1. Clone the repository

git clone <your-repository-url>
cd AssetPilot


### 2. Install backend dependencies


cd backend
npm install

### 3. Configure backend environment variables

Create a `.env` file inside the `backend` directory.

Example:


PORT=5001
POSTGRES_URL="your-postgresql-connection-string"
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3000"


**Never commit the `.env` file to GitHub.**

### 4. Set up the database

From the `backend` directory:


npx prisma db push


If the project uses seed data:


npx prisma db seed


### 5. Start the backend


npm run dev


The backend API runs on:

http://localhost:5001


### 6. Install frontend dependencies

Open another terminal:

cd frontend
npm install


### 7. Start the frontend


npm run dev


The frontend runs on:


http://localhost:3000


Open the application in your browser:


http://localhost:3000




## 🔐 Demo Account

For local development, the database seed creates a demo administrator account.

The credentials are intentionally **not published in this README**.

Use the credentials configured by the project's seed/setup process.

> For production deployments, use strong unique credentials and secrets.


## 🔒 Security Notes

* Environment variables are stored in `.env` and excluded through `.gitignore`.
* JWT secrets should be unique and securely generated.
* Database credentials should never be committed to the repository.
* Passwords are hashed using bcrypt.
*  Protected API routes require authentication.
*   Backend authorization validates user permissions.
*   Frontend controls do not replace backend authorization.
*   Employees are restricted to permitted employee-level operations.
*   Employees cannot process their own asset check-in.
*   License-management actions are restricted to authorized roles.
*   Repair-resolution actions are restricted to authorized roles.
*   Digital handover documents are protected using document permissions.
*   Development credentials should be changed before production deployment.


## 📌 Project Status

AssetPilot is an academic/internship project demonstrating:

* Full-stack web development
* REST API design
* Authentication and authorization
* Database modeling
* Asset lifecycle management
* State-machine validation
* Audit logging
* License management
* Modern responsive UI development

---

## 👩‍💻 Development

The project is structured as two applications:

                 ┌───────────────────┐
                 │       User        │
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │      Vercel       │
                 │     Frontend      │
                 └─────────┬─────────┘
                           │
                         HTTPS
                           │
                           ▼
                 ┌───────────────────┐
                 │      Render       │
                 │      Backend      │
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │    PostgreSQL     │
                 │     Database      │
                 └───────────────────┘

## 📄 License

This project is developed for educational and internship purposes.
