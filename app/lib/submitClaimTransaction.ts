import { config } from "@/app/wagmi";
import { scorePayoutAbi } from "@/lib/payoutContract";
import type { ClaimVoucherResponse } from "@/app/lib/claim-voucher-client";
import type { ClientPayoutConfig } from "@/app/lib/payout-config-client";
import { formatClaimError } from "@/app/lib/formatClaimError";
import {
  getAccount,
  getConnectorClient,
  switchChain,
  waitForTransactionReceipt,
} from "@wagmi/core";
import type { Address, Hex } from "viem";
import { encodeFunctionData } from "viem";
import { bsc, bscTestnet } from "viem/chains";

type WagmiPayoutChainId = (typeof config)["chains"][number]["id"];

const RECEIPT_TIMEOUT_MS = 60_000;

function toWagmiChainId(chainId: number): WagmiPayoutChainId {
  if (chainId !== 97 && chainId !== 56) {
    throw new Error(
      `Unsupported payout chain ${chainId} — use BSC Testnet (97) or BSC (56)`,
    );
  }
  return chainId;
}

function chainForId(chainId: number) {
  return chainId === 97 ? bscTestnet : bsc;
}

function normalizeBytes32(value: string): Hex {
  const hex = value.startsWith("0x") ? value : `0x${value}`;
  return hex as Hex;
}

function normalizeSignature(value: string): Hex {
  const hex = value.startsWith("0x") ? value : `0x${value}`;
  if (hex.length !== 132) {
    throw new Error("Invalid claim signature from server — contact support");
  }
  return hex as Hex;
}

/** Call before voucher fetch so MetaMask network switch is separate from the claim tx. */
export async function ensurePayoutChainSelected(
  chainId: number,
): Promise<WagmiPayoutChainId> {
  const wagmiChainId = toWagmiChainId(chainId);
  const active = getAccount(config);

  if (!active.isConnected || !active.address) {
    throw new Error("Connect MetaMask on the Wallet tab first");
  }

  if (active.chainId === wagmiChainId) {
    return wagmiChainId;
  }

  await switchChain(config, { chainId: wagmiChainId });

  for (let attempt = 0; attempt < 40; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    if (getAccount(config).chainId === wagmiChainId) {
      return wagmiChainId;
    }
  }

  throw new Error(
    "MetaMask must be on BSC Testnet (chain 97). Switch network in MetaMask, then press Claim again.",
  );
}

export type SubmitClaimPhase = "wallet-confirm" | "mining";

export async function submitClaimTransaction(
  params: {
    payout: ClientPayoutConfig;
    voucher: ClaimVoucherResponse;
    account: Address;
    wagmiChainId: WagmiPayoutChainId;
  },
  onPhase?: (phase: SubmitClaimPhase) => void,
): Promise<Hex> {
  const { payout, voucher, account, wagmiChainId } = params;
  const chain = chainForId(payout.chainId);

  const args = [
    BigInt(voucher.epochId),
    voucher.to as Address,
    BigInt(voucher.amount),
    normalizeBytes32(voucher.voucherId),
    normalizeSignature(voucher.signature),
  ] as const;

  const active = getAccount(config);
  if (active.address?.toLowerCase() !== account.toLowerCase()) {
    throw new Error("Wallet address changed — refresh the page and try again");
  }

  if (active.chainId !== wagmiChainId) {
    throw new Error(
      "Wrong network in MetaMask — switch to BSC Testnet, then press Claim again",
    );
  }

  const client = await getConnectorClient(config, {
    chainId: wagmiChainId,
    account,
  });

  onPhase?.("wallet-confirm");

  let hash: Hex;
  try {
    hash = await client.writeContract({
      address: payout.contractAddress,
      abi: scorePayoutAbi,
      functionName: "claim",
      args,
      account,
      chain,
    });
  } catch (writeErr) {
    const data = encodeFunctionData({
      abi: scorePayoutAbi,
      functionName: "claim",
      args,
    });

    try {
      hash = await client.sendTransaction({
        to: payout.contractAddress,
        data,
        account,
        chain,
      });
    } catch {
      throw writeErr;
    }
  }

  onPhase?.("mining");

  try {
    await Promise.race([
      waitForTransactionReceipt(config, { hash, chainId: wagmiChainId }),
      new Promise<never>((_, reject) => {
        setTimeout(
          () =>
            reject(
              new Error(
                `Submitted ${hash.slice(0, 10)}… — open BscScan if the app is slow`,
              ),
            ),
          RECEIPT_TIMEOUT_MS,
        );
      }),
    ]);
  } catch (receiptErr) {
    const message =
      receiptErr instanceof Error ? receiptErr.message : String(receiptErr);
    if (message.includes("Submitted")) {
      return hash;
    }
    throw receiptErr;
  }

  return hash;
}

export function toClaimError(err: unknown): string {
  return formatClaimError(err);
}
