const sequelize = require('../utils/database');
const User = require('./User')(sequelize);
const Expense = require('./Expense')(sequelize);
const ExpenseSubmission = require('./ExpenseSubmission')(sequelize);
const Offering = require('./Offering')(sequelize);
const Reimbursement = require('./Reimbursement')(sequelize);
const Donation = require('./Donation')(sequelize);
const Donor = require('./Donor')(sequelize);
const DonationSession = require('./DonationSession')(sequelize);
const PastorGift = require('./PastorGift')(sequelize);

// Define all model associations
const models = { User, Expense, ExpenseSubmission, Offering, Reimbursement, Donation, Donor, DonationSession, PastorGift };

// Set up associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Legacy associations for backward compatibility
User.hasMany(Expense, { foreignKey: 'userId' });
Expense.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Donation, { foreignKey: 'enteredBy' });
Donation.belongsTo(User, { foreignKey: 'enteredBy' });
Expense.hasOne(Reimbursement, { foreignKey: 'expenseId' });
Reimbursement.belongsTo(Expense, { foreignKey: 'expenseId' });
Reimbursement.belongsTo(User, { as: 'Treasurer', foreignKey: 'treasurerId' });

module.exports = { sequelize, User, Expense, ExpenseSubmission, Offering, Reimbursement, Donation, Donor, DonationSession, PastorGift };