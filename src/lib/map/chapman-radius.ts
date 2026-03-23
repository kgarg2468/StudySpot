import mapboxgl from "mapbox-gl";
import { CHAPMAN_CENTER, ON_CAMPUS_RADIUS_MILES } from "@/lib/constants";

const MILES_TO_KM = 1.609344;
const EARTH_RADIUS_KM = 6371;

function createCircleCoordinates(steps = 72): [number, number][] {
  const centerLat = (CHAPMAN_CENTER.lat * Math.PI) / 180;
  const centerLng = (CHAPMAN_CENTER.lng * Math.PI) / 180;
  const angularDistance = (ON_CAMPUS_RADIUS_MILES * MILES_TO_KM) / EARTH_RADIUS_KM;
  const coordinates: [number, number][] = [];

  for (let i = 0; i <= steps; i += 1) {
    const bearing = ((i / steps) * 360 * Math.PI) / 180;
    const lat = Math.asin(
      Math.sin(centerLat) * Math.cos(angularDistance) +
        Math.cos(centerLat) * Math.sin(angularDistance) * Math.cos(bearing)
    );
    const lng =
      centerLng +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(centerLat),
        Math.cos(angularDistance) - Math.sin(centerLat) * Math.sin(lat)
      );

    coordinates.push([(lng * 180) / Math.PI, (lat * 180) / Math.PI]);
  }

  return coordinates;
}

export function addChapmanRadiusOverlay(
  map: mapboxgl.Map,
  idPrefix = "chapman-radius"
) {
  const sourceId = `${idPrefix}-source`;
  const fillId = `${idPrefix}-fill`;
  const strokeId = `${idPrefix}-stroke`;

  if (map.getSource(sourceId)) return;

  map.addSource(sourceId, {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [createCircleCoordinates()],
      },
    },
  });

  map.addLayer({
    id: fillId,
    type: "fill",
    source: sourceId,
    paint: {
      "fill-color": "#f97316",
      "fill-opacity": 0.18,
    },
  });

  map.addLayer({
    id: strokeId,
    type: "line",
    source: sourceId,
    paint: {
      "line-color": "#ea580c",
      "line-width": 2,
      "line-opacity": 0.9,
    },
  });
}
