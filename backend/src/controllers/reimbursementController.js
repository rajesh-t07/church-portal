const { Reimbursement, Expense, User } = require('../models');
const { uploadToBlob } = require('../services/blobStorageService');
const { sendEmail } = require('../services/emailService');

exports.submitReimbursement = async (req, res) => {
  try {
    const { expenseId } = req.body;
    const treasurerId = req.user.id;
    let receiptUrl = null;
    if (req.file) {
      receiptUrl = await uploadToBlob(req.file);
    }
    const reimbursement = await Reimbursement.create({ expenseId, treasurerId, receiptUrl });
    await Expense.update({ status: 'reimbursed' }, { where: { id: expenseId } });
    const expense = await Expense.findByPk(expenseId, { include: User });
    // await sendEmail(expense.User.email, 'Reimbursement Processed', `Your expense of $${expense.amount} has been reimbursed.`);
    res.status(201).json(reimbursement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getReimbursements = async (req, res) => {
  try {
    const reimbursements = await Reimbursement.findAll({ include: [Expense, User] });
    res.json(reimbursements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};