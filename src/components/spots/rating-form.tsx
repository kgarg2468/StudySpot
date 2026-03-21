"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/context";
import { StarRating } from "@/components/ui/star-rating";
import { X, Loader2 } from "lucide-react";
import type { Rating } from "@/lib/types/database";

interface RatingFormProps {
  spotId: string;
  existingRating?: Rating;
  onClose: () => void;
  onSaved: () => void;
}

const OPTIONAL_ATTRIBUTES = [
  { key: "noise_level", label: "Noise Level" },
  { key: "seating_availability", label: "Seating" },
  { key: "wifi_quality", label: "WiFi Quality" },
  { key: "outlet_availability", label: "Outlets" },
  { key: "food_drink", label: "Food & Drink" },
  { key: "vibe", label: "Vibe" },
  { key: "group_friendly", label: "Group Friendly" },
] as const;

type AttributeKey = (typeof OPTIONAL_ATTRIBUTES)[number]["key"];

export function RatingForm({
  spotId,
  existingRating,
  onClose,
  onSaved,
}: RatingFormProps) {
  const { user } = useAuth();
  const supabase = createClient();

  const [overall, setOverall] = useState(existingRating?.overall ?? 0);
  const [attributes, setAttributes] = useState<Record<AttributeKey, number | null>>({
    noise_level: existingRating?.noise_level ?? null,
    seating_availability: existingRating?.seating_availability ?? null,
    wifi_quality: existingRating?.wifi_quality ?? null,
    outlet_availability: existingRating?.outlet_availability ?? null,
    food_drink: existingRating?.food_drink ?? null,
    vibe: existingRating?.vibe ?? null,
    group_friendly: existingRating?.group_friendly ?? null,
  });
  const [comment, setComment] = useState(existingRating?.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setAttribute = (key: AttributeKey, value: number) => {
    setAttributes((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || overall === 0) return;

    setSaving(true);
    setError("");

    const ratingData = {
      spot_id: spotId,
      user_id: user.id,
      overall,
      ...Object.fromEntries(
        Object.entries(attributes).filter(([, v]) => v !== null)
      ),
      comment: comment.trim() || null,
      updated_at: existingRating ? new Date().toISOString() : undefined,
    };

    if (existingRating) {
      const { error: updateError } = await supabase
        .from("ratings")
        .update({
          ...ratingData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingRating.id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from("ratings")
        .insert(ratingData);

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    onSaved();
  };

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm flex items-end justify-center">
        <div className="bg-card border border-border rounded-t-2xl p-6 w-full max-w-lg">
          <p className="text-center text-secondary">
            Please{" "}
            <a href="/login" className="text-primary font-medium">
              sign in
            </a>{" "}
            to rate this spot.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-card border border-border rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold">
            {existingRating ? "Update Rating" : "Rate This Spot"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Overall */}
          <div>
            <label className="text-sm font-semibold block mb-2">
              Overall Rating *
            </label>
            <StarRating value={overall} onChange={setOverall} size={28} />
          </div>

          {/* Optional attributes */}
          <div className="space-y-3">
            <p className="text-xs text-muted">
              Optional — rate specific attributes
            </p>
            {OPTIONAL_ATTRIBUTES.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-secondary">{label}</span>
                <StarRating
                  value={attributes[key] ?? 0}
                  onChange={(v) => setAttribute(key, v)}
                  size={16}
                />
              </div>
            ))}
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-semibold block mb-2">
              Comment (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Share your thoughts..."
              className="w-full bg-card-secondary border border-border rounded-xl p-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary/30 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving || overall === 0}
            className="w-full bg-primary text-bg font-bold py-3 rounded-xl text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : existingRating ? (
              "Update Rating"
            ) : (
              "Submit Rating"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
