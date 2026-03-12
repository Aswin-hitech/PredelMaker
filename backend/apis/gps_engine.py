import math

def calculate_speed(prev_lat, prev_lon, curr_lat, curr_lon, time_diff_seconds):
    """
    Calculates speed in km/h between two points using Haversine formula.
    """
    if time_diff_seconds <= 0:
        return 0
        
    # Haversine distance
    R = 6371  # Earth radius in km
    d_lat = math.radians(curr_lat - prev_lat)
    d_lon = math.radians(curr_lon - prev_lon)
    a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(prev_lat)) * math.cos(math.radians(curr_lat)) * math.sin(d_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance_km = R * c
    
    speed_kmh = distance_km / (time_diff_seconds / 3600)
    return round(speed_kmh, 2)

def calculate_stop_duration(speed, current_stop_minutes, time_diff_seconds):
    """
    Calculates stop duration in minutes.
    If speed < 2 km/h, increment duration. Otherwise, reset to 0.
    """
    if speed < 2:
        return current_stop_minutes + (time_diff_seconds / 60)
    return 0
