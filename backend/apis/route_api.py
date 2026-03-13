import requests
from backend.config import Config
from geopy.distance import geodesic

def get_route(origin_lat, origin_lon, dest_lat, dest_lon):
    """
    Calls OSRM Routing API to get route distance, duration and geometry.
    Fallback to geodesic distance * 1.32 if OSRM fails or times out.
    """
    # 1. Try OSRM fetch first
    try:
        url = f"{Config.OSRM_BASE_URL}/{origin_lon},{origin_lat};{dest_lon},{dest_lat}?overview=full&geometries=geojson"
        response = requests.get(url, timeout=3)
        if response.status_code == 200:
            data = response.json()
            if data.get("code") == "Ok" and data.get("routes"):
                route = data["routes"][0]
                return {
                    "distance_km": round(route["distance"] / 1000, 2),
                    "duration_min": round(route["duration"] / 60, 2),
                    "geometry": route["geometry"]
                }
    except Exception as e:
        print(f"OSRM Route API Error/Timeout: {e}")

    # 2. Fallback to geodesic distance * 1.32
    print("Falling back to geodesic distance for routing...")
    try:
        dist_km = geodesic((origin_lat, origin_lon), (dest_lat, dest_lon)).km
        corrected_dist = round(dist_km * 1.32, 2)
        
        # Consistent return structure even on fallback
        return {
            "distance_km": corrected_dist,
            "duration_min": round((corrected_dist / 40) * 60, 2), # Estimate time at 40km/h
            "geometry": {
                "type": "LineString",
                "coordinates": [[origin_lon, origin_lat], [dest_lon, dest_lat]] # Direct line geometry
            },
            "is_fallback": True
        }
    except Exception as e:
        print(f"Fallback distance calculation failed: {e}")
        return None
