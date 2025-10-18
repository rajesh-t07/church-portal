# Deployment Guide

This document provides detailed instructions for deploying the Church Portal application to Azure.

## Prerequisites

1. **Azure Account**: Active Azure subscription
2. **Azure CLI**: Install from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
3. **Azure Developer CLI**: Install from https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd
4. **Docker**: For local container building (optional)
5. **Git**: For version control

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React SPA     │    │   Express API   │    │   SQLite DB     │
│   (Frontend)    │───▶│   (Backend)     │───▶│   (Embedded)    │
│   nginx         │    │   Node.js       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌─────────────────┐
│ Container Apps  │    │  Azure Blob     │
│   (Serverless)  │    │   Storage       │
└─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│   Azure Key     │
│     Vault       │
└─────────────────┘
```

## Step-by-Step Deployment

### 1. Prepare Local Environment

```bash
# Clone the repository
git clone https://github.com/sangeethdba/church-portal.git
cd church-portal

# Login to Azure
az login
azd auth login
```

### 2. Initialize Azure Developer CLI

```bash
# Create new environment
azd env new church-prod

# Set required variables
azd env set AZURE_LOCATION eastus2
azd env set AZURE_SUBSCRIPTION_ID "your-subscription-id"
```

### 3. Deploy Infrastructure

```bash
# Provision Azure resources
azd provision --no-prompt
```

This creates:
- Resource Group: `rg-church-prod`
- Container Apps Environment
- Container Registry
- Storage Account
- Key Vault
- Application Insights
- Managed Identities

### 4. Deploy Applications

```bash
# Deploy both frontend and backend
azd deploy --no-prompt
```

This:
- Builds Docker images
- Pushes to Container Registry
- Deploys to Container Apps
- Updates environment variables

### 5. Verify Deployment

After deployment, verify:

1. **Frontend URL**: Check React app loads correctly
2. **Backend API**: Test health endpoint
3. **Storage**: File upload functionality
4. **Database**: SQLite initialization

## Configuration

### Environment Variables

The following variables are automatically configured:

#### Backend
- `JWT_SECRET`: Stored in Key Vault
- `AZURE_STORAGE_ACCOUNT_NAME`: Auto-configured
- `AZURE_CLIENT_ID`: Managed Identity
- `PORT`: Container port (80)
- `NODE_ENV`: production

#### Frontend
- `BACKEND_BASE_URL`: Points to backend Container App
- `PORT`: Container port (80)

### Custom Domain (Optional)

To add a custom domain:

1. **Purchase domain** from registrar
2. **Add custom domain** in Container Apps
3. **Configure DNS** CNAME record
4. **Enable HTTPS** (automatic with Container Apps)

```bash
# Add custom domain
az containerapp hostname add \
  --resource-group rg-church-prod \
  --name frontend \
  --hostname yourdomain.com
```

## Database Management

### Current Setup: SQLite

- **Location**: `/app/data/church_portal.db` in container
- **Persistence**: Uses container storage (ephemeral)
- **Cost**: $0 (embedded)

### Migration to External Database

For production scale:

#### Option 1: Azure SQL Database

```bash
# Create Azure SQL Database
az sql server create \
  --resource-group rg-church-prod \
  --name church-sql-server \
  --admin-user churchadmin \
  --admin-password "YourSecurePassword123!"

az sql db create \
  --resource-group rg-church-prod \
  --server church-sql-server \
  --name church_portal \
  --service-objective S0
```

Update connection string in Key Vault:
```bash
az keyvault secret set \
  --vault-name kv-qrwr5zoraoqjo \
  --name DATABASE-URL \
  --value "Server=tcp:church-sql-server.database.windows.net,1433;Initial Catalog=church_portal;Persist Security Info=False;User ID=churchadmin;Password=YourSecurePassword123!;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
```

#### Option 2: PostgreSQL

```bash
# Create PostgreSQL Flexible Server
az postgres flexible-server create \
  --resource-group rg-church-prod \
  --name church-postgres \
  --admin-user churchadmin \
  --admin-password "YourSecurePassword123!" \
  --sku-name Standard_B1ms \
  --version 14
```

## Monitoring and Logging

### Application Insights

Automatically configured for:
- Request tracking
- Dependency calls
- Exception logging
- Performance metrics

Access via Azure Portal:
- Navigate to Application Insights resource
- View Live Metrics, Logs, and Performance

### Log Queries

Useful KQL queries for monitoring:

```kql
// Recent errors
exceptions
| where timestamp > ago(1h)
| order by timestamp desc

// Request performance
requests
| where timestamp > ago(1d)
| summarize avg(duration) by bin(timestamp, 1h)

// Failed requests
requests
| where success == false
| where timestamp > ago(1h)
```

## Scaling and Performance

### Container Apps Scaling

Current configuration:
- **Min replicas**: 1
- **Max replicas**: 10
- **Scaling rule**: CPU/Memory based

To adjust scaling:

```bash
az containerapp update \
  --resource-group rg-church-prod \
  --name backend \
  --min-replicas 0 \
  --max-replicas 20
```

### Performance Optimizations

1. **Enable CDN** for static assets
2. **Implement caching** with Redis
3. **Optimize database** queries
4. **Compress responses** (already enabled)

## Security Best Practices

### Implemented Security

- ✅ HTTPS enforced
- ✅ Secrets in Key Vault
- ✅ Managed Identity authentication
- ✅ Container isolation
- ✅ Rate limiting
- ✅ Input validation

### Additional Security

1. **Enable Azure Firewall** for network restrictions
2. **Implement WAF** for web application protection
3. **Enable audit logging** for compliance
4. **Regular security updates** via CI/CD

## Cost Management

### Current Costs (Estimated)

- **Container Apps**: $5-15/month
- **Storage**: $1-3/month
- **Key Vault**: $3/month
- **Application Insights**: $0-5/month
- **Container Registry**: $5/month

**Total**: ~$14-31/month

### Cost Optimization

1. **Scale to zero** during off-hours
2. **Use spot instances** for dev environments
3. **Optimize storage tiers** based on access patterns
4. **Monitor unused resources** with Azure Advisor

## Backup and Recovery

### Data Backup

1. **Database**: SQLite file in container (manual backup needed)
2. **Blob Storage**: Built-in redundancy (LRS)
3. **Application**: Source code in GitHub

### Disaster Recovery

1. **Multi-region deployment** (optional)
2. **Automated failover** with Traffic Manager
3. **Database replication** for critical data

## Troubleshooting

### Common Issues

#### Container won't start
```bash
# Check container logs
az containerapp logs show \
  --resource-group rg-church-prod \
  --name backend \
  --follow
```

#### Database connection failed
- Verify connection string in Key Vault
- Check Managed Identity permissions
- Review firewall rules

#### File upload fails
- Verify Storage Account permissions
- Check Managed Identity role assignments
- Review CORS settings

### Support Resources

- **Azure Documentation**: https://docs.microsoft.com/en-us/azure/
- **Container Apps Docs**: https://docs.microsoft.com/en-us/azure/container-apps/
- **GitHub Issues**: Repository issue tracker

## CI/CD Pipeline (Future Enhancement)

### GitHub Actions Workflow

```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      - name: Deploy with AZD
        run: |
          azd auth login --client-id ${{ secrets.AZURE_CLIENT_ID }}
          azd deploy --no-prompt
```

This enables:
- Automated deployments on code changes
- Environment promotion (dev → staging → prod)
- Rollback capabilities
- Deployment notifications

---

For additional support, please refer to the [GitHub repository](https://github.com/sangeethdba/church-portal) or Azure documentation.