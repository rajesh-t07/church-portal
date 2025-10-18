#!/bin/bash

echo "👥 Adding test donors to the database..."
echo ""

cd /Users/SXT6582/church-portal/backend/src/utils

echo "=== ADDING VIJAY TALLURI ==="
sqlite3 database.sqlite "INSERT OR IGNORE INTO Donors (firstName, lastName, email, phone, isActive, createdAt, updatedAt) VALUES ('Vijay', 'Talluri', 'vijay.talluri@gmail.com', '972-123-4567', 1, datetime('now'), datetime('now'));"

echo "=== ADDING SANGEETH ==="
sqlite3 database.sqlite "INSERT OR IGNORE INTO Donors (firstName, lastName, email, phone, isActive, createdAt, updatedAt) VALUES ('Sangeeth', 'Kumar', 'sangeeth.kumar@gmail.com', '972-765-4321', 1, datetime('now'), datetime('now'));"

echo "=== ADDING A FEW MORE TEST DONORS ==="
sqlite3 database.sqlite "INSERT OR IGNORE INTO Donors (firstName, lastName, email, phone, isActive, createdAt, updatedAt) VALUES ('John', 'Smith', 'john.smith@gmail.com', '972-111-2222', 1, datetime('now'), datetime('now'));"

sqlite3 database.sqlite "INSERT OR IGNORE INTO Donors (firstName, lastName, email, phone, isActive, createdAt, updatedAt) VALUES ('Mary', 'Johnson', 'mary.johnson@gmail.com', '972-333-4444', 1, datetime('now'), datetime('now'));"

echo ""
echo "=== CHECKING INSERTED DONORS ==="
sqlite3 database.sqlite "SELECT id, firstName, lastName, email FROM Donors WHERE isActive = 1 ORDER BY firstName;"

echo ""
echo "✅ Test donors added! Now try typing 'vij' or 'san' in the donation entry form."