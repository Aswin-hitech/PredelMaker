from geopy.distance import geodesic
from geopy.geocoders import Nominatim

geolocator = Nominatim(user_agent="delivery_app")


def get_coordinates(address):

    location = geolocator.geocode(address)

    if location:
        return (location.latitude, location.longitude)

    return None


def calculate_distance(origin, destination):

    coord1 = get_coordinates(origin)
    coord2 = get_coordinates(destination)

    if coord1 and coord2:
        return geodesic(coord1, coord2).km

    return None