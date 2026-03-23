"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { Star } from "lucide-react";
import type { SpotWithStats } from "@/lib/types/database";

interface SpotHoverPreviewProps {
  spot: SpotWithStats;
  position: { x: number; y: number };
}

export function SpotHoverPreview({ spot, position }: SpotHoverPreviewProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const overallAvg = spot.spot_stats?.[0]?.overall_avg;
  const hasImage = !!spot.photo_url && !imageFailed;

  return (
    <div
      className="map-spot-preview"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      <div className="map-spot-preview-image-wrap">
        {hasImage ? (
          <img
            src={spot.photo_url!}
            alt={`${spot.name} preview`}
            className="map-spot-preview-image"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="map-spot-preview-fallback">No image</div>
        )}
      </div>

      <div className="map-spot-preview-content">
        <p className="map-spot-preview-name">{spot.name}</p>
        {overallAvg != null && (
          <div className="map-spot-preview-rating">
            <Star size={12} className="fill-primary text-primary" />
            <span>{overallAvg.toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
