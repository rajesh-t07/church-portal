const path = require('path');
const fs = require('fs');
const { BlobServiceClient } = require('@azure/storage-blob');
const { DefaultAzureCredential } = require('@azure/identity');

const uploadToBlob = async (file, containerName = 'receipts') => {
  try {
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

module.exports = { 
  uploadToBlob,
  uploadReceiptToBlob,
  uploadDocumentToBlob,
  uploadReportToBlob
};