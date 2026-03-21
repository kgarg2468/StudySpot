"use client";

import { CATEGORY_OPTIONS } from "@/lib/constants";
import { Camera, X } from "lucide-react";
import type { SpotFormData } from "@/lib/types/spot-form";

interface DetailsStepProps {
  form: SpotFormData;
  updateForm: (updates: Partial<SpotFormData>) => void;
  existingPhotoUrl?: string | null;
  onClearExistingPhoto?: () => void;
}

export function DetailsStep({ form, updateForm, existingPhotoUrl, onClearExistingPhoto }: DetailsStepProps) {
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Photo must be under 5MB");
      return;
    }
    updateForm({ photo: file });
  };

  return (
    <div>
      <h2 className="text-lg font-extrabold mb-1">Spot Details</h2>
      <p className="text-sm text-secondary mb-4">
        Tell us about this study spot.
      </p>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="text-sm font-semibold block mb-1">Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateForm({ name: e.target.value })}
            placeholder="e.g., Leatherby Libraries"
            className="w-full bg-card border border-border rounded-xl py-2.5 px-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary/30"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-semibold block mb-1">
            Category *
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => updateForm({ category: cat })}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  form.category === cat
                    ? "bg-primary text-bg"
                    : "border border-border text-secondary hover:text-primary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-semibold block mb-1">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => updateForm({ description: e.target.value })}
            placeholder="What makes this spot great for studying?"
            rows={3}
            className="w-full bg-card border border-border rounded-xl py-2.5 px-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary/30 resize-none"
          />
        </div>

        {/* Hours */}
        <div>
          <label className="text-sm font-semibold block mb-1">Hours</label>
          <input
            type="text"
            value={form.hours}
            onChange={(e) => updateForm({ hours: e.target.value })}
            placeholder="e.g., Mon-Fri 7am-12am"
            className="w-full bg-card border border-border rounded-xl py-2.5 px-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary/30"
          />
        </div>

        {/* Indoor/Outdoor */}
        <div>
          <label className="text-sm font-semibold block mb-1">Setting</label>
          <div className="flex gap-2">
            {[
              { value: true, label: "Indoor" },
              { value: false, label: "Outdoor" },
            ].map(({ value, label }) => (
              <button
                key={label}
                type="button"
                onClick={() =>
                  updateForm({
                    is_indoor: form.is_indoor === value ? null : value,
                  })
                }
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  form.is_indoor === value
                    ? "bg-primary text-bg"
                    : "border border-border text-secondary hover:text-primary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Student Discount */}
        <div>
          <label className="text-sm font-semibold block mb-1">
            Student Discount
          </label>
          <input
            type="text"
            value={form.student_discount}
            onChange={(e) => updateForm({ student_discount: e.target.value })}
            placeholder="e.g., 10% off with student ID"
            className="w-full bg-card border border-border rounded-xl py-2.5 px-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary/30"
          />
        </div>

        {/* Photo */}
        <div>
          <label className="text-sm font-semibold block mb-1">Photo</label>
          {form.photo ? (
            <div className="relative inline-block">
              <img
                src={URL.createObjectURL(form.photo)}
                alt="Preview"
                className="w-32 h-24 object-cover rounded-xl border border-border"
              />
              <button
                type="button"
                onClick={() => updateForm({ photo: null })}
                className="absolute -top-2 -right-2 bg-card border border-border rounded-full p-1 text-muted hover:text-primary"
              >
                <X size={12} />
              </button>
            </div>
          ) : existingPhotoUrl ? (
            <div className="relative inline-block">
              <img
                src={existingPhotoUrl}
                alt="Current photo"
                className="w-32 h-24 object-cover rounded-xl border border-border"
              />
              <button
                type="button"
                onClick={onClearExistingPhoto}
                className="absolute -top-2 -right-2 bg-card border border-border rounded-full p-1 text-muted hover:text-primary"
              >
                <X size={12} />
              </button>
              <label className="mt-2 flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg cursor-pointer hover:bg-card transition-colors">
                <Camera size={14} className="text-muted" />
                <span className="text-xs text-muted">Replace photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="sr-only"
                />
              </label>
            </div>
          ) : (
            <label className="flex items-center gap-2 px-4 py-3 border border-border border-dashed rounded-xl cursor-pointer hover:bg-card transition-colors">
              <Camera size={16} className="text-muted" />
              <span className="text-sm text-muted">Upload photo (max 5MB)</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="sr-only"
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
