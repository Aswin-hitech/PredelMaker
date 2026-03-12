from geopy.geocoders import Nominatim

geolocator = Nominatim(user_agent="predel_maker_app")

def coordinates_to_address(lat, lon):
    """
    Reverse geocoding: coordinates -> address
    """
    try:
        location = geolocator.reverse(f"{lat}, {lon}", timeout=5)
        if location:
            return location.address
        return "Unknown Location"
    except Exception:
        return "Unknown Location"
