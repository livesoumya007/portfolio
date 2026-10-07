/**
 * lib/extraction.ts
 *
 * Owns the LLM extraction prompt and the contract assertion that
 * validates its output. Treat LLM output like an untrusted form
 * submission: the prompt is the placeholder hint, assertContract is
 * the zod schema on the API route.
 */

/**
 * Strict prompt that forces a predictable markdown structure we can
 * chunk reliably. "Copy verbatim" stops the model from polishing
 * wording into claims that were never made.
 */
export const EXTRACTION_PROMPT = `Convert this resume to markdown using EXACTLY this structure:
- First: the candidate's name as "# {Full Name}", then one line with all contact details: phone, email, LinkedIn URL, GitHub URL (copy verbatim from the document).
- Then one "## " heading per top-level section (Summary, Experience, Projects, Skills, Education).
- Inside Experience: one "### " heading per role, formatted "### {Role} | {Company} | {Start} – {End}".
- Inside Projects: one "### " heading per project, formatted "### {Project name}".
- Use "- " bullets for achievements. Never use bold text as a heading.
- Copy wording verbatim. Do not summarize, rephrase, or add anything not in the document.
Output only the markdown.`;

/**
 * Validates that the LLM output follows the contract we asked for.
 * Fails loudly so ingestion never silently writes badly structured
 * data into the vector store.
 */
export function assertContract(md: string): void {
  if (!md || md.length < 100) {
    throw new Error(
      `Extraction returned suspiciously short output (${md?.length ?? 0} chars).`,
    );
  }

  const sections = md.match(/^## .+/gm) ?? [];
  const roles = md.match(/^### .+ \| .+ \| .+/gm) ?? [];

  if (sections.length < 3) {
    throw new Error(
      `Expected ≥3 "## " sections, got ${sections.length}. Model may have drifted from the prompt.`,
    );
  }
  if (roles.length === 0) {
    throw new Error(
      'No "### Role | Company | Dates" headings found. Experience section is missing or misformatted.',
    );
  }
}
