"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/context";
import { LocationStep } from "@/components/add-spot/location-step";
import { DetailsStep } from "@/components/add-spot/details-step";
import { RatingStep } from "@/components/add-spot/rating-step";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import type { Category } from "@/lib/types/database";

export interface SpotFormData {
  latitude: number | null;
  longitude: number | null;
  address: string;
  name: string;
  category: Category | "";
  description: string;
  hours: string;
  is_indoor: boolean | null;
  student_discount: string;
  photo: File | null;
  overall: number;
  noise_level: number | null;
  seating_availability: number | null;
  wifi_quality: number | null;
  outlet_availability: number | null;
  food_drink: number | null;
  vibe: number | null;
  group_friendly: number | null;
  comment: string;
}

const INITIAL_FORM: SpotFormData = {
  latitude: null,
  longitude: null,
  address: "",
  name: "",
  category: "",
  description: "",
  hours: "",
  is_indoor: null,
  student_discount: "",
  photo: null,
  overall: 0,
  noise_level: null,
  seating_availability: null,
  wifi_quality: null,
  outlet_availability: null,
  food_drink: null,
  vibe: null,
  group_friendly: null,
  comment: "",
};

const STEPS = [
  { label: "Location", number: 1 },
  { label: "Details", number: 2 },
  { label: "Rating", number: 3 },
];

export default function AddSpotPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<SpotFormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const updateForm = (updates: Partial<SpotFormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return form.latitude !== null && form.longitude !== null && form.address.trim() !== "";
      case 2:
        return form.name.trim() !== "" && form.category !== "";
      case 3:
        return form.overall > 0;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!user || !canProceed()) return;
    setSubmitting(true);
    setError("");

    const { data: spot, error: spotError } = await supabase
      .from("spots")
      .insert({
        name: form.name.trim(),
        description: form.description.trim() || null,
        latitude: form.latitude!,
        longitude: form.longitude!,
        address: form.address.trim(),
        category: form.category as Category,
        hours: form.hours.trim() || null,
        is_indoor: form.is_indoor,
        student_discount: form.student_discount.trim() || null,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (spotError || !spot) {
      setError(spotError?.message ?? "Failed to create spot");
      setSubmitting(false);
      return;
    }

    // Upload photo if present
    if (form.photo) {
      const ext = form.photo.name.split(".").pop() ?? "jpg";
      const filePath = `${spot.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("spot-photos")
        .upload(filePath, form.photo, { upsert: true });

      if (!uploadError) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("spot-photos").getPublicUrl(filePath);

        await supabase
          .from("spots")
          .update({ photo_url: publicUrl })
          .eq("id", spot.id);
      }
    }

    // Create rating
    const ratingData: Record<string, unknown> = {
      spot_id: spot.id,
      user_id: user.id,
      overall: form.overall,
      comment: form.comment.trim() || null,
    };

    const optionalFields = [
      "noise_level",
      "seating_availability",
      "wifi_quality",
      "outlet_availability",
      "food_drink",
      "vibe",
      "group_friendly",
    ] as const;

    for (const field of optionalFields) {
      if (form[field] !== null) {
        ratingData[field] = form[field];
      }
    }

    const { error: ratingError } = await supabase
      .from("ratings")
      .insert(ratingData as never);

    if (ratingError) {
      setError(ratingError.message);
      setSubmitting(false);
      return;
    }

    router.push(`/spot/${spot.id}`);
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center">
          <h1 className="text-xl font-extrabold mb-2">Add a Study Spot</h1>
          <p className="text-secondary text-sm mb-4">
            Sign in to share your favorite study spots.
          </p>
          <a
            href="/login"
            className="inline-block bg-primary text-bg font-bold py-2 px-6 rounded-xl text-sm"
          >
            Sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map(({ label, number }) => (
          <div key={number} className="flex-1">
            <div
              className={`h-1 rounded-full transition-colors ${
                number <= step ? "bg-primary" : "bg-border"
              }`}
            />
            <p
              className={`text-[10px] mt-1 font-medium ${
                number <= step ? "text-primary" : "text-muted"
              }`}
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === 1 && <LocationStep form={form} updateForm={updateForm} />}
      {step === 2 && <DetailsStep form={form} updateForm={updateForm} />}
      {step === 3 && <RatingStep form={form} updateForm={updateForm} />}

      {error && (
        <p className="text-sm text-red-400 mt-4">{error}</p>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-2 px-4 py-3 border border-border rounded-xl text-sm font-medium hover:bg-card transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        )}

        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="flex-1 bg-primary text-bg font-bold py-3 rounded-xl text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            Next
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canProceed() || submitting}
            className="flex-1 bg-primary text-bg font-bold py-3 rounded-xl text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating...
              </>
            ) : (
              "Create Spot"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
