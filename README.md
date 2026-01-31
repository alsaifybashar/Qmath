# Qmath - Adaptive Learning Platform

Qmath is an AI-driven intelligent tutoring system designed for university-level mathematics. It combines adaptive learning algorithms with a comprehensive exam archive to provide students with personalized practice and access to historical exam materials.

---

## ✨ Features

- **Adaptive Learning Engine**: IRT-based question selection with Bayesian Knowledge Tracing
- **Exam Archive**: Search and download old exams from various courses
- **Spaced Repetition**: Optimized review scheduling for long-term retention
- **Real-time Progress Tracking**: Visual analytics of mastery across topics
- **Admin Panel**: Upload and manage exam PDFs
- **Dark Mode**: Full dark theme support throughout the platform

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

---

## 📦 Environment Setup

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="file:./db/qmath.db"

# NextAuth
AUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

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
| `exams` | **NEW**: Exam archive metadata (course, date, PDF path) |

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
│   │   └── admin/
│   │       └── upload-exam/    # Admin exam upload
│   ├── (auth)/                 # Auth pages (login, register)
│   ├── dashboard/              # Student dashboard
│   ├── archive/                # Exam archive (NEW)
│   ├── admin/                  # Admin panel
│   │   └── upload-exam/        # Exam upload form
│   └── study/                  # Practice interface
├── components/                 # React components
│   ├── Header.tsx              # Main navigation
│   ├── ExamResultsTable.tsx    # Exam search results
│   └── LoginPromptModal.tsx    # Auth prompt
├── db/                         # Database layer
│   ├── drizzle.ts              # DB connection
│   ├── schema.ts               # Table definitions
│   └── seeds/                  # Seed scripts
│       ├── seed.ts             # Main data
│       ├── seed-admin.ts       # Admin user
│       └── seed-exams.ts       # Sample exams
├── lib/                        # Utilities
│   └── adaptive-engine/        # Learning algorithms
├── uploads/                    # Uploaded exam PDFs
│   └── exams/
│       └── {courseCode}/       # Organized by course
├── auth.ts                     # NextAuth config
├── auth.config.ts              # Auth callbacks
├── middleware.ts               # Route protection
└── drizzle.config.ts           # Drizzle Kit config
```

---

## 🎓 User Roles & Access

### Student (Default)
- Access adaptive learning practice
- Search and download exams (requires login)
- View personal progress and analytics

### Admin
- All student permissions
- Upload exam PDFs at `/admin/upload-exam`
- Manage exam archive

### Default Credentials

After running `npm run db:seed`:

| Type | Email | Password | Role |
|------|-------|----------|------|
| Student | `test@qmath.se` | `test123456` | `student` |
| Admin | `admin@qmath.se` | `admin123456` | `admin` |

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

---

## 🚀 Deployment

### Environment Variables (Production)

```env
# Database (for production, consider PostgreSQL)
DATABASE_URL="file:./db/qmath.db"  # or PostgreSQL connection string

# Auth
AUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://yourdomain.com"

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

- ✅ Passwords hashed with bcryptjs (10 rounds)
- ✅ HTTP-only session cookies
- ✅ Protected routes via middleware
- ✅ Role-based access control (admin vs student)
- ✅ Exam PDFs served via authenticated API (not publicly accessible)
- ✅ CSRF protection via NextAuth
- ✅ SQL injection protection via Drizzle ORM

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
