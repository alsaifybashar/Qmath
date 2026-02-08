# Qmath - Adaptive Learning Platform

Qmath is an AI-driven intelligent tutoring system designed for university-level mathematics. It combines adaptive learning algorithms with AI-powered content generation and a comprehensive exam archive to provide students with personalized practice and access to historical exam materials.

**🤖 Powered by Anthropic Claude** for intelligent math problem generation

> **🔑 Quick Reference**
> 
> **Student Login**: `test@qmath.se` / `test123456`  
> **Admin Login**: `admin@qmath.se` / `admin123456`  
> **Admin Panel**: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## ✨ Features

### For Students
- **Adaptive Learning Engine**: IRT-based question selection with Bayesian Knowledge Tracing
- **AI-Generated Content**: Dynamic problem generation using Claude AI with multiple content types
- **Free-Form Symbolic Input**: Enter mathematical expressions with real-time LaTeX preview and equivalence checking
- **Exam Archive**: Search and download old exams from various courses (liutentor.se inspired)
- **Spaced Repetition**: Optimized review scheduling for long-term retention
- **Real-time Progress Tracking**: Visual analytics of mastery across topics
- **Minimal Design**: Clean, modern interface with centered search

### For Administrators
- **Comprehensive Admin Panel**: Full-featured dashboard with sidebar navigation
- **Dashboard**: Real-time stats, activity feeds, top courses, system status
- **User Management**: Promote/demote admins, view user activity, delete accounts
- **Exam Management**: Upload, edit, delete exams with download statistics
- **Exam Upload API**: Upload exam PDFs for AI-powered question extraction
- **Activity Logs**: Monitor all system events with filtering and search
- **Settings**: Configure site settings, file uploads, and system preferences

### General
- **Dark Mode**: Full dark theme support throughout the platform
- **Role-Based Access**: Student and admin roles with protected routes
- **Session Management**: Secure JWT-based authentication

---

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/Qmath.git
cd Qmath

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# 4. Initialize database
npm run db:push

# 5. Seed with sample data
npm run db:seed
npm run db:seed:admin    # Create admin user
npm run db:seed:exams    # Add sample exams

# 6. Start development server
npm run dev

# 7. Open http://localhost:3000
```

### 🔐 Default Login Credentials

After running the seed scripts, use these credentials to log in:

#### **Student Account**
- **Email**: `test@qmath.se`
- **Password**: `test123456`
- **Access**: Exam archive, adaptive learning, progress tracking

#### **Admin Account**
- **Email**: `admin@qmath.se`
- **Password**: `admin123456`
- **Access**: Full admin panel + all student features

#### Admin Panel Routes:
- `/admin` - Dashboard with stats and activity
- `/admin/users` - User management
- `/admin/exams` - Exam management  
- `/admin/upload-exam` - Upload new exams
- `/admin/logs` - Activity logs
- `/admin/settings` - System settings

---

## 📦 Environment Setup

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="file:./qmath.db"

# NextAuth
AUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# AI Content Generation (Anthropic Claude)
ANTHROPIC_API_KEY="your-anthropic-api-key"
AI_PROVIDER="anthropic"  # or "mock" for development without API

# Optional: For production
NODE_ENV="development"
```

### Generate Auth Secret

```bash
openssl rand -base64 32
```

---

## 🗄️ Database

Qmath uses **SQLite** for local development with Drizzle ORM for type-safe queries.

### Database Schema

| Table | Description |
|-------|-------------|
| `users` | Authentication (email, password, role) |
| `profiles` | Student profiles (university, program, GPA target) |
| `universities` | University catalog |
| `courses` | Course catalog per university |
| `topics` | Learning topics with prerequisites |
| `questions` | Practice problems (MCQ, numeric, proof) |
| `userMastery` | BKT mastery tracking per topic |
| `attemptLogs` | Interaction logs for analytics |
| `exams` | Exam archive metadata (course, date, PDF path) |
| `source_exams` | **NEW**: Uploaded source exams for AI processing |
| `exam_questions` | **NEW**: Extracted questions from source exams |
| `course_areas` | **NEW**: Curriculum areas for content organization |
| `generated_content` | **NEW**: AI-generated content with polymorphic data |
| `content_attempts` | **NEW**: Student attempts on generated content |
| `content_quality` | **NEW**: Quality metrics for generated content |

### Database Commands

```bash
npm run db:push          # Apply schema to database
npm run db:generate      # Generate migrations
npm run db:studio        # Open Drizzle Studio (visual DB browser)
npm run db:seed          # Seed sample learning data
npm run db:seed:admin    # Create admin user (admin@qmath.se / admin123456)
npm run db:seed:exams    # Seed sample exam files
npm run db:reset         # Clear and re-seed database
```

### Drizzle Studio

Browse and edit your database visually:

```bash
npm run db:studio
# Opens at https://local.drizzle.studio
```

---

## 📂 Project Structure

```
Qmath/
├── app/                        # Next.js App Router
│   ├── actions/                # Server Actions
│   │   ├── auth.ts             # Authentication actions
│   │   ├── user.ts             # User profile actions
│   │   ├── courses.ts          # Course/topic queries
│   │   └── engine.ts           # Learning engine
│   ├── api/                    # API Routes
│   │   ├── exams/
│   │   │   ├── search/         # Public exam search
│   │   │   └── download/[id]/  # Protected download
│   │   ├── content/            # AI Content APIs (NEW)
│   │   │   ├── generate/       # Generate AI content
│   │   │   ├── validate/       # Validate math answers
│   │   │   └── upload-exam/    # Upload exam for processing
│   │   └── admin/
│   │       └── upload-exam/    # Admin exam upload
│   ├── (auth)/                 # Auth pages (login, register)
│   ├── dashboard/              # Student dashboard
│   ├── features/               # Features showcase (NEW)
│   ├── archive/                # Exam archive (liutentor.se style)
│   ├── admin/                  # Admin panel
│   │   ├── page.tsx            # Dashboard with stats
│   │   ├── users/              # User management
│   │   ├── exams/              # Exam management
│   │   ├── upload-exam/        # Exam upload form
│   │   ├── logs/               # Activity logs
│   │   └── settings/           # System settings
│   └── study/                  # Practice interface
├── components/                 # React components
│   ├── Header.tsx              # Main navigation
│   ├── AdminLayout.tsx         # Admin sidebar layout
│   ├── ExamResultsTable.tsx    # Exam search results
│   ├── LoginPromptModal.tsx    # Auth prompt
│   └── content/                # AI Content Components (NEW)
│       ├── FreeFormInput.tsx   # Symbolic math input
│       ├── ContentCard.tsx     # AI content display cards
│       └── index.ts            # Component exports
├── db/                         # Database layer
│   ├── drizzle.ts              # DB connection
│   ├── schema.ts               # Core table definitions
│   ├── content-schema.ts       # AI content tables (NEW)
│   └── seeds/                  # Seed scripts
│       ├── seed.ts             # Main data
│       ├── seed-admin.ts       # Admin user
│       └── seed-exams.ts       # Sample exams
├── lib/                        # Utilities
│   ├── adaptive-engine/        # Learning algorithms
│   └── content-generation/     # AI Content Generation (NEW)
│       ├── content-generator.ts # Main generator with Anthropic
│       ├── symbolic-validator.ts # Math equivalence checker
│       ├── types.ts            # TypeScript definitions
│       ├── prompts/            # AI prompt templates
│       │   ├── free-form-symbolic.ts
│       │   ├── faded-example.ts
│       │   ├── parsons-problem.ts
│       │   └── error-spotting.ts
│       └── index.ts            # Exports
├── scripts/                    # CLI scripts
│   └── test-ai-generation.ts   # Test AI content generation
├── uploads/                    # Uploaded files
│   └── exams/                  # Exam PDFs by course
├── auth.ts                     # NextAuth config
├── auth.config.ts              # Auth callbacks
├── middleware.ts               # Route protection
└── drizzle.config.ts           # Drizzle Kit config
```

---

## 🎓 User Roles & Access

### Student (Default)
- ✅ Access adaptive learning practice
- ✅ Search and download exams (requires login)
- ✅ View personal progress and analytics
- ✅ Track mastery across topics
- 🔒 **No admin panel access**

### Administrator
**All student permissions PLUS:**
- ✅ **Dashboard** (`/admin`) - View stats, activity feed, top courses, system status
- ✅ **User Management** (`/admin/users`) - Promote/demote admins, delete users, search
- ✅ **Exam Management** (`/admin/exams`) - View all exams, download stats, delete
- ✅ **Upload Exams** (`/admin/upload-exam`) - Add new exam PDFs to archive
- ✅ **Activity Logs** (`/admin/logs`) - Monitor system events, filter by type
- ✅ **Settings** (`/admin/settings`) - Configure site, users, file uploads

### Default Credentials

After running `npm run db:seed` and `npm run db:seed:admin`:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Student** | `test@qmath.se` | `test123456` | Public pages + exam archive |
| **Admin** | `admin@qmath.se` | `admin123456` | All features + admin panel |

> **Note**: Both accounts have full access to the exam archive and adaptive learning features. The admin account additionally has access to the complete admin panel.

---

## 📚 Exam Archive Feature

The exam archive mimics the design and functionality of liutentor.se, allowing students to search for and download old exams.

### For Students

1. Navigate to `/archive` or click "Old Exams" in the header
2. Search by course code (e.g., "SF1672", "TATA24")
3. Browse results with exam date, type, and solution indicator
4. Click download (login required)

### For Admins

1. Log in with admin credentials
2. Navigate to `/admin/upload-exam`
3. Fill out exam metadata:
   - Course code (e.g., SF1672)
   - Course name (e.g., Linear Algebra)
   - Exam date
   - Exam type (Final, Midterm, Retake)
   - Has solution (checkbox)
4. Upload PDF file
5. Exam appears in search results immediately

### How It Works

- **Public search**: `/api/exams/search?q={courseCode}`
- **Protected download**: `/api/exams/download/{id}` (requires auth)
- **File storage**: PDFs stored in `/uploads/exams/{courseCode}/`
- **Login modal**: Prompts unauthenticated users to sign in

---

## 🎛️ Admin Panel

The admin panel provides comprehensive control over the Qmath platform with a clean sidebar navigation interface.

### Accessing the Admin Panel

1. Log in with admin credentials (`admin@qmath.se` / `admin123456`)
2. Navigate to `/admin` or click your profile menu
3. Use the sidebar to navigate between admin sections

### Admin Pages Overview

#### 1. **Dashboard** (`/admin`)
- **Overview Stats**: Total users, exams, downloads, searches
- **Activity Feed**: Recent user registrations, exam uploads, downloads
- **Top Courses**: Most downloaded exams ranking
- **System Status**: Database, API, Authentication health
- **Storage Info**: Current storage usage visualization
- **Alerts**: System notifications and warnings

#### 2. **User Management** (`/admin/users`)
- **User Statistics**: Total users, admins, students breakdown
- **Search Functionality**: Filter users by email or name
- **User Table**: Display all users with avatar, name, email, role, join date
- **Actions**:
  - 🔼 Promote student to admin
  - 🔽 Demote admin to student
  - 🗑️ Delete user account (with confirmation)
- **Protection**: Cannot delete your own account

#### 3. **Exam Management** (`/admin/exams`)
- **Exam Statistics**: Total exams, with solutions, downloads, unique courses
- **Search & Filter**: Find exams by course code or name
- **Exam Table**: Course, date, type, solution status, size, downloads
- **Actions**:
  - 👁️ View exam details
  - ✏️ Edit exam metadata
  - 🗑️ Delete exam (removes file and database entry)
- **Quick Upload**: Direct link to upload page

#### 4. **Upload Exam** (`/admin/upload-exam`)
- **Form Fields**:
  - Course Code (e.g., SF1672)
  - Course Name (e.g., Linear Algebra)
  - Exam Date (date picker)
  - Exam Type (Final/Midterm/Retake dropdown)
  - Has Solution (checkbox)
  - PDF File upload
- **Validation**: PDF-only, file size limits
- **Auto-organization**: Files stored in `/uploads/exams/{courseCode}/`
- **Instant availability**: Exams appear in search immediately

#### 5. **Activity Logs** (`/admin/logs`)
- **Event Tracking**: All system activities logged with timestamps
- **Filter Options**: All, User Register, Exam Upload, Exam Download, Role Change, Error
- **Log Details**:
  - Event type with color-coded icons
  - User email who performed action
  - IP address
  - Metadata (course codes, affected resources)
  - Relative and absolute timestamps
- **Statistics**: Event counts by category

#### 6. **Settings** (`/admin/settings`)
- **General Settings**:
  - Site Name configuration
  - Site URL
  - Support Email
- **User Settings**:
  - Allow/disable new registrations
  - Require email verification toggle
  - Enable notifications
- **File Upload Settings**:
  - Maximum file size (MB)
  - Allowed file types
- **Database Actions**:
  - Export database
  - Clear cache
- **System Info**: Version, database type, Node.js, Next.js versions

### Admin Panel Features

✅ **Sidebar Navigation**: Persistent navigation across all admin pages  
✅ **Responsive Design**: Works on desktop and tablet  
✅ **Real-time Stats**: Live updates of key metrics  
✅ **Role-Based Access**: Automatic redirect for non-admin users  
✅ **Dark Mode**: Full theme support  
✅ **Search & Filter**: Quick find functionality on all pages  
✅ **Confirmation Dialogs**: Prevent accidental destructive actions  

---

## 🧠 Adaptive Learning Engine

Qmath uses three complementary algorithms:

### 1. Item Response Theory (IRT)
- Estimates student ability (θ)
- Selects questions at optimal difficulty
- 3-Parameter Logistic (3PL) model

### 2. Bayesian Knowledge Tracing (BKT)
- Tracks mastery probability per topic: P(Learned)
- Updates after each attempt using Bayes' theorem
- Mastery threshold: P(L) > 0.95

### 3. Spaced Repetition (SM-2/FSRS)
- Schedules reviews for long-term retention
- Interval expansion on success
- Interval reset on forgetting

> For detailed formulas and implementation, see [`ADAPTIVE_ENGINE_LOGIC.md`](./ADAPTIVE_ENGINE_LOGIC.md)

---

## 🤖 AI Content Generation

Qmath uses **Anthropic Claude** to dynamically generate mathematics problems tailored to each topic and difficulty level.

### Supported Content Types

| Type | Description | Status |
|------|-------------|--------|
| **Free-Form Symbolic** | Enter mathematical expressions with equivalence checking | ✅ Complete |
| **Faded Worked Examples** | Step-by-step solutions with progressive blanks | 🚧 Template Ready |
| **Parsons Problems** | Arrange proof steps in correct order | 🚧 Template Ready |
| **Error Spotting** | Find mistakes in given solutions | 🚧 Template Ready |
| **Multiple Choice** | AI-generated distractors | 📋 Planned |
| **Numeric Input** | Exact value with tolerance | 📋 Planned |
| **Matrix Input** | Grid-based matrix entry | 📋 Planned |
| **Graph Sketching** | Interactive function plotting | 📋 Planned |

### Free-Form Symbolic Input

The flagship feature allows students to enter mathematical expressions:

- **Real-time LaTeX Preview**: See rendered math as you type
- **Confidence Tagging**: Students rate their confidence (affects scoring)
- **Progressive Hints**: 3 AI-generated hints per problem
- **Mathematical Equivalence**: `x+1` and `1+x` are correctly marked equivalent
- **Detailed Explanations**: Step-by-step solutions after submission

### Testing AI Generation

```bash
# Test with your Anthropic API key
DATABASE_URL="file:./qmath.db" npx tsx scripts/test-ai-generation.ts
```

Example output:
```
✅ Anthropic API key found
📚 Using topic: Vectors in Rⁿ
🤖 Generating free-form symbolic content...
✅ Content generated successfully!
📝 Problem: Find the magnitude of vector sum
⏱️  Generation time: 8531ms
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/content/generate` | POST | Generate new AI content |
| `/api/content/validate` | POST | Validate student answers |
| `/api/content/upload-exam` | POST | Upload exam for processing |

### Configuration

```env
# Required for AI generation
ANTHROPIC_API_KEY="sk-ant-..."

# Provider selection
AI_PROVIDER="anthropic"  # or "mock" for development
```

---

## 🛠️ Development Workflow

### Daily Development

```bash
# Start dev server
npm run dev

# Open in browser
open http://localhost:3000

# View database
npm run db:studio
```

### Making Schema Changes

```bash
# 1. Edit db/schema.ts

# 2. Push changes to database
npm run db:push

# 3. (Optional) Generate migration for production
npm run db:generate

# 4. Re-seed if needed
npm run db:seed
```

### Adding New Features

1. **Create API route** in `app/api/` if needed
2. **Add server action** in `app/actions/` for data operations
3. **Update schema** in `db/schema.ts` if new tables required
4. **Create components** in `components/`
5. **Add page** in `app/`

---

## 🎨 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 16, React 19 | UI, routing, SSR |
| **Styling** | Tailwind CSS, Framer Motion | Responsive design, animations |
| **Auth** | NextAuth.js v5 | Session management, JWT |
| **Database** | SQLite | Local-first data storage |
| **ORM** | Drizzle ORM | Type-safe queries |
| **AI** | **Anthropic Claude** | Content generation, math problems |
| **Math Rendering** | KaTeX | LaTeX equations |
| **File Upload** | Next.js FormData API | Exam PDF handling |
| **Icons** | Lucide React | Consistent iconography |

---

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Apply schema to database |
| `npm run db:generate` | Generate migrations |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed` | Seed learning data |
| `npm run db:seed:admin` | Create admin user |
| `npm run db:seed:exams` | Seed sample exams |
| `npm run db:reset` | Clear and re-seed DB |
| `npx tsx scripts/test-ai-generation.ts` | Test AI content generation |

---

## 🚀 Deployment

### Environment Variables (Production)

```env
# Database (for production, consider PostgreSQL)
DATABASE_URL="file:./qmath.db"  # or PostgreSQL connection string

# Auth
AUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://yourdomain.com"

# AI Content Generation
ANTHROPIC_API_KEY="sk-ant-..."
AI_PROVIDER="anthropic"

# Node
NODE_ENV="production"
```

### Build and Deploy

```bash
# 1. Build the application
npm run build

# 2. Run migrations (if using PostgreSQL)
npm run db:push

# 3. Seed initial data
npm run db:seed
npm run db:seed:admin

# 4. Start production server
npm start

# OR use PM2 for process management
pm2 start npm --name "qmath" -- start
```

### Docker Deployment (Optional)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/db ./db
RUN npm ci --production
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🔒 Security

### Authentication & Authorization
- ✅ Passwords hashed with bcryptjs (10 rounds)
- ✅ HTTP-only session cookies
- ✅ JWT-based session management with NextAuth v5
- ✅ Role-based access control (admin vs student)
- ✅ Session validation on every admin route

### Route Protection
- ✅ Protected routes via middleware
- ✅ Admin panel routes require `role: 'admin'` in session
- ✅ Automatic redirect for unauthorized access
- ✅ Cannot delete own admin account (self-protection)

### Data Protection
- ✅ Exam PDFs served via authenticated API (not publicly accessible)
- ✅ File uploads validated (PDF only, size limits)
- ✅ SQL injection protection via Drizzle ORM
- ✅ CSRF protection via NextAuth
- ✅ User emails stored with unique constraints

### Admin Panel Security
- ✅ All admin actions require authentication check
- ✅ Confirmation dialogs for destructive actions (delete user, delete exam)
- ✅ Activity logging for audit trail
- ✅ IP address tracking for security events

---

## 📝 License

© 2026 Qmath EdTech AB. All rights reserved.

---

## 🆘 Troubleshooting

### Database Issues

```bash
# Reset database completely
rm -rf db/qmath.db
npm run db:push
npm run db:seed
```

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Missing Dependencies

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📧 Support

For questions or issues, please open an issue on GitHub or contact support@qmath.se.
