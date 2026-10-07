CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"source" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_documents_embedding" ON "documents" USING hnsw ("embedding" vector_cosine_ops);