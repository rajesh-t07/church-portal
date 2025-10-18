const { User, Donor, DonationSession, Donation, Offering, Expense, ExpenseSubmission, Reimbursement, PastorGift } = require('./src/models');
const bcrypt = require('bcryptjs');
const { sequelize } = require('./src/models');

// Member names for generating test data (Indian names)
const memberNames = [
  'Rajesh Kumar', 'Priya Sharma', 'Amit Singh', 'Deepika Patel', 'Rahul Gupta',
  'Kavya Reddy', 'Arjun Nair', 'Sneha Joshi', 'Vikram Mehta', 'Anita Verma',
  'Karthik Rao', 'Pooja Agarwal', 'Suresh Iyer', 'Meera Bansal', 'Ashwin Das',
  'Divya Pillai', 'Rohit Sinha', 'Lakshmi Menon', 'Naveen Choudhary', 'Ritu Malhotra',
  'Sanjay Kapoor', 'Preethi Krishnan', 'Manoj Tiwari', 'Shweta Desai', 'Arun Bhat',
  'Neha Saxena', 'Vijay Pandey', 'Roshni Shah', 'Girish Kulkarni', 'Smita Jain',
  'Rakesh Yadav', 'Pallavi Mishra', 'Abhishek Ghosh', 'Tanvi Bhatt', 'Sunil Khurana',
  'Madhuri Devi', 'Harish Chandra', 'Vaishali Rane', 'Mohan Lal', 'Swati Goel'
];

// Auto-recurring expenses (monthly direct debits)
const autoExpenses = [
  { description: 'Church Rent', amount: 1200, category: 'Facility', day: 1 },
  { description: 'Electricity Bill', amount: 350, category: 'Utilities', day: 15 },
  { description: 'Water Bill', amount: 120, category: 'Utilities', day: 10 },
  { description: 'Internet & Phone', amount: 180, category: 'Communication', day: 5 },
  { description: 'Security System', amount: 85, category: 'Security', day: 12 },
  { description: 'Cleaning Services', amount: 200, category: 'Maintenance', day: 20 },
  { description: 'Insurance Premium', amount: 450, category: 'Insurance', day: 1 },
  { description: 'Waste Management', amount: 75, category: 'Utilities', day: 8 }
];

// Reimbursable expense categories for member submissions
const expenseCategories = [
  'Office Supplies', 'Ministry Materials', 'Food & Refreshments', 'Transportation',
  'Event Supplies', 'Equipment Maintenance', 'Guest Speaker', 'Youth Ministry',
  'Outreach Programs', 'Books & Resources'
];

// Cash denominations for anonymous donations
const cashDenominations = ['ones', 'fives', 'tens', 'twenties', 'fifties', 'hundreds'];

// Utility functions
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomAmount(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function getAllSundays(startYear, endYear, endMonth = 12) {
  const sundays = [];
  const start = new Date(startYear, 0, 1);
  const end = endYear === new Date().getFullYear() ? 
    new Date(endYear, endMonth - 1, 30) : 
    new Date(endYear, 11, 31);
  
  // Find first Sunday
  let current = new Date(start);
  while (current.getDay() !== 0) {
    current.setDate(current.getDate() + 1);
  }
  
  // Collect all Sundays
  while (current <= end) {
    sundays.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }
  
  return sundays;
}

function getAllMonths(startYear, endYear, endMonth = 12) {
  const months = [];
  for (let year = startYear; year <= endYear; year++) {
    const maxMonth = year === endYear ? endMonth : 12;
    for (let month = 1; month <= maxMonth; month++) {
      months.push({ year, month });
    }
  }
  return months;
}

function generateCashDenominations(totalCash) {
  // Distribute cash across denominations realistically
  const distribution = {
    ones: Math.floor(totalCash * 0.05),
    fives: Math.floor(totalCash * 0.10),
    tens: Math.floor(totalCash * 0.15),
    twenties: Math.floor(totalCash * 0.40),
    fifties: Math.floor(totalCash * 0.20),
    hundreds: Math.floor(totalCash * 0.10)
  };
  
  return distribution;
}

async function truncateAllTables() {
  console.log('🗑️ Truncating all tables...');
  
  try {
    // Disable foreign key checks
    await sequelize.query('PRAGMA foreign_keys = OFF');
    
    // Truncate in reverse dependency order
    await ExpenseSubmission.destroy({ where: {}, force: true });
    await Expense.destroy({ where: {}, force: true });
    await Reimbursement.destroy({ where: {}, force: true });
    await PastorGift.destroy({ where: {}, force: true });
    await Donation.destroy({ where: {}, force: true });
    await DonationSession.destroy({ where: {}, force: true });
    await Offering.destroy({ where: {}, force: true });
    await Donor.destroy({ where: {}, force: true });
    
    // Delete only member users, keep admin/treasurer users
    await User.destroy({ where: { role: 'member' }, force: true });
    
    // Re-enable foreign key checks
    await sequelize.query('PRAGMA foreign_keys = ON');
    
    console.log('✅ All tables truncated successfully');
  } catch (error) {
    console.error('❌ Error truncating tables:', error);
    throw error;
  }
}

async function createMembers() {
  console.log('👥 Creating 40 unique members with Indian names...');
  
  const hashedPassword = await bcrypt.hash('test123', 10);
  const members = [];
  const donors = [];
  
  for (let i = 0; i < memberNames.length; i++) {
    const [firstName, lastName] = memberNames[i].split(' ');
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@church.org`;
    
    // Create user
    const user = {
      name: memberNames[i],
      email: email,
      password: hashedPassword,
      role: 'member'
    };
    
    // Create donor
    const donor = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: `(555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      address: `${getRandomInt(100, 9999)} Church St, Atlanta, GA 30309`
    };
    
    members.push(user);
    donors.push(donor);
  }
  
  await User.bulkCreate(members);
  await Donor.bulkCreate(donors);
  
  console.log('✅ Created 40 members with login credentials');
  console.log('📧 Login format: firstname.lastname@church.org');
  console.log('🔑 Password: test123');
}

async function createWeeklyOfferings() {
  console.log('⛪ Generating weekly offerings for 2023-2025 (every Sunday)...');
  
  // Get all Sundays from 2023 to September 2025
  const sundays = getAllSundays(2023, 2025, 9);
  console.log(`📅 Found ${sundays.length} Sundays to process`);
  
  // Get admin user for entries
  const adminUser = await User.findOne({ where: { role: 'admin' } });
  if (!adminUser) {
    throw new Error('No admin user found');
  }
  
  // Get all donors
  const allDonors = await Donor.findAll();
  const reviewers = ['Rajesh Kumar', 'Priya Sharma', 'Amit Singh', 'Deepika Patel'];
  
  for (let i = 0; i < sundays.length; i++) {
    const sunday = sundays[i];
    const sessionDate = new Date(sunday);
    
    console.log(`📊 Processing ${sessionDate.toDateString()} (${i + 1}/${sundays.length})`);
    
    // Generate anonymous cash (500-1000 per week)
    const anonymousCash = getRandomAmount(500, 1000);
    
    // Generate 5-15 checks per week
    const numChecks = getRandomInt(5, 15);
    
    // Calculate target check total (1000-3000 per week total)
    const targetTotal = getRandomAmount(1000, 3000);
    const availableForChecks = targetTotal - anonymousCash;
    
    // Pastor offering (once per month - 20% chance, $100-200)
    const isPastorWeek = Math.random() < 0.2;
    const pastorGift = isPastorWeek ? getRandomAmount(100, 200) : 0;
    
    // Create session first
    const session = await DonationSession.create({
      sessionDate: sessionDate,
      totalDonations: 0, // Will update after creating donations
      cashAmount: 0,
      checkAmount: 0,
      pastorGift: pastorGift,
      netDeposit: 0,
      donationCount: 0,
      enteredBy: adminUser.id,
      reviewer1: reviewers[getRandomInt(0, 1)],
      reviewer2: reviewers[getRandomInt(2, 3)],
      notes: `Sunday offering - ${numChecks} checks, anonymous cash: $${anonymousCash.toFixed(2)}`
    });
    
    const donations = [];
    let totalAmount = anonymousCash;
    let totalCash = anonymousCash;
    let totalChecks = 0;
    
    // Generate check donations
    for (let j = 0; j < numChecks; j++) {
      const donor = allDonors[getRandomInt(0, allDonors.length - 1)];
      // Distribute remaining amount across checks
      const remainingChecks = numChecks - j;
      const remainingAmount = availableForChecks - totalChecks;
      const minAmount = Math.max(100, remainingAmount - (remainingChecks - 1) * 500);
      const maxAmount = Math.min(500, remainingAmount - (remainingChecks - 1) * 100);
      const amount = getRandomAmount(minAmount, maxAmount);
      const checkNumber = String(getRandomInt(1001, 9999));
      
      donations.push({
        donationDate: sessionDate,
        amount: amount,
        paymentMethod: 'Check',
        checkNumber: checkNumber,
        donorName: `${donor.firstName} ${donor.lastName}`,
        donationType: Math.random() < 0.8 ? 'Tithe' : 'Offering',
        donorId: donor.id,
        sessionId: session.id,
        enteredBy: adminUser.id
      });
      
      totalAmount += amount;
      totalChecks += amount;
    }
    
    // Generate 2-4 individual cash donations
    const numCashDonations = getRandomInt(2, 4);
    for (let k = 0; k < numCashDonations; k++) {
      const donor = allDonors[getRandomInt(0, allDonors.length - 1)];
      const amount = getRandomAmount(20, 200);
      
      donations.push({
        donationDate: sessionDate,
        amount: amount,
        paymentMethod: 'Cash',
        donorName: `${donor.firstName} ${donor.lastName}`,
        donationType: Math.random() < 0.8 ? 'Tithe' : 'Offering',
        donorId: donor.id,
        sessionId: session.id,
        enteredBy: adminUser.id
      });
      
      totalAmount += amount;
      totalCash += amount;
    }
    
    // Create all donations
    await Donation.bulkCreate(donations);
    
    const finalDeposit = totalAmount - pastorGift;
    
    // Update session totals
    await session.update({
      totalDonations: totalAmount,
      cashAmount: totalCash,
      checkAmount: totalChecks,
      netDeposit: finalDeposit,
      donationCount: donations.length
    });
    
    // Create corresponding Offering record
    const checks = donations
      .filter(d => d.paymentMethod === 'Check')
      .map(d => ({
        donor: d.donorName,
        amount: d.amount,
        checkNumber: d.checkNumber
      }));
    
    const individualCash = donations
      .filter(d => d.paymentMethod === 'Cash')
      .map(d => ({
        donor: d.donorName,
        amount: d.amount
      }));
    
    const cashDenominations = generateCashDenominations(anonymousCash);
    
    await Offering.create({
      date: sessionDate,
      checks: checks,
      cash: cashDenominations,
      individualCashDonations: individualCash,
      total: totalAmount,
      pastorGift: pastorGift,
      finalDeposit: finalDeposit,
      cashTotal: totalCash,
      checksTotal: totalChecks,
      status: 'approved', // All offerings approved and finalized
      sessionId: session.id,
      reviewer1: session.reviewer1,
      reviewer2: session.reviewer2,
      submittedBy: adminUser.id,
      submittedAt: sessionDate,
      updatedBy: adminUser.id,
      updatedAt: sessionDate
    });
    
    if (i % 20 === 0) {
      console.log(`   ✅ Processed ${i + 1}/${sundays.length} weeks`);
    }
  }
  
  console.log('✅ All weekly offerings generated successfully!');
}

async function createMonthlyAutoExpenses() {
  console.log('💳 Generating monthly auto-pay expenses (2023-2025)...');
  
  // Get admin user for auto expenses
  const adminUser = await User.findOne({ where: { role: 'admin' } });
  if (!adminUser) {
    throw new Error('No admin user found for auto expenses');
  }
  
  const startDate = new Date(2023, 0, 1);
  const endDate = new Date(2025, 8, 30); // Till September 2025
  
  const autoExpenses = [
    { description: 'Church Rent Payment', category: 'Facilities', amount: 2500 },
    { description: 'Electricity Bill', category: 'Utilities', amount: 450 },
    { description: 'Water & Sewer', category: 'Utilities', amount: 125 },
    { description: 'Internet & Phone', category: 'Communications', amount: 180 },
    { description: 'Insurance Premium', category: 'Insurance', amount: 675 },
    { description: 'Security System', category: 'Security', amount: 95 },
    { description: 'Cleaning Service', category: 'Maintenance', amount: 320 }
  ];
  
  let current = new Date(startDate);
  let monthCount = 0;
  
  while (current <= endDate) {
    monthCount++;
    const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
    
    for (const autoExpense of autoExpenses) {
      const expenseDate = new Date(monthStart);
      expenseDate.setDate(Math.floor(Math.random() * 28) + 1); // Random day in month
      
      await Expense.create({
        userId: adminUser.id,
        amount: autoExpense.amount + (Math.random() * 50 - 25), // ±$25 variation
        description: autoExpense.description,
        category: autoExpense.category,
        status: 'approved',
        submissionDate: expenseDate,
        approvedBy: adminUser.id,
        approvedDate: expenseDate,
        notes: 'Auto-generated monthly expense'
      });
    }
    
    current.setMonth(current.getMonth() + 1);
  }
  
  console.log(`📅 Processing ${monthCount} months of auto expenses`);
  console.log('✅ Monthly auto-pay expenses generated');
}

async function createWeeklyMemberExpenses() {
  console.log('📝 Generating weekly member expense submissions (2023-2025)...');
  
  const sundays = getAllSundays(2023, 2025, 9);
  const allMembers = await User.findAll({ where: { role: 'member' } });
  const adminUser = await User.findOne({ where: { role: 'admin' } });
  
  const expenseCategories = [
    'Office Supplies', 'Ministry Materials', 'Food & Refreshments', 
    'Transportation', 'Equipment', 'Books & Resources', 'Maintenance',
    'Marketing & Outreach', 'Events', 'Communications'
  ];
  
  let weekCount = 0;
  
  for (const sunday of sundays) {
    weekCount++;
    
    // Generate 2-5 expenses per week
    const numExpenses = getRandomInt(2, 5);
    
    for (let i = 0; i < numExpenses; i++) {
      const member = allMembers[getRandomInt(0, allMembers.length - 1)];
      const category = expenseCategories[getRandomInt(0, expenseCategories.length - 1)];
      const amount = getRandomAmount(25, 300);
      const expenseDate = new Date(sunday.getTime() + getRandomInt(0, 6) * 24 * 60 * 60 * 1000); // Random day of the week
      
      // Recent expenses (last 4 weeks) should be pending, rest approved
      const isRecent = weekCount > sundays.length - 4;
      const status = isRecent ? 'pending' : 'approved';
      
      await Expense.create({
        userId: member.id,
        description: `${category} - ${member.name}`,
        amount: amount,
        category: category,
        status: status,
        submissionDate: expenseDate,
        approvedBy: status === 'approved' ? adminUser.id : null,
        approvedDate: status === 'approved' ? expenseDate : null,
        notes: `Submitted by ${member.name} for ${category.toLowerCase()}`
      });
    }
    
    if (weekCount % 20 === 0) {
      console.log(`   ✅ Processed ${weekCount}/${sundays.length} weeks of expenses`);
    }
  }
  
  console.log('✅ Weekly member expenses generated successfully!');
}

function getAllMonths(startYear, endYear, endMonth = 12) {
  const months = [];
  for (let year = startYear; year <= endYear; year++) {
    const lastMonth = year === endYear ? endMonth : 12;
    for (let month = 1; month <= lastMonth; month++) {
      months.push({ year, month });
    }
  }
  return months;
}

async function validateExpenseToOfferingRatio() {
  console.log('⚖️ Validating expense to offering ratios...');
  
  const months = getAllMonths(2023, 2025, 9);
  
  for (const { year, month } of months) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    // Get monthly offerings
    const monthlyOfferings = await Donation.sum('amount', {
      where: {
        donationDate: {
          [require('sequelize').Op.between]: [startDate, endDate]
        }
      }
    }) || 0;

    // Get monthly expenses
    const monthlyExpenses = await Expense.sum('amount', {
      where: {
        submissionDate: {
          [require('sequelize').Op.between]: [startDate, endDate]
        }
      }
    }) || 0;    const ratio = monthlyExpenses / monthlyOfferings;
    
    if (ratio > 0.8) {
      console.log(`⚠️ Warning: ${year}-${month.toString().padStart(2, '0')} expenses (${monthlyExpenses.toFixed(2)}) are ${(ratio * 100).toFixed(1)}% of offerings (${monthlyOfferings.toFixed(2)})`);
    }
  }
  
  console.log('✅ Expense to offering ratio validation completed');
}

async function generateSummaryReport() {
  console.log('\n📊 COMPREHENSIVE GENERATION SUMMARY REPORT');
  console.log('==========================================');
  
  const userCount = await User.count();
  const donorCount = await Donor.count();
  const sessionCount = await DonationSession.count();
  const donationCount = await Donation.count();
  const offeringCount = await Offering.count();
  const expenseCount = await Expense.count();
  
  const totalDonations = await Donation.sum('amount') || 0;
  const totalPastorGifts = await DonationSession.sum('pastorGift') || 0;
  const totalDeposits = await DonationSession.sum('netDeposit') || 0;
  const totalExpenses = await Expense.sum('amount') || 0;
  
  const pendingExpenses = await Expense.count({ where: { status: 'pending' } });
  const approvedExpenses = await Expense.count({ where: { status: 'approved' } });
  
  console.log(`👥 Users Created: ${userCount}`);
  console.log(`🙏 Donors Created: ${donorCount}`);
  console.log(`📅 Sessions Created: ${sessionCount}`);
  console.log(`💰 Donations Created: ${donationCount}`);
  console.log(`⛪ Offerings Created: ${offeringCount}`);
  console.log(`📝 Expenses Created: ${expenseCount}`);
  console.log(`💵 Total Donations: $${totalDonations.toLocaleString()}`);
  console.log(`🎁 Total Pastor Gifts: $${totalPastorGifts.toLocaleString()}`);
  console.log(`🏦 Total Net Deposits: $${totalDeposits.toLocaleString()}`);
  console.log(`💳 Total Expenses: $${totalExpenses.toLocaleString()}`);
  console.log(`⏳ Pending Expenses: ${pendingExpenses}`);
  console.log(`✅ Approved Expenses: ${approvedExpenses}`);
  console.log(`📈 Net Cash Flow: $${(totalDeposits - totalExpenses).toLocaleString()}`);
  
  console.log('\n🔐 LOGIN CREDENTIALS:');
  console.log('Format: firstname.lastname@church.org');
  console.log('Password: test123');
  console.log('\nExample logins:');
  console.log('- rajesh.kumar@church.org');
  console.log('- priya.sharma@church.org');
  console.log('- amit.singh@church.org');
  
  console.log('\n📋 DATA FEATURES:');
  console.log('• Anonymous cash donations: $500-1000 per week');
  console.log('• Check donations: 5-15 per week, $100-500 each');
  console.log('• Total weekly offerings: $1000-3000');
  console.log('• Pastor offerings: Random monthly, $100-200');
  console.log('• Auto-pay expenses: Monthly recurring');
  console.log('• Member expenses: 2-5 per week');
  console.log('• Recent expenses: Pending approval');
  console.log('• All offerings: Approved and finalized');
}

async function main() {
  try {
    console.log('🚀 Starting Comprehensive Church Portal Data Generation');
    console.log('======================================================\n');
    
    // Step 1: Clear all data
    await truncateAllTables();
    
    // Step 2: Create members with Indian names
    await createMembers();
    
    // Step 3: Generate weekly offerings (2023-2025, every Sunday)
    await createWeeklyOfferings();
    
    // Step 4: Generate monthly auto-pay expenses
    await createMonthlyAutoExpenses();
    
    // Step 5: Generate weekly member expenses
    await createWeeklyMemberExpenses();
    
    // Step 6: Validate expense ratios
    await validateExpenseToOfferingRatio();
    
    // Step 7: Generate comprehensive summary
    await generateSummaryReport();
    
    console.log('\n🎉 Comprehensive data generation completed successfully!');
    console.log('You now have a complete church portal with:');
    console.log('- 40 members with Indian names');
    console.log('- Weekly offerings for every Sunday 2023-2025');
    console.log('- Monthly auto-pay expenses');
    console.log('- Weekly member expense submissions');
    console.log('- Realistic financial ratios');
    console.log('- Recent expenses pending approval');
    
  } catch (error) {
    console.error('❌ Error during data generation:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
main();