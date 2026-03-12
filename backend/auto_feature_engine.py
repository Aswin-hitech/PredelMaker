from datetime import datetime
from backend.apis.weather_api import get_weather_condition
from backend.apis.traffic_engine import estimate_traffic
from backend.apis.gps_utils import coordinates_to_address
from backend.apis.route_api import get_route

def generate_auto_features(lat, lon, destination=None):
    """
    Aggregates data from various APIs to generate real-time features.
    """
    current_hour = datetime.now().hour
    
    # 1. Weather
    weather = get_weather_condition(lat, lon)
    
    # 2. Traffic
    traffic = estimate_traffic(current_hour)
    
    # 3. Address
    address = coordinates_to_address(lat, lon)
    
    # 4. Route/Distance (if destination provided)
    distance = 5.0  # Default
    if destination:
        # Note: destination might be a string address or coords. 
        # For this engine, we assume the backend handles geocoding or it's passed from frontend.
        # Let's use a placeholder logic that would be expanded.
        pass

    return {
        "weather_condition": weather,
        "traffic_level": traffic,
        "current_address": address,
        "time_of_day": current_hour,
        "distance_remaining": distance
    }
