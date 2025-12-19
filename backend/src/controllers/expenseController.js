const { Expense, ExpenseSubmission, User } = require('../models');
const { uploadToBlob, getSignedUrl } = require('../services/blobStorageService');
const { sendEmail } = require('../services/emailService');
const { Op } = require('sequelize');

exports.submitExpense = async (req, res) => {
  console.log('=== EXPENSE SUBMISSION REQUEST ===');
  console.log('User ID:', req.user?.id);
  console.log('Request body keys:', Object.keys(req.body));
  console.log('Request body:', req.body);
  console.log('Request body.expenses type:', typeof req.body.expenses);
  console.log('Request body.expenses value:', req.body.expenses);
  console.log('Request files:', req.files);
  console.log('Files count:', req.files?.length || 0);
  console.log('==================================');

  try {
    const { expenses: expensesString } = req.body; // This will be a JSON string
    const userId = req.user.id;

    console.log('Extracted expensesString:', expensesString);
    console.log('Type of expensesString:', typeof expensesString);

    // Parse the JSON string
    let expenses;
    try {
      expenses = JSON.parse(expensesString);
    } catch (parseError) {
      console.error('Failed to parse expenses JSON:', parseError);
      return res.status(400).json({ error: 'Invalid expenses data format' });
    }

    if (!expenses || !Array.isArray(expenses)) {
      console.log('Expenses validation failed:', { expenses, isArray: Array.isArray(expenses) });
      return res.status(400).json({ error: 'Expenses array is required' });
    }

    // Calculate total amount
    const totalAmount = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

    // Create submission group
    const submission = await ExpenseSubmission.create({
      userId,
      totalAmount,
      submissionDate: new Date()
    });

    // Process each expense
    const createdExpenses = [];
    for (let i = 0; i < expenses.length; i++) {
      const expenseData = expenses[i];
      let receiptUrls = [];

      // Handle file uploads for this expense
      const fieldName = `receipts_${i}`;
      if (req.files && req.files.length > 0) {
        // Filter files for this expense
        const expenseFiles = req.files.filter(file => file.fieldname === fieldName);
        for (const file of expenseFiles) {
          const result = await uploadToBlob(file);
          receiptUrls.push(result.url);
        }
      }

      const expense = await Expense.create({
        userId,
        submissionId: submission.id,
        amount: parseFloat(expenseData.amount),
        description: expenseData.description,
        category: expenseData.category || 'General',
        receiptUrls,
        submissionDate: new Date()
      });

      createdExpenses.push(expense);
    }

    // Generate signed URLs for response
    for (const exp of createdExpenses) {
      if (exp.receiptUrls && exp.receiptUrls.length > 0) {
        exp.dataValues.receiptUrls = await Promise.all(
          exp.receiptUrls.map(url => getSignedUrl(url))
        );
      }
    }

    res.status(201).json({
      submission,
      expenses: createdExpenses,
      message: `Successfully submitted ${createdExpenses.length} expenses totaling $${totalAmount.toFixed(2)}`
    });
  } catch (error) {
    console.error('Error submitting expenses:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.approveSubmission = async (req, res) => {
  try {
    const { submissionId } = req.body;
    let reimbursementReceiptUrl = null;

    if (req.file) {
      const result = await uploadToBlob(req.file);
      reimbursementReceiptUrl = result.url;
    }

    // Update submission
    await ExpenseSubmission.update(
      {
        status: 'approved',
        approvedBy: req.user.id,
        approvedDate: new Date(),
        reimbursementReceiptUrl
      },
      { where: { id: submissionId } }
    );

    // Update all related expenses
    await Expense.update(
      {
        status: 'approved',
        approvedBy: req.user.id,
        approvedDate: new Date(),
        reimbursementReceiptUrl
      },
      { where: { submissionId } }
    );

    res.json({ message: 'Expense submission approved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.rejectSubmission = async (req, res) => {
  try {
    const { submissionId, reason } = req.body;

    // Update submission
    await ExpenseSubmission.update(
      {
        status: 'rejected',
        approvedBy: req.user.id,
        approvedDate: new Date(),
        notes: reason
      },
      { where: { id: submissionId } }
    );

    // Update all related expenses
    await Expense.update(
      {
        status: 'rejected',
        approvedBy: req.user.id,
        approvedDate: new Date(),
        notes: reason
      },
      { where: { submissionId } }
    );

    res.json({ message: 'Expense submission rejected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Legacy single expense approval (for backward compatibility)
exports.approveExpense = async (req, res) => {
  try {
    const { expenseId, status } = req.body;
    let reimbursementReceiptUrl = null;

    if (req.file) {
      const result = await uploadToBlob(req.file);
      reimbursementReceiptUrl = result.url;
    }

    await Expense.update(
      {
        status: 'approved',
        approvedBy: req.user.id,
        approvedDate: new Date(),
        reimbursementReceiptUrl
      },
      { where: { id: expenseId } }
    );

    res.json({ message: 'Expense approved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.rejectExpense = async (req, res) => {
  try {
    const { expenseId, reason } = req.body;

    await Expense.update(
      {
        status: 'rejected',
        approvedBy: req.user.id,
        approvedDate: new Date(),
        notes: reason
      },
      { where: { id: expenseId } }
    );

    res.json({ message: 'Expense rejected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    let where = {};
    if (req.user.role !== 'admin' && req.user.role !== 'treasurer') {
      where.userId = req.user.id;
    }

    // Server-side Filtering
    const { status, userId, year } = req.query;

    // Filter by User (only for admins/treasurers who haven't been restricted by above check)
    if (userId && userId !== 'all') {
      if (req.user.role === 'admin' || req.user.role === 'treasurer') {
        where.userId = userId;
      }
    }

    // Filter by Status
    if (status && status !== 'all') {
      where.status = status;
    }

    // Filter by Year
    if (year && year !== 'all') {
      const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
      where.submissionDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    const submissions = await ExpenseSubmission.findAll({
      where,
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'ApprovedBy',
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: Expense,
          as: 'Expenses'
        }
      ],
      order: [['submissionDate', 'DESC']]
    });

    // Sign URLs
    for (const submission of submissions) {
      if (submission.reimbursementReceiptUrl) {
        submission.dataValues.reimbursementReceiptUrl = await getSignedUrl(submission.reimbursementReceiptUrl);
      }
      if (submission.Expenses) {
        for (const expense of submission.Expenses) {
          if (expense.receiptUrls && Array.isArray(expense.receiptUrls)) {
            expense.dataValues.receiptUrls = await Promise.all(
              expense.receiptUrls.map(url => getSignedUrl(url))
            );
          } else if (typeof expense.receiptUrls === 'string') {
            // Handle case where it might be a JSON string as seen in verification
            try {
              const parsed = JSON.parse(expense.receiptUrls);
              if (Array.isArray(parsed)) {
                const signed = await Promise.all(parsed.map(url => getSignedUrl(url)));
                expense.dataValues.receiptUrls = signed;
              }
            } catch (e) {
              // If basic string URL
              expense.dataValues.receiptUrls = [await getSignedUrl(expense.receiptUrls)];
            }
          }
          if (expense.reimbursementReceiptUrl) {
            expense.dataValues.reimbursementReceiptUrl = await getSignedUrl(expense.reimbursementReceiptUrl);
          }
        }
      }
    }

    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    let where = {};
    let include = [];
    if (req.user.role !== 'admin' && req.user.role !== 'treasurer') {
      where.userId = req.user.id;
    } else {
      include = [{ model: User }];
    }
    const expenses = await Expense.findAll({ where, include });

    // Sign URLs
    for (const expense of expenses) {
      if (expense.receiptUrls && Array.isArray(expense.receiptUrls)) {
        expense.dataValues.receiptUrls = await Promise.all(
          expense.receiptUrls.map(url => getSignedUrl(url))
        );
      } else if (typeof expense.receiptUrls === 'string') {
        try {
          const parsed = JSON.parse(expense.receiptUrls);
          if (Array.isArray(parsed)) {
            const signed = await Promise.all(parsed.map(url => getSignedUrl(url)));
            expense.dataValues.receiptUrls = signed;
          }
        } catch (e) {
          expense.dataValues.receiptUrls = [await getSignedUrl(expense.receiptUrls)];
        }
      }
      if (expense.reimbursementReceiptUrl) {
        expense.dataValues.reimbursementReceiptUrl = await getSignedUrl(expense.reimbursementReceiptUrl);
      }
    }

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};