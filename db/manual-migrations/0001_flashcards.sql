-- Manual migration: integrated flashcards v1
--
-- Applied outside drizzle-kit because `db:generate` produced a wider migration
-- that tried to recreate pre-existing tables (ai_request_logs, api_keys, audit_logs)
-- and rebuild articles/topics/source_exams. The schema drift that caused that
-- is unrelated to flashcards and should be resolved separately.
--
-- This file contains ONLY the four new flashcard tables + a covering index.
-- Apply with:
--   sqlite3 qmath.db < db/manual-migrations/0001_flashcards.sql

CREATE TABLE IF NOT EXISTS `flashcard_decks` (
    `id` text PRIMARY KEY NOT NULL,
    `user_id` text NOT NULL,
    `name` text NOT NULL,
    `description` text,
    `color` text DEFAULT 'blue',
    `topic_id` text,
    `created_at` integer NOT NULL,
    `updated_at` integer NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade,
    FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON DELETE set null
);

CREATE TABLE IF NOT EXISTS `flashcards` (
    `id` text PRIMARY KEY NOT NULL,
    `user_id` text NOT NULL,
    `deck_id` text NOT NULL,
    `topic_id` text,
    `type` text DEFAULT 'basic' NOT NULL,
    `front` text,
    `back` text,
    `front_math` text,
    `back_math` text,
    `image_url` text,
    `occlusion_masks` text,
    `source_context_type` text DEFAULT 'manual',
    `source_context_id` text,
    `created_at` integer NOT NULL,
    `updated_at` integer NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade,
    FOREIGN KEY (`deck_id`) REFERENCES `flashcard_decks`(`id`) ON DELETE cascade,
    FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON DELETE set null
);

CREATE TABLE IF NOT EXISTS `flashcard_card_state` (
    `card_id` text PRIMARY KEY NOT NULL,
    `user_id` text NOT NULL,
    `stability` real DEFAULT 0,
    `difficulty` real DEFAULT 0,
    `elapsed_days` real DEFAULT 0,
    `scheduled_days` real DEFAULT 0,
    `reps` integer DEFAULT 0,
    `lapses` integer DEFAULT 0,
    `state` text DEFAULT 'new' NOT NULL,
    `last_review` integer,
    `next_review` integer NOT NULL,
    FOREIGN KEY (`card_id`) REFERENCES `flashcards`(`id`) ON DELETE cascade,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS `idx_flashcard_card_state_user_next_review`
    ON `flashcard_card_state` (`user_id`, `next_review`);

CREATE TABLE IF NOT EXISTS `flashcard_reviews` (
    `id` text PRIMARY KEY NOT NULL,
    `user_id` text NOT NULL,
    `card_id` text NOT NULL,
    `reviewed_at` integer NOT NULL,
    `rating` integer NOT NULL,
    `elapsed_days` real NOT NULL,
    `scheduled_days` real NOT NULL,
    `stability` real NOT NULL,
    `difficulty` real NOT NULL,
    `state` text NOT NULL,
    `lapses` integer NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade,
    FOREIGN KEY (`card_id`) REFERENCES `flashcards`(`id`) ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS `idx_flashcard_reviews_user_card`
    ON `flashcard_reviews` (`user_id`, `card_id`);
