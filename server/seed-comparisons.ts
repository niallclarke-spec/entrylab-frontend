/**
 * One-time seed script — generates all draft comparison pairs and alternatives pages.
 * Run with: npx tsx server/seed-comparisons.ts
 * Safe to run multiple times — existing records are skipped.
 */

import { generateAllMissingPairs, generateAllAlternatives } from "./comparison-engine";

async function main() {
  console.log("Starting comparison seed...\n");

  console.log("Generating all vs comparison pairs...");
  const pairsResult = await generateAllMissingPairs();
  console.log(`  ✓ Broker pairs created:    ${pairsResult.brokers}`);
  console.log(`  ✓ Prop firm pairs created:  ${pairsResult.propFirms}`);

  console.log("\nGenerating all alternatives pages...");
  const altsResult = await generateAllAlternatives();
  console.log(`  ✓ Broker alternatives:      ${altsResult.brokers}`);
  console.log(`  ✓ Prop firm alternatives:   ${altsResult.propFirms}`);

  const total =
    pairsResult.brokers + pairsResult.propFirms + altsResult.brokers + altsResult.propFirms;
  console.log(`\nDone — ${total} draft records created.`);
  console.log("All records have status = 'draft'. Nothing is publicly visible.");

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
