const { User, Donation, Donor, DonationSession, PastorGift, Expense, Reimbursement } = require('./src/models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// List of 20 church members with realistic names
const churchMembers = [
  { firstName: 'John', lastName: 'Smith' },
  { firstName: 'Mary', lastName: 'Johnson' },
  { firstName: 'David', lastName: 'Williams' },
  { firstName: 'Sarah', lastName: 'Brown' },
  { firstName: 'Michael', lastName: 'Davis' },
  { firstName: 'Lisa', lastName: 'Miller' },
  { firstName: 'Robert', lastName: 'Wilson' },
  { firstName: 'Jennifer', lastName: 'Moore' },
  { firstName: 'William', lastName: 'Taylor' },
  { firstName: 'Linda', lastName: 'Anderson' },
  { firstName: 'Richard', lastName: 'Thomas' },
  { firstName: 'Patricia', lastName: 'Jackson' },
  { firstName: 'Charles', lastName: 'White' },
  { firstName: 'Barbara', lastName: 'Harris' },
  { firstName: 'Joseph', lastName: 'Martin' },
  { firstName: 'Susan', lastName: 'Thompson' },
  { firstName: 'Thomas', lastName: 'Garcia' },
  { firstName: 'Jessica', lastName: 'Martinez' },
  { firstName: 'Christopher', lastName: 'Robinson' },
  { firstName: 'Nancy', lastName: 'Clark' }
];

// Helper function to get all Sundays in a year
function getAllSundays(year) {
  const sundays = [];
  const date = new Date(year, 0, 1); // Start of year
  
  // Find first Sunday
  while (date.getDay() !== 0) {
    date.setDate(date.getDate() + 1);
  }
  
  // Get all Sundays
  while (date.getFullYear() === year) {
    sundays.push(new Date(date));
    date.setDate(date.getDate() + 7);
  }
  
  return sundays;
}

// Helper function to generate random amount
function randomAmount(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to pick random members
function getRandomMembers(count) {
  const shuffled = [...churchMembers].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function generateTestData() {
  try {
    console.log('🎯 Starting test data generation...');
    
    // Clear existing donation and expense data (keep users and donors)
    console.log('🧹 Clearing existing offering and expense data...');
    await Donation.destroy({ where: {} });
    await DonationSession.destroy({ where: {} });
    await PastorGift.destroy({ where: {} });
    await Reimbursement.destroy({ where: {} });
    await Expense.destroy({ where: {} });
    
    console.log('✅ Cleared existing data');
    
    // Get existing users and donors
    console.log('👥 Loading existing users and donors...');
    const existingUsers = await User.findAll({
      where: {
        email: {
          [Op.like]: '%@gmail.com'
        }
      }
    });
    
    const existingDonors = await Donor.findAll();
    
    // Use existing users and donors
    const createdDonors = [];
    const createdUsers = [];
    
    for (const member of churchMembers) {
      const email = `${member.firstName.toLowerCase()}.${member.lastName.toLowerCase()}@gmail.com`;
      
      // Find existing user
      let user = existingUsers.find(u => u.email === email);
      
      if (user) {
        console.log(`   Found existing user: ${user.name}`);
        createdUsers.push(user);
      } else {
        console.log(`   User not found: ${email}`);
        continue; // Skip if user doesn't exist
      }
      
      // Find existing donor
      let donor = existingDonors.find(d => 
        d.firstName === member.firstName && d.lastName === member.lastName
      );
      
      if (donor) {
        console.log(`   Found existing donor: ${donor.firstName} ${donor.lastName}`);
        createdDonors.push(donor);
      } else {
        // Create donor if it doesn't exist
        try {
          donor = await Donor.create({
            firstName: member.firstName,
            lastName: member.lastName,
            email: email,
            phone: `555-${Math.floor(Math.random() * 9000) + 1000}`,
            address: `${Math.floor(Math.random() * 9999) + 1} Church St`,
            city: 'Hometown',
            state: 'TX',
            zipCode: '75001'
          });
          console.log(`   Created donor: ${donor.firstName} ${donor.lastName}`);
          createdDonors.push(donor);
        } catch (error) {
          console.log(`   Error creating donor for ${member.firstName} ${member.lastName}:`, error.message);
        }
      }
    }
    
    console.log(`✅ Working with ${createdUsers.length} users and ${createdDonors.length} donors`);
    
    // If no users found, use admin as fallback
    if (createdUsers.length === 0) {
      console.log('⚠️  No member users found, using admin user as fallback');
      const adminUser = await User.findOne({ where: { role: 'admin' } });
      if (adminUser) {
        createdUsers.push(adminUser);
        console.log(`   Using admin user: ${adminUser.name}`);
      } else {
        throw new Error('No users found at all - cannot proceed');
      }
    }
    
    // Generate data for 2024 and 2025
    for (const year of [2024, 2025]) {
      console.log(`📅 Generating data for ${year}...`);
      const sundays = getAllSundays(year);
      
      for (const sunday of sundays) {
        console.log(`   📊 Processing ${sunday.toDateString()}...`);
        
        // Create donation session (simulating data entry)
        if (createdUsers.length === 0) {
          throw new Error('No users available to enter donations');
        }
        
        const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
        console.log(`   Using user: ${randomUser.name} (ID: ${randomUser.id})`);
        
        const session = await DonationSession.create({
          sessionDate: sunday,
          enteredBy: randomUser.id,
          totalDonations: 0, // Will update after adding donations
          cashAmount: 0,
          checkAmount: 0,
          pastorGift: 0,
          netDeposit: 0, // Will update after calculating pastor gift
          donationCount: 0,
          notes: `Weekly offerings for ${sunday.toDateString()}`
        });
        
        let weekTotalCash = 0;
        let weekTotalChecks = 0;
        let weekDonationCount = 0;
        
        // Add cash offering (always present, $200-$1000)
        const cashAmount = randomAmount(200, 1000);
        await Donation.create({
          donorName: 'Cash Collection',
          amount: cashAmount,
          paymentMethod: 'cash',
          donationType: 'tithe',
          donationDate: sunday,
          sessionId: session.id,
          enteredBy: randomUser.id
        });
        weekTotalCash += cashAmount;
        weekDonationCount += 1;
        
        // Add individual check donations (3-8 people per week)
        const numCheckDonors = randomAmount(3, 8);
        const weekDonors = getRandomMembers(numCheckDonors);
        
        for (const donor of weekDonors) {
          const checkAmount = randomAmount(10, 100);
          const checkNumber = Math.floor(Math.random() * 9000) + 1000;
          const donorRecord = createdDonors.find(d => 
            d.firstName === donor.firstName && d.lastName === donor.lastName
          );
          
          await Donation.create({
            donorId: donorRecord.id,
            donorName: `${donor.firstName} ${donor.lastName}`,
            amount: checkAmount,
            paymentMethod: 'check',
            checkNumber: checkNumber.toString(),
            donationType: 'tithe',
            donationDate: sunday,
            sessionId: session.id,
            enteredBy: randomUser.id
          });
          weekTotalChecks += checkAmount;
          weekDonationCount += 1;
        }
        
        // Calculate pastor gift for this week (if any)
        let weekPastorGift = 0;
        if (Math.random() < 0.4) {
          weekPastorGift = randomAmount(20, 100);
          await PastorGift.create({
            weekDate: sunday,
            amount: weekPastorGift,
            notes: `Weekly pastor gift - taken from ${Math.random() < 0.7 ? 'cash' : 'check'}`,
            enteredBy: randomUser.id
          });
        }
        
        // Calculate totals
        const weekTotalDonations = weekTotalCash + weekTotalChecks;
        const weekNetDeposit = weekTotalDonations - weekPastorGift;
        
        // Update session totals
        await session.update({
          totalDonations: weekTotalDonations,
          cashAmount: weekTotalCash,
          checkAmount: weekTotalChecks,
          pastorGift: weekPastorGift,
          netDeposit: weekNetDeposit,
          donationCount: weekDonationCount
        });
      }
    }
    
    // Generate expenses for various months
    console.log('💰 Creating expense submissions...');
    const expenseCategories = [
      'Office Supplies', 'Utilities', 'Maintenance', 'Food & Catering', 
      'Transportation', 'Books & Materials', 'Event Expenses', 'Miscellaneous'
    ];
    
    const expenseDescriptions = {
      'Office Supplies': ['Printer paper', 'Pens and pencils', 'Folders', 'Staples'],
      'Utilities': ['Electric bill', 'Water bill', 'Internet service', 'Phone service'],
      'Maintenance': ['Plumbing repair', 'HVAC service', 'Cleaning supplies', 'Light bulbs'],
      'Food & Catering': ['Fellowship dinner', 'Coffee supplies', 'Youth group snacks', 'Potluck items'],
      'Transportation': ['Gas for church van', 'Vehicle maintenance', 'Parking fees', 'Bus rental'],
      'Books & Materials': ['Sunday school materials', 'Bibles', 'Workbooks', 'Art supplies'],
      'Event Expenses': ['Conference registration', 'Retreat costs', 'Speaker fees', 'Decorations'],
      'Miscellaneous': ['Bank fees', 'Postage', 'Software license', 'Equipment rental']
    };
    
    // Create expenses for each quarter of 2024 and 2025
    for (const year of [2024, 2025]) {
      console.log(`💰 Creating expenses for ${year}...`);
      for (let quarter = 1; quarter <= 4; quarter++) {
        const numExpenses = randomAmount(5, 12); // 5-12 expenses per quarter
        
        for (let i = 0; i < numExpenses; i++) {
          // Only use users that we know exist
          if (createdUsers.length === 0) {
            console.log('⚠️  No users available for expense creation, skipping...');
            break;
          }
          
          const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
          const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
          const descriptions = expenseDescriptions[category];
          const description = descriptions[Math.floor(Math.random() * descriptions.length)];
          
          // Random date within the quarter
          const startMonth = (quarter - 1) * 3 + 1;
          const month = startMonth + Math.floor(Math.random() * 3);
          const day = Math.floor(Math.random() * 28) + 1;
          const expenseDate = new Date(year, month - 1, day);
          
          const amount = randomAmount(15, 300);
          
          try {
            const expense = await Expense.create({
              userId: randomUser.id,
              description: description,
              amount: amount,
              category: category,
              submissionDate: expenseDate,
              receiptUrl: null,
              status: 'approved',
              submissionId: Math.floor(Math.random() * 900000) + 100000
            });
            
            // Create reimbursement record (mark as paid)
            await Reimbursement.create({
              expenseId: expense.id,
              amount: amount,
              reimbursementDate: new Date(expenseDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000), // Within 30 days
              treasurerId: createdUsers[0].id, // First user as treasurer
              notes: 'Approved and reimbursed',
              status: 'completed'
            });
          } catch (error) {
            console.log(`   Error creating expense: ${error.message}`);
          }
        }
      }
    }
    
    console.log('🎉 Test data generation completed successfully!');
    console.log('📊 Summary:');
    console.log(`   👥 Working with ${churchMembers.length} church members`);
    console.log(`   📅 Generated offerings for all Sundays in 2024 and 2025`);
    console.log(`   💰 Created random pastor gifts throughout both years`);
    console.log(`   🧾 Generated quarterly expense submissions for both years`);
    console.log('');
    console.log('🔑 Login credentials for all members:');
    console.log('   Email: firstname.lastname@gmail.com');
    console.log('   Password: test123');
    console.log('');
    console.log('🎯 You can now test the reporting functionality with realistic data!');
    
  } catch (error) {
    console.error('❌ Error generating test data:', error);
  }
}

// Run the script
generateTestData();