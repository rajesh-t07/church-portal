# Copilot Instructions for CHURCH-PORTAL

This file tracks the setup and development progress for the church portal application.

## Project Status: ✅ DEPLOYED TO AZURE

### Live Application URLs
- **Frontend**: https://frontend.blacksea-4befa204.eastus2.azurecontainerapps.io/
- **Backend API**: https://backend.blacksea-4befa204.eastus2.azurecontainerapps.io/
- **Azure Portal**: https://portal.azure.com/#@/resource/subscriptions/fbd8d5e7-282c-4255-9d2f-18f8bcf7a816/resourceGroups/rg-church-prod/overview

## Checklist
- [x] Clarify Project Requirements
- [x] Scaffold the Project
- [x] Customize the Project
- [x] Install Required Extensions
- [x] Compile the Project
- [x] Create and Run Task
- [x] Launch the Project
- [x] Deploy to Azure Container Apps
- [x] Configure Azure Blob Storage
- [x] Set up Azure Key Vault
- [x] Ensure Documentation is Complete

## Final Architecture
- **Backend**: Node.js/Express API with SQLite database (cost-effective)
- **Frontend**: React SPA with Material-UI served by nginx
- **Storage**: Azure Blob Storage for file uploads (receipts, documents)
- **Hosting**: Azure Container Apps (serverless, auto-scaling)
- **Security**: Azure Key Vault for secrets, managed identity authentication
- **Monitoring**: Application Insights for logs and metrics

## Key Features Implemented
- ✅ Expense submission with file upload
- ✅ Donation entry and tracking  
- ✅ Offering management
- ✅ User authentication (JWT)
- ✅ Role-based access control
- ✅ Financial reporting
- ✅ Admin/treasurer dashboard
- ✅ Email notifications (configured)
- ✅ PDF generation for receipts
- ✅ Azure Blob Storage integration

## Cost Optimization
- Using SQLite embedded database (FREE)
- Serverless Container Apps (pay-per-use)
- Total estimated cost: $6-17/month

## Documentation Created
- [README.md](../README.md) - Main project documentation with live URLs
- [DEPLOYMENT.md](../DEPLOYMENT.md) - Detailed deployment guide
- [API.md](../API.md) - Complete API documentation
- [DEVELOPMENT.md](../DEVELOPMENT.md) - Development setup and coding standards
- [LICENSE](../LICENSE) - MIT license

## Next Steps for Users
1. Test the live application
2. Create admin user via API
3. Configure email service for notifications
4. Add church-specific data and users
5. Consider migrating to external database when scaling
