import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createHttpApi } from "./api";
import { App } from "./App";

const root = document.getElementById("root");
if (root === null) {
  throw new Error("root element is missing");
}

createRoot(root).render(
  <StrictMode>
    <App api={createHttpApi()} />
  </StrictMode>,
);
