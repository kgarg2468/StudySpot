import type { Spot, SpotStats, SpotWithStats } from "@/lib/types/database";

export async function fetchSpotsWithStats(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  options?: { offset?: number; limit?: number }
): Promise<SpotWithStats[]> {
  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? 100;

  const { data: spots, error: spotsError } = await supabase
    .from("spots")
    .select("*")
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  if (spotsError || !spots || spots.length === 0) {
    return [];
  }

  const spotIds = spots.map((s: Spot) => s.id);

  const { data: stats } = await supabase
    .from("spot_stats")
    .select("*")
    .in("spot_id", spotIds);

  const statsMap = new Map<string, SpotStats>();
  if (stats) {
    for (const s of stats as SpotStats[]) {
      statsMap.set(s.spot_id, s);
    }
  }

  return (spots as Spot[]).map((spot) => ({
    ...spot,
    spot_stats: statsMap.has(spot.id) ? [statsMap.get(spot.id)!] : [],
  }));
}
