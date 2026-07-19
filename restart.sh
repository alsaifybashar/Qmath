#!/bin/bash

# Qmath Development Restart Script
# Kills all running processes, clears cache, and restarts the dev server

set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔄 Restarting Qmath Development Server..."

echo "✅ Using Node $(node -v)"

# Empty or invalid PORT (for example WSLENV forwarding) breaks `next dev`.
if [ -z "${PORT:-}" ] || ! [[ "${PORT}" =~ ^[0-9]+$ ]] || [ "${PORT}" -lt 1 ] || [ "${PORT}" -gt 65535 ]; then
  unset PORT
fi

DEV_PORT="${PORT:-3000}"
DEV_AUTH_URL="http://localhost:${DEV_PORT}"

# Auth.js rejects untrusted Host headers by default. This trust is deliberately
# scoped to the child development process; production must opt in separately at
# its trusted reverse proxy. Exported values override a stale port in .env.local.
export AUTH_TRUST_HOST="true"
export AUTH_URL="$DEV_AUTH_URL"
export NEXTAUTH_URL="$DEV_AUTH_URL"
export DOTENV_CONFIG_QUIET="true"

# Kill any node/next processes and python math engine
echo "📦 Stopping existing processes..."
fuser -k 3000/tcp 2>/dev/null || true
fuser -k 3001/tcp 2>/dev/null || true
fuser -k 8000/tcp 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
pkill -f "node.*qmath" 2>/dev/null || true
pkill -f "uvicorn.*main:app" 2>/dev/null || true
sleep 1

# Clear Next.js cache (fall back when .next was created as root/Docker)
clear_next_cache() {
  local dir="${1:-.next}"
  if [ ! -d "$dir" ]; then
    return 0
  fi
  if rm -rf "$dir" 2>/dev/null; then
    return 0
  fi
  if [ "$dir" = ".next" ]; then
    echo "⚠️  Cannot remove .next (permission denied — often from a prior root/Docker run)."
    echo "   Using .next-local instead. To reclaim .next: sudo rm -rf .next"
    export NEXT_DIST_DIR=".next-local"
    rm -rf "$NEXT_DIST_DIR" 2>/dev/null || true
    return 0
  fi
  echo "⚠️  Failed to clear $dir cache."
  return 1
}

echo "🧹 Clearing cache..."
clear_next_cache ".next"

# Ensure local environment file is created
if [ ! -f .env.local ]; then
  echo "🔑 .env.local not found. Creating default configuration..."
  if command -v openssl >/dev/null 2>&1; then
    AUTH_SECRET="$(openssl rand -base64 48)"
  elif [ -r /dev/urandom ] && command -v base64 >/dev/null 2>&1; then
    AUTH_SECRET="$(head -c 48 /dev/urandom | base64)"
  else
    echo "❌ Cannot generate AUTH_SECRET: install openssl or provide .env.local."
    exit 1
  fi
  cat <<EOF > .env.local
# Database
DATABASE_URL="file:./qmath.db"

# NextAuth
AUTH_SECRET="$AUTH_SECRET"
AUTH_URL="$DEV_AUTH_URL"
NEXTAUTH_URL="$DEV_AUTH_URL"

# AI Content Generation
AI_PROVIDER="mock"
EOF
  echo "✅ Created .env.local with secure AUTH_SECRET."
fi

# Ensure Node.js dependencies match the current lockfile. This also installs
# newly added native dependencies such as argon2 after a security update.
if [ ! -d node_modules ] || [ ! -f node_modules/.package-lock.json ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  echo "📦 Installing updated Node.js dependencies..."
  PUPPETEER_SKIP_DOWNLOAD=true npm install
  echo "✅ Node.js dependencies installed."
fi

# Ensure Python virtual environment and dependencies are set up
MATH_VENV_PYTHON="math-engine/venv/bin/python"
if [ ! -x "$MATH_VENV_PYTHON" ]; then
  echo "🐍 Python virtual environment not found. Setting up..."
  if ! command -v python3 >/dev/null 2>&1; then
    echo "❌ python3 is required but not installed."
    exit 1
  fi
  python3 -m venv --without-pip math-engine/venv
  echo "📥 Installing pip in virtual environment..."
  if ! curl -fsS https://bootstrap.pypa.io/get-pip.py -o math-engine/get-pip.py; then
    echo "❌ Failed to download get-pip.py"
    exit 1
  fi
  "$MATH_VENV_PYTHON" math-engine/get-pip.py
  rm -f math-engine/get-pip.py
  echo "📦 Installing Python math-engine dependencies..."
  math-engine/venv/bin/pip install fastapi uvicorn sympy pydantic
  echo "✅ Python virtual environment set up successfully."
fi

# Ensure database is pushed and seeded
if [ ! -f qmath.db ] || [ ! -s qmath.db ]; then
  echo "🗄️ Database not found or empty. Initializing..."
  npm run db:push
  echo "🌱 Seeding database with initial data..."
  npm run db:seed
  npm run db:seed:exams
  echo "✅ Database initialized and seeded successfully."
fi

# Existing databases also need additive authentication/RBAC migrations.
echo "🔐 Applying idempotent security database migration..."
if ! npm run db:migrate:security; then
  echo "❌ Security database migration failed; refusing to start the application."
  exit 1
fi

# Start the development server
echo "🔨 Ensuring better-sqlite3 is built for $(node -v)..."
npm rebuild better-sqlite3

echo "🧮 Starting Python math-engine on port 8000..."
(cd math-engine && ./venv/bin/python -m uvicorn main:app --reload --port 8000) &
MATH_PID=$!

cleanup() {
  echo '🛑 Stopping math-engine...'
  kill "$MATH_PID" 2>/dev/null || true
  wait "$MATH_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "🚀 Starting Next.js development server on port ${DEV_PORT}..."
echo "🔒 Auth.js trusted development origin: ${DEV_AUTH_URL}"
npm run dev -- -p "${DEV_PORT}"
