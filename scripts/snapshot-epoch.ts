import { config } from "dotenv";
config({ path: ".env.local" });

import { snapshotEpochLeaderboard } from "../lib/snapshotEpoch";

async function main() {
  const result = await snapshotEpochLeaderboard();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
