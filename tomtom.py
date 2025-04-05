import requests
from dotenv import load_dotenv
import os
import json
from shapely.geometry import Point, Polygon
import numpy as np
import time
from lonlat_utils import CRZ_ENTRY_POINTS, CRZ_POLYGON

# Load environment variables from .env file
load_dotenv()
TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY")
if TOMTOM_API_KEY is None:
    raise ValueError("TOMTOM_API_KEY is not set in the environment variables.")

def get_congestion_score(lat, lon):
    url = f"https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json"
    params = {
        "point": f"{lat},{lon}",
        "key": TOMTOM_API_KEY
    }
    r = requests.get(url, params=params)
    data = r.json()

    try:
        current_speed = data["flowSegmentData"]["currentSpeed"]
        free_flow_speed = data["flowSegmentData"]["freeFlowSpeed"]
        congestion_score = 1 - (current_speed / free_flow_speed)
        return max(0.0, round(congestion_score, 2))  # clipped at 0
    except:
        return None
    
def get_crz_congestion_by_sampling(polygon=CRZ_POLYGON, grid_size=5, delay=0.2):
    """
    Estimates CRZ-wide congestion by sampling multiple points inside the polygon and averaging their congestion scores.
    """
    # Convert to shapely polygon for point-inside checks
    poly = Polygon([(lon, lat) for lat, lon in polygon])  # Note: (lon, lat) format for shapely

    # Get polygon bounds
    min_lon, min_lat, max_lon, max_lat = poly.bounds

    lat_points = np.linspace(min_lat, max_lat, grid_size)
    lon_points = np.linspace(min_lon, max_lon, grid_size)

    valid_scores = []
    for lat in lat_points:
        for lon in lon_points:
            pt = Point(lon, lat)
            if poly.contains(pt):
                score = get_congestion_score(lat, lon)
                if score is not None:
                    valid_scores.append(score)
                time.sleep(delay)

    if valid_scores:
        avg_score = round(sum(valid_scores) / len(valid_scores), 2)
        return avg_score
    else:
        print("❌ No valid congestion data found within polygon")
        return None

def fetch_realtime_entry_scores():
    scores = {}
    for name, coords in CRZ_ENTRY_POINTS.items():
        counter = 0
        total_score = 0
        for lat, lon in coords:
            score = get_congestion_score(lat, lon)
            if score is not None:
                total_score += score
                counter += 1
        scores[name] = round(total_score / counter, 2) if counter > 0 else 0.0
    return scores

def fetch_crz_global_score():
    return get_crz_congestion_by_sampling(grid_size=5)
