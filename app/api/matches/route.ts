import { FIXTURES, getNextFixture } from "@/app/data/fixtures";
import { enrichFixture, enrichFixtures, formatMatchStatus } from "@/lib/enrichFixtures";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const nextOnly = request.nextUrl.searchParams.get("next") === "1";

  try {
    if (nextOnly) {
      const fixture = getNextFixture();
      const enriched = await enrichFixture(fixture);
      return NextResponse.json({
        fixture: enriched,
        statusLabel: formatMatchStatus(enriched.live),
      });
    }

    const enriched = await enrichFixtures(FIXTURES);
    return NextResponse.json({
      fixtures: enriched.map((fixture) => ({
        ...fixture,
        statusLabel: formatMatchStatus(fixture.live),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load matches";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
