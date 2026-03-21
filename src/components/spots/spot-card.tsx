import Link from "next/link";
import { Star } from "lucide-react";
import { CategoryIcon } from "./category-icon";
import { AttributeChip } from "@/components/ui/attribute-chip";
import { getLocationLabel } from "@/lib/constants";
import type { SpotWithStats } from "@/lib/types/database";

interface SpotCardProps {
  spot: SpotWithStats;
}

const ATTRIBUTE_KEYS = [
  { key: "noise", avgField: "noise_avg", countField: "noise_count" },
  { key: "seating", avgField: "seating_avg", countField: "seating_count" },
  { key: "wifi", avgField: "wifi_avg", countField: "wifi_count" },
  { key: "outlet", avgField: "outlet_avg", countField: "outlet_count" },
  {
    key: "food_drink",
    avgField: "food_drink_avg",
    countField: "food_drink_count",
  },
  { key: "vibe", avgField: "vibe_avg", countField: "vibe_count" },
  {
    key: "group_friendly",
    avgField: "group_friendly_avg",
    countField: "group_friendly_count",
  },
] as const;

export function SpotCard({ spot }: SpotCardProps) {
  const stats = spot.spot_stats?.[0];
  const overallAvg = stats?.overall_avg;
  const ratingCount = stats?.rating_count ?? 0;

  const topAttributes = ATTRIBUTE_KEYS.filter((attr) => {
    const count = stats?.[attr.countField as keyof typeof stats] as number;
    return count > 0;
  })
    .sort((a, b) => {
      const countA = (stats?.[a.countField as keyof typeof stats] as number) ?? 0;
      const countB = (stats?.[b.countField as keyof typeof stats] as number) ?? 0;
      return countB - countA;
    })
    .slice(0, 4);

  return (
    <Link href={`/spot/${spot.id}`} className="block">
      <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-colors">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-card-secondary rounded-lg flex items-center justify-center shrink-0">
            <CategoryIcon category={spot.category} size={20} strokeWidth={1.5} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-sm truncate">{spot.name}</h3>
              {overallAvg != null && (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-sm font-bold">
                    {overallAvg.toFixed(1)}
                  </span>
                  <Star size={12} className="fill-primary text-primary" />
                  <span className="text-xs text-muted">({ratingCount})</span>
                </div>
              )}
            </div>

            <p className="text-xs text-secondary mt-0.5">
              {getLocationLabel(spot.latitude, spot.longitude)}
            </p>

            {(spot.hours || spot.student_discount) && (
              <p className="text-xs text-muted mt-1 truncate">
                {spot.hours && <span>{spot.hours}</span>}
                {spot.hours && spot.student_discount && <span> · </span>}
                {spot.student_discount && <span>{spot.student_discount}</span>}
              </p>
            )}

            {topAttributes.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {topAttributes.map((attr) => {
                  const avg = stats?.[attr.avgField as keyof typeof stats] as number;
                  return (
                    <AttributeChip
                      key={attr.key}
                      attributeKey={attr.key}
                      avg={avg}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
