#!/bin/bash

echo "🚀 Adding individualCashDonations column to database..."
echo ""

cd /Users/SXT6582/church-portal
node add-individual-cash-column.js

echo ""
echo "✅ Migration completed!"
echo "Now you can test the individual cash donations in your deposit slips."