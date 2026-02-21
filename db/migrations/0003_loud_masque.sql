CREATE TABLE `attempt_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`question_id` text,
	`is_correct` integer NOT NULL,
	`time_taken_ms` integer,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `calibration_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`session_id` text,
	`topic_id` text,
	`predicted_score` integer NOT NULL,
	`actual_score` integer,
	`total_questions` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `course_exam_analysis_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`course_code` text NOT NULL,
	`exam_fingerprint` text NOT NULL,
	`analysis_json` text NOT NULL,
	`exams_analyzed` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`university_id` text,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`name_sv` text,
	`description` text,
	`semester` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`university_id`) REFERENCES `universities`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `curriculum_standards` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`level` text NOT NULL,
	`title` text NOT NULL,
	`title_sv` text,
	`description` text,
	`category` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `curriculum_standards_code_unique` ON `curriculum_standards` (`code`);--> statement-breakpoint
CREATE TABLE `diagnostic_item_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`diagnostic_result_id` text NOT NULL,
	`question_id` text,
	`topic_id` text,
	`curriculum_standard_id` text,
	`is_correct` integer NOT NULL,
	`time_taken_ms` integer,
	`confidence` integer,
	`student_answer` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`diagnostic_result_id`) REFERENCES `diagnostic_results`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `diagnostic_results` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text,
	`diagnostic_type` text NOT NULL,
	`completed_at` integer NOT NULL,
	`screening_score` real,
	`detailed_results` text,
	`gaps_identified` text,
	`learning_path_generated` integer DEFAULT false,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`enrolled_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `exams` (
	`id` text PRIMARY KEY NOT NULL,
	`course_code` text NOT NULL,
	`course_name` text NOT NULL,
	`exam_date` integer NOT NULL,
	`exam_type` text NOT NULL,
	`file_name` text NOT NULL,
	`file_path` text NOT NULL,
	`file_size` integer,
	`has_solution` integer DEFAULT false,
	`solution_file_name` text,
	`solution_file_path` text,
	`solution_file_size` integer,
	`uploaded_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `misconceptions` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`description` text NOT NULL,
	`description_sv` text,
	`affected_topic_ids` text,
	`common_wrong_patterns` text,
	`feedback_en` text,
	`feedback_sv` text,
	`remediation_topic_id` text,
	`severity` text DEFAULT 'medium',
	`created_at` integer NOT NULL,
	FOREIGN KEY (`remediation_topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `misconceptions_code_unique` ON `misconceptions` (`code`);--> statement-breakpoint
CREATE TABLE `prerequisite_edges` (
	`id` text PRIMARY KEY NOT NULL,
	`from_topic_id` text NOT NULL,
	`to_topic_id` text NOT NULL,
	`strength` real DEFAULT 1,
	`edge_type` text DEFAULT 'required',
	`created_at` integer NOT NULL,
	FOREIGN KEY (`from_topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`university_id` text,
	`enrollment_year` integer,
	`study_year` integer,
	`university_program` text,
	`target_gpa` real,
	`math_anxiety_level` integer,
	`self_efficacy_score` integer,
	`study_skills_completed` integer DEFAULT false,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`university_id`) REFERENCES `universities`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`topic_id` text NOT NULL,
	`content_markdown` text NOT NULL,
	`question_type` text NOT NULL,
	`correct_answer` text NOT NULL,
	`options` text,
	`explanation_markdown` text,
	`difficulty_tier` integer DEFAULT 1,
	`strategy_tag` text,
	`is_published` integer DEFAULT false,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `topics` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`title_sv` text,
	`description` text,
	`prerequisites` text,
	`base_difficulty` integer,
	`engineering_context` text,
	`curriculum_standard_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`curriculum_standard_id`) REFERENCES `curriculum_standards`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `topics_slug_unique` ON `topics` (`slug`);--> statement-breakpoint
CREATE TABLE `universities` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`country` text,
	`logo_url` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_mastery` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`mastery_probability` real DEFAULT 0.1,
	`last_practiced_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password` text,
	`name` text,
	`role` text DEFAULT 'student',
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `question_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`session_id` text,
	`question_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`difficulty_level` integer NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`is_correct` integer NOT NULL,
	`attempts` integer DEFAULT 1,
	`hints_used` integer DEFAULT 0,
	`error_type` text,
	`confidence_before` integer,
	`reflection_text` text,
	`xp_earned` integer DEFAULT 0,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `study_sessions`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `study_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`session_type` text NOT NULL,
	`focus_score` real,
	`breaks_taken` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`achievement_id` text NOT NULL,
	`category` text NOT NULL,
	`earned_at` integer NOT NULL,
	`metadata` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_city` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`city_level` integer DEFAULT 1,
	`total_xp` integer DEFAULT 0,
	`buildings` text,
	`weather` text DEFAULT 'sunny',
	`last_updated` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`description` text NOT NULL,
	`target_value` text,
	`target_date` integer,
	`progress` integer DEFAULT 0,
	`completed` integer DEFAULT false,
	`completed_at` integer,
	`metadata` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_personal_records` (
	`user_id` text PRIMARY KEY NOT NULL,
	`longest_streak` integer DEFAULT 0,
	`most_problems_one_day` integer DEFAULT 0,
	`fastest_mastery_days` integer,
	`fastest_mastery_topic` text,
	`highest_accuracy_session` real DEFAULT 0,
	`highest_accuracy_date` integer,
	`total_xp_earned` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_streaks` (
	`user_id` text PRIMARY KEY NOT NULL,
	`current_streak` integer DEFAULT 0,
	`longest_streak` integer DEFAULT 0,
	`last_study_date` integer,
	`freeze_days_available` integer DEFAULT 2,
	`freeze_days_used` integer DEFAULT 0,
	`freeze_days_reset_at` integer,
	`total_study_days` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_topic_mastery` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`mastery_level` integer DEFAULT 0,
	`total_attempts` integer DEFAULT 0,
	`correct_attempts` integer DEFAULT 0,
	`last_practiced_at` integer,
	`next_review_date` integer,
	`consecutive_correct` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `content_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`content_id` text NOT NULL,
	`attempt_data` text,
	`is_correct` integer,
	`partial_score` real,
	`confidence_rating` text,
	`time_spent_seconds` integer,
	`feedback_received` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`content_id`) REFERENCES `generated_content`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `content_attempts_user_idx` ON `content_attempts` (`user_id`);--> statement-breakpoint
CREATE INDEX `content_attempts_content_idx` ON `content_attempts` (`content_id`);--> statement-breakpoint
CREATE TABLE `content_quality` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`total_attempts` integer DEFAULT 0,
	`success_rate` real,
	`avg_time_seconds` real,
	`overconfidence_rate` real,
	`underconfidence_rate` real,
	`flagged_for_review` integer DEFAULT false,
	`flag_reason` text,
	`last_calculated` integer,
	FOREIGN KEY (`content_id`) REFERENCES `generated_content`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_quality_content_id_unique` ON `content_quality` (`content_id`);--> statement-breakpoint
CREATE TABLE `course_areas` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`name` text NOT NULL,
	`name_en` text,
	`description` text,
	`order_index` integer DEFAULT 0,
	`exam_frequency` real,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `exam_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`source_exam_id` text NOT NULL,
	`topic_id` text,
	`question_number` integer,
	`original_text` text NOT NULL,
	`latex_form` text,
	`points` integer,
	`difficulty_estimate` real,
	`topic_tags` text,
	`concepts` text,
	`prerequisites` text,
	`question_type` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`source_exam_id`) REFERENCES `source_exams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `exam_questions_source_idx` ON `exam_questions` (`source_exam_id`);--> statement-breakpoint
CREATE INDEX `exam_questions_topic_idx` ON `exam_questions` (`topic_id`);--> statement-breakpoint
CREATE TABLE `generated_content` (
	`id` text PRIMARY KEY NOT NULL,
	`topic_id` text NOT NULL,
	`content_type` text NOT NULL,
	`content` text NOT NULL,
	`source_exam_questions` text,
	`difficulty` real,
	`estimated_minutes` integer,
	`tags` text,
	`verification_status` text DEFAULT 'pending',
	`verified_by` text,
	`verified_at` integer,
	`verification_notes` text,
	`generated_by` text,
	`generation_prompt` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `generated_content_topic_idx` ON `generated_content` (`topic_id`);--> statement-breakpoint
CREATE INDEX `generated_content_type_idx` ON `generated_content` (`content_type`);--> statement-breakpoint
CREATE INDEX `generated_content_status_idx` ON `generated_content` (`verification_status`);--> statement-breakpoint
CREATE TABLE `source_exams` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text,
	`exam_date` integer,
	`exam_type` text,
	`file_name` text NOT NULL,
	`file_path` text NOT NULL,
	`file_size` integer,
	`format` text,
	`parsed_content` text,
	`processing_status` text DEFAULT 'pending',
	`processing_error` text,
	`uploaded_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
