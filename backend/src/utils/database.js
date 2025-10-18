const { Sequelize } = require('sequelize');

// For local testing, use SQLite if no Azure connection
if (!process.env.AZURE_SQL_CONNECTION_STRING || process.env.AZURE_SQL_CONNECTION_STRING === 'your-azure-sql-connection-string') {
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite',
    logging: false
  });
  module.exports = sequelize;
} else {
  // Parse Azure SQL connection string
  const connStr = process.env.AZURE_SQL_CONNECTION_STRING;
  const parts = {};
  connStr.split(';').forEach(part => {
    const [key, value] = part.split('=');
    parts[key] = value;
  });
  const sequelize = new Sequelize({
    dialect: 'mssql',
    host: parts['Server']?.split(',')[0]?.replace('tcp:', ''),
    port: parts['Server']?.split(',')[1],
    database: parts['Initial Catalog'],
    username: parts['User ID'],
    password: parts['Password'],
    options: {
      encrypt: true,
      trustServerCertificate: false
    },
    logging: false
  });
  module.exports = sequelize;
}