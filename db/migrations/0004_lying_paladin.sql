CREATE TABLE `articles` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`title_sv` text,
	`excerpt` text,
	`course_id` text,
	`topic_id` text,
	`content_blocks` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`author_id` text,
	`tags` text,
	`reading_time_minutes` integer,
	`view_count` integer DEFAULT 0,
	`sort_order` integer DEFAULT 0,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `articles_slug_unique` ON `articles` (`slug`);--> statement-breakpoint
CREATE TABLE `question_steps` (
	`id` text PRIMARY KEY NOT NULL,
	`question_id` text NOT NULL,
	`step_number` integer NOT NULL,
	`instruction` text NOT NULL,
	`display_latex` text,
	`correct_answer` text NOT NULL,
	`question_type` text DEFAULT 'algebra',
	`hint` text,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `attempt_logs` ADD `student_answer_raw` text;--> statement-breakpoint
ALTER TABLE `attempt_logs` ADD `feedback_code` text;--> statement-breakpoint
ALTER TABLE `attempt_logs` ADD `partial_score` real;--> statement-breakpoint
ALTER TABLE `attempt_logs` ADD `confidence_rating` integer;--> statement-breakpoint
ALTER TABLE `attempt_logs` ADD `symbolically_checked` integer;--> statement-breakpoint
ALTER TABLE `questions` ADD `status` text DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `questions` ADD `ai_difficulty_tier` integer;--> statement-breakpoint
ALTER TABLE `questions` ADD `ai_analysis` text;--> statement-breakpoint
ALTER TABLE `questions` ADD `ai_analyzed_at` integer;--> statement-breakpoint
ALTER TABLE `questions` ADD `guidance_steps` text;--> statement-breakpoint
ALTER TABLE `questions` ADD `sub_questions` text;--> statement-breakpoint
ALTER TABLE `topics` ADD `source` text DEFAULT 'manual';--> statement-breakpoint
ALTER TABLE `topics` ADD `sort_order` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `topics` ADD `phase` text;--> statement-breakpoint
ALTER TABLE `topics` ADD `ai_importance` integer;--> statement-breakpoint
ALTER TABLE `topics` ADD `ai_difficulty` text;--> statement-breakpoint
ALTER TABLE `topics` ADD `study_tips` text;--> statement-breakpoint
ALTER TABLE `topics` ADD `common_mistakes` text;--> statement-breakpoint
ALTER TABLE `topics` ADD `exam_frequency` text;--> statement-breakpoint
ALTER TABLE `topics` ADD `exam_sections` text;