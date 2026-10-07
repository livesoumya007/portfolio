import { config } from "dotenv";
config({ path: ".env.local" });

import { retrieveWithScore } from "../lib/retrieve";

const QUERIES = [
  "What did he do at DBS Bank?",
  "Which companies has he worked at?"
];

async function main() {
  for (const query of QUERIES) {
    console.log(`\n${"─".repeat(60)}`);
    console.log(`Query: "${query}"`);
    console.log("─".repeat(60));

    const chunks = await retrieveWithScore(query);

    for (const chunk of chunks) {
      // The breadcrumb is always the first line of the chunk content.
      const breadcrumb = chunk.content.split("\n")[0];
      const similarity = (1 - chunk.distance).toFixed(4); // distance → similarity
      console.log(`  [${similarity}]  ${breadcrumb}`);
    }
  }
}

main().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
