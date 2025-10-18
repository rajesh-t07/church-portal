#!/bin/bash

echo "=== Church Portal Status Check ==="
echo ""

# Check if backend is running
echo "1. Checking if backend is running on port 4000..."
if lsof -ti:4000 > /dev/null; then
    echo "✅ Backend is running on port 4000"
    echo "   Process: $(ps -p $(lsof -ti:4000) -o comm=)"
else
    echo "❌ Backend is NOT running on port 4000"
    echo "   You need to start the backend:"
    echo "   cd /Users/SXT6582/church-portal/backend"
    echo "   npm start"
fi

echo ""

# Check if database file exists
echo "2. Checking database file..."
if [ -f "/Users/SXT6582/church-portal/backend/database.sqlite" ]; then
    echo "✅ Database file exists"
    echo "   Size: $(du -h /Users/SXT6582/church-portal/backend/database.sqlite | cut -f1)"
else
    echo "❌ Database file does not exist"
fi

echo ""

# Check if frontend is running
echo "3. Checking if frontend is running on port 3000..."
if lsof -ti:3000 > /dev/null; then
    echo "✅ Frontend is running on port 3000"
else
    echo "❌ Frontend is NOT running on port 3000"
    echo "   You need to start the frontend:"
    echo "   cd /Users/SXT6582/church-portal/frontend"
    echo "   npm start"
fi

echo ""
echo "=== Status Check Complete ==="