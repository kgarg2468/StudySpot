"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/context";
import {
  LogOut,
  Edit2,
  Check,
  X,
  MapPin,
  Star,
  Loader2,
  Shield,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import type { Spot, Rating } from "@/lib/types/database";

export default function ProfilePage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [mySpots, setMySpots] = useState<Spot[]>([]);
  const [myRatings, setMyRatings] = useState<(Rating & { spots: { name: string } | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingSpotId, setDeletingSpotId] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
  }, [profile?.display_name]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [spotsRes, ratingsRes] = await Promise.all([
          supabase
            .from("spots")
            .select("*")
            .eq("created_by", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("ratings")
            .select("*, spots(name)")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
        ]);

        if (cancelled) return;
        if (spotsRes.data) setMySpots(spotsRes.data);
        if (ratingsRes.data)
          setMyRatings(
            ratingsRes.data as (Rating & { spots: { name: string } | null })[]
          );
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load profile data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [authLoading, router, supabase, user]);

  const handleSaveName = async () => {
    if (!user) return;
    setSavingName(true);

    await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() || null })
      .eq("id", user.id);

    setEditingName(false);
    setSavingName(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const handleDeleteSpot = async (spotId: string, spotName: string) => {
    if (!confirm(`Delete "${spotName}"? This will also remove all its ratings and cannot be undone.`)) return;
    setDeletingSpotId(spotId);
    const { error } = await supabase.from("spots").delete().eq("id", spotId);
    if (!error) {
      setMySpots((prev) => prev.filter((s) => s.id !== spotId));
    }
    setDeletingSpotId(null);
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={24} className="animate-spin text-secondary" />
      </div>
    );
  }

  if (!user || !profile) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Profile header */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-card-secondary rounded-full flex items-center justify-center text-lg font-extrabold">
              {(profile.display_name ?? "?")[0].toUpperCase()}
            </div>
            <div>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-card-secondary border border-border rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-primary/30 w-36"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingName}
                    className="text-primary hover:text-primary/80"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setDisplayName(profile.display_name ?? "");
                    }}
                    className="text-muted hover:text-primary"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">
                    {profile.display_name ?? "Anonymous"}
                  </span>
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-muted hover:text-primary"
                  >
                    <Edit2 size={12} />
                  </button>
                </div>
              )}
              <p className="text-xs text-muted">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          {profile.is_admin && (
            <Link
              href="/admin"
              className="flex items-center gap-1 text-xs font-medium px-3 py-2 border border-border rounded-xl text-secondary hover:text-primary transition-colors"
            >
              <Shield size={12} />
              Admin
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1 text-xs font-medium px-3 py-2 border border-border rounded-xl text-secondary hover:text-primary transition-colors ml-auto"
          >
            <LogOut size={12} />
            Sign out
          </button>
        </div>
      </div>

      {/* My Spots */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <h2 className="text-sm font-bold mb-3">
          My Spots ({mySpots.length})
        </h2>
        {error && (
          <p className="text-xs text-red-400 mb-3">{error}</p>
        )}
        {mySpots.length === 0 ? (
          <p className="text-sm text-muted">No spots created yet.</p>
        ) : (
          <div className="space-y-2">
            {mySpots.map((spot) => (
              <div
                key={spot.id}
                className="flex items-center gap-2 py-2 border-b border-border last:border-0 -mx-2 px-2 rounded-lg"
              >
                <Link
                  href={`/spot/${spot.id}`}
                  className="flex items-center gap-2 flex-1 min-w-0 hover:bg-card-secondary/50 rounded-lg transition-colors"
                >
                  <MapPin size={14} className="text-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{spot.name}</p>
                    <p className="text-xs text-muted">{spot.category}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/spot/${spot.id}/edit`}
                    className="p-1.5 text-muted hover:text-primary rounded-lg hover:bg-card-secondary transition-colors"
                  >
                    <Pencil size={13} />
                  </Link>
                  <button
                    onClick={() => handleDeleteSpot(spot.id, spot.name)}
                    disabled={deletingSpotId === spot.id}
                    className="p-1.5 text-muted hover:text-red-400 rounded-lg hover:bg-card-secondary transition-colors disabled:opacity-50"
                  >
                    {deletingSpotId === spot.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Ratings */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="text-sm font-bold mb-3">
          My Ratings ({myRatings.length})
        </h2>
        {myRatings.length === 0 ? (
          <p className="text-sm text-muted">No ratings given yet.</p>
        ) : (
          <div className="space-y-2">
            {myRatings.map((rating) => (
              <Link
                key={rating.id}
                href={`/spot/${rating.spot_id}`}
                className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-card-secondary/50 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {rating.spots?.name ?? "Unknown spot"}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(rating.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-sm font-bold">{rating.overall}</span>
                  <Star size={12} className="fill-primary text-primary" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
