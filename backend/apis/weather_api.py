import requests

def get_weather_condition(lat, lon):
    """
    Fetches weather condition from Open-Meteo API.
    Returns:
    0 - Clear
    1 - Rain
    2 - Storm (Estimated based on high wind or heavy rain)
    """
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
        response = requests.get(url, timeout=5)
        data = response.json()
        
        if "current_weather" not in data:
            return 0
            
        weather_code = data["current_weather"]["weathercode"]
        
        # Open-Meteo WMO Weather interpretation codes
        # 0: Clear sky
        # 1, 2, 3: Mainly clear, partly cloudy, and overcast
        # 51-67: Rain
        # 71-77: Snow
        # 80-82: Rain showers
        # 95-99: Thunderstorm
        
        if weather_code in [0, 1, 2, 3]:
            return 0  # Clear
        elif weather_code in [51, 53, 55, 61, 63, 65, 80, 81, 82]:
            return 1  # Rain
        elif weather_code >= 95:
            return 2  # Storm
        else:
            return 0
            
    except Exception as e:
        print(f"Weather API Error: {e}")
        return 0
