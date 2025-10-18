const bcrypt = require('bcryptjs');
const { User } = require('../models');

const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ where: { email: 'admin@church.org' } });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('ChurchAdmin2025!', 10);
    await User.create({
      name: 'Church Administrator',
      email: 'admin@church.org',
      password: hashedPassword,
      role: 'admin'
    });

    console.log('Admin user created successfully!');
    console.log('Email: admin@church.org');
    console.log('Password: ChurchAdmin2025!');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

module.exports = { createAdminUser };