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
      connectTimeout: 30000,
      requestTimeout: 30000
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test the connection
sequelize.authenticate()
  .then(() => {
    console.log('✓ Successfully connected to Azure SQL Server');
  })
  .catch(err => {
    console.error('✗ Unable to connect to Azure SQL Server:', err.message);
    console.error('Please check your database credentials and network connectivity');
  });

module.exports = sequelize;