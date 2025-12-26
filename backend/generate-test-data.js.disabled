const { User, Donor, DonationSession, Donation, Offering, Expense, ExpenseSubmission, Reimbursement, PastorGift } = require('./src/models');
const bcrypt = require('bcryptjs'); // Use bcryptjs instead of bcrypt
const { sequelize } = require('./src/models');

// Expense categories and auto-recurring expenses
const expenseCategories = [
  'Office Supplies', 'Utilities', 'Maintenance', 'Travel', 'Food & Beverages',
  'Ministry Materials', 'Technology', 'Insurance', 'Communications', 'Other'
];

const recurringExpenses = [
  { description: 'Monthly Rent', amount: 2500, category: 'Utilities', day: 1 },
  { description: 'Electricity Bill', amount: 350, category: 'Utilities', day: 15 },
  { description: 'Water Bill', amount: 120, category: 'Utilities', day: 10 },
  { description: 'Internet Service', amount: 89, category: 'Communications', day: 5 },
  { description: 'Phone Service', amount: 150, category: 'Communications', day: 8 },
  { description: 'Insurance Premium', amount: 450, category: 'Insurance', day: 1 },
  { description: 'Cleaning Service', amount: 200, category: 'Maintenance', day: 20 },
  { description: 'Security System', amount: 85, category: 'Maintenance', day: 12 }
];

const memberExpenseTypes = [
  { description: 'Ministry Event Supplies', category: 'Ministry Materials', minAmount: 25, maxAmount: 200 },
  { description: 'Office Supplies Purchase', category: 'Office Supplies', minAmount: 15, maxAmount: 150 },
  { description: 'Travel Reimbursement', category: 'Travel', minAmount: 50, maxAmount: 300 },
  { description: 'Food for Event', category: 'Food & Beverages', minAmount: 30, maxAmount: 400 },
  { description: 'Technology Equipment', category: 'Technology', minAmount: 100, maxAmount: 800 },
  { description: 'Building Maintenance', category: 'Maintenance', minAmount: 25, maxAmount: 500 }
];
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

// Auto-recurring expenses (monthly)
const autoExpenses = [
  { description: 'Church Rent', amount: 1200, category: 'Facility' },
  { description: 'Electricity Bill', amount: 350, category: 'Utilities' },
  { description: 'Water Bill', amount: 120, category: 'Utilities' },
  { description: 'Internet & Phone', amount: 180, category: 'Communication' },
  { description: 'Security System', amount: 85, category: 'Security' },
  { description: 'Cleaning Services', amount: 200, category: 'Maintenance' },
  { description: 'Insurance Premium', amount: 450, category: 'Insurance' }
];

// Reimbursable expense categories
const expenseCategories = [
  'Office Supplies', 'Ministry Materials', 'Food & Refreshments', 'Transportation',
  'Event Supplies', 'Equipment Maintenance', 'Guest Speaker', 'Youth Ministry',
  'Outreach Programs', 'Books & Resources'
];

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

async function truncateAllTables() {
  console.log('🗑️ Truncating ALL tables...');
  
  try {
    // Disable foreign key checks
    await sequelize.query('PRAGMA foreign_keys = OFF');
    
    // Truncate in reverse dependency order
    await Reimbursement.destroy({ where: {}, force: true });
    await Expense.destroy({ where: {}, force: true });
    await ExpenseSubmission.destroy({ where: {}, force: true });
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
    // Re-enable foreign keys even on error
    await sequelize.query('PRAGMA foreign_keys = ON');
    throw error;
  }
}

async function createMembers() {
  console.log('👥 Creating 40 unique members...');
  
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
  console.log('⛪ Generating weekly offerings for 2023-2025...');
  
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
  
  const reviewers = ['John Smith', 'Mary Johnson', 'David Wilson', 'Sarah Brown'];
  
  for (let i = 0; i < sundays.length; i++) {
    const sunday = sundays[i];
    const sessionDate = new Date(sunday);
    
    console.log(`📊 Processing ${sessionDate.toDateString()} (${i + 1}/${sundays.length})`);
    
    // Generate random number of checks (2-14)
    const numChecks = getRandomInt(2, 14);
    
    // Generate anonymous cash (300-1000)
    const anonymousCash = getRandomAmount(300, 1000);
    
    // Random pastor gift (20% chance, $20-$100)
    const hasPastorGift = Math.random() < 0.2;
    const pastorGift = hasPastorGift ? getRandomAmount(20, 100) : 0;
    
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
    let totalAmount = 0;
    let totalCash = anonymousCash;
    let totalChecks = 0;
    
    // Generate check donations
    for (let j = 0; j < numChecks; j++) {
      const donor = allDonors[getRandomInt(0, allDonors.length - 1)];
      const amount = getRandomAmount(25, 500);
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
    
    // Generate 2-5 individual cash donations
    const numCashDonations = getRandomInt(2, 5);
    for (let k = 0; k < numCashDonations; k++) {
      const donor = allDonors[getRandomInt(0, allDonors.length - 1)];
      const amount = getRandomAmount(10, 200);
      
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
    
    totalAmount += anonymousCash;
    const finalDeposit = totalAmount - pastorGift;
    
    // Update session totals
    await session.update({
      totalDonations: totalAmount,
      cashAmount: totalCash,
      checkAmount: totalChecks,
      netDeposit: finalDeposit,
      donationCount: donations.length
    });
    
    // Create corresponding Offering record (for compatibility)
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
    
    const cashDenominations = {
      ones: Math.floor(anonymousCash * 0.1),
      fives: Math.floor(anonymousCash * 0.15),
      tens: Math.floor(anonymousCash * 0.2),
      twenties: Math.floor(anonymousCash * 0.3),
      fifties: Math.floor(anonymousCash * 0.15),
      hundreds: Math.floor(anonymousCash * 0.1)
    };
    
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
      status: 'approved',
      sessionId: session.id,
      reviewer1: session.reviewer1,
      reviewer2: session.reviewer2,
      submittedBy: adminUser.id,
      submittedAt: sessionDate,
      updatedBy: adminUser.id,
      updatedAt: sessionDate
    });
    
    if (i % 10 === 0) {
      console.log(`   ✅ Processed ${i + 1}/${sundays.length} weeks`);
    }
  }
  
  console.log('✅ All weekly offerings generated successfully!');
}

async function createMonthlyRecurringExpenses() {
  console.log('💰 Generating monthly recurring expenses...');
  
  // Get admin user for auto expenses
  const adminUser = await User.findOne({ where: { role: 'admin' } });
  if (!adminUser) {
    throw new Error('No admin user found');
  }
  
  // Generate for each month from 2023 to Sept 2025
  const months = [];
  for (let year = 2023; year <= 2025; year++) {
    const endMonth = year === 2025 ? 9 : 12;
    for (let month = 1; month <= endMonth; month++) {
      months.push({ year, month });
    }
  }
  
  console.log(`📅 Processing ${months.length} months of recurring expenses`);
  
  for (const { year, month } of months) {
    for (const recurringExpense of recurringExpenses) {
      const expenseDate = new Date(year, month - 1, recurringExpense.day);
      
      // Add small random variation to amounts (±5%)
      const variation = 1 + (Math.random() - 0.5) * 0.1;
      const amount = Math.round(recurringExpense.amount * variation * 100) / 100;
      
      await Expense.create({
        userId: adminUser.id,
        amount: amount,
        description: recurringExpense.description,
        category: recurringExpense.category,
        status: 'approved',
        submissionDate: expenseDate,
        approvedBy: adminUser.id,
        approvedDate: expenseDate,
        notes: 'Auto-generated recurring expense'
      });
    }
  }
  
  console.log('✅ Monthly recurring expenses generated successfully!');
}

async function createMemberExpenses() {
  console.log('💳 Generating member expense submissions...');
  
  // Get all members and admin
  const allUsers = await User.findAll();
  const members = allUsers.filter(u => u.role === 'member');
  const adminUser = allUsers.find(u => u.role === 'admin');
  
  if (!adminUser) {
    throw new Error('No admin user found');
  }
  
  // Generate 3-8 expenses per member per year
  let totalExpenses = 0;
  
  for (const member of members) {
    for (let year = 2023; year <= 2025; year++) {
      const endMonth = year === 2025 ? 9 : 12;
      const expensesThisYear = getRandomInt(3, 8);
      
      for (let i = 0; i < expensesThisYear; i++) {
        const month = getRandomInt(1, endMonth);
        const day = getRandomInt(1, 28);
        const expenseDate = new Date(year, month - 1, day);
        
        const expenseType = memberExpenseTypes[getRandomInt(0, memberExpenseTypes.length - 1)];
        const amount = getRandomAmount(expenseType.minAmount, expenseType.maxAmount);
        
        // Random status: 70% approved, 20% pending, 10% rejected
        const rand = Math.random();
        let status, approvedBy, approvedDate;
        
        if (rand < 0.7) {
          status = 'approved';
          approvedBy = adminUser.id;
          approvedDate = new Date(expenseDate.getTime() + (Math.random() * 7 * 24 * 60 * 60 * 1000)); // Approved within a week
        } else if (rand < 0.9) {
          status = 'pending';
          approvedBy = null;
          approvedDate = null;
        } else {
          status = 'rejected';
          approvedBy = adminUser.id;
          approvedDate = new Date(expenseDate.getTime() + (Math.random() * 7 * 24 * 60 * 60 * 1000));
        }
        
        const expense = await Expense.create({
          userId: member.id,
          amount: amount,
          description: expenseType.description,
          category: expenseType.category,
          status: status,
          submissionDate: expenseDate,
          approvedBy: approvedBy,
          approvedDate: approvedDate,
          notes: `Submitted by ${member.name}`
        });
        
        // Create reimbursement for approved expenses (80% chance)
        if (status === 'approved' && Math.random() < 0.8) {
          const reimbursementDate = new Date(approvedDate.getTime() + (Math.random() * 14 * 24 * 60 * 60 * 1000)); // Within 2 weeks
          await Reimbursement.create({
            expenseId: expense.id,
            treasurerId: adminUser.id,
            reimbursedAt: reimbursementDate
          });
        }
        
        totalExpenses++;
      }
    }
  }
  
  console.log(`✅ Generated ${totalExpenses} member expenses with reimbursements!`);
}

async function createPastorGifts() {
  console.log('🎁 Generating pastor gifts...');
  
  // Get admin user
  const adminUser = await User.findOne({ where: { role: 'admin' } });
  if (!adminUser) {
    throw new Error('No admin user found');
  }
  
  // Get all Sundays (same as offerings)
  const sundays = getAllSundays(2023, 2025, 9);
  
  let pastorGiftCount = 0;
  
  for (const sunday of sundays) {
    // 20% chance of pastor gift each week
    if (Math.random() < 0.2) {
      const amount = getRandomAmount(20, 100);
      
      await PastorGift.create({
        weekDate: sunday,
        amount: amount,
        notes: `Weekly pastor gift - ${sunday.toDateString()}`,
        enteredBy: adminUser.id
      });
      
      pastorGiftCount++;
    }
  }
  
  console.log(`✅ Generated ${pastorGiftCount} pastor gifts!`);
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
  const reimbursementCount = await Reimbursement.count();
  const pastorGiftCount = await PastorGift.count();
  
  const totalDonations = await Donation.sum('amount') || 0;
  const totalOfferings = await Offering.sum('total') || 0;
  const totalExpenses = await Expense.sum('amount') || 0;
  const totalReimbursements = await Reimbursement.count() || 0;
  const totalPastorGifts = await PastorGift.sum('amount') || 0;
  
  // Expense breakdown by status
  const approvedExpenses = await Expense.count({ where: { status: 'approved' } });
  const pendingExpenses = await Expense.count({ where: { status: 'pending' } });
  const rejectedExpenses = await Expense.count({ where: { status: 'rejected' } });
  
  console.log('👥 USERS & DONORS:');
  console.log(`   Users Created: ${userCount}`);
  console.log(`   Donors Created: ${donorCount}`);
  
  console.log('\n� DONATIONS & OFFERINGS:');
  console.log(`   Sessions Created: ${sessionCount}`);
  console.log(`   Individual Donations: ${donationCount}`);
  console.log(`   Offering Records: ${offeringCount}`);
  console.log(`   Total Donations: $${totalDonations.toLocaleString()}`);
  console.log(`   Total Offerings: $${totalOfferings.toLocaleString()}`);
  
  console.log('\n💳 EXPENSES & REIMBURSEMENTS:');
  console.log(`   Total Expenses: ${expenseCount}`);
  console.log(`   - Approved: ${approvedExpenses}`);
  console.log(`   - Pending: ${pendingExpenses}`);
  console.log(`   - Rejected: ${rejectedExpenses}`);
  console.log(`   Total Expense Amount: $${totalExpenses.toLocaleString()}`);
  console.log(`   Reimbursements Processed: ${totalReimbursements}`);
  
  console.log('\n🎁 PASTOR GIFTS:');
  console.log(`   Pastor Gifts Created: ${pastorGiftCount}`);
  console.log(`   Total Pastor Gifts: $${totalPastorGifts.toLocaleString()}`);
  
  console.log('\n💵 FINANCIAL SUMMARY:');
  const netIncome = totalOfferings - totalExpenses - totalPastorGifts;
  console.log(`   Total Income: $${totalOfferings.toLocaleString()}`);
  console.log(`   Total Expenses: $${totalExpenses.toLocaleString()}`);
  console.log(`   Pastor Gifts: $${totalPastorGifts.toLocaleString()}`);
  console.log(`   Net Income: $${netIncome.toLocaleString()}`);
  
  console.log('\n🔐 LOGIN CREDENTIALS:');
  console.log('Format: firstname.lastname@church.org');
  console.log('Password: test123');
  console.log('\nExample logins:');
  console.log('- john.smith@church.org');
  console.log('- mary.johnson@church.org');
  console.log('- david.wilson@church.org');
  
  console.log('\n📋 DATA TIMEFRAME:');
  console.log('- Donations: Every Sunday from Jan 2023 to Sep 2025');
  console.log('- Recurring Expenses: Monthly from Jan 2023 to Sep 2025');
  console.log('- Member Expenses: 3-8 per member per year');
  console.log('- Pastor Gifts: Random 20% of Sundays');
}

async function main() {
  try {
    console.log('🚀 Starting COMPREHENSIVE Church Portal Data Generation');
    console.log('======================================================\n');
    
    // Step 1: Truncate all existing data
    await truncateAllTables();
    
    // Step 2: Create members and donors
    await createMembers();
    
    // Step 3: Generate weekly offerings (2023-2025)
    await createWeeklyOfferings();
    
    // Step 4: Generate monthly recurring expenses
    await createMonthlyRecurringExpenses();
    
    // Step 5: Generate member expense submissions
    await createMemberExpenses();
    
    // Step 6: Generate pastor gifts
    await createPastorGifts();
    
    // Step 7: Generate comprehensive summary
    await generateSummaryReport();
    
    console.log('\n🎉 COMPREHENSIVE data generation completed successfully!');
    console.log('=====================================');
    console.log('Your church portal now has:');
    console.log('✅ 40 member accounts with login credentials');
    console.log('✅ 3+ years of weekly offering data');
    console.log('✅ Monthly recurring expenses (rent, utilities, etc.)');
    console.log('✅ Member expense submissions and reimbursements');
    console.log('✅ Pastor gifts and comprehensive reporting data');
    console.log('\nYou can now explore the full system functionality!');
    
  } catch (error) {
    console.error('❌ Error during comprehensive data generation:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
main();