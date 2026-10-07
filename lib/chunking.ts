/**
 * lib/chunking.ts
 *
 * Structure-first markdown chunker for RAG ingestion.
 *
 * Design principles (in priority order):
 *  1. Structure first, size second.
 *     Natural boundaries (a section, a role, a project) define chunks.
 *     The token limit is only a safety net for oversized units — it is
 *     NOT the primary splitter.
 *
 *  2. Hard boundaries are never merged.
 *     Two roles never share a chunk, however small they are.
 *
 *  3. Context travels with the chunk.
 *     Every chunk is prefixed with its full breadcrumb, e.g.
 *     "Resume > Professional Experience > Analyst | DBS Bank | Nov 2022 – May 2024"
 *     The breadcrumb gets embedded (helps matching) and is pasted into
 *     the prompt (so the model knows where each fact came from).
 *
 *  4. Measure in tokens, not characters.
 *     chars / 4 is a fine English estimate. Size is only the safety
 *     net here, so a real tokenizer is not worth the dependency.
 *
 *  5. Overlap only when the safety net cuts.
 *     Natural-boundary splits never straddle a fact, so overlap is
 *     pointless there. When an oversized block must be cut, the last
 *     bullet is repeated at the start of the next piece.
 */

export type Chunk = {
  /** Full text that gets embedded and stored. */
  content: string;
  /** Breadcrumb path from the document root, e.g. ["Experience", "Analyst | DBS Bank | ..."] */
  headingPath: string[];
  /** Sequential index across all chunks for this document. */
  chunkIndex: number;
};

type Block = {
  path: string[];
  lines: string[];
};

/** Safety-net token budget per chunk. One role ≈ 150–350 tokens. */
const MAX_TOKENS = 400;

/** Good-enough English estimate: 1 token ≈ 4 chars. */
const estimateTokens = (s: string) => Math.ceil(s.length / 4);

/**
 * Walk the markdown once, emitting a new Block at every ## or ###
 * heading. Each block carries its heading path (breadcrumb) and the
 * raw lines of its body (everything before the next heading).
 *
 * A "## Experience" whose body is only ### children will produce an
 * empty-body block which we filter out — the children carry the data.
 */
function toBlocks(md: string): Block[] {
  const blocks: Block[] = [];
  let section = "Overview"; // catch-all for content before the first ##
  let current: Block = { path: [section], lines: [] };
  blocks.push(current);

  for (const line of md.split("\n")) {
    const h2 = /^## (.+)/.exec(line);
    const h3 = /^### (.+)/.exec(line);

    if (h2) {
      section = h2[1].trim();
      current = { path: [section], lines: [] };
      blocks.push(current);
    } else if (h3) {
      // Hard boundary: always a new block, never merged with siblings.
      current = { path: [section, h3[1].trim()], lines: [] };
      blocks.push(current);
    } else {
      current.lines.push(line);
    }
  }

  // Drop blocks whose body is entirely empty (parent ## with only ### children).
  return blocks.filter((b) => b.lines.join("").trim().length > 0);
}

/**
 * Safety-net splitter: only called when a block's body exceeds MAX_TOKENS.
 *
 * Packs top-level bullets/paragraphs greedily. When a unit would push
 * the buffer over budget, flushes and starts the next piece with a
 * one-unit overlap (the last bullet of the previous piece) so facts
 * that might straddle the cut appear whole at least once.
 */
function splitBody(body: string, budget: number): string[] {
  const units = body
    .split(/\n(?=- )|\n\s*\n/)
    .map((u) => u.trim())
    .filter(Boolean);

  const pieces: string[] = [];
  let buf: string[] = [];

  for (const unit of units) {
    const wouldExceed =
      buf.length > 0 &&
      estimateTokens([...buf, unit].join("\n")) > budget;

    if (wouldExceed) {
      pieces.push(buf.join("\n"));
      // One-unit overlap: repeat the last bullet so context isn't lost.
      buf = [buf[buf.length - 1], unit];
    } else {
      buf.push(unit);
    }
  }

  if (buf.length > 0) pieces.push(buf.join("\n"));
  return pieces;
}

/**
 * Convert structured markdown into retrieval-ready chunks.
 *
 * @param md        Markdown string from the LLM (must pass assertContract).
 * @param docTitle  Top-level label for the breadcrumb, e.g. "Soumya Ranjan Panda — Resume".
 */
export function chunkMarkdown(md: string, docTitle: string): Chunk[] {
  const chunks: Chunk[] = [];

  for (const block of toBlocks(md)) {
    const breadcrumb = [docTitle, ...block.path].join(" > ");
    const body = block.lines.join("\n").trim();
    const budget = MAX_TOKENS - estimateTokens(breadcrumb);

    // Apply safety net only when body exceeds the remaining budget.
    const pieces =
      estimateTokens(body) <= budget ? [body] : splitBody(body, budget);

    for (const piece of pieces) {
      chunks.push({
        content: `${breadcrumb}\n\n${piece}`,
        headingPath: block.path,
        chunkIndex: chunks.length,
      });
    }
  }

  return chunks;
}
