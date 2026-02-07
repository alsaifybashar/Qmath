#!/bin/bash

# Qmath Development Restart Script
# Kills all running processes, clears cache, and restarts the dev server

echo "🔄 Restarting Qmath Development Server..."

# Kill any node/next processes
echo "📦 Stopping existing processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "node.*qmath" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 1

# Clear Next.js cache
echo "🧹 Clearing cache..."
rm -rf .next

# Start the development server
echo "🚀 Starting development server on port 3000..."
npm run dev
