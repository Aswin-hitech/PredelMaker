from geopy.distance import geodesic
from geopy.geocoders import Nominatim

geolocator = Nominatim(user_agent="delivery_app")


def get_coordinates(address):
    if not address or len(address.strip()) < 3:
        return None
        
    try:
        location = geolocator.geocode(address, timeout=10)
        if location:
            return (location.latitude, location.longitude)
    except Exception as e:
        print(f"Geocoding error for {address}: {e}")
    return None


def calculate_distance(origin, destination):
    """
    Calculates corrected distance using: geodesic(origin, destination) * 1.32
    """
    coord1 = get_coordinates(origin)
    coord2 = get_coordinates(destination)

    if coord1 and coord2:
        distance_km = geodesic(coord1, coord2).km
        return round(distance_km * 1.32, 2)

    return None