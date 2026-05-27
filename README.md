# Delhi Metro Route Planner

![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=111)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=fff)
![Vite](https://img.shields.io/badge/Vite-7.2-646cff?logo=vite&logoColor=fff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38bdf8?logo=tailwindcss&logoColor=fff)
![License](https://img.shields.io/badge/license-private-neutral)

Interactive Delhi Metro route planning with station search, fare and time estimates, animated map playback, journey timelines, and PNG/MP4 exports.

![Delhi Metro Route Planner showcase](public/images/showcase.png)

## Features

- Search Delhi Metro origin and destination stations.
- View route fare, stop count, estimated travel time, interchanges, and line direction.
- Follow the metro on the SVG map with smooth or station-by-station animation.
- Choose route camera zoom levels for map playback and video export.
- Export the journey timeline as PNG.
- Export the animated metro route as MP4 using Mediabunny.

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
pnpm install
pnpm run dev
```

Build for production:

```bash
pnpm run build
```

Preview the production build:

```bash
pnpm run preview
```
