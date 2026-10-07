/**
 * RAG Ingestion Script
 *
 * Reads the resume PDF → extracts markdown via LLM → validates the
 * output contract → chunks by structure → embeds → atomically upserts
 * into the `documents` table.
 *
 * Idempotent: the delete + insert go in one db.batch() call (a single
 * HTTP round trip that Neon runs inside BEGIN...COMMIT), so a crash
 * mid-way cannot leave the table in a half-empty state.
 * 
 *
 * Usage:
 *   npx tsx scripts/ingest.ts 
 */

/*
  TODO: 
  keeping chunks deterministic: There's only one non-deterministic, 
  expensive step in our pipeline: the LLM extraction. 
  So isolate it and gate it:
*/

import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { eq } from "drizzle-orm";
import { db } from "../lib/db-config";
import { documents } from "../lib/db-schema";
import { EXTRACTION_PROMPT, assertContract } from "../lib/extraction";
import { chunkMarkdown } from "../lib/chunking";
import { embedTexts } from "../lib/embed";


const PDF_PATH = path.resolve("public/soumya-panda-6-yoe-AI-fullstack.pdf");

const EXTRACTED_MD_PATH = path.resolve("lib/extracted.md");

const SOURCE = "resume";

const DOC_TITLE = `Soumya Ranjan Panda — Resume`;


async function extractMarkdown(): Promise<string> {
  const pdfBytes = fs.readFileSync(PDF_PATH);
  console.log(`📄 Sending ${path.basename(PDF_PATH)} to GPT-5-mini for extraction...`);

  const { text } = await generateText({
    model: openai("gpt-5-mini"),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: EXTRACTION_PROMPT },
          { type: "file", data: pdfBytes, mediaType: "application/pdf" },
        ],
      },
    ],
  });

  console.log(`✅ Extracted ${text.length} characters of markdown.`);

  // Treat LLM output as untrusted — validate structure before proceeding.
  assertContract(text);
  console.log("✅ Contract assertion passed.");

  // Persist raw extraction so you can inspect exactly what the LLM produced.
  fs.writeFileSync(EXTRACTED_MD_PATH, text, "utf-8");
  console.log(`💾 Raw extraction saved to ${EXTRACTED_MD_PATH}`);

  return text;
}

function buildChunks(md: string) {
  const chunks = chunkMarkdown(md, DOC_TITLE);
  return chunks;
}

async function embed(chunks: ReturnType<typeof chunkMarkdown>) {
  const embeddings = await embedTexts(chunks.map((c) => c.content));
  return embeddings;
}

async function upsert(
  chunks: ReturnType<typeof chunkMarkdown>,
  embeddings: number[][],
) {
  const rows = chunks.map((chunk, i) => ({
    content: chunk.content,
    embedding: embeddings[i],
    source: SOURCE,
  }));

  await db.batch([
    db.delete(documents).where(eq(documents.source, SOURCE)),
    db.insert(documents).values(rows),
  ]);
}

async function main() {
  const markdown = await extractMarkdown();
  const chunks = buildChunks(markdown);
  const embeddings = await embed(chunks);
  await upsert(chunks, embeddings);
}

main().catch((err) => {
  console.error("❌ Ingestion failed:", err);
  process.exit(1);
});
