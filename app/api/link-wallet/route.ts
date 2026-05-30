import { auth } from "@/auth";
import {
  describeSessionIdentity,
  resolveCanonicalUserId,
} from "@/app/lib/resolveCanonicalUserId";
import { upsertUserWallet } from "@/app/lib/userWallets";
import { parseWalletAddress } from "@/lib/walletAddress";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type LinkWalletBody = {
  wallet_address?: unknown;
};

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: LinkWalletBody;
  try {
    body = (await request.json()) as LinkWalletBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const walletAddress = parseWalletAddress(body.wallet_address);
  if (!walletAddress) {
    return NextResponse.json(
      { error: "wallet_address must be a valid EVM address" },
      { status: 400 },
    );
  }

  try {
    const userId = await resolveCanonicalUserId(session);
    if (!userId) {
      const identity = describeSessionIdentity(session);
      const error = identity.handle
        ? `Could not match @${identity.handle} to a player on the leaderboard — sign in with the same X account you used to predict`
        : identity.numericId
          ? "Could not verify your X account — try signing out and back in"
          : "Your X session is missing a username — sign out, sign in with X again, then connect your wallet";
      return NextResponse.json({ error }, { status: 401 });
    }

    const row = await upsertUserWallet(userId, walletAddress);
    return NextResponse.json({
      wallet_address: row.wallet_address,
      updated_at: row.updated_at,
    });
  } catch (error) {
    const raw =
      error instanceof Error ? error.message : "Failed to link wallet";
    const message = raw.includes("SUPABASE_SERVICE_ROLE_KEY")
      ? "Server cannot save wallets — SUPABASE_SERVICE_ROLE_KEY is not set on production"
      : raw.includes("user_wallets")
        ? "Payout wallet table is missing — run supabase/schema.sql on your database"
        : raw;
    const status =
      message.includes("SUPABASE_SERVICE_ROLE_KEY") ||
      message.includes("schema.sql")
        ? 503
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
