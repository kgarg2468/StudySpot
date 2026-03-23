"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { createClient } from "@/lib/supabase/client";
import { fetchSpotsWithStats } from "@/lib/queries";
import { CHAPMAN_CENTER } from "@/lib/constants";
import { addChapmanRadiusOverlay } from "@/lib/map/chapman-radius";
import { CategoryIcon } from "@/components/spots/category-icon";
import { Star, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { SpotWithStats, Category } from "@/lib/types/database";
import { getLocationLabel } from "@/lib/constants";

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<SpotWithStats | null>(null);
  const [spots, setSpots] = useState<SpotWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSpots() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const data = await fetchSpotsWithStats(supabase);
        if (!cancelled) {
          setSpots(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load map spots");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSpots();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [CHAPMAN_CENTER.lng, CHAPMAN_CENTER.lat],
      zoom: 14,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.on("load", () => {
      if (!map.current) return;
      addChapmanRadiusOverlay(map.current, "main-map-radius");
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    spots.forEach((spot) => {
      const el = document.createElement("div");
      el.className =
        "w-8 h-8 bg-white rounded-full border-2 border-black/10 flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform";

      const iconMap: Record<Category, string> = {
        Library: "📚",
        Cafe: "☕",
        Outdoor: "🌳",
        Building: "🏢",
        Other: "📍",
      };
      el.innerHTML = `<span class="text-sm">${iconMap[spot.category] ?? "📍"}</span>`;

      el.addEventListener("click", () => setSelectedSpot(spot));

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([spot.longitude, spot.latitude])
        .addTo(map.current!);
      markersRef.current.push(marker);
    });
  }, [spots]);

  return (
    <div className="fixed inset-x-0 top-14 bottom-16 z-0">
      <div ref={mapContainer} className="w-full h-full" />

      <div className="absolute top-4 left-4 z-10">
        <Link
          href="/"
          className="flex items-center gap-1 bg-bg/90 backdrop-blur-sm text-primary text-sm font-medium px-3 py-2 rounded-xl border border-border hover:bg-card transition-colors"
        >
          <ArrowLeft size={16} />
          Feed
        </Link>
      </div>

      {(loading || error) && (
        <div className="absolute top-4 right-4 z-10 bg-card border border-border rounded-lg px-3 py-2 text-xs">
          {loading ? "Loading spots..." : `Error: ${error}`}
        </div>
      )}

      {selectedSpot && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <Link href={`/spot/${selectedSpot.id}`}>
            <div className="bg-card border border-border rounded-xl p-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-card-secondary rounded-lg flex items-center justify-center">
                  <CategoryIcon
                    category={selectedSpot.category}
                    size={20}
                    strokeWidth={1.5}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm">{selectedSpot.name}</h3>
                  <p className="text-xs text-secondary">
                    {getLocationLabel(
                      selectedSpot.latitude,
                      selectedSpot.longitude
                    )}
                  </p>
                </div>
                {selectedSpot.spot_stats?.[0]?.overall_avg != null && (
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold">
                      {selectedSpot.spot_stats[0].overall_avg.toFixed(1)}
                    </span>
                    <Star
                      size={12}
                      className="fill-primary text-primary"
                    />
                  </div>
                )}
              </div>
            </div>
          </Link>
          <button
            onClick={() => setSelectedSpot(null)}
            className="absolute top-2 right-2 text-muted hover:text-primary text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
