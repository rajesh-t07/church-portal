const path = require('path');
const fs = require('fs');
const {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential
} = require('@azure/storage-blob');
const { DefaultAzureCredential } = require('@azure/identity');

const uploadToBlob = async (file, containerName = 'receipts') => {
  try {

    if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
      console.log('Using Azure Blob Storage with Connection String');
      const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
      const containerClient = blobServiceClient.getContainerClient(containerName);

      const blobName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.upload(file.buffer, file.size, {
        blobHTTPHeaders: {
          blobContentType: file.mimetype
        }
      });

      return {
        url: blockBlobClient.url,
        filename: blobName,
        container: containerName
      };
    }

    // Check if running in Azure with managed identity
    if (process.env.AZURE_STORAGE_ACCOUNT_NAME && process.env.AZURE_CLIENT_ID) {
      console.log('Using Azure Blob Storage with Managed Identity');

      // Use managed identity for authentication
      const credential = new DefaultAzureCredential();
      const blobServiceClient = new BlobServiceClient(
        `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
        credential
      );

      const containerClient = blobServiceClient.getContainerClient(containerName);
      const blobName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.upload(file.buffer, file.size, {
        blobHTTPHeaders: {
          blobContentType: file.mimetype
        }
      });

      return {
        url: blockBlobClient.url,
        filename: blobName,
        container: containerName
      };
    }

    // Fallback for local development - save to local folder
    console.log('Using local file storage for development');
    const uploadDir = path.join(__dirname, '../../uploads', containerName);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, file.buffer);

    return {
      url: `/uploads/${containerName}/${fileName}`,
      filename: fileName,
      container: containerName
    };

  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

const uploadReceiptToBlob = async (file) => {
  return uploadToBlob(file, process.env.AZURE_STORAGE_CONTAINER_RECEIPTS || 'receipts');
};

const uploadDocumentToBlob = async (file) => {
  return uploadToBlob(file, process.env.AZURE_STORAGE_CONTAINER_DOCUMENTS || 'documents');
};

const uploadReportToBlob = async (file) => {
  return uploadToBlob(file, process.env.AZURE_STORAGE_CONTAINER_REPORTS || 'reports');
};

const getSignedUrl = async (blobUrl) => {
  try {
    if (!blobUrl || typeof blobUrl !== 'string' || !blobUrl.includes('blob.core.windows.net')) {
      return blobUrl;
    }

    // Parse container and blob name from URL
    const url = new URL(blobUrl);
    const pathParts = url.pathname.split('/');
    const containerName = pathParts[1];
    const blobName = pathParts.slice(2).join('/'); // Join back in case blob name has slashes

    if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
      // Parse connection string to get account name and key
      const matches = process.env.AZURE_STORAGE_CONNECTION_STRING.match(/AccountName=([^;]+).*AccountKey=([^;]+)/);
      if (!matches) return blobUrl;

      const accountName = matches[1];
      const accountKey = matches[2];
      const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

      const sasOptions = {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse("r"), // Read only
        startsOn: new Date(),
        expiresOn: new Date(new Date().valueOf() + 3600 * 1000), // 1 hour
      };

      const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
      return `${blobUrl}?${sasToken}`;
    }

    // For Managed Identity, we need User Delegation Key (more complex, skipping for now as Connection String is primary)
    // If we are here, we might return just the URL if we can't sign it easily without extra setup.
    return blobUrl;

  } catch (error) {
    console.error('Error generating SAS token:', error);
    return blobUrl;
  }
};

module.exports = {
  uploadToBlob,
  uploadReceiptToBlob,
  uploadDocumentToBlob,
  uploadReportToBlob,
  getSignedUrl
};