#!/bin/bash

# Qmath Development Restart Script
# Kills all running processes, clears cache, and restarts the dev server

echo "🔄 Restarting Qmath Development Server..."

echo "✅ Using Node $(node -v)"

# Kill any node/next processes and python math engine
echo "📦 Stopping existing processes..."
fuser -k 3000/tcp 2>/dev/null || true
fuser -k 3001/tcp 2>/dev/null || true
fuser -k 8000/tcp 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
pkill -f "node.*qmath" 2>/dev/null || true
pkill -f "uvicorn" 2>/dev/null || true
sleep 1

# Clear Next.js cache
echo "🧹 Clearing cache..."
rm -rf .next

# Start the development server
echo "🔨 Ensuring better-sqlite3 is built for $(node -v)..."
npm rebuild better-sqlite3

echo "🧮 Starting Python math-engine on port 8000..."
(cd math-engine && ./venv/bin/python -m uvicorn main:app --reload --port 8000) &
MATH_PID=$!

# Ensure the Python process is cleaned up when Next.js stops
trap "echo '🛑 Stopping math-engine...'; kill $MATH_PID 2>/dev/null" EXIT INT TERM

echo "🚀 Starting Next.js development server on port 3000..."
npm run dev
