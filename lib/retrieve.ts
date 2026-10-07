/**
 * lib/retrieve.ts
 *
 * Retrieves the most relevant document chunks from the vector store
 * for a given query string.
 *
 * Flow:
 *   query string
 *     → embed with the same model used at ingestion
 *     → cosine-distance search against the documents table
 *     → return top-k chunks ordered by similarity
 */

import { cosineDistance, sql, asc } from "drizzle-orm";
import { db } from "./db-config";
import { documents } from "./db-schema";
import { embedQuery } from "./embed";

/** Number of chunks to return. 3–5 is the typical sweet spot for a chat prompt. */
const TOP_K = 5;

/**
 * Minimum cosine similarity (0–1) a chunk must score to be returned.
 * Below this threshold the query is too unrelated to the knowledge base
 * (e.g. "hi", "thanks") and no context is injected into the prompt.
 *
 * Calibrated from smoke-test results:
 *   - "What did he do at DBS Bank?" → top score 0.46  (should pass)
 *   - "hi"                          → top score 0.20  (should be filtered)
 */
export const MIN_SIMILARITY = 0.35;

export type RetrievedChunk = {
  content: string;
  /** Cosine distance: 0 = identical, 2 = opposite. Lower = more relevant. */
  distance: number;
};


export async function retrieveWithScore(query: string): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embedQuery(query);
  const distance = cosineDistance(documents.embedding, queryEmbedding);

  const rows = await db
    .select({
      content: documents.content,
      distance: sql<number>`${distance}`,
    })
    .from(documents)
    .orderBy(asc(distance))
    .limit(TOP_K);

  return rows
    .map((r) => ({ content: r.content, distance: r.distance }))
    .filter((r) => 1 - r.distance >= MIN_SIMILARITY);
}

/**
 * Returns the top-k most relevant document chunk strings for the given query.
 * Use this in the chat route to build the system prompt context.
 */
export async function retrieve(query: string): Promise<string[]> {
  const chunks = await retrieveWithScore(query);
  return chunks.map((c) => c.content);
}
