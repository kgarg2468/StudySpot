"use client";

import { useCallback, useEffect, useMemo, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/context";
import { CategoryIcon } from "@/components/spots/category-icon";
import { StarRating } from "@/components/ui/star-rating";
import { AttributeBar } from "@/components/spots/attribute-bar";
import { RatingForm } from "@/components/spots/rating-form";
import { ReportModal } from "@/components/moderation/report-modal";
import {
  Star,
  ArrowLeft,
  Navigation,
  Flag,
  Clock,
  Tag,
  Home,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type {
  Spot,
  SpotStats,
  RatingWithProfile,
} from "@/lib/types/database";
import { getLocationLabel } from "@/lib/constants";

interface SpotDetailPageProps {
  params: Promise<{ id: string }>;
}

const ATTRIBUTES = [
  { key: "noise", label: "Noise Level", avgField: "noise_avg", countField: "noise_count" },
  { key: "seating", label: "Seating", avgField: "seating_avg", countField: "seating_count" },
  { key: "wifi", label: "WiFi", avgField: "wifi_avg", countField: "wifi_count" },
  { key: "outlet", label: "Outlets", avgField: "outlet_avg", countField: "outlet_count" },
  { key: "food_drink", label: "Food/Drink", avgField: "food_drink_avg", countField: "food_drink_count" },
  { key: "vibe", label: "Vibe", avgField: "vibe_avg", countField: "vibe_count" },
  { key: "group_friendly", label: "Group Friendly", avgField: "group_friendly_avg", countField: "group_friendly_count" },
] as const;

export default function SpotDetailPage({ params }: SpotDetailPageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [stats, setStats] = useState<SpotStats | null>(null);
  const [ratings, setRatings] = useState<RatingWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: "spot" | "rating";
    id: string;
  } | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const loadData = useCallback(async (currentId: string) => {
    setLoading(true);
    setError(null);

    try {
      const [spotRes, statsRes, ratingsRes] = await Promise.all([
        supabase.from("spots").select("*").eq("id", currentId).single(),
        supabase.from("spot_stats").select("*").eq("spot_id", currentId).single(),
        supabase
          .from("ratings")
          .select("*, profiles(display_name)")
          .eq("spot_id", currentId)
          .order("created_at", { ascending: false }),
      ]);

      if (spotRes.data) setSpot(spotRes.data);
      if (statsRes.data) setStats(statsRes.data);
      if (ratingsRes.data) setRatings(ratingsRes.data as RatingWithProfile[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load spot");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData(id);
  }, [id, loadData]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={24} className="animate-spin text-secondary" />
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="text-center py-16">
        <p className="text-secondary">Spot not found.</p>
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        <Link href="/" className="text-primary text-sm mt-2 inline-block">
          Back to feed
        </Link>
      </div>
    );
  }

  const overallAvg = stats?.overall_avg;
  const ratingCount = stats?.rating_count ?? 0;

  const existingRating = ratings.find((r) => r.user_id === user?.id);

  const isOwner = user?.id === spot.created_by;

  const openDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`;
    window.open(url, "_blank");
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${spot.name}"? This will also remove all its ratings and cannot be undone.`)) return;
    setDeleting(true);
    const { error } = await supabase.from("spots").delete().eq("id", spot.id);
    if (!error) {
      router.push("/profile");
    } else {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Hero */}
      <div className="relative">
        {spot.photo_url ? (
          <div className="h-48 bg-card">
            <img
              src={spot.photo_url}
              alt={spot.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg/80 to-transparent" />
          </div>
        ) : (
          <div className="h-48 bg-card flex items-center justify-center">
            <CategoryIcon
              category={spot.category}
              size={64}
              strokeWidth={1}
              className="text-muted"
            />
          </div>
        )}

        <div className="absolute top-4 left-4">
          <Link
            href="/"
            className="flex items-center gap-1 bg-bg/80 backdrop-blur-sm text-primary text-sm font-medium px-3 py-2 rounded-xl border border-border"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6 relative z-10">
        {/* Spot info */}
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold">{spot.name}</h1>
              <p className="text-sm text-secondary mt-0.5">
                {getLocationLabel(spot.latitude, spot.longitude)} ·{" "}
                {spot.category}
              </p>
              {spot.address && (
                <p className="text-xs text-muted mt-1">{spot.address}</p>
              )}
            </div>
            {overallAvg != null && (
              <div className="flex items-center gap-1 bg-card-secondary px-3 py-1.5 rounded-lg">
                <span className="text-lg font-extrabold">
                  {overallAvg.toFixed(1)}
                </span>
                <Star size={14} className="fill-primary text-primary" />
                <span className="text-xs text-muted ml-1">
                  ({ratingCount})
                </span>
              </div>
            )}
          </div>

          {spot.description && (
            <p className="text-sm text-secondary mt-3">{spot.description}</p>
          )}
        </div>

        {/* Quick Facts */}
        {stats && (
          <div className="bg-card border border-border rounded-xl p-4 mb-4">
            <h2 className="text-sm font-bold mb-3">Quick Facts</h2>
            <div className="grid grid-cols-2 gap-3">
              {ATTRIBUTES.map((attr) => {
                const avg = stats[attr.avgField as keyof SpotStats] as number | null;
                const count = stats[attr.countField as keyof SpotStats] as number;
                if (!avg || count === 0) return null;
                return (
                  <AttributeBar
                    key={attr.key}
                    label={attr.label}
                    avg={avg}
                    attributeKey={attr.key}
                  />
                );
              })}

              {spot.hours && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={14} className="text-muted" />
                  <div>
                    <p className="text-xs text-muted">Hours</p>
                    <p className="text-sm">{spot.hours}</p>
                  </div>
                </div>
              )}

              {spot.student_discount && (
                <div className="flex items-center gap-2 text-sm">
                  <Tag size={14} className="text-muted" />
                  <div>
                    <p className="text-xs text-muted">Student Discount</p>
                    <p className="text-sm">{spot.student_discount}</p>
                  </div>
                </div>
              )}

              {spot.is_indoor != null && (
                <div className="flex items-center gap-2 text-sm">
                  <Home size={14} className="text-muted" />
                  <div>
                    <p className="text-xs text-muted">Setting</p>
                    <p className="text-sm">
                      {spot.is_indoor ? "Indoor" : "Outdoor"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowRatingForm(true)}
            className="flex-1 bg-primary text-bg font-bold py-3 rounded-xl text-sm hover:bg-primary/90 transition-colors"
          >
            {existingRating ? "Update Rating" : "Rate This Spot"}
          </button>
          <button
            onClick={openDirections}
            className="flex items-center gap-2 px-4 py-3 border border-border rounded-xl text-sm font-medium hover:bg-card transition-colors"
          >
            <Navigation size={14} />
            Directions
          </button>
          {isOwner && (
            <Link
              href={`/spot/${spot.id}/edit`}
              className="flex items-center gap-2 px-3 py-3 border border-border rounded-xl text-sm text-muted hover:text-primary hover:bg-card transition-colors"
            >
              <Pencil size={14} />
            </Link>
          )}
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-3 py-3 border border-border rounded-xl text-sm text-muted hover:text-red-400 hover:bg-card transition-colors disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          )}
          <button
            onClick={() => setReportTarget({ type: "spot", id: spot.id })}
            className="flex items-center gap-2 px-3 py-3 border border-border rounded-xl text-sm text-muted hover:text-primary hover:bg-card transition-colors"
          >
            <Flag size={14} />
          </button>
        </div>

        {/* Rating Form Modal */}
        {showRatingForm && (
          <RatingForm
            spotId={spot.id}
            existingRating={existingRating ?? undefined}
            onClose={() => setShowRatingForm(false)}
            onSaved={() => {
              setShowRatingForm(false);
              loadData(id);
            }}
          />
        )}

        {/* Recent Ratings */}
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <h2 className="text-sm font-bold mb-3">
            Recent Ratings ({ratings.length})
          </h2>
          {ratings.length === 0 ? (
            <p className="text-sm text-muted">No ratings yet.</p>
          ) : (
            <div className="space-y-4">
              {ratings.map((rating) => (
                <div
                  key={rating.id}
                  className="border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        {rating.profiles?.display_name ?? "Anonymous"}
                      </span>
                      <StarRating value={rating.overall} readonly size={12} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted">
                        {new Date(
                          rating.updated_at ?? rating.created_at
                        ).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() =>
                          setReportTarget({ type: "rating", id: rating.id })
                        }
                        className="text-muted hover:text-primary transition-colors"
                      >
                        <Flag size={10} />
                      </button>
                    </div>
                  </div>
                  {rating.comment && (
                    <p className="text-sm text-secondary mt-1">
                      {rating.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {reportTarget && (
        <ReportModal
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
}
