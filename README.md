# Church Portal 🙏

A production-grade full-stack application for managing church finances, donations, expenses, and offerings.

## 🌟 Live Application

- **🖥️ Frontend**: https://frontend.blacksea-4befa204.eastus2.azurecontainerapps.io/
- **🔧 API Backend**: https://backend.blacksea-4befa204.eastus2.azurecontainerapps.io/
- **☁️ Azure Portal**: [View Resources](https://portal.azure.com/#@/resource/subscriptions/fbd8d5e7-282c-4255-9d2f-18f8bcf7a816/resourceGroups/rg-church-prod/overview)

## ✨ Features

### 🔐 Authentication & Security
- Secure JWT-based authentication with bcrypt password hashing
- Role-based access control (Members, Admins, Treasurers)
- Rate limiting and input validation
- HTTPS enforced in production

### 💰 Financial Management
- **Donation Entry**: Track individual and family donations with receipt generation
- **Expense Tracking**: Submit expenses with file upload support
- **Offering Management**: Weekly offering entry with cash and check tracking
- **Reimbursement System**: Upload receipts and track reimbursement status

### 📊 Reporting & Analytics
- Monthly and yearly financial reports
- Individual donor statements and tax forms
- Weekly offering summaries
- Expense category analysis

### 📧 Communication
- Automated email notifications to members and treasurers
- Receipt generation and distribution
- Status updates and confirmations

### 📁 File Management
- Azure Blob Storage integration for secure file uploads
- Support for PDF, JPEG, PNG receipts and documents
- Organized storage containers (receipts, documents, reports)

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js 20 with Express.js
- **Database**: SQLite (embedded, cost-effective for initial deployment)
- **Storage**: Azure Blob Storage for file uploads
- **Security**: JWT, bcrypt, Helmet, express-rate-limit
- **Email**: Nodemailer for notifications
- **Testing**: Jest, Supertest

### Frontend
- **Framework**: React 18 with Material-UI
- **Routing**: React Router
- **HTTP Client**: Axios
- **Build**: Create React App with production optimizations

### Infrastructure
- **Hosting**: Azure Container Apps (Serverless)
- **Container Registry**: Azure Container Registry
- **Secrets**: Azure Key Vault
- **Monitoring**: Application Insights
- **DNS**: Custom domain ready

## 🚀 Local Development

### Prerequisites
- Node.js 20+
- Docker (optional, for containerized development)
- Azure account (for cloud features)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/sangeethdba/church-portal.git
   cd church-portal
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create .env file
   cp .env.example .env
   # Edit .env with your configuration
   
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database (local development uses SQLite by default)
# DATABASE_URL=your_database_connection_string

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# Azure Storage (for file uploads)
AZURE_STORAGE_ACCOUNT_NAME=your-storage-account
AZURE_STORAGE_CONTAINER_RECEIPTS=receipts
AZURE_STORAGE_CONTAINER_DOCUMENTS=documents
AZURE_STORAGE_CONTAINER_REPORTS=reports

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Application Settings
NODE_ENV=development
PORT=5000
```

## 🐳 Docker Development

Build and run with Docker:

```bash
# Backend
cd backend
docker build -t church-portal-backend .
docker run -p 5000:80 church-portal-backend

# Frontend
cd frontend
docker build -t church-portal-frontend .
docker run -p 3000:80 church-portal-frontend
```

## ☁️ Azure Deployment

### Prerequisites
- Azure CLI installed and configured
- Azure Developer CLI (azd) installed

### Deployment Steps

1. **Initialize Azure Developer CLI**
   ```bash
   azd auth login
   azd env new church-prod
   ```

2. **Set environment variables**
   ```bash
   azd env set AZURE_LOCATION eastus2
   azd env set AZURE_SUBSCRIPTION_ID your-subscription-id
   ```

3. **Deploy infrastructure and application**
   ```bash
   azd provision  # Create Azure resources
   azd deploy     # Deploy applications
   ```

### Infrastructure Created
- **Resource Group**: `rg-church-prod`
- **Container Apps**: Serverless hosting for frontend and backend
- **Container Registry**: Private registry for Docker images
- **Storage Account**: Blob storage for file uploads
- **Key Vault**: Secure storage for secrets
- **Application Insights**: Monitoring and logging

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Donation entry and receipt generation
- [ ] Expense submission with file upload
- [ ] Offering entry and weekly reports
- [ ] Admin dashboard functionality
- [ ] Email notifications
- [ ] File upload to Azure Blob Storage

## 📈 Production Considerations

### Database Migration
For production scale, consider migrating from SQLite to:
- **Azure SQL Database**: For full SQL Server features
- **PostgreSQL**: For open-source compatibility
- **MySQL**: For cost-effective relational database

Update `backend/src/utils/database.js` to switch database providers.

### Scaling
- Container Apps automatically scale from 0-10 replicas based on demand
- Storage scales automatically with usage
- Consider Azure CDN for static assets at scale

### Security
- All secrets stored in Azure Key Vault
- HTTPS enforced across all endpoints
- Managed Identity authentication between services
- Regular security updates via automated deployments

## 💰 Cost Optimization

Current setup optimized for minimal costs:

- **Container Apps**: $0-15/month (serverless, pay-per-use)
- **Storage**: $1-3/month (first 5GB free)
- **Key Vault**: $3/month (first 10,000 operations free)
- **Application Insights**: $0-5/month (first 5GB free)

**Total Estimated Cost**: $4-26/month

## 📋 Usage Guide

### For Members
1. Register account or login
2. Submit expenses with receipt uploads
3. View personal donation history
4. Download tax forms at year-end

### For Admins/Treasurers
1. Enter weekly offerings (cash, checks)
2. Process expense reimbursements
3. Generate monthly/yearly reports
4. Manage donor information
5. Export data for accounting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with Azure Container Apps for serverless deployment
- Material-UI for beautiful React components
- SQLite for cost-effective data storage
- Azure Blob Storage for reliable file management

---

**Deployed with ❤️ for church communities using Azure Container Apps**