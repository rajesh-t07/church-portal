#!/bin/bash

echo "👥 Creating donor records from existing donations..."
echo ""

cd /Users/SXT6582/church-portal/backend

echo "=== CHECKING CURRENT DONORS ==="
echo "Current donors in Donors table:"
sqlite3 database.sqlite "SELECT id, firstName, lastName FROM Donors WHERE isActive = 1;"

echo ""
echo "=== FINDING UNIQUE DONORS FROM DONATIONS ==="
echo "Unique donor names from Donations table:"
sqlite3 database.sqlite "SELECT DISTINCT donorName, COUNT(*) as donation_count, SUM(amount) as total_amount FROM Donations WHERE donorName IS NOT NULL AND donorName != '' GROUP BY donorName ORDER BY total_amount DESC;"

echo ""
echo "=== CREATING DONOR RECORDS FROM DONATIONS ==="

# Get unique donor names and create records
sqlite3 database.sqlite "
-- Create donors from donations where they don't already exist
INSERT OR IGNORE INTO Donors (firstName, lastName, email, phone, isActive, createdAt, updatedAt, totalDonations)
SELECT 
  CASE 
    WHEN instr(trim(donorName), ' ') > 0 
    THEN substr(trim(donorName), 1, instr(trim(donorName), ' ') - 1)
    ELSE trim(donorName)
  END as firstName,
  CASE 
    WHEN instr(trim(donorName), ' ') > 0 
    THEN trim(substr(trim(donorName), instr(trim(donorName), ' ') + 1))
    ELSE ''
  END as lastName,
  NULL as email,
  NULL as phone,
  1 as isActive,
  datetime('now') as createdAt,
  datetime('now') as updatedAt,
  SUM(amount) as totalDonations
FROM Donations 
WHERE donorName IS NOT NULL 
  AND donorName != '' 
  AND trim(donorName) NOT IN (
    SELECT trim(firstName || ' ' || lastName) 
    FROM Donors 
    WHERE isActive = 1
  )
GROUP BY trim(donorName);
"

echo ""
echo "=== LINKING DONATIONS TO DONOR RECORDS ==="

# Update donations to link them to donor records
sqlite3 database.sqlite "
UPDATE Donations 
SET donorId = (
  SELECT d.id 
  FROM Donors d 
  WHERE trim(d.firstName || ' ' || d.lastName) = trim(Donations.donorName)
  AND d.isActive = 1
  LIMIT 1
)
WHERE donorId IS NULL 
  AND donorName IS NOT NULL 
  AND donorName != '';
"

echo ""
echo "=== UPDATING DONOR TOTALS ==="

# Update donor totals and last donation dates
sqlite3 database.sqlite "
UPDATE Donors 
SET 
  totalDonations = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM Donations 
    WHERE donorId = Donors.id
  ),
  lastDonationDate = (
    SELECT MAX(donationDate) 
    FROM Donations 
    WHERE donorId = Donors.id
  ),
  updatedAt = datetime('now')
WHERE id IN (
  SELECT DISTINCT donorId 
  FROM Donations 
  WHERE donorId IS NOT NULL
);
"

echo ""
echo "=== FINAL RESULTS ==="
echo "All donors now in the system:"
sqlite3 database.sqlite "SELECT id, firstName, lastName, email, totalDonations, lastDonationDate FROM Donors WHERE isActive = 1 ORDER BY totalDonations DESC;"

echo ""
echo "=== DONATION LINKAGE CHECK ==="
echo "Donations with donor links:"
sqlite3 database.sqlite "SELECT COUNT(*) as linked_donations FROM Donations WHERE donorId IS NOT NULL;"
echo "Donations without donor links:"
sqlite3 database.sqlite "SELECT COUNT(*) as unlinked_donations FROM Donations WHERE donorId IS NULL;"

echo ""
echo "✅ All donors who have made donations are now in the members list!"
echo "📊 Check the Donor Management page to see everyone."