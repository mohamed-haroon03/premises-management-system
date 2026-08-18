# 🏢 Premises Management System

A full-stack web-based **Premises Management System** designed to simplify and automate property management operations. The system helps property owners manage properties, units, tenants, rental contracts, lease contracts, payments, property taxes, and notifications from a centralized dashboard.

## 🚀 Features

### 👤 Authentication & Authorization
- Secure user authentication
- Role-based access control
- Owner/Landlord and Tenant dashboards
- Protected API routes

### 🏠 Property Management
- Add, edit, view, and manage properties
- Manage individual property units
- Track property status and details
- Property and unit relationship management

### 👥 Tenant Management
- Add and manage tenant information
- Assign tenants to rental units
- View tenant-related contracts and payments
- Tenant dashboard

### 📄 Rental & Lease Management
- Create and manage rental contracts
- Create and manage lease contracts
- Track contract status
- Manage rental and lease periods
- Automated contract-related notifications

### 💳 Payment Management
- Track rental payments
- Manage payment records
- Monitor payment status
- Support for different payment methods
- Tenant payment history

### 🧾 Property Tax Management
- Manage property tax information
- Calculate and track property taxes
- Record tax payments
- Automated tax-related processing

### 🔔 Notification System
- Rent payment reminders
- Lease-related notifications
- Property tax notifications
- Tenant notification dashboard
- Notification management

### 📊 Dashboard
- Property overview
- Tenant statistics
- Rental and lease information
- Payment summaries
- Property tax information
- Notifications and alerts

---

## 🛠️ Technology Stack

### Frontend
- React.js
- Vite
- JavaScript
- CSS
- React Router
- Axios
- Zustand

### Backend
- Node.js
- Express.js
- RESTful APIs
- Mongoose

### Database
- MongoDB
- MongoDB Atlas

### Development Tools
- Visual Studio Code
- Git
- GitHub
- npm

---

## 📁 Project Structure

```text
property_Management/
│
├── backend/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── notificationController.js
│   │   └── propertyTaxController.js
│   │
│   ├── models/
│   │   ├── LeaseContract.js
│   │   ├── Notification.js
│   │   ├── Payment.js
│   │   ├── Property.js
│   │   ├── PropertyTax.js
│   │   ├── RentContract.js
│   │   ├── Tenant.js
│   │   ├── Unit.js
│   │   └── User.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── leaseRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── propertyRoutes.js
│   │   ├── propertyTaxRoutes.js
│   │   ├── rentRoutes.js
│   │   ├── tenantRoutes.js
│   │   └── unitRoutes.js
│   │
│   ├── services/
│   │   ├── NotificationService.js
│   │   ├── TaxCalculationService.js
│   │   ├── leaseCron.js
│   │   ├── rentCron.js
│   │   └── taxCron.js
│   │
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
├── package.json
└── README.md