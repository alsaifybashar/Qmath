#!/bin/bash

# Qmath Development Restart Script
# Kills all running processes, clears cache, and restarts the dev server

echo "🔄 Restarting Qmath Development Server..."

# Ensure we're using Node 22
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
nvm use 22 || nvm install 22
echo "✅ Using Node $(node -v)"

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
echo "🔨 Ensuring better-sqlite3 is built for $(node -v)..."
npm rebuild better-sqlite3

echo "🚀 Starting development server on port 3000..."
npm run dev
