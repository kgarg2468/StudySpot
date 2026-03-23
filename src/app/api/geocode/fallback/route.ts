import { NextRequest, NextResponse } from "next/server";
import { CHAPMAN_CENTER } from "@/lib/constants";

type FallbackFeature = {
  place_name: string;
  center: [number, number];
  text: string;
  source: "nominatim";
};

function getChapmanViewboxPadding() {
  // ~2 miles around Chapman as a biasing box.
  const latPad = 0.03;
  const lngPad = 0.04;
  return {
    left: CHAPMAN_CENTER.lng - lngPad,
    right: CHAPMAN_CENTER.lng + lngPad,
    top: CHAPMAN_CENTER.lat + latPad,
    bottom: CHAPMAN_CENTER.lat - latPad,
  };
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 3) {
    return NextResponse.json({ features: [] });
  }

  const limit = Math.min(
    Number(request.nextUrl.searchParams.get("limit") ?? "5"),
    10
  );
  const box = getChapmanViewboxPadding();

  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    limit: String(limit),
    viewbox: `${box.left},${box.top},${box.right},${box.bottom}`,
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    {
      headers: {
        "User-Agent": "StudySpot/1.0 (geocoding fallback)",
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    }
  );

  if (!response.ok) {
    return NextResponse.json({ features: [] }, { status: 200 });
  }

  const data = (await response.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
    name?: string;
  }>;

  const features: FallbackFeature[] = data
    .map((item) => {
      const lat = Number(item.lat);
      const lng = Number(item.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return {
        place_name: item.display_name,
        center: [lng, lat] as [number, number],
        text: item.name ?? item.display_name.split(",")[0] ?? item.display_name,
        source: "nominatim" as const,
      };
    })
    .filter((item): item is FallbackFeature => item !== null);

  return NextResponse.json({ features });
}
