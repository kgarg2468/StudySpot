"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { SpotCard } from "@/components/spots/spot-card";
import { MiniMap } from "@/components/map/mini-map";
import { FEED_PAGE_SIZE } from "@/lib/constants";
import type { SpotWithStats } from "@/lib/types/database";
import { Loader2 } from "lucide-react";

type FeedTab = "trending" | "top" | "gems" | "new";

const TABS: { key: FeedTab; label: string }[] = [
  { key: "trending", label: "Trending" },
  { key: "top", label: "Top Rated" },
  { key: "gems", label: "Hidden Gems" },
  { key: "new", label: "New" },
];

export default function FeedPage() {
  const [tab, setTab] = useState<FeedTab>("trending");
  const [spots, setSpots] = useState<SpotWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const supabase = createClient();

  const fetchSpots = useCallback(
    async (currentTab: FeedTab, currentOffset: number, append = false) => {
      setLoading(true);

      let query = supabase
        .from("spots")
        .select("*, spot_stats(*)")
        .range(currentOffset, currentOffset + FEED_PAGE_SIZE - 1);

      switch (currentTab) {
        case "trending":
          query = query.order("created_at", { ascending: false });
          break;
        case "top":
          query = query.order("created_at", { ascending: false });
          break;
        case "gems":
          query = query.order("created_at", { ascending: false });
          break;
        case "new":
          query = query.order("created_at", { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching spots:", error);
        setLoading(false);
        return;
      }

      let filtered = (data as SpotWithStats[]) ?? [];

      // Client-side filtering based on tab (stats come from the view)
      switch (currentTab) {
        case "trending":
          filtered = filtered.sort((a, b) => {
            const aRecent = a.spot_stats?.[0]?.recent_rating_count ?? 0;
            const bRecent = b.spot_stats?.[0]?.recent_rating_count ?? 0;
            return bRecent - aRecent;
          });
          break;
        case "top":
          filtered = filtered
            .filter((s) => (s.spot_stats?.[0]?.rating_count ?? 0) >= 3)
            .sort((a, b) => {
              const aAvg = a.spot_stats?.[0]?.overall_avg ?? 0;
              const bAvg = b.spot_stats?.[0]?.overall_avg ?? 0;
              return bAvg - aAvg;
            });
          break;
        case "gems":
          filtered = filtered
            .filter((s) => {
              const stats = s.spot_stats?.[0];
              const count = stats?.rating_count ?? 0;
              const avg = stats?.overall_avg ?? 0;
              return count < 5 && avg >= 4.0;
            })
            .sort((a, b) => {
              const aAvg = a.spot_stats?.[0]?.overall_avg ?? 0;
              const bAvg = b.spot_stats?.[0]?.overall_avg ?? 0;
              return bAvg - aAvg;
            });
          break;
        case "new":
          // Already sorted by created_at desc
          break;
      }

      if (append) {
        setSpots((prev) => [...prev, ...filtered]);
      } else {
        setSpots(filtered);
      }

      setHasMore((data?.length ?? 0) >= FEED_PAGE_SIZE);
      setLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    setOffset(0);
    fetchSpots(tab, 0);
  }, [tab, fetchSpots]);

  const loadMore = () => {
    const newOffset = offset + FEED_PAGE_SIZE;
    setOffset(newOffset);
    fetchSpots(tab, newOffset, true);
  };

  return (
    <div>
      <MiniMap spots={spots} />

      {/* Tabs */}
      <div className="sticky top-14 z-40 bg-bg/90 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 flex gap-1 overflow-x-auto py-2 no-scrollbar">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
                tab === key
                  ? "bg-primary text-bg"
                  : "text-secondary hover:text-primary border border-border"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Spot list */}
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-3">
        {loading && spots.length === 0 ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-secondary" />
          </div>
        ) : spots.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-secondary text-sm">No spots found yet.</p>
            <p className="text-muted text-xs mt-1">
              Be the first to add a study spot!
            </p>
          </div>
        ) : (
          <>
            {spots.map((spot) => (
              <SpotCard key={spot.id} spot={spot} />
            ))}

            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loading}
                className="w-full py-3 text-sm font-medium text-secondary hover:text-primary border border-border rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? "Loading..." : "Load more"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
