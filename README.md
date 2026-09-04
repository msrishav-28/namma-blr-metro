# Namma Metro + Suburban Planner

Fork of [biomathcode/delhi-metro-react](https://github.com/biomathcode/delhi-metro-react) adapted for **Bengaluru**.

This copy lives at [msrishav-28/blr-metro-react](https://github.com/msrishav-28/blr-metro-react). It is **not** pushed upstream.

## What this fork changes

- Network data is Bengaluru **Namma Metro** plus **Suburban Rail**.
- Map includes **operational**, **under-construction**, **planned**, and **suburban** corridors.
- The Delhi schematic SVG is replaced with a data-driven map drawn from `edge.json`.
- Branding points at this fork, not metro.coolhead.in.

## Lines in the dataset

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

## Run locally

```bash
pnpm install
pnpm run dev
```

## Data

Regenerate network files:

```bash
python3 scripts/generate-bangalore-network.py
```

Station coordinates are schematic-quality approximations for routing and layout, not official BMRCL survey points.

## Credit

Original planner by [Pratik Sharma / biomathcode](https://github.com/biomathcode/delhi-metro-react) (Apache-2.0).
Bengaluru adaptation by [M S Rishav Subhin](https://github.com/msrishav-28).
Independent tool — not affiliated with BMRCL, K-RIDE, or DMRC.
