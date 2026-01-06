-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users (Students)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  enrollment_year int,
  university_program text,
  target_gpa decimal(3,2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Topics (The Knowledge Graph)
create table topics (
  id uuid default uuid_generate_v4() primary key,
  slug text unique not null,
  title text not null,
  description text,
  prerequisites jsonb, -- Array of topic_ids
  base_difficulty int check (base_difficulty between 1 and 10),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Questions
create table questions (
  id uuid default uuid_generate_v4() primary key,
  topic_id uuid references topics(id) on delete cascade not null,
  content_markdown text not null, -- Contains LaTeX
  question_type text check (question_type in ('multiple_choice', 'numeric', 'proof_step')) not null,
  correct_answer text not null,
  options jsonb, -- For MCQ
  explanation_markdown text,
  difficulty_tier int default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User Mastery State (Adaptive Engine Memory)
create table user_mastery (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  topic_id uuid references topics(id) on delete cascade not null,
  mastery_probability float default 0.1,
  last_practiced_at timestamp with time zone,
  unique(user_id, topic_id)
);

-- Interaction Logs (Granular Events)
create table attempt_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  question_id uuid references questions(id) on delete set null,
  is_correct boolean not null,
  time_taken_ms int,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);
