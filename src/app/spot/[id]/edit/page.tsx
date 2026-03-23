"use client";

import { useEffect, useMemo, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/context";
import { LocationStep } from "@/components/add-spot/location-step";
import { DetailsStep } from "@/components/add-spot/details-step";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { INITIAL_FORM } from "@/lib/types/spot-form";
import type { SpotFormData } from "@/lib/types/spot-form";
import type { Spot } from "@/lib/types/database";
import {
  ON_CAMPUS_RADIUS_MILES,
  getDistanceFromCampus,
  isWithinCampusRadius,
} from "@/lib/constants";

interface EditSpotPageProps {
  params: Promise<{ id: string }>;
}

const STEPS = [
  { label: "Location", number: 1 },
  { label: "Details", number: 2 },
];

export default function EditSpotPage({ params }: EditSpotPageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<SpotFormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const locationOutsideRadius =
    form.latitude !== null &&
    form.longitude !== null &&
    !isWithinCampusRadius(form.latitude, form.longitude);
  const distanceFromCampus =
    form.latitude !== null && form.longitude !== null
      ? getDistanceFromCampus(form.latitude, form.longitude)
      : null;

  const updateForm = (updates: Partial<SpotFormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadSpot() {
      setLoading(true);
      setError("");
      try {
        const { data: spot } = await supabase
          .from("spots")
          .select("*")
          .eq("id", id)
          .single<Spot>();

        if (!spot || spot.created_by !== user.id) {
          router.replace(`/spot/${id}`);
          return;
        }

        if (cancelled) return;
        setForm({
          ...INITIAL_FORM,
          latitude: spot.latitude,
          longitude: spot.longitude,
          address: spot.address,
          name: spot.name,
          category: spot.category,
          description: spot.description ?? "",
          hours: spot.hours ?? "",
          is_indoor: spot.is_indoor,
          student_discount: spot.student_discount ?? "",
        });
        setExistingPhotoUrl(spot.photo_url);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load spot");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSpot();
    return () => {
      cancelled = true;
    };
  }, [id, router, supabase, user]);

  const canProceed = () => {
    switch (step) {
      case 1:
        return form.latitude !== null && form.longitude !== null && form.address.trim() !== "";
      case 2:
        return form.name.trim() !== "" && form.category !== "";
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!user || !canProceed()) return;
    setSubmitting(true);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("spots")
        .update({
          name: form.name.trim(),
          description: form.description.trim() || null,
          latitude: form.latitude!,
          longitude: form.longitude!,
          address: form.address.trim(),
          category: form.category as string,
          hours: form.hours.trim() || null,
          is_indoor: form.is_indoor,
          student_discount: form.student_discount.trim() || null,
        })
        .eq("id", id);

      if (updateError) {
        setError(updateError.message);
        setSubmitting(false);
        return;
      }

      if (form.photo) {
        const ext = form.photo.name.split(".").pop() ?? "jpg";
        const filePath = `${id}.${ext}`;
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
            .eq("id", id);
        }
      }

      router.push(`/spot/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error");
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center">
          <h1 className="text-xl font-extrabold mb-2">Edit Spot</h1>
          <p className="text-secondary text-sm mb-4">Sign in to edit your spots.</p>
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

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={24} className="animate-spin text-secondary" />
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

      {step === 1 && <LocationStep form={form} updateForm={updateForm} />}
      {step === 2 && (
        <DetailsStep
          form={form}
          updateForm={updateForm}
          existingPhotoUrl={existingPhotoUrl}
          onClearExistingPhoto={() => setExistingPhotoUrl(null)}
        />
      )}

      {error && <p className="text-sm text-red-400 mt-4">{error}</p>}
      {step === 2 && locationOutsideRadius && distanceFromCampus !== null && (
        <p className="text-xs text-amber-500 mt-4">
          This spot is {distanceFromCampus.toFixed(1)} miles from Chapman. It is
          still allowed, but spots within {ON_CAMPUS_RADIUS_MILES} mile are
          prioritized.
        </p>
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

        {step < 2 ? (
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
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
