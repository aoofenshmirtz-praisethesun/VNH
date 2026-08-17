"""NeerNetra / Viksit Nagpur — FastAPI backend."""

from __future__ import annotations

import json
import math
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from verdict_engine import crop_advice, crop_yield_loss, cpcb_class, drinking_verdict

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
CITIZEN_FILE = DATA_DIR / "citizen_readings.json"

CGWB_GEOJSON = DATA_DIR / "nagpur_groundwater_cgwb.geojson"
NEERI_GEOJSON = DATA_DIR / "nagpur_neeri_2023-24.geojson"

NAGPUR_CENTER = [21.1458, 79.0882]
MAX_NEAREST_KM = 25.0
GRID_SIZE = 0.001  # ~100 m at Nagpur latitude


app = FastAPI(title="NeerNetra API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CitizenReadingIn(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    ec: float | None = Field(None, ge=0)
    tds: float | None = Field(None, ge=0)
    ph: float | None = Field(None, ge=0, le=14)
    date: str | None = None
    notes: str | None = None


class CropQuery(BaseModel):
    lat: float
    lon: float
    crop: str


def _load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def _num(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        x = float(value)
        return None if math.isnan(x) else x
    except (TypeError, ValueError):
        return None


def _coarsen(lat: float, lon: float) -> tuple[float, float]:
    return round(lat / GRID_SIZE) * GRID_SIZE, round(lon / GRID_SIZE) * GRID_SIZE


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlon / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _cgwb_sample(props: dict) -> dict:
    return {
        "ph": _num(props.get("ph")),
        "ec": _num(props.get("ec")),
        "tds": _num(props.get("tds")),
        "th": _num(props.get("th")),
        "ca": _num(props.get("ca")),
        "mg": _num(props.get("mg")),
        "cl": _num(props.get("cl")),
        "so4": _num(props.get("so4")),
        "no3": _num(props.get("no3")),
        "f": _num(props.get("f")),
        "sar": _num(props.get("sar")),
    }


def _neeri_sample(props: dict) -> dict:
    ec_mscm = _num(props.get("ec_mscm"))
    ec_uscm = ec_mscm * 1000 if ec_mscm is not None else None
    return {
        "ph": _num(props.get("ph")),
        "ec": ec_uscm,
        "tds": _num(props.get("tds_mgl")),
        "no3": _num(props.get("nitrate_mgl")),
        "do_mgl": _num(props.get("do_mgl")),
        "total_coliform_cfu100ml": _num(props.get("total_coliform_cfu100ml")),
        "faecal_coliform_cfu100ml": _num(props.get("faecal_coliform_cfu100ml")),
    }


def _point_label(props: dict, source: str) -> str:
    if source == "cgwb":
        return props.get("site") or props.get("taluka") or "CGWB sample"
    if props.get("source_type") == "river":
        return f"{props.get('river', 'River')} — {props.get('code', '')}"
    if props.get("source_type") == "groundwater_city":
        return props.get("detail") or props.get("code") or "City well"
    if props.get("source_type") == "stp":
        return props.get("code") or "STP"
    return props.get("code") or "NEERI sample"


def _load_official_points() -> list[dict]:
    points: list[dict] = []

    for path, source in [(CGWB_GEOJSON, "cgwb"), (NEERI_GEOJSON, "neeri")]:
        if not path.exists():
            continue
        geo = _load_json(path, {"features": []})
        for idx, feature in enumerate(geo.get("features", [])):
            geom = feature.get("geometry") or {}
            coords = geom.get("coordinates") or [None, None]
            if len(coords) < 2:
                continue
            lon, lat = coords[0], coords[1]
            props = feature.get("properties") or {}
            sample = _cgwb_sample(props) if source == "cgwb" else _neeri_sample(props)
            point_id = f"{source}-{props.get('sr') or props.get('code') or idx}"
            source_type = props.get("source_type") or ("groundwater" if source == "cgwb" else "unknown")
            points.append(
                {
                    "id": str(point_id),
                    "lat": lat,
                    "lon": lon,
                    "source": source,
                    "source_type": source_type,
                    "label": _point_label(props, source),
                    "taluka": props.get("taluka"),
                    "aquifer": props.get("aquifer"),
                    "measured_date": "CGWB district survey" if source == "cgwb" else "NEERI 2023-24",
                    "sample": sample,
                    "properties": props,
                    "kind": "official",
                }
            )
    return points


def _load_citizen_points() -> list[dict]:
    readings = _load_json(CITIZEN_FILE, [])
    out = []
    for reading in readings:
        sample = {
            "ph": _num(reading.get("ph")),
            "ec": _num(reading.get("ec")),
            "tds": _num(reading.get("tds")),
        }
        out.append(
            {
                "id": reading["id"],
                "lat": reading["display_lat"],
                "lon": reading["display_lon"],
                "source": "citizen",
                "source_type": "citizen_reading",
                "label": "Citizen reading (approximate location)",
                "measured_date": reading.get("date") or reading.get("submitted_at", "")[:10],
                "sample": sample,
                "properties": {"notes": reading.get("notes"), "is_synthetic": False},
                "kind": "citizen",
                "citizen_only": True,
            }
        )
    return out


def _all_points() -> list[dict]:
    return _load_official_points() + _load_citizen_points()


def _serialize_point(point: dict, include_verdict: bool = True) -> dict:
    payload = {
        "id": point["id"],
        "lat": point["lat"],
        "lon": point["lon"],
        "source": point["source"],
        "source_type": point["source_type"],
        "label": point["label"],
        "measured_date": point.get("measured_date"),
        "kind": point.get("kind", "official"),
        "sample": {k: v for k, v in point["sample"].items() if v is not None},
    }
    if point.get("taluka"):
        payload["taluka"] = point["taluka"]
    if point.get("aquifer"):
        payload["aquifer"] = point["aquifer"]
    if point.get("citizen_only"):
        payload["citizen_only"] = True
        payload["irrigation_note"] = (
            "Citizen meter readings cannot produce a drinking verdict. "
            "Consider lab testing for nitrate, fluoride, coliforms, and metals."
        )
    if include_verdict and not point.get("citizen_only"):
        payload["drinking_verdict"] = drinking_verdict(point["sample"])
    elif include_verdict:
        payload["drinking_verdict"] = {
            "verdict": "NOT_TESTED",
            "statement": "Citizen meter readings cannot produce a drinking verdict.",
            "exceedances": [],
            "n_parameters_tested": len(payload["sample"]),
            "bacteriological_tested": False,
        }
    return payload


def _nearest_official(lat: float, lon: float) -> tuple[dict | None, float | None]:
    best = None
    best_dist = None
    for point in _load_official_points():
        dist = _haversine_km(lat, lon, point["lat"], point["lon"])
        if best_dist is None or dist < best_dist:
            best = point
            best_dist = dist
    return best, best_dist


@app.get("/api/health")
def health() -> dict:
    official = _load_official_points()
    return {
        "status": "ok",
        "official_points": len(official),
        "citizen_points": len(_load_citizen_points()),
    }


@app.get("/api/meta")
def meta() -> dict:
    return {
        "center": NAGPUR_CENTER,
        "max_nearest_km": MAX_NEAREST_KM,
        "stats": {
            "cgwb_samples": sum(1 for p in _load_official_points() if p["source"] == "cgwb"),
            "neeri_features": sum(1 for p in _load_official_points() if p["source"] == "neeri"),
        },
        "optional_features": {
            "esr_supply": False,
            "outfalls": False,
            "flood_reports": False,
        },
    }


@app.get("/api/points")
def list_points(include_citizen: bool = True) -> dict:
    points = _load_official_points()
    if include_citizen:
        points += _load_citizen_points()
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [p["lon"], p["lat"]]},
                "properties": _serialize_point(p, include_verdict=False),
            }
            for p in points
        ],
    }


@app.get("/api/points/{point_id}")
def get_point(point_id: str) -> dict:
    for point in _all_points():
        if point["id"] == point_id:
            data = _serialize_point(point)
            if not point.get("citizen_only"):
                data["cpcb_classes"] = cpcb_class(point["sample"])
            return data
    raise HTTPException(status_code=404, detail="Point not found")


@app.get("/api/nearest")
def nearest(lat: float, lon: float) -> dict:
    point, distance_km = _nearest_official(lat, lon)
    if point is None:
        return {
            "query": {"lat": lat, "lon": lon},
            "distance_km": None,
            "drinking_verdict": drinking_verdict({}),
        }
    if distance_km is not None and distance_km > MAX_NEAREST_KM:
        verdict = drinking_verdict({})
        return {
            "query": {"lat": lat, "lon": lon},
            "distance_km": round(distance_km, 2),
            "nearest_point": None,
            "drinking_verdict": verdict,
            "note": "Nearest official measurement is beyond the configured search radius.",
        }

    serialized = _serialize_point(point)
    serialized["cpcb_classes"] = cpcb_class(point["sample"])
    return {
        "query": {"lat": lat, "lon": lon},
        "distance_km": round(distance_km or 0, 2),
        "nearest_point": serialized,
        "drinking_verdict": serialized["drinking_verdict"],
    }


@app.get("/api/crops")
def list_crops() -> dict:
    from verdict_engine import CROPS

    crops = sorted(CROPS.keys())
    nagpur_first = [c for c in crops if "Orange" in c or "Cotton" in c or "Tur" in c or "Mango" in c]
    rest = [c for c in crops if c not in nagpur_first]
    return {"crops": nagpur_first + rest}


@app.post("/api/crop-verdict")
def crop_verdict(body: CropQuery) -> dict:
    point, distance_km = _nearest_official(body.lat, body.lon)
    if point is None or (distance_km or 0) > MAX_NEAREST_KM:
        return {
            "distance_km": round(distance_km, 2) if distance_km else None,
            "error": "No nearby official measurement for crop analysis.",
        }

    ec = _num(point["sample"].get("ec"))
    if ec is None:
        return {
            "distance_km": round(distance_km or 0, 2),
            "nearest_point": _serialize_point(point, include_verdict=False),
            "error": "Nearest point has no EC measurement for irrigation analysis.",
        }

    loss = crop_yield_loss(ec, body.crop)
    if not loss:
        raise HTTPException(status_code=400, detail="Unknown crop")

    classes = cpcb_class(point["sample"])
    alternatives = [c for c in crop_advice(ec, 6) if c["crop"] != body.crop][:5]

    return {
        "distance_km": round(distance_km or 0, 2),
        "nearest_point": _serialize_point(point, include_verdict=False),
        "crop": body.crop,
        "yield_loss": loss,
        "cpcb_class_e": classes.get("E"),
        "alternatives": alternatives,
    }


@app.get("/api/citizen-readings")
def get_citizen_readings() -> dict:
    return {"readings": _load_json(CITIZEN_FILE, [])}


@app.post("/api/citizen-readings")
def add_citizen_reading(body: CitizenReadingIn) -> dict:
    if body.ec is None and body.tds is None:
        raise HTTPException(status_code=400, detail="Provide at least EC or TDS.")

    display_lat, display_lon = _coarsen(body.lat, body.lon)
    ec = body.ec
    if ec is None and body.tds is not None:
        ec = body.tds * 1.6  # rough conductivity estimate from TDS

    reading = {
        "id": str(uuid.uuid4()),
        "display_lat": display_lat,
        "display_lon": display_lon,
        "ec": ec,
        "tds": body.tds,
        "ph": body.ph,
        "date": body.date or datetime.now(timezone.utc).date().isoformat(),
        "notes": body.notes,
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "irrigation_only": True,
        "label": "simulated sensor feed — citizen submission, approximate location",
    }

    readings = _load_json(CITIZEN_FILE, [])
    readings.append(reading)
    _save_json(CITIZEN_FILE, readings)

    point = {
        "id": reading["id"],
        "lat": display_lat,
        "lon": display_lon,
        "source": "citizen",
        "source_type": "citizen_reading",
        "label": reading["label"],
        "measured_date": reading["date"],
        "sample": {"ph": body.ph, "ec": ec, "tds": body.tds},
        "kind": "citizen",
        "citizen_only": True,
    }

    return {
        "reading": reading,
        "point": _serialize_point(point),
        "message": "Reading stored at reduced precision. No drinking verdict is produced for citizen submissions.",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
