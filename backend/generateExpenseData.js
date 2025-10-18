const { User, Expense, Reimbursement, ExpenseSubmission } = require('./src/models');

async function generateExpenseData() {
  try {
    console.log('💰 Starting expense data generation...');
    
    // Get existing users
    const users = await User.findAll({
      where: {
        role: 'member'
      }
    });
    
    if (users.length === 0) {
      throw new Error('No member users found');
    }
    
    console.log(`Found ${users.length} users for expense generation`);
    
    // Helper function to generate random amount
    function randomAmount(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    // Helper function to get random user
    function getRandomUser() {
      return users[Math.floor(Math.random() * users.length)];
    }
    
    // User expense categories and descriptions
    const userExpenseCategories = {
      'Office Supplies': ['Printer paper', 'Pens and pencils', 'Folders', 'Staples', 'Notebooks'],
      'Food & Catering': ['Fellowship dinner', 'Coffee supplies', 'Youth group snacks', 'Potluck items', 'Kitchen supplies'],
      'Transportation': ['Gas for church van', 'Vehicle maintenance', 'Parking fees', 'Bus rental'],
      'Books & Materials': ['Sunday school materials', 'Bibles', 'Workbooks', 'Art supplies', 'Teaching materials'],
      'Event Expenses': ['Conference registration', 'Retreat costs', 'Speaker fees', 'Decorations', 'Sound equipment rental'],
      'Miscellaneous': ['Bank fees', 'Postage', 'Software license', 'Equipment rental', 'Cleaning supplies']
    };
    
    // Church direct expenses
    const churchExpenses = [
      { description: 'Monthly rent payment', amount: 200 },
      { description: 'Amazon office supplies', amount: 100 },
      { description: 'Amazon kitchen supplies', amount: 100 },
      { description: 'Amazon books and materials', amount: 100 },
      { description: 'Amazon cleaning supplies', amount: 100 }
    ];
    
    // Generate expenses for 2024 and 2025
    for (const year of [2024, 2025]) {
      console.log(`📅 Generating expenses for ${year}...`);
      
      for (let month = 1; month <= 12; month++) {
        console.log(`   📊 Processing ${year}-${month.toString().padStart(2, '0')}...`);
        
        // Generate 5-10 user reimbursable expenses per month
        const numUserExpenses = randomAmount(5, 10);
        
        for (let i = 0; i < numUserExpenses; i++) {
          const user = getRandomUser();
          const categories = Object.keys(userExpenseCategories);
          const category = categories[Math.floor(Math.random() * categories.length)];
          const descriptions = userExpenseCategories[category];
          const description = descriptions[Math.floor(Math.random() * descriptions.length)];
          
          // Random date within the month
          const day = Math.floor(Math.random() * 28) + 1;
          const expenseDate = new Date(year, month - 1, day);
          const amount = randomAmount(100, 200);
          
          try {
            // Create expense submission first
            const expenseSubmission = await ExpenseSubmission.create({
              userId: user.id,
              submissionDate: expenseDate,
              totalAmount: amount,
              status: 'approved',
              approvedBy: users[0].id, // Admin user as approver
              approvedDate: new Date(expenseDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000),
              notes: 'Generated test data'
            });
            
            const expense = await Expense.create({
              userId: user.id,
              description: description,
              amount: amount,
              category: category,
              submissionDate: expenseDate,
              approvedDate: new Date(expenseDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000), // Approved within a week
              receiptUrls: null,
              status: 'approved',
              submissionId: expenseSubmission.id,
              approvedBy: users[0].id
            });
            
            // Create reimbursement record
            await Reimbursement.create({
              expenseId: expense.id,
              amount: amount,
              reimbursementDate: new Date(expenseDate.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000), // Reimbursed within 2 weeks
              treasurerId: users[0].id, // First user as treasurer
              notes: 'Approved and reimbursed',
              status: 'completed'
            });
            
          } catch (error) {
            console.log(`   Error creating user expense: ${error.message}`);
          }
        }
        
        // Generate church direct expenses (rent + Amazon purchases)
        for (const churchExpense of churchExpenses) {
          const day = Math.floor(Math.random() * 28) + 1;
          const expenseDate = new Date(year, month - 1, day);
          
          try {
            await Expense.create({
              userId: users[0].id, // Admin user for church expenses
              description: churchExpense.description,
              amount: churchExpense.amount,
              category: churchExpense.description.includes('rent') ? 'Facilities' : 'Supplies',
              submissionDate: expenseDate,
              approvedDate: expenseDate, // Church expenses auto-approved
              receiptUrls: null,
              status: 'approved',
              submissionId: null, // Direct church expenses don't have submission IDs
              approvedBy: users[0].id
            });
            
          } catch (error) {
            console.log(`   Error creating church expense: ${error.message}`);
          }
        }
      }
    }
    
    console.log('🎉 Expense data generation completed successfully!');
    console.log('📊 Summary:');
    console.log('   💰 Generated monthly user expenses ($100-$200 each)');
    console.log('   🏢 Generated monthly church expenses (rent $200, Amazon purchases $100 each)');
    console.log('   📅 Covered all months in 2024 and 2025');
    console.log('   ✅ All expenses marked as approved and reimbursed');
    
  } catch (error) {
    console.error('❌ Error generating expense data:', error);
  }
}

// Run the script
generateExpenseData();