import { serial, pgTable, text, vector, index } from "drizzle-orm/pg-core";

export const documents = pgTable("documents", {
    id: serial("id").primaryKey(),
    content: text("content").notNull(),
    embedding: vector("embedding", {dimensions: 1536}).notNull(),
    source: text("source").notNull(),
}, (table) => [
    index("idx_documents_embedding").using("hnsw", table.embedding.op("vector_cosine_ops"))
    // created a vector index on the embedding column.
    // You create an embedding for the question and need to find the chunks whose vectors are most similar.

    // The HNSW index helps PostgreSQL/pgvector find those similar vectors efficiently, rather than comparing against every single vector.
]);

export type InsertDocument = typeof documents.$inferInsert;
export type SelectDocument = typeof documents.$inferSelect;