const { Sequelize } = require('sequelize');

// Azure SQL Server Configuration
console.log('Connecting to Azure SQL Server database...');

const sequelize = new Sequelize({
  dialect: 'mssql',
  host: process.env.DB_HOST || 'churchfinancesql.database.windows.net',
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_NAME || 'ChurchFinanceDB',
  username: process.env.DB_USER || 'sqladmin',
  password: process.env.DB_PASSWORD,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    options: {
      encrypt: true, // Required for Azure SQL
      trustServerCertificate: false, // Use true for local dev, false for production
      connectTimeout: 60000, // Increased to 60s for cold starts
      requestTimeout: 60000 // Increased to 60s
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 60000, // Increased to 60s
    idle: 10000
  },
  retry: {
    match: [
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /Invalid state/,
      /ECONNRESET/
    ],
    max: 5, // Maximum number of retries
    timeout: 60000 // Retry timeout
  }
});

// Function to test connection with retry logic
const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      console.log('✓ Successfully connected to Azure SQL Server');
      console.log('  > Host:', sequelize.config.host);
      console.log('  > Database:', sequelize.config.database);
      return;
    } catch (err) {
      console.error(`✗ Start failure (attempt ${i + 1}/${retries}):`, err.message);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.error('✗ Unable to connect to Azure SQL Server after multiple attempts');
};

connectWithRetry();

module.exports = sequelize;