import type { ReactElement } from "react";

export type MapPoint = {
  longitude: number;
  latitude: number;
  selected: boolean;
};

export type TrackMapProps = {
  points: MapPoint[];
  onPointClick: (index: number) => void;
};

export type TrackMap = (props: TrackMapProps) => ReactElement;
