#!/usr/bin/env python3
"""Generate stations-lite.json, edge.json, labels.json, metro.json for Bengaluru."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src" / "data"

# viewBox 0 0 1500 1450 — project Bengaluru WGS84 into schematic space
LAT_MIN, LAT_MAX = 12.74, 13.26
LNG_MIN, LNG_MAX = 77.44, 77.79
PAD = 90
WIDTH, HEIGHT = 1500, 1450


def project(lat: float, lng: float) -> tuple[float, float]:
    x = PAD + (lng - LNG_MIN) / (LNG_MAX - LNG_MIN) * (WIDTH - 2 * PAD)
    y = PAD + (LAT_MAX - lat) / (LAT_MAX - LAT_MIN) * (HEIGHT - 2 * PAD)
    return round(x, 2), round(y, 2)


LINES = [
    {
        "name": "Purple Line",
        "color": "#7b2cbf",
        "status": "operational",
        "ids": [
            "WFD", "HFC", "KTP", "PTA", "SSH", "NLH", "KDH", "SRP", "HOD", "GCP",
            "SYP", "KRP", "BNG", "BYP", "SVR", "INR", "HLS", "TRN", "MGR", "CBP",
            "VDS", "SMV", "MJS", "KSR", "MGD", "HSL", "VJN", "ATG", "DJN", "MSR",
            "NYD", "RRN", "JNB", "PTG", "KBT", "KNG", "CHG",
        ],
    },
    {
        "name": "Green Line",
        "color": "#2e7d32",
        "status": "operational",
        "ids": [
            "MDV", "CBK", "MJN", "NGS", "DSH", "JLH", "PYI", "PYA", "GGP", "YPR",
            "SSF", "MHL", "RJN", "KVR", "SRP2", "SMS", "MJS", "CKP", "KRM", "NCL",
            "LBG", "SEC", "JYN", "RVR", "BSK", "JPN", "YCH", "KKC", "DKK", "VJH",
            "TGP", "SLK",
        ],
    },
    {
        "name": "Yellow Line",
        "color": "#f9a825",
        "status": "operational",
        "ids": [
            "RVR", "RGD", "JDH", "BTM", "CSB", "BMH", "HGA", "KDG", "SGS", "HSR2",
            "BTA", "ELC", "IFK", "HKR", "HBG", "BMS",
        ],
    },
    {
        "name": "Pink Line",
        "color": "#e91e8c",
        "status": "construction",
        "ids": [
            "KLA", "HLM", "IIM", "JP4", "JPN", "TVK", "DRC", "LKS", "LFT", "RMS",
            "MGR", "SVJ", "CNT", "PTT", "TNR", "VNK", "KGD", "NGW",
        ],
    },
    {
        "name": "Blue Line (Airport)",
        "color": "#1565c0",
        "status": "construction",
        "ids": [
            "CSB", "HSRL", "AGR", "IBL", "BLR", "KDB", "KBS", "MTH", "ISR", "DNK",
            "KRP", "BGD", "SWN", "KSN", "HRM", "HRB", "KLN", "NGW", "KKN", "HBR", "VRP",
            "KMP", "HBL", "KGH", "JKC", "YLH", "BGC", "DJL", "APC", "KIA",
        ],
    },
    {
        "name": "Orange Line",
        "color": "#ef6c00",
        "status": "planned",
        "ids": [
            "JP5", "KDC", "KMD", "BSK", "HSK", "PES", "MSR", "NGB", "NBC", "VNL",
            "FFC", "GGP", "KTS", "BEL", "NSH", "HBL",
        ],
    },
    {
        "name": "Grey Line",
        "color": "#607d8b",
        "status": "planned",
        "ids": ["HSL", "SMC", "KHB", "HRH", "FGT", "BYD", "KBG"],
    },
    {
        "name": "Red Line",
        "color": "#c62828",
        "status": "planned",
        "ids": ["SJP", "DDM", "CRL", "BGG", "KRM2", "SHN", "MJS", "MLS", "MCK", "HBL"],
    },
    {
        "name": "Suburban · Sampige",
        "color": "#00897b",
        "status": "suburban",
        "ids": ["KRP", "BYE", "BNG", "BYP", "HLG"],
    },
    {
        "name": "Suburban · Mallige",
        "color": "#43a047",
        "status": "suburban",
        "ids": ["KNG", "YPR", "MTN", "LTG", "JDL", "YLH", "NIT", "BTH", "APT", "DVN"],
    },
    {
        "name": "Suburban · Parijaata",
        "color": "#8d6e63",
        "status": "suburban",
        "ids": ["WFD", "KSN2", "SVN", "BNW", "HNR", "TNS", "RJK"],
    },
    {
        "name": "Suburban · Kanaka",
        "color": "#d84315",
        "status": "suburban",
        "ids": ["KSR", "YPR", "STH", "MYD", "CBV"],
    },
]


def main() -> None:
    stations = json.loads((DATA / "stations-lite.json").read_text())
    by_id = {s["id"]: s for s in stations}
    missing = [sid for line in LINES for sid in line["ids"] if sid not in by_id]
    if missing:
        raise SystemExit(f"unknown station ids: {missing}")

    membership: dict[str, list[str]] = {s["id"]: [] for s in stations}
    for line in LINES:
        for sid in line["ids"]:
            if line["name"] not in membership[sid]:
                membership[sid].append(line["name"])

    edges = []
    for line in LINES:
        ids = line["ids"]
        for a, b in zip(ids, ids[1:]):
            ax, ay = project(by_id[a]["Latitude"], by_id[a]["Longitude"])
            bx, by = project(by_id[b]["Latitude"], by_id[b]["Longitude"])
            edges.append({
                "from": a,
                "to": b,
                "stroke": line["color"],
                "path": f"M{ax} {ay} L{bx} {by}",
                "status": line["status"],
                "line": line["name"],
            })

    labels = []
    metro = []
    for s in stations:
        lines = membership[s["id"]]
        labels.append({
            "id": s["id"],
            "text": s["text"],
            "layout": "elevated",
            "Latitude": s["Latitude"],
            "Longitude": s["Longitude"],
            "localName": s["text"],
            "description": f"{s['text']} on {', '.join(lines)}.",
            "interchange": len(lines) > 1,
            "stationFacilities": [],
            "gates": [],
            "facilities": [],
            "platforms": [],
            "parking": [],
            "lifts": [],
            "nearbyPlaces": [],
        })
        for line_name in lines:
            metro.append({
                "Station": s["text"],
                "Line": line_name,
                "Latitude": s["Latitude"],
                "Longitude": s["Longitude"],
            })

    (DATA / "edge.json").write_text(json.dumps(edges, indent=2) + "\n")
    (DATA / "labels.json").write_text(json.dumps(labels, indent=2) + "\n")
    (DATA / "stations.json").write_text(json.dumps(labels, indent=2) + "\n")
    (DATA / "metro.json").write_text(json.dumps(metro, indent=2) + "\n")
    print(f"wrote {len(stations)} stations, {len(edges)} edges")


if __name__ == "__main__":
    main()
