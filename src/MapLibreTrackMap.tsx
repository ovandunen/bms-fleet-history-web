import { useEffect, useRef } from "react";
import { LngLatBounds, Map, setWorkerUrl, type GeoJSONSource } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapPoint, TrackMapProps } from "./trackMap";

export const OPENFREEMAP_LIBERTY_STYLE = "https://tiles.openfreemap.org/styles/liberty";

const POINTS = "track-points";
const LINE = "track-line";

setWorkerUrl(workerUrl);

function coordinate(point: MapPoint): [number, number] {
  return [point.longitude, point.latitude];
}

function emptyCollection() {
  return { type: "FeatureCollection" as const, features: [] };
}

function pointData(points: MapPoint[]) {
  return {
    type: "FeatureCollection" as const,
    features: points.map((point, index) => ({
      type: "Feature" as const,
      properties: { index, selected: point.selected },
      geometry: { type: "Point" as const, coordinates: coordinate(point) },
    })),
  };
}

function lineData(points: MapPoint[]) {
  if (points.length < 2) {
    return emptyCollection();
  }
  return {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "LineString" as const,
          coordinates: points.map((point) => coordinate(point)),
        },
      },
    ],
  };
}

function writeSource(map: Map, id: string, data: ReturnType<typeof pointData> | ReturnType<typeof lineData>) {
  const source = map.getSource(id);
  if (source === undefined) {
    return;
  }
  void (source as GeoJSONSource).setData(data as never).catch(() => undefined);
}

function showTrack(map: Map, points: MapPoint[], moveCamera: boolean) {
  writeSource(map, POINTS, pointData(points));
  writeSource(map, LINE, lineData(points));
  if (!moveCamera || points.length === 0) {
    return;
  }
  if (points.length === 1) {
    map.jumpTo({ center: coordinate(points[0]), zoom: 14 });
    return;
  }
  const bounds = new LngLatBounds();
  for (const point of points) {
    bounds.extend(coordinate(point));
  }
  map.fitBounds(bounds, { padding: 40, maxZoom: 16 });
}

function cameraKey(points: MapPoint[]): string {
  return points.map((point) => `${point.longitude},${point.latitude}`).join(";");
}

export function MapLibreTrackMap(props: TrackMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const pointsRef = useRef(props.points);
  const onPointClickRef = useRef(props.onPointClick);
  const fittedKey = useRef<string | null>(null);
  pointsRef.current = props.points;
  onPointClickRef.current = props.onPointClick;

  useEffect(() => {
    const element = container.current;
    if (element === null) {
      return;
    }
    let removed = false;
    const map = new Map({
      container: element,
      style: OPENFREEMAP_LIBERTY_STYLE,
    });
    mapRef.current = map;
    map.on("load", () => {
      if (removed) {
        return;
      }
      map.addSource(POINTS, { type: "geojson", data: emptyCollection() } as never);
      map.addSource(LINE, { type: "geojson", data: emptyCollection() } as never);
      map.addLayer({
        id: LINE,
        type: "line",
        source: LINE,
        paint: { "line-color": "#1d4e89", "line-width": 3 },
      } as never);
      map.addLayer({
        id: POINTS,
        type: "circle",
        source: POINTS,
        paint: {
          "circle-radius": 6,
          "circle-color": ["case", ["==", ["get", "selected"], true], "#c45c26", "#1d4e89"],
          "circle-stroke-width": ["case", ["==", ["get", "selected"], true], 3, 1],
          "circle-stroke-color": "#ffffff",
        },
      } as never);
      map.on("click", POINTS, (event) => {
        const raw = event.features?.[0]?.properties?.index;
        if (typeof raw === "number" && Number.isInteger(raw)) {
          onPointClickRef.current(raw);
          return;
        }
        if (typeof raw === "string" && /^\d+$/.test(raw)) {
          onPointClickRef.current(Number(raw));
        }
      });
      const points = pointsRef.current;
      fittedKey.current = cameraKey(points);
      showTrack(map, points, true);
    });
    return () => {
      removed = true;
      map.remove();
      mapRef.current = null;
      fittedKey.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (map === null || map.getSource(POINTS) === undefined) {
      return;
    }
    const key = cameraKey(props.points);
    const moveCamera = key !== fittedKey.current;
    fittedKey.current = key;
    showTrack(map, props.points, moveCamera);
  }, [props.points]);

  return <div ref={container} style={{ height: "400px" }} />;
}
