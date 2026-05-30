import {
  createPublicClient,
  getAddress,
  http,
  type Address,
  type Hex,
} from "viem";
import { bsc, bscTestnet } from "viem/chains";

export const scorePayoutAbi = [
  {
    type: "function",
    name: "claim",
    stateMutability: "nonpayable",
    inputs: [
      { name: "epochId", type: "uint256" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "voucherId", type: "bytes32" },
      { name: "sig", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "openEpoch",
    stateMutability: "nonpayable",
    inputs: [
      { name: "epochId", type: "uint256" },
      { name: "pot", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "epochs",
    stateMutability: "view",
    inputs: [{ name: "epochId", type: "uint256" }],
    outputs: [
      { name: "pot", type: "uint256" },
      { name: "claimedSum", type: "uint256" },
      { name: "open", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "latestEpochId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "signer",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "totalReserved",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "epochRemaining",
    stateMutability: "view",
    inputs: [{ name: "epochId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "voucherUsed",
    stateMutability: "view",
    inputs: [{ name: "", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export type PublicPayoutConfig = {
  contractAddress: Address;
  chainId: bigint;
};

function parseContractAddress(raw: string | undefined): Address | null {
  if (!raw?.trim()) return null;
  try {
    return getAddress(raw.trim());
  } catch {
    return null;
  }
}

function parseChainId(raw: string | undefined): bigint | null {
  if (!raw?.trim()) return null;
  try {
    const value = BigInt(raw.trim());
    return value > 0n ? value : null;
  } catch {
    return null;
  }
}

/** Server or client — prefers NEXT_PUBLIC_* when set. */
export function readPublicPayoutConfig(): PublicPayoutConfig | null {
  const contractAddress = parseContractAddress(
    process.env.NEXT_PUBLIC_PAYOUT_CONTRACT_ADDRESS?.trim() ||
      process.env.PAYOUT_CONTRACT_ADDRESS?.trim(),
  );
  const chainId = parseChainId(
    process.env.NEXT_PUBLIC_PAYOUT_CHAIN_ID?.trim() ||
      process.env.PAYOUT_CHAIN_ID?.trim(),
  );

  if (!contractAddress || !chainId) return null;
  return { contractAddress, chainId };
}

function chainForId(chainId: bigint) {
  return chainId === 97n ? bscTestnet : bsc;
}

function payoutRpcTransport() {
  const url = process.env.PAYOUT_RPC_URL?.trim();
  return http(url || undefined);
}

export function createPayoutPublicClient(config: PublicPayoutConfig) {
  return createPublicClient({
    chain: chainForId(config.chainId),
    transport: payoutRpcTransport(),
  });
}

/** Native BNB balance held by the payout contract. */
export async function getPayoutContractBalanceWei(): Promise<{
  balance: bigint;
  config: PublicPayoutConfig;
} | null> {
  const config = readPublicPayoutConfig();
  if (!config) return null;

  const client = createPayoutPublicClient(config);
  const balance = await client.getBalance({ address: config.contractAddress });

  return { balance, config };
}

/** BNB already reserved by open epochs on the contract (pot minus claimed per epoch). */
export async function readTotalReservedOnChain(): Promise<bigint | null> {
  const config = readPublicPayoutConfig();
  if (!config) return null;

  const client = createPayoutPublicClient(config);
  return client.readContract({
    address: config.contractAddress,
    abi: scorePayoutAbi,
    functionName: "totalReserved",
  });
}

/** Max pot a new openEpoch can use: balance − totalReserved (contract rule). */
export async function readMaxOpenEpochPotWei(): Promise<{
  balance: bigint;
  totalReserved: bigint;
  maxPot: bigint;
} | null> {
  const onChain = await getPayoutContractBalanceWei();
  if (!onChain) return null;

  const totalReserved = (await readTotalReservedOnChain()) ?? 0n;
  const maxPot =
    onChain.balance > totalReserved ? onChain.balance - totalReserved : 0n;

  return {
    balance: onChain.balance,
    totalReserved,
    maxPot,
  };
}

export async function isVoucherClaimedOnChain(
  config: PublicPayoutConfig,
  voucherId: Hex,
): Promise<boolean> {
  const client = createPayoutPublicClient(config);

  return client.readContract({
    address: config.contractAddress,
    abi: scorePayoutAbi,
    functionName: "voucherUsed",
    args: [voucherId],
  });
}
