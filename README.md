# Bengaluru Namma Metro Route Planner

[![GitHub repo](https://img.shields.io/badge/GitHub-msrishav--28%2Fblr--metro--react-181717?logo=github)](https://github.com/msrishav-28/blr-metro-react)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=111)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2-646cff?logo=vite&logoColor=fff)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38bdf8?logo=tailwindcss&logoColor=fff)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](#license)

Interactive Namma Metro & Suburban Rail route planning with station search, fare and time estimates, animated map playback, journey timelines, and PNG/MP4 exports.
## Features

- Search Bengaluru Namma Metro and Suburban Rail origin and destination stations.
- View route fare, stop count, estimated travel time, interchanges, and line direction.
- Follow the metro on the SVG map with smooth or station-by-station animation.
- Includes operational, under-construction, planned, and suburban corridors.
- Choose route camera zoom levels for map playback and video export.
- Export the journey timeline as PNG.
- Export the animated metro route as MP4 using Mediabunny.

## Lines in the Dataset

| Corridor | Status | Colour |
| --- | --- | --- |
| Purple (Whitefield ↔ Challaghatta) | Operational | `#7b2cbf` |
| Green (Madavara ↔ Silk Institute) | Operational | `#2e7d32` |
| Yellow (RV Road ↔ Bommasandra) | Operational | `#f9a825` |
| Pink (Kalena Agrahara ↔ Nagawara) | Under construction | `#e91e8c` |
| Blue / Airport (Silk Board ↔ KIAL) | Under construction | `#1565c0` |
| Orange (JP Nagar ↔ Hebbal / ORR west) | Planned | `#ef6c00` |
| Grey (Hosahalli ↔ Kadabagere) | Planned | `#607d8b` |
| Red (Sarjapur ↔ Hebbal) | Planned | `#c62828` |
| Suburban Sampige | Planned / tendering | `#00897b` |
| Suburban Mallige | Under construction | `#43a047` |
| Suburban Parijaata | Planned | `#8d6e63` |
| Suburban Kanaka | Under construction | `#d84315` |

Dashed strokes on the map mark construction, planned, and suburban corridors.

## How Routing Works

Routing is implemented in `src/utils/routePlanner.ts` as a weighted graph over station IDs.

- `src/data/stations-lite.json` provides station IDs, names, and coordinates.
- `src/data/edge.json` provides the metro links between stations, line colors, and SVG path fragments used to draw each segment.
- Each station is added as a graph node.
- Each edge is weighted by the haversine distance between station coordinates. If coordinates are missing or invalid, the edge falls back to `1`.
- Route options are enriched with display names, stops, interchanges, distance, fare, holiday fare, fare type, time limit, estimated journey minutes, and one combined SVG path.

The fare calculation follows Bengaluru's standardized distance-based fare system.

Route sorting in the UI is separate from path finding. The planner can sort returned options by lowest interchange count first, or by lowest stop count first.

## Animation with GSAP

The animated route is rendered in `src/components/graphsvg.tsx`. The route planner returns a single SVG `d` string, and the map uses that path as the rail for both the visible route highlight and the animated train.

The train is not animated by directly tweening SVG transforms. GSAP animates a small proxy object:

```ts
const proxy = { progress: 0 };
```

On each GSAP update, the current progress is converted into a real SVG point with `getPointAtLength()`. The next point on the path is sampled to compute the train's rotation angle, then the train group receives a `translate(...) rotate(...)` transform. The same progress value drives the camera transform, keeping the train centered during cinematic playback.

There are two route playback modes:

- Smooth mode animates continuously from the first route stop to the last stop with a `power1.inOut` ease.
- Step mode creates one timeline segment per station pair, uses `power2.inOut`, updates the active station at each stop, and adds a short dwell between stations.

Video export reuses the same route math. Instead of depending on live GSAP playback, export code calculates the expected progress for each frame, renders the SVG into a canvas, and writes the frames with Mediabunny.

## Android Packaging with Bubblewrap

This repository includes the Bubblewrap-generated Android wrapper for the web app. Bubblewrap reads `twa-manifest.json` and creates the native Android project that launches the app as a Trusted Web Activity.

Typical Bubblewrap flow:

```bash
npx @bubblewrap/cli init --manifest https://[your-domain]/manifest.json
npx @bubblewrap/cli update
npx @bubblewrap/cli build
```

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- GSAP
- Zustand
- Mediabunny
- html-to-image

## Getting Started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Useful Scripts

```bash
npm run lint
npm run generate:seo
npm run update:labels
npm run update:gates
```

## Data

Regenerate network files after updating Python data sources:

```bash
python scripts/generate-bangalore-network.py
```

*Note: Station coordinates are schematic-quality approximations for routing and layout, not official BMRCL survey points.*

## Credit

Created by [M S Rishav Subhin](https://github.com/msrishav-28).
Independent tool — not affiliated with BMRCL or K-RIDE.

## License

This project is licensed under the Apache License 2.0. See `package.json` for the current package license metadata.
