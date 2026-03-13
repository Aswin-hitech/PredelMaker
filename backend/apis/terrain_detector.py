import os
import requests
import numpy as np
from dotenv import load_dotenv

load_dotenv()

THRESHOLD = float(os.getenv("TERRAIN_ELEVATION_THRESHOLD", 250))

def detect_terrain(origin_lat, origin_lon, dest_lat, dest_lon):
    """
    Detects terrain type by sampling elevation points between origin and destination.
    Uses Open-Meteo Elevation API.
    Returns: 'mountain' if variation > threshold, else 'plain'.
    """
    try:
        # Create 5 sample points along the route
        lats = np.linspace(origin_lat, dest_lat, 5)
        lons = np.linspace(origin_lon, dest_lon, 5)
        
        lat_str = ",".join(map(str, lats))
        lon_str = ",".join(map(str, lons))
        
        url = f"https://api.open-meteo.com/v1/elevation?latitude={lat_str}&longitude={lon_str}"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            elevations = response.json().get("elevation", [])
            if elevations:
                variation = max(elevations) - min(elevations)
                print(f"[DEBUG] Elevation Variation: {variation}m")
                
                if variation > THRESHOLD:
                    return "mountain"
        
    except Exception as e:
        print(f"[DEBUG] Terrain Detection Failed: {e}")
        
    return "plain"

if __name__ == "__main__":
    # Test (Simulate mountainous vs flat)
    print(f"Terrain: {detect_terrain(10.6589, 77.0097, 11.0168, 76.9558)}")
