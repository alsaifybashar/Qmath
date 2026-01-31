#!/usr/bin/env bash
# =============================================================================
# Qmath Database Setup Script
# =============================================================================
# This script helps you set up the PostgreSQL database for Qmath.
# It supports both Docker and native PostgreSQL installations.
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                    Qmath Database Setup                    ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check for Docker
check_docker() {
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        echo -e "${GREEN}✓ Docker and Docker Compose found${NC}"
        return 0
    elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
        echo -e "${GREEN}✓ Docker with Compose plugin found${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ Docker not found${NC}"
        return 1
    fi
}

# Check for native PostgreSQL
check_postgres() {
    if command -v psql &> /dev/null; then
        echo -e "${GREEN}✓ PostgreSQL client found${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ PostgreSQL client not found${NC}"
        return 1
    fi
}

# Setup with Docker
setup_docker() {
    echo -e "\n${BLUE}Setting up PostgreSQL with Docker...${NC}"
    
    # Check if container is already running
    if docker ps | grep -q qmath_db; then
        echo -e "${GREEN}✓ qmath_db container is already running${NC}"
    else
        # Check if container exists but is stopped
        if docker ps -a | grep -q qmath_db; then
            echo "Starting existing qmath_db container..."
            docker start qmath_db
        else
            echo "Creating new PostgreSQL container..."
            docker compose up -d postgres
        fi
        
        # Wait for PostgreSQL to be ready
        echo "Waiting for PostgreSQL to be ready..."
        sleep 3
        
        # Check health
        for i in {1..30}; do
            if docker exec qmath_db pg_isready -U qmath -d qmath &> /dev/null; then
                echo -e "${GREEN}✓ PostgreSQL is ready!${NC}"
                break
            fi
            echo "  Waiting... ($i/30)"
            sleep 1
        done
    fi
    
    # Set the DATABASE_URL
    DATABASE_URL="postgresql://qmath:qmath_dev_password_2026@localhost:5432/qmath"
    
    # Update .env.local
    update_env_file "$DATABASE_URL"
}

# Setup with native PostgreSQL
setup_native() {
    echo -e "\n${BLUE}Setting up native PostgreSQL...${NC}"
    echo ""
    echo "Please ensure PostgreSQL is running and provide connection details:"
    echo ""
    
    read -p "PostgreSQL host [localhost]: " PG_HOST
    PG_HOST=${PG_HOST:-localhost}
    
    read -p "PostgreSQL port [5432]: " PG_PORT
    PG_PORT=${PG_PORT:-5432}
    
    read -p "PostgreSQL user [postgres]: " PG_USER
    PG_USER=${PG_USER:-postgres}
    
    read -sp "PostgreSQL password: " PG_PASS
    echo ""
    
    read -p "Database name [qmath]: " PG_DB
    PG_DB=${PG_DB:-qmath}
    
    DATABASE_URL="postgresql://${PG_USER}:${PG_PASS}@${PG_HOST}:${PG_PORT}/${PG_DB}"
    
    # Try to create the database if it doesn't exist
    echo -e "\n${BLUE}Attempting to create database...${NC}"
    PGPASSWORD="$PG_PASS" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -c "CREATE DATABASE $PG_DB;" 2>/dev/null || \
        echo -e "${YELLOW}Database '$PG_DB' may already exist (this is fine)${NC}"
    
    # Update .env.local
    update_env_file "$DATABASE_URL"
}

# Update .env.local file
update_env_file() {
    local db_url=$1
    
    echo -e "\n${BLUE}Updating .env.local...${NC}"
    
    # Create or update .env.local
    if [ -f .env.local ]; then
        # Remove existing DATABASE_URL line
        grep -v "^DATABASE_URL=" .env.local > .env.local.tmp || true
        mv .env.local.tmp .env.local
    fi
    
    # Add the new DATABASE_URL
    echo "DATABASE_URL=\"$db_url\"" >> .env.local
    
    echo -e "${GREEN}✓ DATABASE_URL configured${NC}"
}

# Run migrations
run_migrations() {
    echo -e "\n${BLUE}Running database migrations...${NC}"
    npx drizzle-kit push
    echo -e "${GREEN}✓ Migrations complete${NC}"
}

# Run seed
run_seed() {
    echo -e "\n${BLUE}Seeding database with sample data...${NC}"
    npx tsx db/seeds/seed.ts
}

# Main menu
main() {
    echo "How would you like to run PostgreSQL?"
    echo ""
    echo "  1) Docker (Recommended) - Isolated, easy to manage"
    echo "  2) Native PostgreSQL    - Use existing installation"
    echo "  3) Skip database setup  - I'll configure it manually"
    echo ""
    read -p "Select option [1]: " choice
    choice=${choice:-1}
    
    case $choice in
        1)
            if check_docker; then
                setup_docker
            else
                echo -e "\n${RED}Docker is required for this option.${NC}"
                echo "Install Docker: https://docs.docker.com/get-docker/"
                exit 1
            fi
            ;;
        2)
            if check_postgres; then
                setup_native
            else
                echo -e "\n${RED}PostgreSQL client is required for this option.${NC}"
                echo "Install PostgreSQL: https://www.postgresql.org/download/"
                exit 1
            fi
            ;;
        3)
            echo -e "\n${YELLOW}Skipping database setup.${NC}"
            echo "Please configure DATABASE_URL in .env.local manually."
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            exit 1
            ;;
    esac
    
    # Run migrations
    run_migrations
    
    # Ask about seeding
    echo ""
    read -p "Would you like to seed the database with sample data? [Y/n]: " seed_choice
    seed_choice=${seed_choice:-Y}
    
    if [[ $seed_choice =~ ^[Yy] ]]; then
        run_seed
    fi
    
    echo -e "\n${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                    Setup Complete! 🎉                      ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Start the development server: npm run dev"
    echo "  2. Open http://localhost:3000"
    echo "  3. Login with: test@qmath.se / test123456"
    echo ""
}

# Run main
main
