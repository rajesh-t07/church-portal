#!/bin/bash

echo "🔄 Restarting backend and adding test donors..."
echo ""

# Kill existing backend
pkill -f "src/app.js"
sleep 2

# Add test donors
echo "👥 Adding test donors..."
chmod +x add-test-donors.sh
./add-test-donors.sh

echo ""
echo "🚀 Starting backend server..."
cd /Users/SXT6582/church-portal/backend
nohup npm start > ../backend.log 2>&1 &

echo ""
echo "✅ Backend restarted with fixes!"
echo "📋 Changes made:"
echo "   - Fixed API parameter mismatch (query -> q)"
echo "   - Improved searchDonors response format"
echo "   - Added test donors: Vijay Talluri, Sangeeth Kumar"
echo ""
echo "🧪 Test the autocomplete:"
echo "   1. Go to Record Offerings page"
echo "   2. Type 'vij' in the Donor Name field"
echo "   3. You should see 'Vijay Talluri' in the dropdown"