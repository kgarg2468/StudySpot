"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  CHAPMAN_CENTER,
  ON_CAMPUS_RADIUS_MILES,
  getDistanceFromCampus,
  isWithinCampusRadius,
} from "@/lib/constants";
import { Search, MapPin } from "lucide-react";
import type { SpotFormData } from "@/lib/types/spot-form";
import { addChapmanRadiusOverlay } from "@/lib/map/chapman-radius";

interface LocationStepProps {
  form: SpotFormData;
  updateForm: (updates: Partial<SpotFormData>) => void;
}

export function LocationStep({ form, updateForm }: LocationStepProps) {
  type SearchResult = {
    place_name: string;
    center: [number, number];
    text?: string;
    properties?: { name?: string };
    distanceMiles: number;
    withinRadius: boolean;
  };

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [addressEditable, setAddressEditable] = useState(false);
  const [locationWarning, setLocationWarning] = useState("");

  function setRadiusWarning(lat: number, lng: number) {
    const distance = getDistanceFromCampus(lat, lng);
    if (isWithinCampusRadius(lat, lng)) {
      setLocationWarning("");
      return;
    }
    setLocationWarning(
      `This spot is ${distance.toFixed(
        1
      )} miles from Chapman. You can still save it, but spots within ${ON_CAMPUS_RADIUS_MILES} mile are preferred.`
    );
  }

  function placeMarker(lng: number, lat: number) {
    if (marker.current) {
      marker.current.setLngLat([lng, lat]);
    } else if (map.current) {
      marker.current = new mapboxgl.Marker()
        .setLngLat([lng, lat])
        .addTo(map.current);
    }
    updateForm({ latitude: lat, longitude: lng });
    setRadiusWarning(lat, lng);
  }

  async function reverseGeocode(lat: number, lng: number) {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}`
      );
      const data = await res.json();

      if (data.features?.length > 0) {
        updateForm({ address: data.features[0].place_name });
        setAddressEditable(false);
      } else {
        updateForm({ address: "" });
        setAddressEditable(true);
      }
    } catch {
      updateForm({ address: "" });
      setAddressEditable(true);
    }
  }

  useEffect(() => {
    if (!mapContainer.current || !process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    const initialCenter: [number, number] = form.longitude && form.latitude
      ? [form.longitude, form.latitude]
      : [CHAPMAN_CENTER.lng, CHAPMAN_CENTER.lat];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: initialCenter,
      zoom: 15,
    });
    map.current.on("load", () => {
      if (!map.current) return;
      addChapmanRadiusOverlay(map.current, "location-step-radius");
    });

    if (form.latitude && form.longitude) {
      marker.current = new mapboxgl.Marker()
        .setLngLat([form.longitude, form.latitude])
        .addTo(map.current);
      setRadiusWarning(form.latitude, form.longitude);
    }

    map.current.on("click", async (e) => {
      const { lng, lat } = e.lngLat;
      placeMarker(lng, lat);
      await reverseGeocode(lat, lng);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&proximity=${CHAPMAN_CENTER.lng},${CHAPMAN_CENTER.lat}&types=poi,address,place&country=us&limit=10`
      );
      const data = await res.json();
      const rankedResults: SearchResult[] = (data.features ?? [])
        .map(
          (feature: {
            place_name: string;
            center: [number, number];
            text?: string;
            properties?: { name?: string };
          }) => {
            const [lng, lat] = feature.center;
            const distanceMiles = getDistanceFromCampus(lat, lng);
            return {
              place_name: feature.place_name,
              center: feature.center,
              text: feature.text,
              properties: feature.properties,
              distanceMiles,
              withinRadius: distanceMiles <= ON_CAMPUS_RADIUS_MILES,
            };
          }
        )
        .sort((a, b) => a.distanceMiles - b.distanceMiles);
      setSearchResults(rankedResults);
    } catch {
      setSearchResults([]);
    }
  };

  const selectSearchResult = (result: SearchResult) => {
    const [lng, lat] = result.center;
    placeMarker(lng, lat);
    updateForm({
      address: result.place_name,
      name: result.properties?.name ?? result.text ?? form.name,
    });
    setAddressEditable(false);
    setSearchResults([]);
    setSearchQuery(result.place_name);
    map.current?.flyTo({ center: [lng, lat], zoom: 16 });
  };

  const nearbyResults = searchResults.filter((result) => result.withinRadius);
  const fartherResults = searchResults.filter((result) => !result.withinRadius);

  return (
    <div>
      <h2 className="text-lg font-extrabold mb-1">Set Location</h2>
      <p className="text-sm text-secondary mb-4">
        Search for a place or tap the map to drop a pin.
      </p>

      {/* Search */}
      <div className="relative mb-3">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search for a place..."
          className="w-full bg-card border border-border rounded-xl py-2.5 pl-9 pr-4 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary/30"
        />
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl overflow-hidden z-10 max-h-48 overflow-y-auto">
            {nearbyResults.length > 0 && (
              <p className="px-3 py-1.5 text-[11px] font-semibold text-primary border-b border-border bg-card-secondary/40">
                Within {ON_CAMPUS_RADIUS_MILES} mile
              </p>
            )}
            {nearbyResults.map((result, i) => (
              <button
                key={`near-${i}-${result.place_name}`}
                onClick={() => selectSearchResult(result)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-card-secondary transition-colors border-b border-border"
              >
                <span className="line-clamp-1">{result.place_name}</span>
              </button>
            ))}
            {fartherResults.length > 0 && (
              <p className="px-3 py-1.5 text-[11px] font-semibold text-muted border-b border-border bg-card-secondary/20">
                Farther than {ON_CAMPUS_RADIUS_MILES} mile
              </p>
            )}
            {fartherResults.map((result, i) => (
              <button
                key={`far-${i}-${result.place_name}`}
                onClick={() => selectSearchResult(result)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-card-secondary transition-colors border-b border-border last:border-0"
              >
                <span className="line-clamp-1">{result.place_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div
        ref={mapContainer}
        className="w-full h-56 rounded-xl overflow-hidden border border-border"
      />
      {locationWarning && (
        <p className="mt-2 text-xs text-amber-500">{locationWarning}</p>
      )}

      {/* Address */}
      {(form.latitude !== null || addressEditable) && (
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={14} className="text-muted" />
            <span className="text-xs text-muted">Address</span>
          </div>
          {addressEditable ? (
            <input
              type="text"
              value={form.address}
              onChange={(e) => updateForm({ address: e.target.value })}
              placeholder="Enter address manually..."
              className="w-full bg-card border border-border rounded-xl py-2 px-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary/30"
            />
          ) : (
            <p className="text-sm text-secondary">{form.address}</p>
          )}
        </div>
      )}
    </div>
  );
}
