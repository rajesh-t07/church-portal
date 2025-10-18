# Church Portal

A production-grade full-stack application for managing church expenses and offerings.

## Features
- **Authentication:** Secure login/register with JWT and bcrypt
- **Expense Management:** Submit expenses with file upload (PDF/JPEG bills to Azure Blob Storage)
- **Email Notifications:** Automated emails to members, church, and treasurer
- **Reimbursement Tracking:** Upload receipts and mark as reimbursed
- **Weekly Offerings:** Enter checks, cash, and deposit slips
- **Reporting:** Monthly/yearly reports and tax forms
- **Admin/Treasurer Dashboard:** Role-based access
- **Security:** Helmet, rate limiting, input validation, logging
- **Scalability:** Compression, CORS, error handling

## Tech Stack
- **Backend:** Node.js, Express, Sequelize (Azure SQL), Azure Blob Storage, Nodemailer, JWT, bcrypt
- **Frontend:** React, Axios, React Router
- **Testing:** Jest, Supertest
- **Deployment:** Azure App Service, Azure Static Web Apps

## Setup

### Prerequisites
- Node.js
- Azure account (SQL Database, Blob Storage)

### Backend Setup
1. `cd backend && npm install`
2. Create Azure SQL DB and Blob Storage
3. Update `.env` with connection strings and JWT_SECRET
4. `npm start`

### Frontend Setup
1. `cd frontend && npm install`
2. `npm start`

## Testing
- **Unit Tests:** `npm test` (backend)
- **Manual Testing:** Register/login, submit expenses, enter offerings, view reports

## Deployment
- **Backend:** Azure App Service
- **Frontend:** Azure Static Web Apps
- Set environment variables in Azure

## Security
- Passwords hashed with bcrypt
- JWT for authentication
- Rate limiting and input validation
- HTTPS enforced in production

## Usage
- Register as member or assign admin role in DB
- Members: Submit expenses
- Admins: Enter offerings, process reimbursements, generate reports

## License
MIT