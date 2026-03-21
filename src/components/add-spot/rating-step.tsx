"use client";

import { StarRating } from "@/components/ui/star-rating";
import type { SpotFormData } from "@/lib/types/spot-form";

interface RatingStepProps {
  form: SpotFormData;
  updateForm: (updates: Partial<SpotFormData>) => void;
}

const OPTIONAL_ATTRIBUTES = [
  { key: "noise_level" as const, label: "Noise Level" },
  { key: "seating_availability" as const, label: "Seating" },
  { key: "wifi_quality" as const, label: "WiFi Quality" },
  { key: "outlet_availability" as const, label: "Outlets" },
  { key: "food_drink" as const, label: "Food & Drink" },
  { key: "vibe" as const, label: "Vibe" },
  { key: "group_friendly" as const, label: "Group Friendly" },
];

export function RatingStep({ form, updateForm }: RatingStepProps) {
  return (
    <div>
      <h2 className="text-lg font-extrabold mb-1">Your Rating</h2>
      <p className="text-sm text-secondary mb-4">
        Be the first to rate this spot!
      </p>

      <div className="space-y-5">
        {/* Overall */}
        <div>
          <label className="text-sm font-semibold block mb-2">
            Overall Rating *
          </label>
          <StarRating
            value={form.overall}
            onChange={(v) => updateForm({ overall: v })}
            size={28}
          />
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
                value={form[key] ?? 0}
                onChange={(v) => updateForm({ [key]: v })}
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
            value={form.comment}
            onChange={(e) => updateForm({ comment: e.target.value })}
            rows={3}
            placeholder="Share your thoughts about this spot..."
            className="w-full bg-card border border-border rounded-xl p-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary/30 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
