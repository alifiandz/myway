ALTER TABLE `feedback_submissions` ADD `status` text DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE `feedback_submissions` ADD `internal_notes` text;--> statement-breakpoint
ALTER TABLE `feedback_submissions` ADD `updated_at` text;