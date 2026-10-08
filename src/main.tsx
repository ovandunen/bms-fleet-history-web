import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createHttpApi } from "./api";
import { App } from "./App";
import { MapLibreTrackMap } from "./MapLibreTrackMap";

const root = document.getElementById("root");
if (root === null) {
  throw new Error("root element is missing");
}

const api = createHttpApi();

createRoot(root).render(
  <StrictMode>
    <App api={api} history={api} map={MapLibreTrackMap} />
  </StrictMode>,
);
