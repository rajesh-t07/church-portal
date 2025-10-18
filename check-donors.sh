#!/bin/bash

echo "🔍 Checking for donors in the database..."
echo ""

cd /Users/SXT6582/church-portal/backend/src/utils

echo "=== CHECKING DONORS TABLE ==="
sqlite3 database.sqlite "SELECT id, firstName, lastName, email, createdAt FROM Donors WHERE isActive = 1 ORDER BY firstName;"

echo ""
echo "=== CHECKING DONATIONS WITH 'VIJAY' OR 'SANGEETH' ==="
sqlite3 database.sqlite "SELECT id, donorName, amount, donationDate FROM Donations WHERE donorName LIKE '%vijay%' OR donorName LIKE '%Vijay%' OR donorName LIKE '%sangeeth%' OR donorName LIKE '%Sangeeth%' ORDER BY donationDate DESC LIMIT 10;"

echo ""
echo "=== TOTAL COUNTS ==="
echo -n "Total Donors: "
sqlite3 database.sqlite "SELECT COUNT(*) FROM Donors WHERE isActive = 1;"

echo -n "Total Donations: "
sqlite3 database.sqlite "SELECT COUNT(*) FROM Donations;"

echo ""
echo "=== RECENT DONATION NAMES ==="
sqlite3 database.sqlite "SELECT DISTINCT donorName FROM Donations ORDER BY donorName LIMIT 20;"