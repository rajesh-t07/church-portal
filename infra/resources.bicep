@description('The location used for all deployed resources')
param location string = resourceGroup().location

@description('Tags that will be applied to all resources')
param tags object = {}


param backendExists bool
param frontendExists bool

@description('Id of the user or app to assign application roles')
param principalId string

@description('Principal type of user or app')
param principalType string

var abbrs = loadJsonContent('./abbreviations.json')
var resourceToken = uniqueString(subscription().id, resourceGroup().id, location)

// Generate database credentials
var databaseName = 'church_portal'
var databaseUser = 'churchadmin'
@secure()
param databasePassword string = 'ChurchPortal2024!' 

// Monitor application with Azure Monitor
module monitoring 'br/public:avm/ptn/azd/monitoring:0.1.0' = {
  name: 'monitoring'
  params: {
    logAnalyticsName: '${abbrs.operationalInsightsWorkspaces}${resourceToken}'
    applicationInsightsName: '${abbrs.insightsComponents}${resourceToken}'
    applicationInsightsDashboardName: '${abbrs.portalDashboards}${resourceToken}'
    location: location
    tags: tags
  }
}
// Container registry
module containerRegistry 'br/public:avm/res/container-registry/registry:0.1.1' = {
  name: 'registry'
  params: {
    name: '${abbrs.containerRegistryRegistries}${resourceToken}'
    location: location
    tags: tags
    publicNetworkAccess: 'Enabled'
    roleAssignments:[
      {
        principalId: backendIdentity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
      }
      {
        principalId: frontendIdentity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
      }
    ]
  }
}

// Key Vault for storing secrets
module keyVault 'br/public:avm/res/key-vault/vault:0.6.1' = {
  name: 'keyvault'
  params: {
    name: '${abbrs.keyVaultVaults}${resourceToken}'
    location: location
    tags: tags
    enableRbacAuthorization: true
    roleAssignments: [
      {
        principalId: backendIdentity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6') // Key Vault Secrets User
      }
      {
        principalId: principalId
        principalType: principalType
        roleDefinitionIdOrName: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '00482a5a-887f-4fb3-b363-3b7fe8e74483') // Key Vault Administrator
      }
    ]
    secrets: [
      {
        name: 'DATABASE-URL'
        value: 'postgresql://${databaseUser}:${databasePassword}@${abbrs.dBforPostgreSQLServers}${resourceToken}.postgres.database.azure.com:5432/${databaseName}?sslmode=require'
      }
      {
        name: 'JWT-SECRET'
        value: 'super-secret-jwt-key-for-church-portal-${resourceToken}'
      }
    ]
  }
}

// PostgreSQL Database
resource postgreSQLServer 'Microsoft.DBforPostgreSQL/flexibleServers@2022-12-01' = {
  name: '${abbrs.dBforPostgreSQLServers}${resourceToken}'
  location: location
  tags: tags
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    administratorLogin: databaseUser
    administratorLoginPassword: databasePassword
    version: '14'
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

resource postgreSQLDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2022-12-01' = {
  parent: postgreSQLServer
  name: databaseName
}

resource postgreSQLFirewallRule 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2022-12-01' = {
  parent: postgreSQLServer
  name: 'AllowAllAzureIps'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Storage Account for blob storage
module storageAccount 'br/public:avm/res/storage/storage-account:0.9.1' = {
  name: 'storage'
  params: {
    name: '${abbrs.storageStorageAccounts}${resourceToken}'
    location: location
    tags: tags
    skuName: 'Standard_LRS'
    kind: 'StorageV2'
    allowBlobPublicAccess: false
    roleAssignments: [
      {
        principalId: backendIdentity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe') // Storage Blob Data Contributor
      }
    ]
    blobServices: {
      containers: [
        {
          name: 'receipts'
          publicAccess: 'None'
        }
        {
          name: 'documents'
          publicAccess: 'None'
        }
        {
          name: 'reports'
          publicAccess: 'None'
        }
      ]
    }
  }
}

// Container apps environment
module containerAppsEnvironment 'br/public:avm/res/app/managed-environment:0.4.5' = {
  name: 'container-apps-environment'
  params: {
    logAnalyticsWorkspaceResourceId: monitoring.outputs.logAnalyticsWorkspaceResourceId
    name: '${abbrs.appManagedEnvironments}${resourceToken}'
    location: location
    zoneRedundant: false
  }
}

module backendIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.2.1' = {
  name: 'backendidentity'
  params: {
    name: '${abbrs.managedIdentityUserAssignedIdentities}backend-${resourceToken}'
    location: location
  }
}
module backendFetchLatestImage './modules/fetch-container-image.bicep' = {
  name: 'backend-fetch-image'
  params: {
    exists: backendExists
    name: 'backend'
  }
}

module backend 'br/public:avm/res/app/container-app:0.8.0' = {
  name: 'backend'
  params: {
    name: 'backend'
    ingressTargetPort: 80
    corsPolicy: {
      allowedOrigins: [
        'https://frontend.${containerAppsEnvironment.outputs.defaultDomain}'
      ]
      allowedMethods: [
        '*'
      ]
    }
    scaleMinReplicas: 1
    scaleMaxReplicas: 10
    secrets: {
      secureList: [
        {
          name: 'jwt-secret'
          keyVaultUrl: '${keyVault.outputs.uri}secrets/JWT-SECRET'
          identity: backendIdentity.outputs.resourceId
        }
      ]
    }
    containers: [
      {
        image: backendFetchLatestImage.outputs.?containers[?0].?image ?? 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
        name: 'main'
        resources: {
          cpu: json('0.5')
          memory: '1.0Gi'
        }
        env: [
          {
            name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
            value: monitoring.outputs.applicationInsightsConnectionString
          }
          {
            name: 'AZURE_CLIENT_ID'
            value: backendIdentity.outputs.clientId
          }
          {
            name: 'PORT'
            value: '80'
          }
          {
            name: 'JWT_SECRET'
            secretRef: 'jwt-secret'
          }
          {
            name: 'NODE_ENV'
            value: 'production'
          }
          {
            name: 'AZURE_STORAGE_ACCOUNT_NAME'
            value: storageAccount.outputs.name
          }
          {
            name: 'AZURE_STORAGE_CONTAINER_RECEIPTS'
            value: 'receipts'
          }
          {
            name: 'AZURE_STORAGE_CONTAINER_DOCUMENTS'
            value: 'documents'
          }
          {
            name: 'AZURE_STORAGE_CONTAINER_REPORTS'
            value: 'reports'
          }
        ]
      }
    ]
    managedIdentities:{
      systemAssigned: false
      userAssignedResourceIds: [backendIdentity.outputs.resourceId]
    }
    registries:[
      {
        server: containerRegistry.outputs.loginServer
        identity: backendIdentity.outputs.resourceId
      }
    ]
    environmentResourceId: containerAppsEnvironment.outputs.resourceId
    location: location
    tags: union(tags, { 'azd-service-name': 'backend' })
  }
}

module frontendIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.2.1' = {
  name: 'frontendidentity'
  params: {
    name: '${abbrs.managedIdentityUserAssignedIdentities}frontend-${resourceToken}'
    location: location
  }
}
module frontendFetchLatestImage './modules/fetch-container-image.bicep' = {
  name: 'frontend-fetch-image'
  params: {
    exists: frontendExists
    name: 'frontend'
  }
}

module frontend 'br/public:avm/res/app/container-app:0.8.0' = {
  name: 'frontend'
  params: {
    name: 'frontend'
    ingressTargetPort: 80
    scaleMinReplicas: 1
    scaleMaxReplicas: 10
    secrets: {
      secureList:  [
      ]
    }
    containers: [
      {
        image: frontendFetchLatestImage.outputs.?containers[?0].?image ?? 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
        name: 'main'
        resources: {
          cpu: json('0.5')
          memory: '1.0Gi'
        }
        env: [
          {
            name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
            value: monitoring.outputs.applicationInsightsConnectionString
          }
          {
            name: 'AZURE_CLIENT_ID'
            value: frontendIdentity.outputs.clientId
          }
          {
            name: 'BACKEND_BASE_URL'
            value: 'https://backend.${containerAppsEnvironment.outputs.defaultDomain}'
          }
          {
            name: 'PORT'
            value: '80'
          }
        ]
      }
    ]
    managedIdentities:{
      systemAssigned: false
      userAssignedResourceIds: [frontendIdentity.outputs.resourceId]
    }
    registries:[
      {
        server: containerRegistry.outputs.loginServer
        identity: frontendIdentity.outputs.resourceId
      }
    ]
    environmentResourceId: containerAppsEnvironment.outputs.resourceId
    location: location
    tags: union(tags, { 'azd-service-name': 'frontend' })
  }
}
output AZURE_CONTAINER_REGISTRY_ENDPOINT string = containerRegistry.outputs.loginServer
output AZURE_RESOURCE_BACKEND_ID string = backend.outputs.resourceId
output AZURE_RESOURCE_FRONTEND_ID string = frontend.outputs.resourceId
output AZURE_KEY_VAULT_NAME string = keyVault.outputs.name
output AZURE_STORAGE_ACCOUNT_NAME string = storageAccount.outputs.name
output AZURE_DATABASE_NAME string = databaseName
output BACKEND_URL string = 'https://backend.${containerAppsEnvironment.outputs.defaultDomain}'
output FRONTEND_URL string = 'https://frontend.${containerAppsEnvironment.outputs.defaultDomain}'
