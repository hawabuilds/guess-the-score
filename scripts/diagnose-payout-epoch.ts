/**
 * Read-only: on-chain epoch + signer vs env (no private keys printed).
 * Usage: npx tsx scripts/diagnose-payout-epoch.ts [epochId]
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });
import { epochIdForDate } from "../lib/epochId";
import { readPublicPayoutConfig } from "../lib/payoutContract";
import {
  readContractSignerAddress,
  readLatestEpochIdOnChain,
  readOnChainEpoch,
} from "../lib/payoutOpenEpoch";
import { privateKeyToAccount } from "viem/accounts";
import type { Hex } from "viem";

async function main() {
  const arg = process.argv[2];
  const epochId = arg ? BigInt(arg) : epochIdForDate(new Date());

  const config = readPublicPayoutConfig();
  if (!config) {
    console.error("Missing PAYOUT_CONTRACT_ADDRESS / PAYOUT_CHAIN_ID");
    process.exit(1);
  }

  console.log("contract", config.contractAddress, "chain", config.chainId.toString());
  console.log("epochId", epochId.toString());

  const latest = await readLatestEpochIdOnChain();
  const epoch = await readOnChainEpoch(epochId);
  const signer = await readContractSignerAddress();

  console.log("latestEpochId", latest?.toString() ?? "n/a");
  console.log("epoch", epoch);

  const rawKey = process.env.SIGNER_PRIVATE_KEY?.trim();
  if (rawKey && signer) {
    const pk = (rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`) as Hex;
    const server = privateKeyToAccount(pk).address;
    console.log("contract signer", signer);
    console.log("SIGNER_PRIVATE_KEY address", server);
    console.log("signer match", server.toLowerCase() === signer.toLowerCase());
  } else {
    console.log("contract signer", signer ?? "n/a");
    console.log("SIGNER_PRIVATE_KEY", rawKey ? "(set)" : "(missing)");
  }

  const opKey =
    process.env.PAYOUT_OPERATOR_PRIVATE_KEY?.trim() ||
    process.env.OPERATOR_PRIVATE_KEY?.trim();
  console.log("PAYOUT_OPERATOR_PRIVATE_KEY", opKey ? "(set)" : "(missing)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
