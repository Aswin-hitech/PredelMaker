import os
import requests
from geopy.distance import geodesic
from dotenv import load_dotenv

load_dotenv()

OSRM_BASE_URL = os.getenv("OSRM_BASE_URL", "http://router.project-osrm.org/route/v1/driving")
CORRECTION_FACTOR = float(os.getenv("DISTANCE_CORRECTION_FACTOR", 1.32))

def calculate_corrected_distance(origin_lat, origin_lon, dest_lat, dest_lon):
    """
    Calculates distance between two points.
    1. Tries OSRM Routing API for actual road distance.
    2. Fallbacks to geodesic distance multiplied by a correction factor (default 1.32).
    """
    try:
        # Try OSRM first
        url = f"{OSRM_BASE_URL}/{origin_lon},{origin_lat};{dest_lon},{dest_lat}?overview=false"
        response = requests.get(url, timeout=3)
        if response.status_code == 200:
            data = response.json()
            if data.get("code") == "Ok" and data.get("routes"):
                # OSRM returns distance in meters
                osrm_distance_km = data["routes"][0]["distance"] / 1000.0
                return round(osrm_distance_km, 2)
    except Exception as e:
        print(f"[DEBUG] OSRM Distance Fetch Failed: {e}")

    # Fallback to geodesic with correction factor
    base_geodesic = geodesic((origin_lat, origin_lon), (dest_lat, dest_lon)).km
    corrected_distance = base_geodesic * CORRECTION_FACTOR
    
    return round(corrected_distance, 2)

if __name__ == "__main__":
    # Test coordinates (e.g., Pollachi to Coimbatore)
    res = calculate_corrected_distance(10.6589, 77.0097, 11.0168, 76.9558)
    print(f"Road Distance: {res} km")
