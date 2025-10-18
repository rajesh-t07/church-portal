#!/bin/bash

echo "🔄 Restarting backend server to apply Sequelize association fixes..."
echo ""

# Kill any existing node processes running the backend
pkill -f "src/app.js"

# Wait a moment
sleep 2

# Start the backend server in the background
cd /Users/SXT6582/church-portal/backend
nohup npm start > ../backend.log 2>&1 &

echo "✅ Backend server restarted!"
echo "📋 You can check the logs with: tail -f backend.log"
echo ""
echo "🔧 Fixed the Sequelize association issue:"
echo "   - Added 'as: \"Donor\"' to Donation->Donor includes"
echo "   - Individual donor reports should now work without errors"