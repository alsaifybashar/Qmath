# Qmath - Adaptive Learning Platform

## Overview
Qmath is an AI-driven adaptive learning platform for university-level mathematics. It features a bespoke adaptive engine that calculates student mastery using Bayesian Knowledge Tracing and dynamically scaffolds learning content.

## Architecture
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Math Engine**: KaTeX (via `react-katex`)
- **State/Logic**: Custom Adaptive Engine (`lib/adaptive-engine`)

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation
```bash
npm install
```

### Running Locally
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

## Project Structure
- `/app`: App Router pages (Landing, Study Session, API)
- `/components`: Reusable UI components (QuestionCard)
- `/lib/adaptive-engine`: The core pedagogical logic (BKT algorithm)
- `/lib/data-model`: TypeScript interfaces and shared types
- `/db`: SQL Schemas for Supabase/PostgreSQL

## Status
- [x] Next.js Skeleton & Config
- [x] Adaptive Engine Logic (v1)
- [x] Math Rendering (KaTeX Integration)
- [x] Grading API Endpoint (`/api/grade`)
- [x] Database Schema Design
- [x] Interactive Study Interface
