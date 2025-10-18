const path = require('path');
const fs = require('fs');

const uploadToBlob = async (file) => {
  // For local testing, save to local folder
  if (!process.env.AZURE_BLOB_CONNECTION_STRING || process.env.AZURE_BLOB_CONNECTION_STRING === 'your-azure-blob-connection-string') {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, file.buffer);
    return filePath; // Return local path for testing
  }

  // Production: Upload to Azure Blob
  const { BlobServiceClient } = require('@azure/storage-blob');
  const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_BLOB_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_BLOB_CONTAINER);
  const blobName = `${Date.now()}-${file.originalname}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.upload(file.buffer, file.size);
  return blockBlobClient.url;
};

module.exports = { uploadToBlob };