import numpy as np
from backend.model_loader import ModelLoader


def predict_delay(features):

    model = ModelLoader.load_model()

    # Mappings for categorical inputs if they are strings (from frontend)
    vehicle_map = {'bike': 0, 'scooter': 1, 'car': 2, 'truck': 3}
    route_map = {'city': 0, 'suburban': 1, 'highway': 2}

    def get_val(key, default=0):
        val = features.get(key, default)
        if key == "vehicle_type" and isinstance(val, str):
            return vehicle_map.get(val.lower(), 0)
        if key == "route_type" and isinstance(val, str):
            return route_map.get(val.lower(), 0)
        return val

    input_array = np.array([
        [
            get_val("vehicle_type"),
            get_val("route_type"),
            get_val("speed"),
            get_val("speed_drop"),
            get_val("distance_remaining"),
            get_val("traffic_level"),
            get_val("weather_condition"),
            get_val("stop_duration"),
            get_val("time_of_day")
        ]
    ])

    delay_probability = model.predict_proba(input_array)[0][1]
    delay_prediction = int(delay_probability > 0.5)

    return {
        "delay_probability": float(delay_probability),
        "delay_prediction": delay_prediction
    }