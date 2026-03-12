import random


def generate_simulated_data():

    return {
        "speed": random.randint(10, 60),
        "speed_drop": random.randint(0, 30),
        "distance_remaining": round(random.uniform(1, 10), 2),
        "traffic_level": random.randint(0, 2),
        "weather_condition": random.randint(0, 2),
        "stop_duration": round(random.uniform(0, 5), 2),
        "time_of_day": random.randint(0, 23)
    }