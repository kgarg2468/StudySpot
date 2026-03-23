"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { CHAPMAN_CENTER } from "@/lib/constants";
import { ChevronUp, ChevronDown, Expand } from "lucide-react";
import Link from "next/link";
import type { SpotWithStats } from "@/lib/types/database";
import { SpotHoverPreview } from "@/components/map/spot-hover-preview";
import { createSpotMarkerElement } from "@/components/map/marker-utils";

interface MiniMapProps {
  spots: SpotWithStats[];
}

export function MiniMap({ spots }: MiniMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredSpot, setHoveredSpot] = useState<SpotWithStats | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [CHAPMAN_CENTER.lng, CHAPMAN_CENTER.lat],
      zoom: 15,
      interactive: false,
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    spots.forEach((spot) => {
      const el = createSpotMarkerElement(spot.category);

      el.addEventListener("mouseenter", () => {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
        const rect = el.getBoundingClientRect();
        setHoverPosition({ x: rect.left + rect.width / 2, y: rect.top });
        setHoveredSpot(spot);
      });

      el.addEventListener("mouseleave", () => {
        hoverTimeoutRef.current = setTimeout(() => {
          setHoveredSpot(null);
        }, 90);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([spot.longitude, spot.latitude])
        .addTo(map.current!);
      markersRef.current.push(marker);
    });

    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [spots]);

  useEffect(() => {
    map.current?.resize();
  }, [collapsed]);

  return (
    <div className="relative">
      {hoveredSpot && <SpotHoverPreview spot={hoveredSpot} position={hoverPosition} />}
      <div
        className={`transition-all duration-300 overflow-hidden ${
          collapsed ? "h-0" : "h-40"
        }`}
      >
        <div ref={mapContainer} className="w-full h-40" />
      </div>

      <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1 text-xs text-secondary hover:text-primary transition-colors"
        >
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          {collapsed ? "Show map" : "Hide map"}
        </button>
        <Link
          href="/map"
          className="flex items-center gap-1 text-xs text-secondary hover:text-primary transition-colors"
        >
          <Expand size={12} />
          Expand
        </Link>
      </div>
    </div>
  );
}
