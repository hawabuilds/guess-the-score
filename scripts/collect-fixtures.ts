import { config } from "dotenv";
config({ path: ".env.local" });

import { FIXTURES, formatFixtureLabel, getFixtureById } from "../app/data/fixtures";
import { getMatchState, isMatchScored, markMatchCollected } from "../app/lib/supabase";
import { collectPredictionsForFixture } from "../lib/collectPredictions";
import {
  filterFixturesForCollection,
  getFixturesDueForCollection,
} from "../lib/kickoff";
import { syncFixtureRegistryToSupabase } from "../lib/syncFixtureRegistry";

async function main() {
  const idArg = process.argv[2];
  const dueOnly = process.argv.includes("--due-only");

  await syncFixtureRegistryToSupabase();

  const targets = idArg
    ? [getFixtureById(Number(idArg))].filter((f) => f != null)
    : dueOnly
      ? await filterFixturesForCollection(
          getFixturesDueForCollection(),
          async (matchId) => {
            const state = await getMatchState(matchId);
            const at = state?.predictions_collected_at;
            return at ? new Date(at) : null;
          },
        )
      : FIXTURES;

  if (targets.length === 0) {
    console.error("No fixtures to collect.");
    process.exit(1);
  }

  console.log(
    `Collecting predictions for ${targets.length} fixture(s)…\n`,
  );

  for (const fixture of targets) {
    console.log(`--- Match ${fixture.id}: ${formatFixtureLabel(fixture)} ---`);

    if (await isMatchScored(fixture.id)) {
      console.log("  Skipped: already scored\n");
      continue;
    }

    try {
      const result = await collectPredictionsForFixture(fixture);
      await markMatchCollected(fixture.id);
      console.log(JSON.stringify(result, null, 2));
      console.log("");
    } catch (error) {
      console.error(
        `  Error: ${error instanceof Error ? error.message : error}\n`,
      );
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
