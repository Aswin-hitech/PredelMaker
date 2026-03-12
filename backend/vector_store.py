from pymongo import MongoClient
from backend.config import Config

client = MongoClient(Config.MONGO_URI)

db = client[Config.DB_NAME]

collection = db["delay_context"]


def store_delay_context(data):

    collection.insert_one(data)


def get_similar_context(traffic, weather):

    results = collection.find({
        "traffic_level": traffic,
        "weather_condition": weather
    }).limit(3)

    return list(results)