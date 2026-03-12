import requests
from backend.config import Config

def get_route(origin_lat, origin_lon, dest_lat, dest_lon):
    """
    Calls OSRM Routing API to get route distance, duration and geometry.
    """
    try:
        url = f"{Config.OSRM_BASE_URL}/{origin_lon},{origin_lat};{dest_lon},{dest_lat}?overview=full&geometries=geojson"
        response = requests.get(url, timeout=10)
        data = response.json()
        
        if data.get("code") != "Ok":
            return None
            
        route = data["routes"][0]
        return {
            "distance_km": route["distance"] / 1000,
            "duration_min": route["duration"] / 60,
            "geometry": route["geometry"]
        }
    except Exception as e:
        print(f"OSRM Route API Error: {e}")
        return None
