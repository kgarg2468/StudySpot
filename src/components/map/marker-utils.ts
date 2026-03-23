import type { Category } from "@/lib/types/database";

const categoryLabelMap: Record<Category, string> = {
  Library: "L",
  Cafe: "C",
  Outdoor: "O",
  Building: "B",
  Other: "S",
};

export function createSpotMarkerElement(category: Category): HTMLDivElement {
  const marker = document.createElement("div");
  marker.className = "map-spot-marker";
  marker.innerHTML = `<span class="map-spot-marker-label">${categoryLabelMap[category] ?? "S"}</span>`;
  return marker;
}
