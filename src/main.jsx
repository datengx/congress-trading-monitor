import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";
import { fetchData } from "./data";
import { parseRoute } from "./router";
import "./govuk.scss";
import "./index.css";

const root = document.getElementById("root");
const initialData = document.getElementById("page-data");
const embeddedPage = initialData ? JSON.parse(initialData.textContent) : null;
const route = parseRoute();
const matchesRoute = embeddedPage?.route.name === route.name && embeddedPage?.route.id === route.id && embeddedPage?.route.symbol === route.symbol;
const seed = matchesRoute ? embeddedPage : null;

// The seed names its data files ({ $file: url }) instead of embedding them (see injectPage in scripts/prerender.mjs).
// Fetching them and hydrating with that data keeps the markup identical to the prerendered page.
async function resolve(value) {
  if (Array.isArray(value)) return Promise.all(value.map(resolve));
  if (value && typeof value === "object") {
    if (typeof value.$file === "string") return fetchData(value.$file);
    const entries = await Promise.all(Object.entries(value).map(async ([k, v]) => [k, await resolve(v)]));
    return Object.fromEntries(entries);
  }
  return value;
}

async function start() {
  if (seed && root.hasChildNodes()) {
    try {
      hydrateRoot(root, <App initialPage={await resolve(seed)} />);
      return;
    } catch (error) {
      // The app loads its own data when it starts without a page, so the page still works; it re-renders from scratch.
      console.error("Congress page data failed to load; starting without it", error);
    }
  }
  createRoot(root).render(<App initialPage={null} />);
}
start();
