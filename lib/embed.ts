/**
 * lib/embed.ts
 *
 * Reusable embedding utility for RAG ingestion.
 * Wraps `embedMany` from the AI SDK with batching so it never hits
 * the OpenAI embedding API's per-request token cap.
 */

import { openai } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";

const EMBEDDING_MODEL = openai.embedding("text-embedding-3-small");

/** Max inputs per API call — stays well under OpenAI's payload limit. */
const BATCH_SIZE = 20;

/**
 * Embed an arbitrary number of text strings, batching internally so
 * large input sets don't blow the API's per-request limit.
 *
 * Returns embeddings in the same order as the input values.
 */
export async function embedTexts(values: string[]): Promise<number[][]> {
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < values.length; i += BATCH_SIZE) {
    const batch = values.slice(i, i + BATCH_SIZE);
    const { embeddings } = await embedMany({
      model: EMBEDDING_MODEL,
      values: batch,
    });
    allEmbeddings.push(...embeddings);
  }

  return allEmbeddings;
}

/**
 * Embed a single query string for retrieval.
 * Uses the same model as embedTexts so query and knowledge-base
 * vectors always live in the same vector space.
 */
export async function embedQuery(query: string): Promise<number[]> {
  const { embedding } = await embed({
    model: EMBEDDING_MODEL,
    value: query,
  });
  return embedding;
}
