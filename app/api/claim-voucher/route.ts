import { auth } from "@/auth";
import { resolveSnapshotWinner } from "@/lib/resolveSnapshotWinner";
import {
  getPayoutEpoch,
  parsePotWei,
} from "@/app/lib/payoutEpochs";
import { getUserWallet } from "@/app/lib/userWallets";
import { parseEpochId } from "@/lib/epochId";
import { payoutAmountWei, isTopTwentyRank } from "@/lib/payoutTiers";
import {
  computeVoucherId,
  computeVoucherInnerHash,
  diagnosePayoutSignerEnv,
  readPayoutSignerEnv,
  signVoucherInner,
} from "@/lib/payoutVoucher";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import {
  getTwitterHandleFromSession,
  getTwitterUserIdFromSession,
} from "@/lib/twitterUserId";
import {
  isVoucherClaimedOnChain,
  readPublicPayoutConfig,
} from "@/lib/payoutContract";
import { parseWalletAddress } from "@/lib/walletAddress";
import { NextRequest, NextResponse } from "next/server";
import type { Address } from "viem";

export const dynamic = "force-dynamic";

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

type ClaimVoucherBody = {
  epochId?: unknown;
  to?: unknown;
};

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimitUserKey =
    getTwitterUserIdFromSession(session) ??
    getTwitterHandleFromSession(session) ??
    "unknown";

  const ipLimit = checkRateLimit(
    `claim-voucher:ip:${clientIp(request)}`,
    RATE_LIMIT * 2,
    RATE_WINDOW_MS,
  );
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSec) } },
    );
  }

  const userLimit = checkRateLimit(
    `claim-voucher:user:${rateLimitUserKey}`,
    RATE_LIMIT,
    RATE_WINDOW_MS,
  );
  if (!userLimit.allowed) {
    return NextResponse.json(
      { error: "Too many voucher requests" },
      { status: 429, headers: { "Retry-After": String(userLimit.retryAfterSec) } },
    );
  }

  const signerEnv = readPayoutSignerEnv();
  if (!signerEnv) {
    const detail = diagnosePayoutSignerEnv();
    return NextResponse.json(
      {
        error: detail ?? "Payout signer is not configured",
      },
      { status: 503 },
    );
  }

  let body: ClaimVoucherBody;
  try {
    body = (await request.json()) as ClaimVoucherBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const epochId = parseEpochId(body.epochId);
  if (!epochId) {
    return NextResponse.json(
      { error: "epochId must be a positive integer (e.g. 20260528)" },
      { status: 400 },
    );
  }

  const toAddress = parseWalletAddress(body.to);
  if (!toAddress) {
    return NextResponse.json(
      { error: "to must be a valid EVM address" },
      { status: 400 },
    );
  }
  const to = toAddress as Address;

  try {
    const epoch = await getPayoutEpoch(epochId);
    if (!epoch?.finalized_at) {
      return NextResponse.json(
        { error: "Epoch is not finalized yet" },
        { status: 403 },
      );
    }

    const potWei = parsePotWei(epoch.pot_wei);
    if (!potWei) {
      return NextResponse.json(
        { error: "Epoch pot is not configured" },
        { status: 503 },
      );
    }

    const snapshot = await resolveSnapshotWinner(epochId, session);
    if (!snapshot || !isTopTwentyRank(snapshot.rank)) {
      return NextResponse.json(
        { error: "You are not a top-20 winner for this epoch" },
        { status: 403 },
      );
    }

    const userId = snapshot.user_id;

    const linked = await getUserWallet(userId);
    if (!linked) {
      return NextResponse.json(
        { error: "Link a payout wallet before requesting a voucher" },
        { status: 403 },
      );
    }

    if (linked.wallet_address.toLowerCase() !== to.toLowerCase()) {
      return NextResponse.json(
        {
          error: `This MetaMask address does not match your linked payout wallet (${linked.wallet_address}). Open the Wallet tab, wait for "linked", or disconnect and reconnect the wallet you want to use.`,
        },
        { status: 403 },
      );
    }

    const voucherId = computeVoucherId(epochId, userId);
    const payoutConfig = readPublicPayoutConfig();
    if (payoutConfig) {
      try {
        const alreadyClaimed = await isVoucherClaimedOnChain(
          payoutConfig,
          voucherId,
        );
        if (alreadyClaimed) {
          return NextResponse.json(
            {
              error:
                "This day's reward was already claimed on-chain. The tBNB was sent when you confirmed that claim (usually to whichever wallet was linked then). You cannot claim the same day twice by switching wallets.",
            },
            { status: 409 },
          );
        }
      } catch {
        // Continue — on-chain check is best-effort if RPC fails.
      }
    }

    const amount = payoutAmountWei(potWei, snapshot.rank);
    if (!amount || amount <= 0n) {
      return NextResponse.json(
        { error: "Could not derive payout amount for your rank" },
        { status: 403 },
      );
    }

    const inner = computeVoucherInnerHash({
      contractAddress: signerEnv.contractAddress,
      chainId: signerEnv.chainId,
      epochId,
      to,
      amount,
      voucherId,
    });

    const signature = await signVoucherInner(inner, signerEnv.privateKey);

    return NextResponse.json({
      epochId: epochId.toString(),
      to,
      amount: amount.toString(),
      voucherId,
      signature,
      rank: snapshot.rank,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sign claim voucher";
    const status = message.includes("SUPABASE_SERVICE_ROLE_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
