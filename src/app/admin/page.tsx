"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/context";
import {
  Shield,
  Check,
  Trash2,
  Loader2,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import type { Report } from "@/lib/types/database";

interface ReportWithContext extends Report {
  reporter_name?: string;
  target_name?: string;
}

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [reports, setReports] = useState<ReportWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !profile?.is_admin) {
      router.push("/");
      return;
    }

    loadReports();
  }, [user, profile, authLoading, router]);

  const loadReports = async () => {
    setLoading(true);

    const { data } = await supabase
      .from("reports")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (data) {
      const enriched: ReportWithContext[] = await Promise.all(
        data.map(async (report: Report) => {
          const { data: reporter } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", report.reported_by)
            .single();

          let targetName = "";
          if (report.target_type === "spot") {
            const { data: spot } = await supabase
              .from("spots")
              .select("name")
              .eq("id", report.target_id)
              .single();
            targetName = spot?.name ?? "Deleted spot";
          } else {
            targetName = "Rating";
          }

          return {
            ...report,
            reporter_name: reporter?.display_name ?? "Unknown",
            target_name: targetName,
          };
        })
      );

      setReports(enriched);
    }

    setLoading(false);
  };

  const handleDismiss = async (reportId: string) => {
    setActionLoading(reportId);

    const res = await fetch("/api/admin/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, action: "dismiss" }),
    });

    if (res.ok) {
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    }

    setActionLoading(null);
  };

  const handleRemove = async (report: ReportWithContext) => {
    if (
      !confirm(
        `This will permanently delete the ${report.target_type}. Continue?`
      )
    )
      return;

    setActionLoading(report.id);

    const res = await fetch("/api/admin/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportId: report.id,
        action: "remove",
        targetType: report.target_type,
        targetId: report.target_id,
      }),
    });

    if (res.ok) {
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    }

    setActionLoading(null);
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={24} className="animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/profile" className="text-muted hover:text-primary">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-2">
          <Shield size={20} />
          <h1 className="text-xl font-extrabold">Admin</h1>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="text-sm font-bold mb-3">
          Pending Reports ({reports.length})
        </h2>

        {reports.length === 0 ? (
          <p className="text-sm text-muted">No pending reports.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="border border-border rounded-xl p-3"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <AlertTriangle size={12} className="text-yellow-500" />
                      <span className="text-xs font-medium uppercase text-secondary">
                        {report.target_type}
                      </span>
                    </div>
                    <p className="text-sm font-semibold">
                      {report.target_name}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      Reported by {report.reporter_name} ·{" "}
                      {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-secondary bg-card-secondary rounded-lg px-3 py-2 mb-3">
                  {report.reason}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDismiss(report.id)}
                    disabled={actionLoading === report.id}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium border border-border rounded-lg hover:bg-card-secondary transition-colors disabled:opacity-50"
                  >
                    {actionLoading === report.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <>
                        <Check size={12} />
                        Dismiss
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleRemove(report)}
                    disabled={actionLoading === report.id}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium border border-red-900/30 text-red-400 rounded-lg hover:bg-red-950/20 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === report.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <>
                        <Trash2 size={12} />
                        Remove
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
