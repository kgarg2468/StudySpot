"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/context";
import { X, Loader2, CheckCircle } from "lucide-react";

interface ReportModalProps {
  targetType: "spot" | "rating";
  targetId: string;
  onClose: () => void;
}

const REPORT_REASONS = [
  "Inaccurate information",
  "Inappropriate content",
  "Spam",
  "Duplicate",
  "Other",
];

export function ReportModal({
  targetType,
  targetId,
  onClose,
}: ReportModalProps) {
  const { user } = useAuth();
  const supabase = createClient();

  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const finalReason = reason === "Other" ? customReason.trim() : reason;
    if (!finalReason) return;

    setSaving(true);

    await supabase.from("reports").insert({
      target_type: targetType,
      target_id: targetId,
      reported_by: user.id,
      reason: finalReason,
    });

    setSaving(false);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-card border border-border rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold">Report</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-4">
            <CheckCircle size={32} className="mx-auto mb-3 text-primary" />
            <p className="text-sm text-secondary">
              Thank you. Your report has been submitted.
            </p>
            <button
              onClick={onClose}
              className="mt-4 text-sm text-primary font-medium"
            >
              Close
            </button>
          </div>
        ) : !user ? (
          <p className="text-sm text-secondary text-center py-4">
            Please{" "}
            <a href="/login" className="text-primary font-medium">
              sign in
            </a>{" "}
            to report.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-xs text-muted">
              Why are you reporting this {targetType}?
            </p>
            {REPORT_REASONS.map((r) => (
              <label
                key={r}
                className={`block px-3 py-2 border rounded-xl text-sm cursor-pointer transition-colors ${
                  reason === r
                    ? "border-primary bg-card-secondary"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="sr-only"
                />
                {r}
              </label>
            ))}

            {reason === "Other" && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Describe the issue..."
                rows={2}
                className="w-full bg-card-secondary border border-border rounded-xl p-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary/30 resize-none"
              />
            )}

            <button
              type="submit"
              disabled={saving || !reason || (reason === "Other" && !customReason.trim())}
              className="w-full bg-primary text-bg font-bold py-3 rounded-xl text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Submit Report"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
