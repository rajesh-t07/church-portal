const { Sequelize } = require('sequelize');

// Use SQLite for both development and production (cheapest option)
console.log('Using SQLite database - perfect for initial deployment');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: '/app/data/church_portal.db', // Use persistent volume in container
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;