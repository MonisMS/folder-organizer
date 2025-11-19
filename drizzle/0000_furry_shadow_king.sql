CREATE TABLE "files" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"original_path" text NOT NULL,
	"current_path" text NOT NULL,
	"size" integer NOT NULL,
	"extension" text NOT NULL,
	"category" text,
	"hash" text,
	"scanned_at" timestamp DEFAULT now() NOT NULL,
	"organized_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"file_id" integer,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"metadata" text
);
--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;