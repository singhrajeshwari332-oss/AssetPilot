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

### Return Management

* Employees can submit asset return requests.
* Administrators can inspect returned assets.
* Returned assets can be moved to:

  * `AVAILABLE`
  * `IN_REPAIR`
  * `RETIRED`

### Hardware Repairs

* Create repair records.
* Track vendor information and repair issues.
* Record repair costs.
* Store resolution notes and timestamps.
* Restore the asset to an appropriate state after repair.

### Software License Management

* Track software licenses and seat quotas.
* Monitor allocated versus available seats.
* Prevent license over-allocation.
* Prevent duplicate active assignments.
* Track license expiration dates.
* Revoke allocated seats when required.

### Employee Management

* Employee CRUD operations.
* Department information.
* View assigned hardware.
* View allocated software licenses.

### Audit Trail

* Record important system events.
* Track asset creation, updates, assignments, returns, state changes, and deletions.
* Maintain chronological audit records.

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
* Login validation and error handling.

---

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

```text
AssetPilot/
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   │
│   └── src/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       └── server.js
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── context/
│   ├── lib/
│   └── services/
│
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* PostgreSQL
* Git

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd AssetPilot
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure backend environment variables

Create a `.env` file inside the `backend` directory.

Example:

```env
PORT=5001
POSTGRES_URL="your-postgresql-connection-string"
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3000"
```

**Never commit the `.env` file to GitHub.**

### 4. Set up the database

From the `backend` directory:

```bash
npx prisma db push
```

If the project uses seed data:

```bash
npx prisma db seed
```

### 5. Start the backend

```bash
npm run dev
```

The backend API runs on:

```text
http://localhost:5001
```

### 6. Install frontend dependencies

Open another terminal:

```bash
cd frontend
npm install
```

### 7. Start the frontend

```bash
npm run dev
```

The frontend runs on:

```text
http://localhost:3000
```

Open the application in your browser:

```text
http://localhost:3000
```

---

## 🔐 Demo Account

For local development, the database seed creates a demo administrator account.

The credentials are intentionally **not published in this README**.

Use the credentials configured by the project's seed/setup process.

> For production deployments, use strong unique credentials and secrets.

---

## 🔒 Security Notes

* Environment variables are stored in `.env` and excluded through `.gitignore`.
* JWT secrets should be unique and securely generated.
* Database credentials should never be committed to the repository.
* Change development credentials before deploying the application to a production environment.

---

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

```text
Frontend → Next.js
              ↓
           REST API
              ↓
Backend → Node.js / Express
              ↓
          Prisma ORM
              ↓
         PostgreSQL
```

---

## 📄 License

This project is developed for educational and internship purposes.
