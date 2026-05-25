import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set([
  "pbs.twimg.com",
  "abs.twimg.com",
  "pbs.x.com",
]);

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get("url");
  if (!urlParam) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(urlParam);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: { "User-Agent": "guess-the-score/1.0" },
      next: { revalidate: 3600 },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Upstream fetch failed" },
        { status: 502 },
      );
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Not an image" }, { status: 400 });
    }

    const bytes = await upstream.arrayBuffer();
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }
}
