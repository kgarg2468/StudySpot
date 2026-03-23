export const CHAPMAN_CENTER = {
  lat: 33.7937,
  lng: -117.8515,
} as const;

export const ON_CAMPUS_RADIUS_MILES = 1.0;

export const FEED_PAGE_SIZE = 20;

export const CATEGORY_OPTIONS = [
  "Library",
  "Cafe",
  "Outdoor",
  "Building",
  "Other",
] as const;

export const ATTRIBUTE_LABELS: Record<
  string,
  { low: string; mid: string; high: string }
> = {
  noise: { low: "Quiet", mid: "Moderate", high: "Loud" },
  seating: { low: "Easy to find", mid: "Hit or miss", high: "Hard to find" },
  wifi: { low: "Weak", mid: "Decent", high: "Strong" },
  outlet: { low: "Scarce", mid: "Some", high: "Plenty" },
  food_drink: { low: "None nearby", mid: "Limited", high: "Great options" },
  vibe: { low: "Minimal", mid: "Comfortable", high: "Lively" },
  group_friendly: {
    low: "Solo only",
    mid: "Small groups OK",
    high: "Great for groups",
  },
};

export function getAttributeLabel(key: string, avg: number): string {
  const labels = ATTRIBUTE_LABELS[key];
  if (!labels) return "";
  if (avg <= 2.3) return labels.low;
  if (avg <= 3.6) return labels.mid;
  return labels.high;
}

export function getDistanceFromCampus(lat: number, lng: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat - CHAPMAN_CENTER.lat) * Math.PI) / 180;
  const dLng = ((lng - CHAPMAN_CENTER.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((CHAPMAN_CENTER.lat * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function isWithinCampusRadius(lat: number, lng: number): boolean {
  return getDistanceFromCampus(lat, lng) <= ON_CAMPUS_RADIUS_MILES;
}

export function getLocationLabel(lat: number, lng: number): string {
  const distance = getDistanceFromCampus(lat, lng);
  if (isWithinCampusRadius(lat, lng)) return "On campus";
  return `${distance.toFixed(1)} mi away`;
}
