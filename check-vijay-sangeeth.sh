#!/bin/bash

echo "🔍 Checking for Vijay and Sangeeth in donations and expenses..."
echo ""

cd /Users/SXT6582/church-portal/backend/src/utils

echo "=== DONATIONS WITH VIJAY/SANGEETH ==="
sqlite3 database.sqlite "SELECT donorName, COUNT(*) as count, SUM(amount) as total FROM Donations WHERE donorName LIKE '%vijay%' OR donorName LIKE '%Vijay%' OR donorName LIKE '%sangeeth%' OR donorName LIKE '%Sangeeth%' GROUP BY donorName;"

echo ""
echo "=== EXPENSES WITH VIJAY/SANGEETH ==="
sqlite3 database.sqlite "SELECT submittedBy, COUNT(*) as count, SUM(amount) as total FROM ExpenseSubmissions WHERE submittedBy LIKE '%vijay%' OR submittedBy LIKE '%Vijay%' OR submittedBy LIKE '%sangeeth%' OR submittedBy LIKE '%Sangeeth%' GROUP BY submittedBy;"

echo ""
echo "=== CURRENT DONORS TABLE ==="
sqlite3 database.sqlite "SELECT firstName, lastName, email FROM Donors WHERE isActive = 1;"

echo ""
echo "=== ALL UNIQUE DONOR NAMES FROM DONATIONS ==="
sqlite3 database.sqlite "SELECT DISTINCT donorName FROM Donations WHERE donorName LIKE '%vijay%' OR donorName LIKE '%Vijay%' OR donorName LIKE '%sangeeth%' OR donorName LIKE '%Sangeeth%' ORDER BY donorName;"