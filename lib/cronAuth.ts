import type { NextRequest } from "next/server";

export function isCollectAuthorized(request: NextRequest): boolean {
  const secret = process.env.COLLECT_SECRET;
  if (!secret) return false;

  const headerSecret = request.headers.get("x-collect-secret");
  if (headerSecret === secret) return true;

  const querySecret = request.nextUrl.searchParams.get("secret");
  return querySecret === secret;
}

/** Vercel Cron sends Authorization: Bearer <CRON_SECRET>. COLLECT_SECRET works for manual tests. */
export function isCronAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader === `Bearer ${cronSecret}`) return true;
  }

  return isCollectAuthorized(request);
}
